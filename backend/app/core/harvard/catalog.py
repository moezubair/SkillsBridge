"""Load seed majors, merge with TinyFish agent output, normalize catalog entries."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

_SEED_PATH = Path(__file__).resolve().parents[2] / "data" / "harvard_majors_seed.json"


def load_seed_majors() -> list[dict[str, Any]]:
    raw = json.loads(_SEED_PATH.read_text(encoding="utf-8"))
    majors = raw.get("majors")
    if not isinstance(majors, list):
        return []
    return [m for m in majors if isinstance(m, dict) and m.get("name")]


def _norm_name(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"\s+", " ", s)
    return s


def _coerce_agent_majors(result: dict[str, Any]) -> list[dict[str, Any]]:
    """Accept {majors: [...]}, {programs: [...]}, or top-level list in result."""
    if isinstance(result, list):
        return [x for x in result if isinstance(x, dict)]
    if not isinstance(result, dict):
        return []
    for key in ("majors", "programs", "fields", "concentrations"):
        v = result.get(key)
        if isinstance(v, list):
            return [x for x in v if isinstance(x, dict)]
    return []


def merge_seed_and_agent(
    seed: list[dict[str, Any]],
    agent_items: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    by_key: dict[str, dict[str, Any]] = {}
    for m in seed:
        name = m.get("name")
        if not name:
            continue
        k = _norm_name(str(name))
        kw = m.get("keywords")
        keywords = [str(x) for x in kw] if isinstance(kw, list) else []
        by_key[k] = {
            "name": str(name),
            "keywords": keywords,
            "detail_url": str(m.get("detail_url") or ""),
            "one_line_summary": str(m.get("one_line_summary") or ""),
        }
    for m in agent_items:
        name = m.get("name") or m.get("title") or m.get("field")
        if not name:
            continue
        k = _norm_name(str(name))
        url = str(m.get("url") or m.get("detail_url") or "")
        summ = str(
            m.get("one_line_summary")
            or m.get("summary")
            or m.get("description")
            or "",
        )
        if k in by_key:
            if url:
                by_key[k]["detail_url"] = url
            if summ:
                by_key[k]["one_line_summary"] = summ
        else:
            by_key[k] = {
                "name": str(name),
                "keywords": [],
                "detail_url": url,
                "one_line_summary": summ,
            }
    return list(by_key.values())


def parse_tinyfish_catalog_result(result: dict[str, Any]) -> list[dict[str, Any]]:
    return _coerce_agent_majors(result)
