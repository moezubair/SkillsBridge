"""Lightweight match score + reasons from CV extraction + preferences (MVP)."""

from __future__ import annotations

from typing import Any


def _lower_list(items: list[str]) -> list[str]:
    return [x.lower().strip() for x in items if isinstance(x, str) and x.strip()]


def _as_skill_list(extraction: dict[str, Any], *keys: str) -> list[str]:
    out: list[str] = []
    for k in keys:
        v = extraction.get(k)
        if isinstance(v, list):
            out.extend(str(x) for x in v if x is not None)
        elif isinstance(v, str) and v.strip():
            out.append(v)
    return out


def compute_match(
    *,
    job_title: str,
    job_location: str | None,
    job_snippet: str | None,
    preferences: dict[str, Any],
    extraction: dict[str, Any],
) -> tuple[int, list[str]]:
    """
    Return (0-100 score, human-readable reasons). Heuristic only — no embeddings.
    """
    reasons: list[str] = []
    score = 50

    title_l = job_title.lower()
    blob = " ".join(
        x for x in (job_title, job_location or "", job_snippet or "") if x
    ).lower()

    desired = _lower_list(list(preferences.get("desired_titles") or []))
    for t in desired:
        if t and t in title_l:
            score += 15
            reasons.append(f"Title aligns with desired role: {t}")
            break

    kws = _lower_list(list(preferences.get("keywords_include") or []))
    for kw in kws[:10]:
        if kw and kw in blob:
            score += 5
            reasons.append(f"Listing mentions preferred keyword: {kw}")

    locs = _lower_list(list(preferences.get("locations") or []))
    loc_blob = (job_location or "").lower()
    for loc in locs:
        if loc and loc in loc_blob:
            score += 10
            reasons.append(f"Location matches preference: {loc}")
            break

    if preferences.get("remote_only"):
        if "remote" in blob or "work from home" in blob:
            score += 10
            reasons.append("Remote-friendly language in listing")
        else:
            score -= 5
            reasons.append("Preference is remote-only; listing unclear")

    skills = _as_skill_list(
        extraction,
        "technical_skills",
        "programming_languages",
    )
    matched = 0
    for s in skills[:25]:
        sl = s.lower()
        if len(sl) < 2:
            continue
        if sl in blob:
            matched += 1
            if matched <= 3:
                reasons.append(f"CV skill appears in listing: {s}")
    score += min(20, matched * 4)

    exclude = _lower_list(list(preferences.get("keywords_exclude") or []))
    for ex in exclude:
        if ex and ex in blob:
            score -= 15
            reasons.append(f"Listing contains excluded keyword: {ex}")

    score = max(0, min(100, score))
    if not reasons:
        reasons.append("Baseline match (no strong signals)")
    return score, reasons


def build_goal_from_context(
    *,
    preferences: dict[str, Any],
    extraction: dict[str, Any],
) -> str:
    """Natural-language goal for TinyFish: return JSON for exactly one job."""
    titles = preferences.get("desired_titles") or []
    locs = preferences.get("locations") or []
    kws = preferences.get("keywords_include") or []
    skills = _as_skill_list(extraction, "technical_skills", "programming_languages")[:12]

    parts = [
        "On this page, identify the single best job listing that fits the candidate.",
        "Return ONLY valid JSON with this exact shape (one object, not an array):",
        '{"title": string, "company": string, "url": string (absolute link to the job posting), '
        '"location": string, "snippet": string (1-3 sentence summary)}.',
        "The url must be the canonical job detail URL if visible.",
    ]
    if titles:
        parts.append(f"Preferred job titles: {', '.join(str(t) for t in titles[:8])}.")
    if locs:
        parts.append(f"Preferred locations: {', '.join(str(l) for l in locs[:8])}.")
    if kws:
        parts.append(f"Keywords to favor: {', '.join(str(k) for k in kws[:12])}.")
    if skills:
        parts.append(f"Candidate skills to align with: {', '.join(skills)}.")
    if preferences.get("remote_only"):
        parts.append("Strongly prefer remote or hybrid roles if present.")
    if preferences.get("visa_sponsorship"):
        parts.append("Favor roles that mention visa or sponsorship support if visible.")
    return " ".join(parts)
