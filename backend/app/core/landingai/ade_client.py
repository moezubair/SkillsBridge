"""LandingAI Vision Tools: ADE parse (PDF → markdown) + extract (markdown → JSON by schema)."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

import httpx

from app.config.settings import Settings, get_settings


class LandingAiApiError(Exception):
    """Upstream LandingAI returned an error or unreadable response."""

    def __init__(self, message: str, status_code: int | None = None, body: str | None = None) -> None:
        self.status_code = status_code
        self.body = body
        super().__init__(message)


@dataclass(frozen=True, slots=True)
class AdeParseResult:
    """Output of POST /v1/ade/parse."""

    markdown: str
    http_status: int
    metadata: dict[str, Any]


@dataclass(frozen=True, slots=True)
class AdeExtractResult:
    """Output of POST /v1/ade/extract."""

    extraction: dict[str, Any]
    extraction_metadata: dict[str, Any]
    metadata: dict[str, Any]
    http_status: int


class AdeClient:
    """
    Thin async client for ADE parse + extract.
    PDFs must be parsed to markdown before extract (LandingAI API contract).
    """

    def __init__(self, settings: Settings | None = None, http_client: httpx.AsyncClient | None = None) -> None:
        # Tests can pass a fixed Settings; production passes None and reads get_settings() each call
        # so .env changes apply without rebuilding the client.
        self._settings_override = settings
        self._owns_client = http_client is None
        self._client = http_client or httpx.AsyncClient(timeout=httpx.Timeout(180.0, connect=30.0))

    def _cfg(self) -> Settings:
        return self._settings_override if self._settings_override is not None else get_settings()

    async def aclose(self) -> None:
        if self._owns_client:
            await self._client.aclose()

    def _headers(self) -> dict[str, str]:
        key = self._cfg().LANDINGAI_API_KEY.strip()
        if not key:
            raise LandingAiApiError("LANDINGAI_API_KEY is not configured", status_code=None)
        return {"Authorization": f"Bearer {key}"}

    def _base(self) -> str:
        return self._cfg().LANDINGAI_BASE_URL.rstrip("/")

    async def parse_pdf(self, pdf_bytes: bytes, filename: str) -> AdeParseResult:
        """Turn a PDF into markdown via ADE parse."""
        url = f"{self._base()}/v1/ade/parse"
        files = {"document": (filename or "document.pdf", pdf_bytes, "application/pdf")}
        data = {"model": self._cfg().LANDINGAI_PARSE_MODEL}
        response = await self._client.post(url, headers=self._headers(), files=files, data=data)
        payload = _safe_json(response)
        if response.status_code not in (200, 206):
            raise LandingAiApiError(
                _err_message("ADE parse failed", payload, response.text, response.status_code),
                status_code=response.status_code,
                body=response.text,
            )
        markdown = payload.get("markdown") if isinstance(payload, dict) else None
        if not markdown:
            raise LandingAiApiError(
                "ADE parse returned no markdown",
                status_code=response.status_code,
                body=response.text,
            )
        meta = payload.get("metadata") if isinstance(payload, dict) else {}
        return AdeParseResult(
            markdown=markdown,
            http_status=response.status_code,
            metadata=meta if isinstance(meta, dict) else {},
        )

    async def extract(self, markdown: str, schema: dict[str, Any]) -> AdeExtractResult:
        """Run schema-guided extraction on markdown from parse."""
        url = f"{self._base()}/v1/ade/extract"
        md_bytes = markdown.encode("utf-8")
        files = {"markdown": ("document.md", md_bytes, "text/markdown")}
        data = {
            "schema": json.dumps(schema),
            "model": self._cfg().LANDINGAI_EXTRACT_MODEL,
        }
        response = await self._client.post(url, headers=self._headers(), files=files, data=data)
        payload = _safe_json(response)
        if response.status_code not in (200, 206):
            raise LandingAiApiError(
                _err_message("ADE extract failed", payload, response.text, response.status_code),
                status_code=response.status_code,
                body=response.text,
            )
        if not isinstance(payload, dict):
            raise LandingAiApiError("ADE extract returned invalid JSON", status_code=response.status_code)
        extraction = payload.get("extraction")
        if not isinstance(extraction, dict):
            raise LandingAiApiError(
                "ADE extract response missing extraction object",
                status_code=response.status_code,
            )
        ex_meta = payload.get("extraction_metadata")
        meta = payload.get("metadata")
        return AdeExtractResult(
            extraction=extraction,
            extraction_metadata=ex_meta if isinstance(ex_meta, dict) else {},
            metadata=meta if isinstance(meta, dict) else {},
            http_status=response.status_code,
        )


def _safe_json(response: httpx.Response) -> Any:
    try:
        return response.json()
    except Exception:
        return None


def _err_message(prefix: str, payload: Any, raw: str, status_code: int | None) -> str:
    if isinstance(payload, dict):
        detail = payload.get("detail")
        if detail is not None:
            return f"{prefix}: {detail}"
    trimmed = (raw or "")[:500]
    sc = f" HTTP {status_code}" if status_code is not None else ""
    return f"{prefix}{sc}: {trimmed}"
