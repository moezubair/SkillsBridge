"""Learning plan JSON shape validation."""

import json

from app.core.jobs.learning_plan import LearningPlan


def test_learning_plan_model_validate():
    raw = {
        "stages": [
            {
                "title": "Foundations",
                "timeline": "Week 1-2",
                "activities": ["Read docs", "Build hello API"],
                "resources": [
                    {"type": "article", "url": "https://example.com/guide", "title": "Guide"}
                ],
                "reason": "Core skills for role",
                "difficulty": "beginner",
                "impact": "Interview talking points",
            }
        ]
    }
    plan = LearningPlan.model_validate(raw)
    assert len(plan.stages) == 1
    assert plan.stages[0].resources[0].type == "article"
    dumped = json.loads(json.dumps(plan.model_dump()))
    assert dumped["stages"][0]["title"] == "Foundations"
