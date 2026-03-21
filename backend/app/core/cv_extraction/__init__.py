"""CV extraction: versioned JSON schemas for LandingAI ADE."""

from pathlib import Path

SCHEMA_VERSION_CV_V1 = "cv_v1"


def load_cv_schema(version: str) -> dict:
    """Load a built-in extraction schema by version key (e.g. cv_v1)."""
    if version != SCHEMA_VERSION_CV_V1:
        raise ValueError(f"Unknown CV schema version: {version}")
    path = Path(__file__).resolve().parent / "schemas" / "cv_v1.json"
    import json

    return json.loads(path.read_text(encoding="utf-8"))
