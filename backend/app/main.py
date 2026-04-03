from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.db import SessionLocal, engine
from app.services.auth_service import seed_demo_data

logger = logging.getLogger(__name__)
REQUIRED_SEED_TABLES = {"users", "courses", "enrollments"}


def _has_seed_schema() -> bool:
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    return REQUIRED_SEED_TABLES.issubset(table_names)


@asynccontextmanager
async def lifespan(_: FastAPI):
    if _has_seed_schema():
        with SessionLocal() as db:
            seed_demo_data(db)
    else:
        logger.warning("Database schema is missing. Run 'alembic upgrade head' before starting the app.")

    yield

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Backend for AI-powered exam preparation platform.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(api_router, prefix="/api/v1")
