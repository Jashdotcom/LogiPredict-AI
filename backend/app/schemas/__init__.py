"""
LogiPredict AI - Schemas Package
=================================
Contains Pydantic models for request validation, response serialization,
and data contract enforcement between frontend and backend.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class MessageResponse(BaseModel):
    """Generic message response schema"""
    message: str = Field(..., description="Response message text")
    status: str = Field(default="ok", description="Status code or indicator")
    version: Optional[str] = Field(default=None, description="API version")


class HealthCheckResponse(BaseModel):
    """Health check response schema"""
    status: str = Field(default="healthy", description="Operational status")
    service: str = Field(..., description="Service identifier")
    version: str = Field(..., description="Application version")
    environment: str = Field(default="development", description="Runtime environment")


__all__ = [
    "MessageResponse",
    "HealthCheckResponse",
]
