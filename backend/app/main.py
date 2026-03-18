from fastapi import FastAPI

from app.api.v1.router import api_router

app = FastAPI(
    title="AI Exam Prep API",
    version="0.1.0",
    description="Backend scaffold for AI-powered exam preparation platform.",
)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(api_router, prefix="/api/v1")
