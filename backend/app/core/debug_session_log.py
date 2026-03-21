"""Session NDJSON log for debug mode (no secrets)."""

from __future__ import annotations

import json
import logging
import time
from pathlib import Path

_logger = logging.getLogger(__name__)


def debug_ndjson(
    *,
    hypothesis_id: str,
    location: str,
    message: str,
    data: dict,
) -> None:
    # Write backend/debug-6c8ffe.log and SkillsBridge/debug-6c8ffe.log; mirror to root logger (uvicorn console).
    # #region agent log
    line = {
        "sessionId": "6c8ffe",
        "timestamp": int(time.time() * 1000),
        "hypothesisId": hypothesis_id,
        "location": location,
        "message": message,
        "data": data,
    }
    payload = json.dumps(line, ensure_ascii=False)
    _logger.info("DEBUG_NDJSON %s", payload)
    here = Path(__file__).resolve()
    paths = [
        here.parents[1] / "debug-6c8ffe.log",
        here.parents[2] / "debug-6c8ffe.log",
    ]
    if len(here.parents) > 3:
        paths.append(here.parents[3] / "debug-6c8ffe.log")
    for log_path in paths:
        try:
            with open(log_path, "a", encoding="utf-8") as f:
                f.write(payload + "\n")
        except Exception as exc:
            _logger.warning("debug_ndjson write failed %s: %s", log_path, exc)
    # #endregion
