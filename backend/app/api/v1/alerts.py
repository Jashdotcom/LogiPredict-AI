"""Database-backed predictive alert endpoints."""

from datetime import datetime, timedelta, timezone
from math import ceil
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Query, Path, Body, status, HTTPException, Depends
from sqlalchemy import or_, asc, desc
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.alert import PredictiveAlertModel
from app.schemas.common import ApiResponse
from app.schemas.alert import (
    AlertResponse,
    AlertSummary,
    AlertEvaluationRequest,
    AlertAcknowledgeRequest,
    AlertResolveRequest,
)
from app.services.alert_service import alert_store_service

router = APIRouter(prefix="", tags=["Predictive Alerts"])


def _alert_dict(alert: PredictiveAlertModel) -> Dict[str, Any]:
    """Serialize database rows using the API's historical lowercase contract."""
    data = alert.to_dict()
    data.update({
        "alert_type": str(alert.alert_type).lower(),
        "severity": str(alert.severity).lower(),
        "status": str(alert.status).lower(),
        "updated_at": max(
            value for value in (
                alert.created_at,
                alert.acknowledged_at,
                alert.resolved_at,
            ) if value is not None
        ).isoformat(),
    })
    return data


def _find_alert(db: Session, alert_id: str) -> Optional[PredictiveAlertModel]:
    query = db.query(PredictiveAlertModel)
    if alert_id.isdigit():
        found = query.filter(PredictiveAlertModel.id == int(alert_id)).first()
        if found:
            return found
    return query.filter(PredictiveAlertModel.alert_id == alert_id).first()


def _summary(db: Session) -> Dict[str, Any]:
    rows = db.query(PredictiveAlertModel).all()
    active = [row for row in rows if str(row.status).upper() != "RESOLVED"]
    critical = [row for row in active if str(row.severity).upper() == "CRITICAL"]
    warning = [row for row in active if str(row.severity).upper() in ("WARNING", "HIGH")]
    info = [row for row in active if str(row.severity).upper() in ("INFO", "LOW", "MEDIUM")]
    transit = [
        row for row in active
        if str(row.alert_type).upper() in ("ROUTE_DISRUPTION", "DELAYED_SUPPLY")
        or row.category == "Transit & Route Logistics"
    ]
    latest = max(critical, key=lambda row: row.created_at, default=None)
    return {
        "total_active_alerts": len(active),
        "critical_count": len(critical),
        "warning_count": len(warning),
        "info_count": len(info),
        "unacknowledged_count": sum(row.acknowledged_at is None for row in active),
        "transit_risks_count": len(transit),
        "resolved_count": len(rows) - len(active),
        "latest_critical_alert": _alert_dict(latest) if latest else None,
    }


