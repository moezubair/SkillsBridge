import httpx
import pytest

from app.config.settings import Settings
from app.core.landingai.ade_client import AdeClient, LandingAiApiError


def _settings() -> Settings:
    return Settings(
        LANDINGAI_API_KEY="test-key",
        LANDINGAI_BASE_URL="https://api.va.landing.ai",
    )


@pytest.mark.asyncio
async def test_parse_pdf_success():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path.endswith("/v1/ade/parse")
        return httpx.Response(
            200,
            json={
                "markdown": "%PDF as markdown\n# Jane",
                "metadata": {"job_id": "job-parse-1", "page_count": 1},
            },
        )

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as http:
        client = AdeClient(_settings(), http_client=http)
        result = await client.parse_pdf(b"fake", "cv.pdf")
        assert result.http_status == 200
        assert "Jane" in result.markdown
        assert result.metadata.get("job_id") == "job-parse-1"
        await client.aclose()


@pytest.mark.asyncio
async def test_extract_success_partial_206():
    schema = {"type": "object", "properties": {"a": {"type": "string"}}, "required": ["a"]}

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path.endswith("/v1/ade/extract")
        body = request.read().decode("utf-8", errors="replace")
        assert "schema" in body
        return httpx.Response(
            206,
            json={
                "extraction": {"a": "x"},
                "extraction_metadata": {},
                "metadata": {"job_id": "job-ext-1", "schema_violation_error": "minor"},
            },
        )

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as http:
        client = AdeClient(_settings(), http_client=http)
        result = await client.extract("# doc", schema)
        assert result.http_status == 206
        assert result.extraction["a"] == "x"
        await client.aclose()


@pytest.mark.asyncio
async def test_parse_pdf_upstream_error():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(401, json={"detail": "Unauthorized"})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as http:
        client = AdeClient(_settings(), http_client=http)
        with pytest.raises(LandingAiApiError) as exc:
            await client.parse_pdf(b"x", "x.pdf")
        assert exc.value.status_code == 401
        await client.aclose()


@pytest.mark.asyncio
async def test_missing_api_key():
    settings = Settings(LANDINGAI_API_KEY="")
    transport = httpx.MockTransport(lambda r: httpx.Response(500))
    async with httpx.AsyncClient(transport=transport) as http:
        client = AdeClient(settings, http_client=http)
        with pytest.raises(LandingAiApiError, match="LANDINGAI_API_KEY"):
            await client.parse_pdf(b"x", "x.pdf")
        await client.aclose()
