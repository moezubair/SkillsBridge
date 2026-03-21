"""Stream TinyFish automation over SSE until COMPLETE or failure."""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from app.config.settings import Settings, get_settings
from app.core.debug_session_log import debug_ndjson

logger = logging.getLogger(__name__)

TINYFISH_RUN_SSE_URL = "https://agent.tinyfish.ai/v1/automation/run-sse"


class TinyFishError(Exception):
    """Agent run did not complete successfully."""


def _coerce_result_dict(result: Any) -> dict[str, Any] | None:
    """TinyFish sometimes returns `result` as a JSON string instead of an object."""
    if isinstance(result, dict):
        return result
    if isinstance(result, str):
        try:
            parsed = json.loads(result)
        except json.JSONDecodeError:
            return None
        return parsed if isinstance(parsed, dict) else None
    return None


def _parse_sse_blank_blocks(normalized: str) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []
    for block in normalized.split("\n\n"):
        block = block.strip()
        if not block:
            continue
        parts: list[str] = []
        for raw_line in block.split("\n"):
            line = raw_line.strip()
            if not line or line.startswith(":"):
                continue
            if line.startswith("data:"):
                parts.append(line[5:].lstrip())
        if not parts:
            continue
        payload = "\n".join(parts)
        try:
            obj = json.loads(payload)
            if isinstance(obj, dict):
                events.append(obj)
        except json.JSONDecodeError:
            logger.debug("TinyFish SSE skip block: %s", payload[:120])
    return events


def _parse_sse_line_accumulate(normalized: str) -> list[dict[str, Any]]:
    """When servers omit blank lines between events: flush buffered `data:` on each blank line or EOF."""
    events: list[dict[str, Any]] = []
    buf: list[str] = []

    def _flush() -> None:
        nonlocal buf
        if not buf:
            return
        payload = "\n".join(buf)
        buf = []
        try:
            obj = json.loads(payload)
            if isinstance(obj, dict):
                events.append(obj)
        except json.JSONDecodeError:
            logger.debug("TinyFish SSE line-scan skip: %s", payload[:120])

    for raw_line in normalized.split("\n"):
        line = raw_line.strip()
        if not line:
            _flush()
            continue
        if line.startswith(":"):
            continue
        if line.startswith("data:"):
            buf.append(line[5:].lstrip())
    _flush()
    return events


def _parse_ndjson_lines(normalized: str) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []
    for line in normalized.split("\n"):
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            obj = json.loads(line)
            if isinstance(obj, dict):
                events.append(obj)
        except json.JSONDecodeError:
            continue
    return events


def _events_from_sse_body(text: str) -> list[dict[str, Any]]:
    """
    Parse TinyFish SSE: blank-line blocks, then line-accumulate `data:` if needed, then raw JSON lines.
    """
    normalized = text.replace("\ufeff", "").replace("\r\n", "\n").strip()
    events = _parse_sse_blank_blocks(normalized)
    if not events and "data:" in normalized:
        events = _parse_sse_line_accumulate(normalized)
    if not events:
        events = _parse_ndjson_lines(normalized)
    return events


def _event_type_upper(event: dict[str, Any]) -> str:
    t = event.get("type")
    return str(t).upper() if t is not None else ""


