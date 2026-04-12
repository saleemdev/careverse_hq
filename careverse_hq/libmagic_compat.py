"""Compatibility helpers for environments where libmagic is unavailable."""

from __future__ import annotations

import importlib
import mimetypes
import sys
import types
from typing import Any


_LIBMAGIC_ERROR_HINTS = ("libmagic", "failed to find libmagic")


def _looks_like_libmagic_error(exc: ImportError) -> bool:
    return any(hint in str(exc).lower() for hint in _LIBMAGIC_ERROR_HINTS)


def _guess_mime_from_buffer(buffer: bytes | bytearray | memoryview | None) -> str:
    if not buffer:
        return "application/octet-stream"

    sample = bytes(buffer[:32])
    if sample.startswith(b"%PDF-"):
        return "application/pdf"
    if sample.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if sample.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if sample.startswith((b"GIF87a", b"GIF89a")):
        return "image/gif"
    if sample.startswith(b"PK\x03\x04"):
        return "application/zip"

    return "application/octet-stream"


def _guess_mime_from_path(path: str | None) -> str:
    return mimetypes.guess_type(path or "")[0] or "application/octet-stream"


def _build_fallback_module() -> types.ModuleType:
    module = types.ModuleType("magic")

    class Magic:  # noqa: D401 - mirrors python-magic surface
        def __init__(self, mime: bool = False, **_: Any):
            self.mime = mime

        def from_file(self, filename: str, mime: bool | None = None) -> str:
            return from_file(filename, self.mime if mime is None else mime)

        def from_buffer(self, buffer: bytes, mime: bool | None = None) -> str:
            return from_buffer(buffer, self.mime if mime is None else mime)

    def from_file(filename: str, mime: bool = False) -> str:
        mime_type = _guess_mime_from_path(filename)
        return mime_type if mime else mime_type

    def from_buffer(buffer: bytes, mime: bool = False) -> str:
        mime_type = _guess_mime_from_buffer(buffer)
        return mime_type if mime else mime_type

    module.Magic = Magic
    module.from_file = from_file
    module.from_buffer = from_buffer
    module.__careversehq_fallback__ = True
    return module


def ensure_magic_compat():
    """Install a small `magic` fallback module when libmagic is missing."""
    existing = sys.modules.get("magic")
    if existing is not None:
        return existing

    try:
        return importlib.import_module("magic")
    except ImportError as exc:
        if not _looks_like_libmagic_error(exc):
            raise

        sys.modules.pop("magic", None)
        fallback = _build_fallback_module()
        sys.modules["magic"] = fallback
        return fallback
