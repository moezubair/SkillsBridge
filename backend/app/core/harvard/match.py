"""Heuristic: transcript + IELTS + skills vs Harvard major catalog entries."""

from __future__ import annotations

from typing import Any


def _course_blob(courses: list[Any]) -> str:
    parts: list[str] = []
    for c in courses:
        if not isinstance(c, dict):
            continue
        n = c.get("name")
        g = c.get("grade")
        lv = c.get("level")
        if n:
            parts.append(str(n).lower())
        if g:
            parts.append(str(g).lower())
        if lv:
            parts.append(str(lv).lower())
    return " ".join(parts)


def _gpa_num(extraction: dict[str, Any]) -> float | None:
    g = extraction.get("gpa")
    if isinstance(g, (int, float)):
        return float(g)
    return None


def match_student_to_majors(
    *,
    extraction: dict[str, Any],
    ielts: dict[str, Any] | None,
    skills: list[str],
    majors: list[dict[str, Any]],
    limit: int = 15,
) -> list[dict[str, Any]]:
    courses = extraction.get("courses")
    if not isinstance(courses, list):
        courses = []
    course_text = _course_blob(courses)
    skill_text = " ".join(s.lower() for s in skills if isinstance(s, str))
    gpa = _gpa_num(extraction)

    ielts_overall: float | None = None
    if isinstance(ielts, dict):
        o = ielts.get("overall")
        if isinstance(o, (int, float)):
            ielts_overall = float(o)

    results: list[dict[str, Any]] = []
    for m in majors:
        name = str(m.get("name") or "Unknown")
        keywords = m.get("keywords")
        kw_list = [str(x).lower() for x in keywords] if isinstance(keywords, list) else []
        summary = str(m.get("one_line_summary") or "").lower()
        detail = str(m.get("detail_url") or "")
        blob = " ".join([name.lower(), summary, " ".join(kw_list)])

        score = 45
        reasons: list[str] = []

        for kw in kw_list:
            if len(kw) >= 3 and kw in course_text:
                score += 8
                reasons.append(f"Course profile aligns with keyword: {kw}")
                break

        for kw in kw_list:
            if len(kw) >= 3 and kw in skill_text:
                score += 6
                reasons.append(f"Skill overlap with {name}: {kw}")
                break

        stem_hits = ("ap ", "honors", "ib ", "calculus", "physics", "chemistry", "biology", "computer")
        if any(h in course_text for h in stem_hits) and any(
            x in blob for x in ("engineer", "computer", "math", "statistic", "biology", "physics")
        ):
            score += 10
            reasons.append("Strong STEM coursework fits quantitative/science fields")

        if gpa is not None:
            if gpa >= 3.8:
                score += 12
                reasons.append("High GPA supports competitive concentrations")
            elif gpa >= 3.5:
                score += 8
                reasons.append("Solid GPA supports a range of concentrations")
            elif gpa >= 3.0:
                score += 4
                reasons.append("GPA noted for context")

        if ielts_overall is not None:
            if ielts_overall >= 7.5:
                score += 5
                reasons.append("IELTS overall supports English-heavy humanities")
            elif ielts_overall < 6.0:
                score -= 8
                reasons.append("IELTS overall is below typical strong English proficiency band")

        if not reasons:
            reasons.append("Baseline fit from catalog keywords and profile")

        score = max(0, min(100, score))
        results.append(
            {
                "major": name,
                "score": score,
                "reasons": reasons[:6],
                "detail_url": detail or None,
            }
        )

    results.sort(key=lambda x: (-x["score"], x["major"]))
    return results[:limit]
