"""
LogiPredict AI - Centralized Custom Application Exceptions
==========================================================
Domain-specific exceptions mapped to standardized API error envelope codes.
"""

from typing import Optional, Dict, Any


class AppException(Exception):
    """Base exception for all LogiPredict AI operational errors"""
    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


class NotFoundError(AppException):
    """Resource not found error (404)"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="RESOURCE_NOT_FOUND",
            status_code=404,
            details=details,
        )


class ValidationError(AppException):
    """Domain validation error (422 / 400)"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=422,
            details=details,
        )


class UnauthorizedError(AppException):
    """Authentication required error (401)"""
    def __init__(self, message: str = "Authentication required to access this resource", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="UNAUTHORIZED",
            status_code=401,
            details=details,
        )


class ForbiddenError(AppException):
    """Permission denied error (403)"""
    def __init__(self, message: str = "Insufficient clearance for this military asset", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="FORBIDDEN",
            status_code=403,
            details=details,
        )


class ConflictError(AppException):
    """Resource state conflict error (409)"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="RESOURCE_CONFLICT",
            status_code=409,
            details=details,
        )


class SimulationError(AppException):
    """Simulation engine execution failure (400 / 500)"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="SIMULATION_EXECUTION_ERROR",
            status_code=400,
            details=details,
        )


class RateLimitError(AppException):
    """Rate limit exceeded error (429)"""
    def __init__(self, message: str = "Too many requests. Please try again later", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="RATE_LIMIT_EXCEEDED",
            status_code=429,
            details=details,
        )
