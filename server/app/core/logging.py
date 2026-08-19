"""Application logging configuration."""

import logging

from app.core.config import settings


def configure_logging() -> None:
    """Configure the process logger once, without overriding host configuration."""
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
