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


def _truncate(s: str, max_len: int) -> str:
    s = s.strip()
    if len(s) <= max_len:
        return s
    return s[: max_len - 3].rstrip() + "..."


def compact_cv_profile_for_goal(extraction: dict[str, Any], *, max_chars: int = 2800) -> str:
    """Bounded text block embedded in the TinyFish goal."""
    parts: list[str] = []
    if not extraction:
        return "No CV extraction available."

    fn = extraction.get("full_name")
    if isinstance(fn, str) and fn.strip():
        parts.append(f"Name: {fn.strip()}.")

    ps = extraction.get("professional_summary")
    if isinstance(ps, str) and ps.strip():
        parts.append(f"Summary: {_truncate(ps, 600)}")

    yoe = extraction.get("years_of_experience")
    if yoe is not None:
        parts.append(f"Years of experience (approx): {yoe}.")

    loc = extraction.get("location")
    if isinstance(loc, str) and loc.strip():
        parts.append(f"Candidate location: {loc.strip()}.")

    skills = _as_skill_list(
        extraction,
        "technical_skills",
        "programming_languages",
        "frameworks_and_libraries",
        "cloud_and_infrastructure",
    )[:40]
    if skills:
        parts.append("Skills: " + ", ".join(skills) + ".")

    wx = extraction.get("work_experience")
    if isinstance(wx, list) and wx:
        lines: list[str] = []
        for w in wx[:4]:
            if not isinstance(w, dict):
                continue
            title = w.get("title")
            co = w.get("company")
            head = " — ".join(x for x in (title, co) if isinstance(x, str) and x.strip())
            if not head:
                continue
            hl = w.get("highlights")
            extra = ""
            if isinstance(hl, list) and hl:
                bits = [str(x) for x in hl[:3] if x is not None]
                if bits:
                    extra = " Highlights: " + _truncate("; ".join(bits), 220)
            lines.append(head + extra)
        if lines:
            parts.append("Work: " + " | ".join(lines))

    edu = extraction.get("education")
    if isinstance(edu, list) and edu:
        elines: list[str] = []
        for e in edu[:3]:
            if not isinstance(e, dict):
                continue
            deg = e.get("degree")
            field = e.get("field")
            inst = e.get("institution")
            bits = [str(x) for x in (deg, field, inst) if isinstance(x, str) and x.strip()]
            if bits:
                elines.append(", ".join(bits))
        if elines:
            parts.append("Education: " + "; ".join(elines) + ".")

    blob = " ".join(parts)
    return _truncate(blob, max_chars) if len(blob) > max_chars else blob


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

    target_role = preferences.get("target_role")
    if isinstance(target_role, str) and target_role.strip():
        tr = target_role.strip().lower()
        if tr in title_l or any(
            len(tok) > 2 and tok in title_l for tok in tr.replace("/", " ").split()
        ):
            score += 18
            reasons.append(f"Title aligns with target role: {target_role.strip()}")

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
    target_role: str | None = None,
) -> str:
    """Natural-language goal for TinyFish: return JSON for exactly one job plus gap analysis."""
    titles = preferences.get("desired_titles") or []
    locs = preferences.get("locations") or []
    kws = preferences.get("keywords_include") or []
    profile = compact_cv_profile_for_goal(extraction)

    tr = (target_role or "").strip()
    role_line = (
        f"PRIMARY TARGET ROLE FOR THIS SEARCH: {tr}. "
        f"Choose a listing that best matches this role (title and responsibilities). "
        if tr
        else ""
    )

    secondary_titles = (
        f"Additional preferred job titles (secondary): {', '.join(str(t) for t in titles[:8])}. "
        if titles and not tr
        else (
            f"Also consider these title hints: {', '.join(str(t) for t in titles[:8])}. "
            if titles and tr
            else ""
        )
    )

    json_shape = (
        '{"title": string, "company": string, "url": string (absolute job posting URL), '
        '"location": string, "snippet": string (1-3 sentences from visible posting text), '
        '"missing_or_weak_vs_job": ['
        '{"requirement": string, "candidate_signal": string or null}'
        "], "
        '"improvements_to_close_gaps": ['
        '{"related_requirement": string, "what_to_build_or_learn": string, "suggested_evidence": string}'
        "]}. "
        "missing_or_weak_vs_job: requirements or strengths implied by the visible posting that the candidate "
        "profile below does not clearly satisfy (or is weak on). "
        "improvements_to_close_gaps: concrete ways to close each gap (courses, projects, certs, experience). "
        "Use empty arrays if the posting text is too thin to compare. "
        "Return ONLY this one JSON object, no markdown, no prose outside JSON."
    )

    parts = [
        "You are on a job board page. Identify the single best job listing for this candidate.",
        role_line,
        secondary_titles,
        "Candidate profile (from CV extraction):",
        profile,
        json_shape,
        "The url must be the canonical job detail URL if visible.",
    ]
    if locs:
        parts.append(f"Preferred locations: {', '.join(str(l) for l in locs[:8])}.")
    if kws:
        parts.append(f"Keywords to favor: {', '.join(str(k) for k in kws[:12])}.")
    if preferences.get("remote_only"):
        parts.append("Strongly prefer remote or hybrid roles if present.")
    if preferences.get("visa_sponsorship"):
        parts.append("Favor roles that mention visa or sponsorship support if visible.")
    return " ".join(parts)
