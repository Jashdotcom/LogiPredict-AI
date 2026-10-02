"""
LogiPredict AI - Application Configuration
===========================================
Loads environment variables with fallback defaults.
"""

import os
from typing import List

# Application Metadata
APP_NAME: str = os.getenv("APP_NAME", "LogiPredict AI API")
VERSION: str = os.getenv("VERSION", "0.1.0")
DESCRIPTION: str = (
    "Predictive Logistics and Forward Supply Chain Management API for the Indian Army (SIH 2026)"
)
DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "t")

# API Versioning Prefix
API_V1_PREFIX: str = "/api/v1"

# Database Settings (Placeholder for future database connectivity)
DATABASE_URL: str = os.getenv(
    "DATABASE_URL", "sqlite:///./logipredict.db"
)

# Security & Secrets (Placeholder for authentication/JWT)
SECRET_KEY: str = os.getenv(
    "SECRET_KEY", "insecure-development-key-replace-in-production"
)

# CORS Allowed Origins
_allowed_origins_raw = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000",
)
ALLOWED_ORIGINS: List[str] = [origin.strip() for origin in _allowed_origins_raw.split(",") if origin.strip()]
