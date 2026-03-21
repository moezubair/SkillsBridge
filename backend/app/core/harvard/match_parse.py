"""Parse TinyFish result JSON into program requirements for UniversityProgramResponse."""

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


def _as_list(v: Any) -> list[str]:
    if isinstance(v, list):
        return [str(x).strip() for x in v if str(x).strip()][:20]
    if isinstance(v, str) and v.strip():
        return [v.strip()]
    return []


def _pick_programs_list(result: dict[str, Any]) -> list[dict[str, Any]]:
    p = result.get("programs")
    if isinstance(p, list):
        return [x for x in p if isinstance(x, dict)]
    for key in ("majors", "concentrations", "programs_list", "offerings"):
        v = result.get(key)
        if isinstance(v, list):
            return [x for x in v if isinstance(x, dict)]
    return []


def parse_program_requirements(result: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Return list of {name, required_courses, required_gpa, required_tests, extracurriculars, other_requirements, detail_url?}.
    Empty if parsing fails.
    """
    items = _pick_programs_list(result)
    out: list[dict[str, Any]] = []
    for raw in items[:20]:
        name = _as_str(raw.get("name") or raw.get("program") or raw.get("concentration") or raw.get("major"))
        if not name:
            continue

        required_courses = _as_list(raw.get("required_courses"))
        required_gpa = _as_str(raw.get("required_gpa"))
        required_tests = _as_list(raw.get("required_tests"))
        extracurriculars = _as_list(raw.get("extracurriculars"))
        other_requirements = _as_list(raw.get("other_requirements"))

        url = _as_str(raw.get("detail_url") or raw.get("url"))
        row: dict[str, Any] = {
            "name": name,
            "required_courses": required_courses,
            "required_gpa": required_gpa,
            "required_tests": required_tests,
            "extracurriculars": extracurriculars,
            "other_requirements": other_requirements,
        }
        if url:
            row["detail_url"] = url
        out.append(row)

    if not out:
        logger.warning("TinyFish program requirements: no parseable entries in result keys=%s", list(result.keys()))
    return out[:20]


def enrich_detail_urls_from_seed(
    programs: list[dict[str, Any]],
    seed_programs: list[dict[str, Any]],
) -> None:
    """Fill missing detail_url from seed list by normalized name."""
    by_norm: dict[str, str] = {}
    for m in seed_programs:
        name = m.get("name")
        u = m.get("detail_url")
        if not name or not isinstance(u, str) or not u.strip():
            continue
        k = str(name).lower().strip()
        by_norm[k] = u.strip()
    for row in programs:
        if row.get("detail_url"):
            continue
        k = str(row.get("name", "")).lower().strip()
        if k in by_norm:
            row["detail_url"] = by_norm[k]
