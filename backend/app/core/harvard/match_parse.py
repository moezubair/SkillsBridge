"""Parse TinyFish result JSON into ranked major rows for HarvardMatchResponse."""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


def _as_str(v: Any) -> str | None:
    if v is None:
        return None
    if isinstance(v, str):
        s = v.strip()
        return s or None
    return str(v).strip() or None


def _as_int_score(v: Any) -> int | None:
    if isinstance(v, bool):
        return None
    if isinstance(v, int):
        return max(0, min(100, v))
    if isinstance(v, float):
        return max(0, min(100, int(round(v))))
    return None


def _as_reasons(v: Any) -> list[str]:
    if isinstance(v, list):
        return [str(x).strip() for x in v if str(x).strip()][:8]
    if isinstance(v, str) and v.strip():
        return [v.strip()]
    return []


def _pick_matches_list(result: dict[str, Any]) -> list[dict[str, Any]]:
    m = result.get("matches")
    if isinstance(m, list):
        return [x for x in m if isinstance(x, dict)]
    for key in ("ranked_majors", "majors", "recommendations"):
        v = result.get(key)
        if isinstance(v, list):
            return [x for x in v if isinstance(x, dict)]
    return []


def parse_harvard_ranked_matches(result: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Return list of {major, score, reasons, detail_url?} suitable for HarvardMajorMatchOut.
    Empty if parsing fails.
    """
    items = _pick_matches_list(result)
    out: list[dict[str, Any]] = []
    for raw in items[:20]:
        major = _as_str(raw.get("major") or raw.get("name") or raw.get("concentration"))
        if not major:
            continue
        score = _as_int_score(raw.get("score"))
        if score is None:
            score = 50
        reasons = _as_reasons(raw.get("reasons"))
        if not reasons:
            r = _as_str(raw.get("reason"))
            reasons = [r] if r else ["Ranked from agent output."]
        url = _as_str(raw.get("detail_url") or raw.get("url"))
        row: dict[str, Any] = {
            "major": major,
            "score": score,
            "reasons": reasons,
        }
        if url:
            row["detail_url"] = url
        out.append(row)
    out.sort(key=lambda x: (-int(x["score"]), str(x["major"])))
    if not out:
        logger.warning("TinyFish Harvard match: no parseable entries in result keys=%s", list(result.keys()))
    return out[:15]


def enrich_detail_urls_from_seed(
    matches: list[dict[str, Any]],
    seed_majors: list[dict[str, Any]],
) -> None:
    """Fill missing detail_url from seed list by normalized name."""
    by_norm: dict[str, str] = {}
    for m in seed_majors:
        name = m.get("name")
        u = m.get("detail_url")
        if not name or not isinstance(u, str) or not u.strip():
            continue
        k = str(name).lower().strip()
        by_norm[k] = u.strip()
    for row in matches:
        if row.get("detail_url"):
            continue
        k = str(row.get("major", "")).lower().strip()
        if k in by_norm:
            row["detail_url"] = by_norm[k]
