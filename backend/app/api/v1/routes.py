"""
LogiPredict AI - Routes & Locations API Endpoints
=================================================
FastAPI endpoints for military forward logistics routes, depot locations,
shortest-path convoy optimization, and disruption simulations.

Indian Army Forward Supply Chain (SIH 2026)
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, Path, status

from app.schemas.location_route import (
    SupplyLocationBase,
    SupplyRouteBase,
    RouteOptimizationRequest,
    RouteOptimizationResponse,
    DisruptionSimulationRequest,
    DisruptionSimulationResponse,
    RouteKPIs,
)
from app.services.route_service import route_service

router = APIRouter(tags=["Route Planning & Logistics GIS"])


# ==============================================================================
# Locations Endpoints
# ==============================================================================

@router.get(
    "/locations",
    response_model=Dict[str, Any],
    summary="List all military logistics supply depots and forward hubs",
)
async def list_locations():
    """
    Retrieve all Forward Operating Bases, Base Depots, and Outposts.
    """
    locations = route_service.get_all_locations()
    return {
        "success": True,
        "data": {
            "locations": [loc.model_dump() for loc in locations],
            "total": len(locations),
        },
    }


@router.get(
    "/locations/{location_id}",
    response_model=Dict[str, Any],
    summary="Get single logistics depot by ID",
)
async def get_location(
    location_id: str = Path(..., description="Depot ID (e.g. LOC-LEH-01)")
):
    """
    Retrieve detailed metadata and GIS coordinates for a specific depot.
    """
    location = route_service.get_location_by_id(location_id)
    return {
        "success": True,
        "data": location.model_dump(),
    }


# ==============================================================================
# Routes Endpoints
# ==============================================================================

@router.get(
    "/routes",
    response_model=Dict[str, Any],
    summary="Query supply routes with filtering, search, and sorting",
)
async def list_routes(
    origin: Optional[str] = Query(None, description="Filter by origin depot ID"),
    destination: Optional[str] = Query(None, description="Filter by destination depot ID"),
    status: Optional[str] = Query(None, description="Filter by status: operational, delayed, disrupted, unavailable"),
    road_condition: Optional[str] = Query(None, description="Filter by road condition"),
    search: Optional[str] = Query(None, description="Text search across route name, pass, or corridor"),
    sortBy: str = Query("transit_time", description="Sort field: transit_time, distance, capacity_utilization, risk_score, cost"),
    sortOrder: str = Query("asc", description="Sort direction: asc, desc"),
):
    """
    Query, filter, and inspect forward supply corridors.
    """
    routes = route_service.query_routes(
        origin_location_id=origin,
        destination_location_id=destination,
        status=status,
        road_condition=road_condition,
        search=search,
        sort_by=sortBy,
        sort_order=sortOrder,
    )
    kpis = route_service.calculate_kpis()

    return {
        "success": True,
        "data": {
            "routes": [r.model_dump() for r in routes],
            "total": len(routes),
            "kpis": kpis.model_dump(),
        },
    }


@router.get(
    "/routes/kpis",
    response_model=Dict[str, Any],
    summary="Get network-wide route KPIs and active disruptions summary",
)
async def get_route_kpis():
    """
    Aggregated operational KPIs across all military supply routes.
    """
    kpis = route_service.calculate_kpis()
    return {
        "success": True,
        "data": kpis.model_dump(),
    }


@router.get(
    "/routes/{route_id}",
    response_model=Dict[str, Any],
    summary="Get route details and intermediate waypoints",
)
async def get_route_details(
    route_id: str = Path(..., description="Route ID (e.g. RTE-SRI-KRG-01)")
):
    """
    Retrieve full corridor telemetry, elevation profile, and waypoints.
    """
    route = route_service.get_route_by_id(route_id)
    return {
        "success": True,
        "data": route,
    }


# ==============================================================================
# Convoy Optimization & Simulation Endpoints
# ==============================================================================

@router.post(
    "/routes/optimize",
    response_model=Dict[str, Any],
    summary="AI Convoy Shortest-Path & Risk Optimization",
)
async def optimize_convoy_route(request: RouteOptimizationRequest):
    """
    Compute multi-criteria optimal route considering mountain pass risk,
    transit ETA, capacity headroom, and avalanche warnings.
    """
    result = route_service.optimize_route(request)
    return {
        "success": True,
        "data": result.model_dump(),
    }


@router.post(
    "/routes/simulate-disruption",
    response_model=Dict[str, Any],
    summary="Non-destructively simulate weather, pass closures, and delays",
)
async def simulate_route_disruption(request: DisruptionSimulationRequest):
    """
    Inject real-world disruption scenarios (e.g. Zoji La Blizzard, Rockfall)
    and receive immediate dynamic detour recommendations.
    """
    result = route_service.simulate_disruption(request)
    return {
        "success": True,
        "data": result.model_dump(),
    }


@router.post(
    "/routes/reset",
    response_model=Dict[str, Any],
    summary="Reset route telemetry and disruptions to pristine baseline",
)
async def reset_routes():
    """
    Restore default operational states, capacities, and clear simulation flags.
    """
    route_service.reset_to_pristine()
    kpis = route_service.calculate_kpis()
    return {
        "success": True,
        "data": {
            "reset": True,
            "message": "Route corridors reset to pristine baseline.",
            "kpis": kpis.model_dump(),
        },
    }