@router.get("/alerts", response_model=ApiResponse[Dict[str, Any]])
async def get_alerts(
    search: Optional[str] = Query(None),
    severity: str = Query("all"), category: str = Query("all"),
    status: str = Query("all"), location: str = Query("all"),
    dateRange: Optional[str] = Query(None, alias="dateRange"),
    date_range: Optional[str] = Query(None),
    sortBy: Optional[str] = Query(None, alias="sortBy"), sort_by: Optional[str] = Query(None),
    sortOrder: Optional[str] = Query(None, alias="sortOrder"), sort_order: Optional[str] = Query(None),
    page: int = Query(1, ge=1), pageSize: Optional[int] = Query(None, alias="pageSize", ge=1, le=100),
    page_size: Optional[int] = Query(None, ge=1, le=100), db: Session = Depends(get_db),
):
    query = db.query(PredictiveAlertModel)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(
            PredictiveAlertModel.alert_id.ilike(term), PredictiveAlertModel.title.ilike(term),
            PredictiveAlertModel.description.ilike(term), PredictiveAlertModel.item_name.ilike(term),
            PredictiveAlertModel.item_id.ilike(term), PredictiveAlertModel.location_name.ilike(term),
            PredictiveAlertModel.category.ilike(term), PredictiveAlertModel.recommended_action.ilike(term),
        ))
    if severity.lower() != "all":
        severity_values = [severity.upper()]
        if severity.lower() == "warning":
            severity_values += ["HIGH"]
        query = query.filter(PredictiveAlertModel.severity.in_(severity_values))
    if category.lower() != "all":
        query = query.filter(PredictiveAlertModel.category.ilike(f"%{category}%"))
    if status.lower() != "all":
        normalized = "RESOLVED" if status.lower() == "resolved" else "ACKNOWLEDGED" if status.lower() == "acknowledged" else "ACTIVE"
        query = query.filter(PredictiveAlertModel.status == normalized)
    if location.lower() != "all":
        term = f"%{location}%"
        query = query.filter(or_(PredictiveAlertModel.location_id.ilike(term), PredictiveAlertModel.location_name.ilike(term)))

    sort_field = (sortBy or sort_by or "created_at").lower()
    sort_column = {
        "created_at": PredictiveAlertModel.created_at, "title": PredictiveAlertModel.title,
        "category": PredictiveAlertModel.category, "severity": PredictiveAlertModel.severity,
        "status": PredictiveAlertModel.status, "location_name": PredictiveAlertModel.location_name,
    }.get(sort_field, PredictiveAlertModel.created_at)
    query = query.order_by((asc if (sortOrder or sort_order or "desc").lower() == "asc" else desc)(sort_column))
    total = query.count()
    size = pageSize or page_size or 10
    total_pages = max(1, ceil(total / size))
    safe_page = min(page, total_pages)
    rows = query.offset((safe_page - 1) * size).limit(size).all()
    return ApiResponse.success_response(
        data={"items": [_alert_dict(row) for row in rows], "total": total, "page": safe_page,
              "page_size": size, "total_pages": total_pages, "kpis": _summary(db)},
        message=f"Retrieved {len(rows)} alert records (Total: {total}).",
    )


@router.get("/alerts/summary", response_model=ApiResponse[AlertSummary])
async def get_alert_summary(db: Session = Depends(get_db)):
    return ApiResponse.success_response(data=_summary(db), message="Alert KPI summary generated successfully.")


