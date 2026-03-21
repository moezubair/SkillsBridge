"""OpenAI JSON learning plan from job gap analysis."""

from __future__ import annotations

import json
import logging
from typing import Any, Literal

import openai
from pydantic import BaseModel, Field

from app.config.settings import Settings

logger = logging.getLogger(__name__)


class LearningResource(BaseModel):
    type: Literal["video", "article", "site"]
    url: str
    title: str | None = None


class LearningStage(BaseModel):
    title: str
    timeline: str
    activities: list[str] = Field(default_factory=list)
    resources: list[LearningResource] = Field(default_factory=list)
    reason: str
    difficulty: str
    impact: str


class LearningPlan(BaseModel):
    stages: list[LearningStage] = Field(default_factory=list)


def build_learning_plan_user_message(
    *,
    target_role: str | None,
    job_title: str,
    job_snippet: str | None,
    gap_analysis: dict[str, Any],
    cv_profile: str,
) -> str:
    gaps_json = json.dumps(gap_analysis, ensure_ascii=False)
    role = (target_role or "").strip() or "(not specified — infer from job title)"
    snippet = (job_snippet or "").strip() or "(none)"
    return (
        f"Target role (user): {role}\n"
        f"Job title: {job_title}\n"
        f"Job snippet: {snippet}\n"
        f"Gap analysis (from agent): {gaps_json}\n"
        f"Candidate profile summary:\n{cv_profile}\n\n"
        "Produce a practical multi-stage learning roadmap to close the gaps and strengthen candidacy. "
        "Use reputable public resources; prefer well-known docs, courses, and official guides. "
        "Return JSON only matching the schema described in the system message."
    )


async def generate_learning_plan(
    settings: Settings,
    *,
    target_role: str | None,
    job_title: str,
    job_snippet: str | None,
    gap_analysis: dict[str, Any],
    cv_profile: str,
) -> LearningPlan | None:
    key = (settings.OPENAI_API_KEY or "").strip()
    if not key:
        return None

    model = (settings.OPENAI_JOB_LEARNING_MODEL or "").strip() or "gpt-4o-mini"
    client = openai.AsyncOpenAI(api_key=key)
    system = (
        "You respond with JSON only. The user message will ask for a learning roadmap.\n"
        "Output a single JSON object with exactly this top-level key:\n"
        '"stages": array of objects, each with:\n'
        '  "title": string (stage name),\n'
        '  "timeline": string (e.g. "Week 1-2" or "Month 1"),\n'
        '  "activities": array of strings (what to do in this stage),\n'
        '  "resources": array of { "type": "video" | "article" | "site", "url": string, "title": string or null },\n'
        '  "reason": string (why this stage matters),\n'
        '  "difficulty": string (e.g. beginner / intermediate / advanced),\n'
        '  "impact": string (how it helps employability or interview performance).\n'
        "Include 3-8 stages. If gaps are empty, infer sensible steps for the target role from the job title and snippet.\n"
        "The word json appears in this instruction so json_object mode is valid."
    )
    user_msg = build_learning_plan_user_message(
        target_role=target_role,
        job_title=job_title,
        job_snippet=job_snippet,
        gap_analysis=gap_analysis,
        cv_profile=cv_profile,
    )
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        content = (response.choices[0].message.content or "").strip()
        data = json.loads(content)
        return LearningPlan.model_validate(data)
    except Exception as exc:
        logger.warning("Learning plan generation failed: %s", exc)
        return None
