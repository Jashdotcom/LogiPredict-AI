"""
LogiPredict AI - API v1 Master Router
======================================
Aggregates and registers all version 1 route endpoints.
"""

from fastapi import APIRouter
from app.api.v1.forecast import router as forecast_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.routes import router as routes_router

api_router = APIRouter()

# Register domain sub-routers
api_router.include_router(forecast_router)
api_router.include_router(alerts_router)
api_router.include_router(routes_router)


@api_router.get("/info", tags=["System Info"])
async def get_system_info():
    """
    API v1 System Telemetry Endpoint
    Returns version, model engine status, and operational mode.
    """
    return {
        "api_version": "v1",
        "system": "LogiPredict AI — Indian Army Forward Supply Chain Engine",
        "edition": "SIH 2026",
        "engine_status": "standby",
        "modules": [
            "inventory_management",
            "demand_forecasting",
            "route_planning",
            "supply_requisitions",
            "predictive_alerts",
            "analytics_reports",
        ],
    }
