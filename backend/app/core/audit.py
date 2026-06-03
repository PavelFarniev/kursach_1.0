from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Any

from fastapi import Request

from app.core.config import settings

AUDIT_LOGGER_NAME = "killexam.audit"


def configure_audit_logging() -> None:
    audit_logger = logging.getLogger(AUDIT_LOGGER_NAME)
    log_path = Path(settings.audit_log_path)
    log_path.parent.mkdir(parents=True, exist_ok=True)

    for handler in audit_logger.handlers:
        if isinstance(handler, RotatingFileHandler) and Path(handler.baseFilename) == log_path:
            return

    handler = RotatingFileHandler(
        log_path,
        maxBytes=settings.audit_log_max_bytes,
        backupCount=settings.audit_log_backup_count,
        encoding="utf-8",
    )
    handler.setFormatter(logging.Formatter("%(message)s"))

    audit_logger.setLevel(logging.INFO)
    audit_logger.addHandler(handler)
    audit_logger.propagate = False


def build_request_context(request: Request) -> dict[str, Any]:
    return {
        "request_path": request.url.path,
        "request_method": request.method,
        "ip_address": request.client.host if request.client else "",
        "user_agent": request.headers.get("user-agent", ""),
    }


def log_audit_event(
    *,
    event: str,
    status: str = "success",
    actor_id: int | None = None,
    actor_email: str | None = None,
    resource: str | None = None,
    request: Request | None = None,
    details: dict[str, Any] | None = None,
) -> None:
    configure_audit_logging()
    payload: dict[str, Any] = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event": event,
        "status": status,
        "actor_id": actor_id,
        "actor_email": actor_email,
        "resource": resource,
    }

    if request is not None:
        payload.update(build_request_context(request))

    if details:
        payload["details"] = details

    logging.getLogger(AUDIT_LOGGER_NAME).info(
        json.dumps(payload, ensure_ascii=False, sort_keys=True)
    )
