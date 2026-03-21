"""Input DTO for an upload before validation and persistence."""

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class IncomingPdfPayload:
    """Raw PDF upload from multipart: name, declared type, and body."""

    original_filename: str
    content_type: str | None
    data: bytes
