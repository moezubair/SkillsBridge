import pytest

from app.core.cv_extraction import SCHEMA_VERSION_CV_V1, load_cv_schema
from app.core.landingai.ade_client import AdeExtractResult
from app.services.cv_extraction_service import _derive_status


def test_load_cv_v1_schema():
    schema = load_cv_schema(SCHEMA_VERSION_CV_V1)
    assert schema["type"] == "object"
    assert "technical_skills" in schema["properties"]


def test_load_unknown_schema_version():
    with pytest.raises(ValueError, match="Unknown"):
        load_cv_schema("cv_999")


def test_derive_status_complete():
    ext = AdeExtractResult(
        extraction={},
        extraction_metadata={},
        metadata={},
        http_status=200,
    )
    assert _derive_status(200, ext) == "complete"


def test_derive_status_partial_on_206_extract():
    ext = AdeExtractResult(
        extraction={},
        extraction_metadata={},
        metadata={},
        http_status=206,
    )
    assert _derive_status(200, ext) == "partial"


def test_derive_status_partial_on_parse_206():
    ext = AdeExtractResult(
        extraction={},
        extraction_metadata={},
        metadata={},
        http_status=200,
    )
    assert _derive_status(206, ext) == "partial"


def test_derive_status_partial_on_schema_violation():
    ext = AdeExtractResult(
        extraction={},
        extraction_metadata={},
        metadata={"schema_violation_error": "x"},
        http_status=200,
    )
    assert _derive_status(200, ext) == "partial"
