"""Map TinyFish `result` JSON to a single job-shaped dict for persistence."""

from __future__ import annotations

import logging
from typing import Any
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

REQUIRED_KEYS = ("title", "url")


def _as_str(v: Any) -> str | None:
    if v is None:
        return None
    if isinstance(v, str):
        s = v.strip()
        return s or None
    return str(v).strip() or None


def _pick_job_dict(result: dict[str, Any]) -> dict[str, Any] | None:
    """Accept flexible agent shapes: flat job, {job: {...}}, {jobs: [...]}."""
    if all(k in result for k in REQUIRED_KEYS):
        return result
    job = result.get("job")
    if isinstance(job, dict) and all(k in job for k in REQUIRED_KEYS):
        return job
    jobs = result.get("jobs")
    if isinstance(jobs, list) and jobs:
        first = jobs[0]
        if isinstance(first, dict) and all(k in first for k in REQUIRED_KEYS):
            return first
    # Single key wrapping an object (e.g. {"listing": {...}})
    for _k, v in result.items():
        if isinstance(v, dict) and all(x in v for x in REQUIRED_KEYS):
            return v
    return None


def source_site_from_url(url: str) -> str:
    try:
        host = (urlparse(url).netloc or "").lower()
        if host.startswith("www."):
            host = host[4:]
        return host or "unknown"
    except Exception:
        return "unknown"


def _gap_dict_list(raw: Any) -> list[dict[str, Any]]:
    if not isinstance(raw, list):
        return []
    out: list[dict[str, Any]] = []
    for item in raw:
        if isinstance(item, dict):
            out.append(dict(item))
    return out


def extract_gap_analysis(picked: dict[str, Any]) -> dict[str, Any]:
    return {
        "missing_or_weak_vs_job": _gap_dict_list(picked.get("missing_or_weak_vs_job")),
        "improvements_to_close_gaps": _gap_dict_list(picked.get("improvements_to_close_gaps")),
    }


def normalize_one_job(result: dict[str, Any]) -> dict[str, Any] | None:
    """
    Return a normalized dict with keys used by JobDiscoveryRepository.insert_listing
    (snake_case). None if parsing fails.
    """
    picked = _pick_job_dict(result)
    if not picked:
        logger.warning("TinyFish result: could not find job object with title+url")
        return None

    title = _as_str(picked.get("title"))
    url = _as_str(picked.get("url"))
    if not title or not url:
        return None

    company = _as_str(picked.get("company"))
    location = _as_str(picked.get("location"))
    snippet = _as_str(picked.get("snippet") or picked.get("description_snippet") or picked.get("description"))
    employment_type = _as_str(picked.get("employment_type"))
    remote_policy = _as_str(picked.get("remote_policy"))
    salary_text = _as_str(picked.get("salary") or picked.get("salary_text"))

    gap_analysis = extract_gap_analysis(picked)

    return {
        "source_site": source_site_from_url(url),
        "source_url": url,
        "title": title,
        "company": company,
        "location": location,
        "employment_type": employment_type,
        "remote_policy": remote_policy,
        "posted_at": None,
        "description_snippet": snippet,
        "full_description": _as_str(picked.get("full_description")),
        "salary_text": salary_text,
        "gap_analysis": gap_analysis,
        "raw_agent_payload": picked,
    }
