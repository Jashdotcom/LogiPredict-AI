"""
LogiPredict AI - Backend FastAPI Application
=============================================
Phase 1: Architecture & Project Structure (Section 1.2: Backend Structure)

FastAPI application entry point registering middleware, routers, and health checks.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import (
    APP_NAME,
    VERSION,
    DESCRIPTION,
    DEBUG,
    ALLOWED_ORIGINS,
    API_V1_PREFIX,
)
from app.api.v1 import api_router
from app.schemas import HealthCheckResponse, MessageResponse

# Initialize FastAPI Application
app = FastAPI(
    title=APP_NAME,
    description=DESCRIPTION,
    version=VERSION,
    debug=DEBUG,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure Cross-Origin Resource Sharing (CORS) Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Version 1 API Router
app.include_router(api_router, prefix=API_V1_PREFIX)


@app.get(
    "/",
    tags=["General"],
    response_model=MessageResponse,
    summary="Root Welcome Endpoint",
)
async def root():
    """
    Root Endpoint
    Returns welcome metadata and discovery URLs for API documentation.
    """
    return {
        "message": f"Welcome to {APP_NAME}",
        "status": "online",
        "version": VERSION,
    }


@app.get(
    "/health",
    tags=["Health"],
    response_model=HealthCheckResponse,
    summary="Service Health Check",
)
async def health_check():
    """
    Health Check Endpoint
    Monitors operational availability and environment status.
    """
    return {
        "status": "healthy",
        "service": APP_NAME,
        "version": VERSION,
        "environment": "development" if DEBUG else "production",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
