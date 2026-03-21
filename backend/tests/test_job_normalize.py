"""Unit tests for TinyFish result → one job listing normalization."""

from app.core.jobs.normalize import normalize_one_job, source_site_from_url


def test_normalize_flat_job():
    result = {
        "title": "Engineer",
        "company": "Acme",
        "url": "https://example.com/jobs/1",
        "location": "Remote",
        "snippet": "Build things.",
    }
    out = normalize_one_job(result)
    assert out is not None
    assert out["title"] == "Engineer"
    assert out["source_url"] == "https://example.com/jobs/1"
    assert out["company"] == "Acme"
    assert out["description_snippet"] == "Build things."


def test_normalize_nested_job_key():
    result = {
        "job": {
            "title": "Dev",
            "url": "https://board.example/p/1",
        }
    }
    out = normalize_one_job(result)
    assert out is not None
    assert out["title"] == "Dev"
    assert "board.example" in out["source_site"]


def test_normalize_jobs_array():
    result = {
        "jobs": [
            {"title": "First", "url": "https://x.com/1"},
            {"title": "Second", "url": "https://x.com/2"},
        ]
    }
    out = normalize_one_job(result)
    assert out is not None
    assert out["title"] == "First"


def test_normalize_rejects_missing_url():
    assert normalize_one_job({"title": "Only title"}) is None


def test_source_site_from_url():
    assert source_site_from_url("https://www.indeed.com/viewjob") == "indeed.com"
