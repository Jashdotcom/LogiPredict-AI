"""
LogiPredict AI - Common API Schemas
====================================
Standard envelope models, pagination, error details, and system responses.
"""

from typing import Optional, Generic, TypeVar, Any, Dict, List
from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorDetail(BaseModel):
    """Structured error detail schema"""
    code: str = Field(..., description="Machine-readable error slug (e.g. VALIDATION_ERROR)")
    message: str = Field(..., description="Human-readable error description")
    details: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Optional field-level validation errors or debugging metadata",
    )


class ApiErrorResponse(BaseModel):
    """Standardized error envelope returned across all API endpoints"""
    success: bool = Field(default=False, description="Always False for error responses")
    error: ErrorDetail = Field(..., description="Detailed error object")


class PaginationMeta(BaseModel):
    """Pagination metadata for paginated collection responses"""
    page: int = Field(default=1, ge=1, description="Current page number (1-indexed)")
    page_size: int = Field(default=20, ge=1, le=100, description="Number of items per page")
    total_items: int = Field(..., ge=0, description="Total number of items available")
    total_pages: int = Field(..., ge=0, description="Total number of calculated pages")
    has_next: bool = Field(default=False, description="Whether another page exists")
    has_previous: bool = Field(default=False, description="Whether a previous page exists")


class ApiResponse(BaseModel, Generic[T]):
    """Standardized success envelope wrapping API payloads"""
    success: bool = Field(default=True, description="Always True for successful responses")
    data: T = Field(..., description="Typed payload data")
    meta: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional metadata such as pagination or engine timing",
    )


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
    database_status: Optional[str] = Field(default=None, description="Database connection status")
    latency_ms: Optional[float] = Field(default=None, description="Database latency in milliseconds")
