"""TinyFish goal text for gathering program requirements (web scraping focus)."""

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


def build_program_requirements_goal(
    *,
    extraction: dict[str, Any],
    ielts: dict[str, Any] | None,
    skills: list[str],
    program_names_for_context: list[str],
    university_name: str,
    max_program_names: int = 45,
) -> str:
    """
    Natural-language goal for TinyFish web scraping.
    Instructs agent to gather program requirements and details, not rank.
    """
    t = _transcript_summary(extraction)
    iel = _ielts_line(ielts)
    sk = [s for s in skills if isinstance(s, str) and s.strip()][:24]
    sk_part = ("Skills / activities: " + ", ".join(sk) + ".") if sk else ""

    names = [str(n).strip() for n in program_names_for_context if n][:max_program_names]
    names_json = json.dumps(names, ensure_ascii=False)

    parts = [
        f"You are helping gather detailed program requirements from {university_name} for this student.",
        "Use the page you are on to extract information about each program.",
        "Student profile for reference:",
        t,
    ]
    if iel:
        parts.append(iel)
    if sk_part:
        parts.append(sk_part)
    parts.extend(
        [
            f"Program names at {university_name} to research (prefer gathering details for programs in this list):",
            names_json + ".",
            "For each program, extract and return ALL of the following information if available:",
            "- Required courses or course categories (e.g., Mathematics, Physics, Chemistry)",
            "- Minimum GPA (if stated)",
            "- Standardized test requirements (SAT, ACT, IELTS, TOEFL, etc.)",
            "- Additional tests or assessments (AP, IB, subject-specific exams)",
            "- Extracurricular activities or experiences preferred/required",
            "- Any other admission or enrollment criteria listed on the page",
            "Return ONLY valid JSON with this exact shape — no markdown, no prose outside JSON:",
            '{"programs": ['
            '{"name": string, "required_courses": string[], "required_gpa": string (optional), "required_tests": string[], "extracurriculars": string[], "other_requirements": string[], "detail_url": string (optional, absolute URL)}'
            "]}.",
            "Include all programs found, up to 20.",
            "Use only information explicitly stated on the page; do not infer or add opinions.",
        ]
    )
    return " ".join(parts)
