"""
LogiPredict AI - Simulation API Router
======================================
FastAPI endpoints for forward logistics discrete-event simulations:
baseline configuration, military scenario presets, simulation execution,
and before-versus-after comparative envelopes.

Indian Army Forward Supply Chain (SIH 2026)
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, Path, Body, status

from app.schemas.common import ApiResponse
from app.schemas.simulation import (
    SimulationRequest,
    SimulationBaselineResponse,
    SimulationResultResponse,
    PresetScenarioInfo,
)
from app.services.simulation_service import simulation_service
from app.utils.exceptions import NotFoundError, ValidationError

router = APIRouter(prefix="/simulation", tags=["Simulation Workspace"])


# ==============================================================================
# Simulation Endpoints
# ==============================================================================

@router.get(
    "/baseline",
    response_model=ApiResponse[SimulationBaselineResponse],
    summary="Get simulation baseline metrics and workspace configuration",
)
async def get_simulation_baseline():
    """
    Retrieve baseline inventory levels, SKU catalog summary, strategic routes,
    and pre-configured military disruption presets to initialize the simulation workspace.
    """
    baseline_data = simulation_service.get_baseline_info()
    return ApiResponse(
        success=True,
        data=baseline_data,
        meta={"source": "LogiPredict Discrete-Event Engine (SIH 2026)"},
    )


@router.get(
    "/scenarios",
    response_model=ApiResponse[List[PresetScenarioInfo]],
    summary="List pre-configured military disruption scenario presets",
)
async def list_preset_scenarios():
    """
    Retrieve all tactical military disruption presets (Zoji La Blizzard, Khardung La Landslide,
    Forward Surge, Rear Supply Delay, Cold Chain Failure, Peacetime Baseline).
    """
    presets = simulation_service.get_preset_scenarios()
    return ApiResponse(
        success=True,
        data=presets,
        meta={"total": len(presets)},
    )


@router.get(
    "/scenarios/{scenario_id}",
    response_model=ApiResponse[PresetScenarioInfo],
    summary="Get single military disruption scenario preset by ID",
)
async def get_preset_scenario(
    scenario_id: str = Path(..., description="Scenario preset ID (e.g. SCN-WINTER-01)"),
):
    """
    Retrieve detailed parameters and tactical narrative for a specific disruption scenario.
    """
    preset = simulation_service.get_preset_scenario_by_id(scenario_id)
    return ApiResponse(
        success=True,
        data=preset,
    )


@router.post(
    "/run",
    response_model=ApiResponse[SimulationResultResponse],
    status_code=status.HTTP_200_OK,
    summary="Execute forward logistics stress test simulation",
)
async def run_simulation(
    request: SimulationRequest = Body(..., description="Simulation parameters and disruption injection"),
):
    """
    Execute a deterministic discrete-event logistics simulation modeling forward inventory
    drawdowns, supply line delays, demand surges, and corridor disruptions over 7 to 180 days.
    Returns 7-dimension Before-Versus-After comparison metrics, daily trajectories, stockout events,
    impact summaries, and proactive recommendations.
    """
    result = simulation_service.run_simulation(request)
    return ApiResponse(
        success=True,
        data=result,
        meta={
            "execution_time_seconds": result.execution_time_seconds,
            "simulation_id": result.simulation_id,
        },
    )


@router.get(
    "/{simulation_id}",
    response_model=ApiResponse[SimulationResultResponse],
    summary="Retrieve completed simulation run results by ID",
)
async def get_simulation_run(
    simulation_id: str = Path(..., description="Simulation Run ID (e.g. SIM-1727961234)"),
):
    """
    Retrieve full results, comparative envelopes, and recommendations of a prior simulation execution.
    """
    result = simulation_service.get_simulation_by_id(simulation_id)
    return ApiResponse(
        success=True,
        data=result,
    )
