"""One TinyFish run against Harvard public academics page to enrich major catalog."""

from __future__ import annotations

import logging

from app.config.settings import Settings
from app.core.harvard.catalog import merge_seed_and_agent, parse_tinyfish_catalog_result
from app.core.tinyfish.client import TinyFishError, run_automation_sse

logger = logging.getLogger(__name__)

HARVARD_CATALOG_GOAL = (
    "You are on Harvard College academics information. Extract undergraduate fields of study "
    "or concentrations mentioned on this page. Return ONLY valid JSON with this exact shape: "
    '{"majors": [{"name": string, "url": string (absolute link if available), '
    '"one_line_summary": string}]}. Use at least 5 entries if visible on the page; '
    "if the page is a hub, list linked concentration names you can see."
)


async def fetch_harvard_catalog_via_tinyfish(settings: Settings) -> dict:
    """
    Run TinyFish once; merge with seed file. Returns {"majors": [...], "source": "tinyfish+seed"|"seed_only"}.
    """
    from app.core.harvard.catalog import load_seed_majors

    seed = load_seed_majors()
    url = (settings.HARVARD_CATALOG_URL or "").strip()
    if not url:
        return {"majors": merge_seed_and_agent(seed, []), "source": "seed_only"}

    key = (settings.TINYFISH_API_KEY or "").strip()
    if not key:
        merged = merge_seed_and_agent(seed, [])
        return {"majors": merged, "source": "seed_only"}

    try:
        timeout_s = float(
            settings.TINYFISH_HARVARD_TIMEOUT_SECONDS or settings.TINYFISH_SSE_TIMEOUT_SECONDS
        )
        result, _run_id = await run_automation_sse(
            url=url,
            goal=HARVARD_CATALOG_GOAL,
            api_key=key,
            timeout_seconds=timeout_s,
            base_url=(settings.TINYFISH_BASE_URL or "").strip() or None,
        )
        agent_list = parse_tinyfish_catalog_result(result)
        merged = merge_seed_and_agent(seed, agent_list)
        return {"majors": merged, "source": "tinyfish+seed"}
    except TinyFishError as exc:
        logger.warning("Harvard TinyFish catalog fetch failed: %s", exc)
        merged = merge_seed_and_agent(seed, [])
        return {"majors": merged, "source": "seed_only"}
