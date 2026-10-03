"""
LogiPredict AI - Predictive Alerts API Router
=============================================
Phase 6.3: Predictive Supply Chain Anomaly & Alert Management Endpoints
Indian Army Forward Supply Chain (SIH 2026)

Provides endpoints for querying, filtering, sorting, evaluating, acknowledging,
and resolving predictive logistics alerts.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, Path, Body, status, HTTPException

from app.schemas.common import ApiResponse
from app.schemas.alert import (
    AlertResponse,
    AlertSummary,
    AlertEvaluationRequest,
    AlertAcknowledgeRequest,
    AlertResolveRequest,
)
from app.services.alert_service import alert_store_service
from app.utils.exceptions import ValidationError, NotFoundError

router = APIRouter(prefix="", tags=["Predictive Alerts"])


@router.get(
    "/alerts",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Query, Filter, and Paginate Supply Chain Alerts",
)
async def get_alerts(
    search: Optional[str] = Query(None, description="Search term across title, description, SKU, warehouse"),
    severity: str = Query("all", description="Filter by severity ('all', 'critical', 'warning', 'info')"),
    category: str = Query("all", description="Filter by supply category"),
    status: str = Query("all", description="Filter by lifecycle status ('all', 'new', 'acknowledged', 'resolved')"),
    location: str = Query("all", description="Filter by warehouse or depot location"),
    dateRange: Optional[str] = Query(None, alias="dateRange", description="Date window filter"),
    date_range: Optional[str] = Query(None, description="Date window filter (snake_case)"),
    sortBy: Optional[str] = Query(None, alias="sortBy", description="Sorting field"),
    sort_by: Optional[str] = Query(None, description="Sorting field (snake_case)"),
    sortOrder: Optional[str] = Query(None, alias="sortOrder", description="Sort direction ('asc' | 'desc')"),
    sort_order: Optional[str] = Query(None, description="Sort direction (snake_case)"),
    page: int = Query(1, ge=1, description="Page number"),
    pageSize: Optional[int] = Query(None, alias="pageSize", ge=1, le=100, description="Page size"),
    page_size: Optional[int] = Query(None, ge=1, le=100, description="Page size (snake_case)"),
):
    """
    Returns filtered, sorted, and paginated supply chain anomaly alerts with live KPI counters.
    Supports both camelCase and snake_case query parameter aliases for frontend compatibility.
    """
    effective_sort = sortBy or sort_by or "created_at"
    effective_order = sortOrder or sort_order or "desc"
    effective_page_size = pageSize or page_size or 10
    effective_date_range = dateRange or date_range

    result = alert_store_service.query_alerts(
        search=search,
        severity=severity,
        category=category,
        status=status,
        location=location,
        date_range=effective_date_range,
        sort_by=effective_sort,
        sort_order=effective_order,
        page=page,
        page_size=effective_page_size,
    )

    return ApiResponse.success_response(
        data=result,
        message=f"Retrieved {len(result['items'])} alert records (Total: {result['total']}).",
    )


@router.get(
    "/alerts/summary",
    response_model=ApiResponse[AlertSummary],
    summary="Get High-Level Active Alert KPI Summary",
)
async def get_alert_summary():
    """
    Returns real-time aggregated counts of active, critical, warning, unacknowledged,
    and transit risk alerts across the supply network.
    """
    summary = alert_store_service.calculate_kpis()
    return ApiResponse.success_response(
        data=summary,
        message="Alert KPI summary generated successfully.",
    )


@router.get(
    "/alerts/{alert_id}",
    response_model=ApiResponse[AlertResponse],
    summary="Get Alert Details by Identifier",
)
async def get_alert_details(
    alert_id: str = Path(..., description="Alert ID (e.g. 'ALT-1049' or integer ID)"),
):
    """
    Retrieves full telemetry, trigger conditions, audit stamps, and action protocol for a specific alert.
    """
    alert = alert_store_service.get_alert_by_id(alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with identifier '{alert_id}' was not found.",
        )
    return ApiResponse.success_response(
        data=alert,
        message=f"Retrieved alert {alert.alert_id}.",
    )


@router.post(
    "/alerts/evaluate",
    response_model=ApiResponse[List[AlertResponse]],
    summary="Evaluate Telemetry and Trigger Anomaly Alerts",
)
async def evaluate_alerts(
    payload: Optional[AlertEvaluationRequest] = Body(default=None),
):
    """
    Runs rule-based and predictive anomaly evaluation against inventory items and transit routes.
    Applies deterministic MD5 deduplication to prevent duplicate active alerts.
    """
    items = payload.inventory_items if payload else None
    routes = payload.routes if payload else None
    auto_persist = payload.auto_persist if payload else True

    triggered = alert_store_service.evaluate_and_persist(
        inventory_items=items,
        routes=routes,
        auto_persist=auto_persist,
    )

    return ApiResponse.success_response(
        data=triggered,
        message=f"Evaluation completed. Generated {len(triggered)} new non-duplicate alerts.",
    )


@router.post(
    "/alerts/{alert_id}/acknowledge",
    response_model=ApiResponse[AlertResponse],
    summary="Acknowledge an Anomaly Alert",
)
async def acknowledge_alert(
    alert_id: str = Path(..., description="Alert identifier to acknowledge"),
    payload: Optional[AlertAcknowledgeRequest] = Body(default=None),
):
    """
    Acknowledges an active anomaly alert, logging the officer's callsign and timestamp.
    """
    callsign = payload.acknowledged_by if payload else "Col. Rajesh Verma"
    try:
        updated = alert_store_service.acknowledge_alert(
            alert_id=alert_id,
            acknowledged_by=callsign,
        )
        return ApiResponse.success_response(
            data=updated,
            message=f"Alert {alert_id} acknowledged by {callsign}.",
        )
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)


@router.post(
    "/alerts/{alert_id}/resolve",
    response_model=ApiResponse[AlertResponse],
    summary="Resolve and Mitigate an Anomaly Alert",
)
async def resolve_alert(
    alert_id: str = Path(..., description="Alert identifier to resolve"),
    payload: Optional[AlertResolveRequest] = Body(default=None),
):
    """
    Marks an anomaly alert as resolved, recording the mitigation notes, resolving officer, and timestamp.
    """
    callsign = payload.resolved_by if payload and payload.resolved_by else "Col. Rajesh Verma"
    notes = (
        payload.resolution_notes
        if payload
        else "Anomaly mitigated via standard operational protocol."
    )

    try:
        updated = alert_store_service.resolve_alert(
            alert_id=alert_id,
            resolved_by=callsign,
            resolution_notes=notes,
        )
        return ApiResponse.success_response(
            data=updated,
            message=f"Alert {alert_id} resolved with mitigation audit trail.",
        )
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)


@router.post(
    "/alerts/reset",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Reset Alerts Store to Synthetic Baseline",
)
async def reset_alerts():
    """
    Restores all alert states to initial synthetic baseline records.
    """
    alert_store_service.reset_to_pristine()
    kpis = alert_store_service.calculate_kpis()
    return ApiResponse.success_response(
        data={"kpis": kpis, "reset": True},
        message="Alert repository reset to baseline synthetic state.",
    )