@router.get("/alerts/{alert_id}", response_model=ApiResponse[AlertResponse])
async def get_alert_details(alert_id: str = Path(...), db: Session = Depends(get_db)):
    alert = _find_alert(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert with identifier '{alert_id}' was not found.")
    return ApiResponse.success_response(data=_alert_dict(alert), message=f"Retrieved alert {alert.alert_id}.")


@router.post("/alerts/evaluate", response_model=ApiResponse[List[AlertResponse]])
async def evaluate_alerts(payload: Optional[AlertEvaluationRequest] = Body(default=None), db: Session = Depends(get_db)):
    items = payload.inventory_items if payload else None
    routes = payload.routes if payload else None
    auto_persist = payload.auto_persist if payload else True
    generated = alert_store_service.evaluate_and_persist(items, routes, auto_persist=False)
    result = []
    for generated_alert in generated:
        data = generated_alert.model_dump()
        existing = db.query(PredictiveAlertModel).filter(PredictiveAlertModel.alert_id == data["alert_id"]).first()
        if existing:
            result.append(_alert_dict(existing))
            continue
        if auto_persist:
            row = PredictiveAlertModel(
                alert_id=data["alert_id"], item_id=data.get("item_id") or "UNKNOWN", item_name=data.get("item_name") or "Unknown",
                location_id=data.get("location_id") or "UNKNOWN", location_name=data.get("location_name") or "Unknown",
                alert_type=str(data["alert_type"]).split(".")[-1].upper(), category=data.get("category") or "General",
                severity=str(data["severity"]).split(".")[-1].upper(), status="ACTIVE", title=data["title"], description=data["description"],
                predicted_impact=data["predicted_impact"], recommended_action=data["recommended_action"], trigger_condition=data.get("trigger_condition"),
                dedup_hash=data.get("dedup_hash"), is_synthetic=data.get("is_synthetic", True), created_at=datetime.utcnow(),
            )
            db.add(row)
            db.flush()
            result.append(_alert_dict(row))
        else:
            result.append(data)
    if auto_persist:
        db.commit()
    return ApiResponse.success_response(data=result, message=f"Evaluation completed. Generated {len(result)} new non-duplicate alerts.")


@router.post("/alerts/{alert_id}/acknowledge", response_model=ApiResponse[AlertResponse])
async def acknowledge_alert(alert_id: str, payload: Optional[AlertAcknowledgeRequest] = Body(default=None), db: Session = Depends(get_db)):
    row = _find_alert(db, alert_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Alert with identifier '{alert_id}' was not found.")
    if str(row.status).upper() == "RESOLVED":
        raise HTTPException(status_code=400, detail="Resolved alerts cannot be acknowledged.")
    row.status = "ACKNOWLEDGED"
    row.acknowledged_at = datetime.utcnow()
    row.acknowledged_by = payload.acknowledged_by if payload else "Col. Rajesh Verma"
    db.commit(); db.refresh(row)
    return ApiResponse.success_response(data=_alert_dict(row), message=f"Alert {alert_id} acknowledged by {row.acknowledged_by}.")


@router.post("/alerts/{alert_id}/resolve", response_model=ApiResponse[AlertResponse])
async def resolve_alert(alert_id: str, payload: Optional[AlertResolveRequest] = Body(default=None), db: Session = Depends(get_db)):
    row = _find_alert(db, alert_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Alert with identifier '{alert_id}' was not found.")
    row.status = "RESOLVED"; row.resolved_at = datetime.utcnow()
    row.resolved_by = payload.resolved_by if payload and payload.resolved_by else "Col. Rajesh Verma"
    row.resolution_notes = payload.resolution_notes if payload else "Anomaly mitigated via standard operational protocol."
    db.commit(); db.refresh(row)
    return ApiResponse.success_response(data=_alert_dict(row), message=f"Alert {alert_id} resolved with mitigation audit trail.")


@router.post("/alerts/{alert_id}/mitigate", response_model=ApiResponse[Dict[str, Any]])
async def mitigate_alert(alert_id: str, payload: Optional[Dict[str, Any]] = Body(default=None), db: Session = Depends(get_db)):
    row = _find_alert(db, alert_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Alert with identifier '{alert_id}' was not found.")
    action = (payload or {}).get("actionType") or (payload or {}).get("action_type") or "dispatch_emergency_convoy"
    row.status = "RESOLVED"; row.resolved_at = datetime.utcnow(); row.resolved_by = (payload or {}).get("callsign") or "Col. Rajesh Verma"
    row.resolution_notes = (payload or {}).get("notes") or f"Automated mitigation protocol '{action}' dispatched successfully."
    db.commit()
    return ApiResponse.success_response(data={"success": True, "alertId": alert_id, "alert_id": alert_id, "actionType": action, "action_type": action, "timestamp": datetime.now(timezone.utc).isoformat(), "message": f"Mitigation protocol '{action}' dispatched successfully."}, message=f"Mitigation protocol '{action}' dispatched for alert {alert_id}.")


@router.post("/alerts/reset", response_model=ApiResponse[Dict[str, Any]])
async def reset_alerts(db: Session = Depends(get_db)):
    rows = db.query(PredictiveAlertModel).all()
    for row in rows:
        row.status = "ACTIVE"; row.acknowledged_at = None; row.acknowledged_by = None
        row.resolved_at = None; row.resolved_by = None; row.resolution_notes = None
    db.commit()
    return ApiResponse.success_response(data={"kpis": _summary(db), "reset": True}, message="Alert repository reset to baseline synthetic state.")
