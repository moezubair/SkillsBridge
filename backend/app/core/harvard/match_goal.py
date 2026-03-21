"""TinyFish goal text for Harvard major ranking (mirrors job board goal pattern)."""

from __future__ import annotations

import json
from typing import Any


def _transcript_summary(extraction: dict[str, Any], *, max_courses: int = 18) -> str:
    parts: list[str] = []
    sn = extraction.get("school_name")
    if isinstance(sn, str) and sn.strip():
        parts.append(f"School: {sn.strip()}.")
    gy = extraction.get("graduation_year")
    if gy is not None:
        parts.append(f"Graduation year: {gy}.")
    gpa = extraction.get("gpa")
    gs = extraction.get("gpa_scale")
    if gpa is not None:
        parts.append(f"GPA: {gpa}" + (f" (scale {gs})" if isinstance(gs, str) and gs else "") + ".")
    courses = extraction.get("courses")
    if isinstance(courses, list) and courses:
        names: list[str] = []
        for c in courses[:max_courses]:
            if isinstance(c, dict):
                n = c.get("name")
                if n:
                    g = c.get("grade")
                    lv = c.get("level")
                    bit = str(n)
                    if g is not None:
                        bit += f" ({g})"
                    if isinstance(lv, str) and lv:
                        bit += f" [{lv}]"
                    names.append(bit)
        if names:
            parts.append("Courses: " + "; ".join(names) + ".")
    return " ".join(parts) if parts else "Transcript details sparse."


def _ielts_line(ielts: dict[str, Any] | None) -> str:
    if not ielts:
        return ""
    bits = [f"{k}={v}" for k, v in sorted(ielts.items()) if v is not None]
    return ("IELTS bands: " + ", ".join(bits) + ".") if bits else ""


def build_harvard_match_goal(
    *,
    extraction: dict[str, Any],
    ielts: dict[str, Any] | None,
    skills: list[str],
    major_names_for_context: list[str],
    max_major_names: int = 45,
) -> str:
    """
    Natural-language goal for TinyFish on Harvard academics URL.
    Instructs agent to return strict JSON ranked matches.
    """
    t = _transcript_summary(extraction)
    iel = _ielts_line(ielts)
    sk = [s for s in skills if isinstance(s, str) and s.strip()][:24]
    sk_part = ("Skills / activities: " + ", ".join(sk) + ".") if sk else ""

    names = [str(n).strip() for n in major_names_for_context if n][:max_major_names]
    names_json = json.dumps(names, ensure_ascii=False)

    parts = [
        "You are helping rank Harvard College undergraduate fields of study (concentrations) for this student.",
        "Use the page you are on plus the student profile below.",
        "Student transcript summary:",
        t,
    ]
    if iel:
        parts.append(iel)
    if sk_part:
        parts.append(sk_part)
    parts.extend(
        [
            "Candidate concentration names to consider (prefer ranking within this set when they fit; "
            "you may include another Harvard field if strongly justified):",
            names_json + ".",
            "Return ONLY valid JSON with this exact shape — no markdown, no prose outside JSON:",
            '{"matches": ['
            '{"major": string, "score": number (0-100 integer), '
            '"reasons": string[] (2-5 short strings), "detail_url": string (optional, absolute URL if known)}'
            "]}.",
            "Include up to 15 matches, sorted by score descending.",
            "Scores should reflect fit to coursework, STEM/humanities balance, and stated skills/English profile.",
        ]
    )
    return " ".join(parts)
