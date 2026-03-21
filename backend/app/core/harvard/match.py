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

        score = 3
        reasons: list[str] = []
        passed_requirements: list[str] = []
        failed_requirements: list[str] = []
        borderline_requirements: list[str] = []
        confidence = 5

        course_match = False
        for kw in kw_list:
            if len(kw) >= 3 and kw in course_text:
                score += 2
                reasons.append(f"Strong course content alignment: contains keyword '{kw}'.")
                passed_requirements.append(f"Relevant coursework: {kw}")
                course_match = True
                break

        skill_match = False
        for kw in kw_list:
            if len(kw) >= 3 and kw in skill_text:
                score += 2
                reasons.append(f"Skill match to major profile: found '{kw}' in provided skills.")
                passed_requirements.append(f"Relevant skill: {kw}")
                skill_match = True
                break

        if not course_match and not skill_match:
            reasons.append("No direct keyword match in courses or skills, baseline fit.")
            failed_requirements.append("No matching coursework or skills")

        stem_hits = ("ap ", "honors", "ib ", "calculus", "physics", "chemistry", "biology", "computer")
        if any(h in course_text for h in stem_hits) and any(
            x in blob for x in ("engineer", "computer", "math", "statistic", "biology", "physics")
        ):
            score += 2
            reasons.append("STEM coursework in transcript strongly supports quantitative concentrations.")
            passed_requirements.append("STEM coursework present")

        if gpa is not None:
            if gpa >= 3.8:
                score += 2
                reasons.append("GPA is excellent and supports highly competitive majors.")
                passed_requirements.append("GPA >= 3.8")
            elif gpa >= 3.5:
                score += 1
                reasons.append("GPA is strong and suitable for many majors.")
                passed_requirements.append("GPA >= 3.5")
            elif gpa >= 3.0:
                reasons.append("GPA is moderate; consider more selective concentration options carefully.")
                borderline_requirements.append("GPA 3.0-3.5")
            else:
                score -= 1
                reasons.append("GPA is lower than typical competitive admission thresholds.")
                failed_requirements.append("GPA < 3.0")
        else:
            failed_requirements.append("GPA not available")

        if ielts_overall is not None:
            if ielts_overall >= 7.5:
                score += 1
                reasons.append("IELTS is strong for English-intensive majors")
                passed_requirements.append("IELTS >= 7.5")
            elif ielts_overall >= 6.5:
                reasons.append("IELTS is acceptable; higher score would broaden options")
                passed_requirements.append("IELTS >= 6.5")
            elif ielts_overall >= 6.0:
                borderline_requirements.append("IELTS 6.0-6.5")
            else:
                score -= 1
                reasons.append("IELTS is below ideal level for top programs")
                failed_requirements.append("IELTS < 6.0")
        else:
            failed_requirements.append("IELTS not available")

        if not reasons:
            reasons.append("Baseline fit from profile.")

        score = max(0, min(10, score))

        # Confidence based on data completeness
        data_points = 0
        if gpa is not None:
            data_points += 1
        if ielts_overall is not None:
            data_points += 1
        if course_match or skill_match:
            data_points += 1
        confidence = min(10, data_points * 3 + 1)  # Scale to 0-10

        results.append(
            {
                "major": name,
                "score": score,
                "passed_requirements": passed_requirements,
                "failed_requirements": failed_requirements,
                "borderline_requirements": borderline_requirements,
                "confidence": confidence,
                "reasons": reasons[:6],
                "detail_url": detail or None,
            }
        )

    results.sort(key=lambda x: (-x["score"], x["major"]))
    return results[:limit]