async def run_automation_sse(
    *,
    url: str,
    goal: str,
    api_key: str,
    timeout_seconds: float,
    base_url: str | None = None,
) -> tuple[dict[str, Any], str | None]:
    """
    POST run-sse, consume events until COMPLETE.

    Returns (result_dict, run_id). result_dict is the `result` field from COMPLETE.
    """
    endpoint = (base_url or TINYFISH_RUN_SSE_URL).rstrip("/")
    if not endpoint.endswith("/v1/automation/run-sse"):
        endpoint = f"{endpoint}/v1/automation/run-sse"

    headers = {
        "X-API-Key": api_key,
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
    }
    body = {"url": url, "goal": goal}

    timeout = httpx.Timeout(timeout_seconds, connect=30.0)
    # #region agent log
    debug_ndjson(
        hypothesis_id="H2-H3",
        location="tinyfish/client.py:run_automation_sse:pre_stream",
        message="starting sse stream",
        data={
            "endpoint": endpoint,
            "automation_url": url[:120],
            "goal_len": len(goal),
            "timeout_s": timeout_seconds,
        },
    )
    # #endregion
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            async with client.stream(
                "POST",
                endpoint,
                headers=headers,
                json=body,
            ) as response:
                try:
                    response.raise_for_status()
                except httpx.HTTPStatusError as exc:
                    # #region agent log
                    debug_ndjson(
                        hypothesis_id="H1-H2",
                        location="tinyfish/client.py:run_automation_sse:http_error",
                        message="raise_for_status failed",
                        data={"http_status": exc.response.status_code},
                    )
                    # #endregion
                    raise TinyFishError(
                        f"TinyFish HTTP {exc.response.status_code}",
                    ) from exc
                # #region agent log
                debug_ndjson(
                    hypothesis_id="H2",
                    location="tinyfish/client.py:run_automation_sse:stream_open",
                    message="http ok streaming",
                    data={"http_status": response.status_code},
                )
                # #endregion
                chunks: list[bytes] = []
                async for chunk in response.aiter_bytes():
                    chunks.append(chunk)
                text = b"".join(chunks).decode("utf-8", errors="replace")
                events = _events_from_sse_body(text)
                last_run_id: str | None = None
                last_event_type: str | None = None
                for event in events:
                    ev_type = _event_type_upper(event)
                    last_event_type = event.get("type")
                    if ev_type in ("STARTED", "STREAMING_URL", "PROGRESS"):
                        rid = event.get("run_id")
                        if isinstance(rid, str):
                            last_run_id = rid
                    elif ev_type == "COMPLETE":
                        rid = event.get("run_id")
                        if isinstance(rid, str):
                            last_run_id = rid
                        status = event.get("status")
                        if status is not None and str(status).upper() != "COMPLETED":
                            raise TinyFishError(f"TinyFish completed with status={status!r}")
                        raw_result = event.get("result")
                        result = _coerce_result_dict(raw_result)
                        if result is None:
                            # #region agent log
                            debug_ndjson(
                                hypothesis_id="H5",
                                location="tinyfish/client.py:complete_no_result_dict",
                                message="COMPLETE missing dict result",
                                data={"result_type": type(raw_result).__name__},
                            )
                            # #endregion
                            raise TinyFishError("TinyFish COMPLETE event missing result object")
                        return result, last_run_id
                    elif ev_type in ("FAILED", "ERROR", "FAILURE"):
                        msg = event.get("message") or event.get("error") or str(event)
                        # #region agent log
                        debug_ndjson(
                            hypothesis_id="H4",
                            location="tinyfish/client.py:failed_event",
                            message="TinyFish FAILED/ERROR event",
                            data={"msg_prefix": str(msg)[:300]},
                        )
                        # #endregion
                        raise TinyFishError(str(msg))

                # #region agent log
                type_preview = [e.get("type") for e in events[:25]]
                debug_ndjson(
                    hypothesis_id="H3",
                    location="tinyfish/client.py:stream_end_no_complete",
                    message="no COMPLETE in parsed events",
                    data={
                        "last_event_type": last_event_type,
                        "event_count": len(events),
                        "body_chars": len(text),
                        "type_preview": type_preview,
                    },
                )
                # #endregion
                raise TinyFishError("TinyFish stream ended without COMPLETE event")
    except httpx.TimeoutException as exc:
        # #region agent log
        debug_ndjson(
            hypothesis_id="H2-H3",
            location="tinyfish/client.py:httpx_timeout",
            message="httpx timeout",
            data={"exc_type": type(exc).__name__},
        )
        # #endregion
        raise TinyFishError(f"TinyFish network timed out: {exc}") from exc
    except httpx.RequestError as exc:
        # #region agent log
        debug_ndjson(
            hypothesis_id="H2",
            location="tinyfish/client.py:httpx_request_error",
            message="httpx request error",
            data={"exc_type": type(exc).__name__},
        )
        # #endregion
        raise TinyFishError(f"TinyFish network error: {exc}") from exc


async def run_with_settings(
    *,
    url: str,
    goal: str,
    settings: Settings | None = None,
    timeout_seconds: float | None = None,
) -> tuple[dict[str, Any], str | None]:
    cfg = settings or get_settings()
    key = (cfg.TINYFISH_API_KEY or "").strip()
    if not key:
        # #region agent log
        debug_ndjson(
            hypothesis_id="H1",
            location="tinyfish/client.py:run_with_settings:no_key",
            message="api key missing",
            data={},
        )
        # #endregion
        raise TinyFishError("TINYFISH_API_KEY is not configured")
    # #region agent log
    debug_ndjson(
        hypothesis_id="H1",
        location="tinyfish/client.py:run_with_settings:key_ok",
        message="api key present",
        data={"key_len": len(key)},
    )
    # #endregion
    timeout = float(
        timeout_seconds
        if timeout_seconds is not None
        else cfg.TINYFISH_SSE_TIMEOUT_SECONDS
    )
    return await run_automation_sse(
        url=url,
        goal=goal,
        api_key=key,
        timeout_seconds=timeout,
        base_url=(cfg.TINYFISH_BASE_URL or "").strip() or None,
    )
