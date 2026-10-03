"""
LogiPredict AI - Backend FastAPI Application
=============================================
Phase 1: Architecture & Project Structure (Section 1.3: Application Architecture)

FastAPI application entry point registering middleware, routers, health checks,
and centralized standard error-handling conventions.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import (
    APP_NAME,
    VERSION,
    DESCRIPTION,
    DEBUG,
    ALLOWED_ORIGINS,
    API_V1_PREFIX,
)
from app.api.v1 import api_router
from app.schemas.common import HealthCheckResponse, MessageResponse, ApiErrorResponse
from app.utils.exceptions import AppException
from app.database.seed import init_db, seed_database
from app.database.session import SessionLocal


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager.
    Initializes database schema and ensures deterministic canonical seed data
    is populated on startup.
    """
    try:
        init_db()
        with SessionLocal() as db:
            seed_database(db, force_reset=False)
    except Exception as e:
        import logging
        logging.getLogger("uvicorn.error").error(f"Database initialization error: {e}")
    yield


# Initialize FastAPI Application
app = FastAPI(
    title=APP_NAME,
    description=DESCRIPTION,
    version=VERSION,
    debug=DEBUG,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure Cross-Origin Resource Sharing (CORS) Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==============================================================================
# Centralized Error Handling Handlers
# Standard Envelope: { "success": False, "error": { "code": "...", "message": "...", "details": {...} } }
# ==============================================================================

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Handles all domain-specific application exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handles Pydantic request validation errors (HTTP 422)"""
    formatted_errors = []
    for err in exc.errors():
        field = " -> ".join([str(loc) for loc in err.get("loc", []) if loc != "body"])
        formatted_errors.append({
            "field": field or "body",
            "message": err.get("msg", "Validation error"),
            "type": err.get("type", "value_error"),
        })

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "The provided request payload failed validation.",
                "details": {"validation_errors": formatted_errors},
            },
        },
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handles standard HTTPExceptions (e.g. 404 Not Found, 403 Forbidden)"""
    code_mapping = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "RESOURCE_NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        429: "RATE_LIMIT_EXCEEDED",
        500: "INTERNAL_SERVER_ERROR",
        503: "SERVICE_UNAVAILABLE",
    }
    error_code = code_mapping.get(exc.status_code, "HTTP_ERROR")

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": error_code,
                "message": str(exc.detail) if exc.detail else "An HTTP error occurred.",
                "details": {},
            },
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Catch-all for unhandled server errors (HTTP 500) preventing sensitive leaks"""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected internal server error occurred. Please contact the logistics administrator.",
                "details": {"debug_info": str(exc)} if DEBUG else {},
            },
        },
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
