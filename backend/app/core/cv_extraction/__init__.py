"""CV extraction: versioned JSON schemas for LandingAI ADE."""

from pathlib import Path

SCHEMA_VERSION_CV_V1 = "cv_v1"
SCHEMA_VERSION_TRANSCRIPT_V1 = "transcript_v1"


def load_cv_schema(version: str) -> dict:
    """Load a built-in extraction schema by version key (e.g. cv_v1)."""
    if version != SCHEMA_VERSION_CV_V1:
        raise ValueError(f"Unknown CV schema version: {version}")
    path = Path(__file__).resolve().parent / "schemas" / "cv_v1.json"
    import json

    return json.loads(path.read_text(encoding="utf-8"))


def load_transcript_schema(version: str) -> dict:
    """Load transcript / scoreboard extraction schema (e.g. transcript_v1)."""
    if version != SCHEMA_VERSION_TRANSCRIPT_V1:
        raise ValueError(f"Unknown transcript schema version: {version}")
    import json

    path = Path(__file__).resolve().parent / "schemas" / "transcript_v1.json"
    return json.loads(path.read_text(encoding="utf-8"))
