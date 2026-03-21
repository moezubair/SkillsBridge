"""Writes file bytes to a local directory (production could swap for S3, etc.)."""

import asyncio
from pathlib import Path

from app.config.settings import Settings


class LocalDiskFileStorage:
    """Stores blobs on disk under a configured root; keys are unique filenames."""

    def __init__(self, settings: Settings) -> None:
        self._root = _resolve_upload_root(settings.UPLOAD_ROOT)

    def full_path(self, storage_key: str) -> Path:
        """Absolute path for a stored key (used when streaming downloads)."""
        if ".." in storage_key or storage_key.startswith(("/", "\\")):
            raise ValueError("Invalid storage key")
        path = (self._root / storage_key).resolve()
        path.relative_to(self._root)  # must stay under upload root
        return path

    async def write(self, storage_key: str, data: bytes) -> None:
        """Persist bytes asynchronously so we do not block the event loop."""
        path = self.full_path(storage_key)
        path.parent.mkdir(parents=True, exist_ok=True)

        def _write() -> None:
            path.write_bytes(data)

        await asyncio.to_thread(_write)


def _backend_root() -> Path:
    """Directory containing the `app` package (same anchor as settings loading `.env`)."""
    return Path(__file__).resolve().parents[3]


def _resolve_upload_root(config_value: str) -> Path:
    raw = Path(config_value)
    if raw.is_absolute():
        return raw.resolve()
    # Relative paths are stable regardless of process cwd (e.g. uvicorn from repo root).
    return (_backend_root() / raw).resolve()
