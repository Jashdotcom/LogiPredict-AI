"""
LogiPredict AI - Inventory API Router
=====================================
Phase 10.1: Database-Backed Inventory & Multi-Echelon Stock Management Endpoints
Indian Army Forward Supply Chain (SIH 2026)

Provides endpoints for inventory querying, stock level updates, transaction auditing,
health diagnostics, and category rollups backed by persistent SQLite database storage.
"""

from datetime import datetime
import time
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, Path, Body, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from app.database.session import get_db
from app.models.inventory import InventoryItemModel, InventoryTransactionModel
from app.schemas.common import ApiResponse
from app.schemas.inventory import (
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryTransactionCreate,
    StockHealthSummary,
    CategoryStockSummary,
)

router = APIRouter(prefix="", tags=["Inventory Management"])


def _query_inventory(
    db: Session,
    search: Optional[str] = None,
    category: Optional[str] = None,
    location: Optional[str] = None,
    status_filter: Optional[str] = None,
    min_stock: Optional[float] = None,
    max_stock: Optional[float] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = None,
    page: Optional[int] = None,
    page_size: Optional[int] = None,
) -> Dict[str, Any]:
    """Helper function to filter, sort, and paginate inventory items from database."""
    query = db.query(InventoryItemModel)

    # Search filter across SKU ID, name, location
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                InventoryItemModel.item_id.ilike(term),
                InventoryItemModel.item_name.ilike(term),
                InventoryItemModel.storage_location_id.ilike(term),
                InventoryItemModel.storage_location_name.ilike(term),
            )
        )

    # Category filter
    if category and category.lower() != "all":
        query = query.filter(InventoryItemModel.category.ilike(f"%{category.strip()}%"))

    # Location / Depot filter
    if location and location.lower() != "all":
        query = query.filter(
            or_(
                InventoryItemModel.storage_location_id.ilike(f"%{location.strip()}%"),
                InventoryItemModel.storage_location_name.ilike(f"%{location.strip()}%"),
            )
        )

    # Stock quantity bounds
    if min_stock is not None:
        query = query.filter(InventoryItemModel.current_stock >= min_stock)
    if max_stock is not None:
        query = query.filter(InventoryItemModel.current_stock <= max_stock)

    all_items = query.all()

    # Status filter (computed property)
    if status_filter and status_filter.lower() != "all":
        target = status_filter.lower()
        if target in ("stockout risk", "critical"):
            all_items = [i for i in all_items if i.status.lower() in ("critical", "stockout risk")]
        elif target in ("warning", "reorder"):
            all_items = [i for i in all_items if i.status.lower() == "warning"]
        elif target in ("healthy", "optimal"):
            all_items = [i for i in all_items if i.status.lower() in ("optimal", "healthy")]
        elif target == "overstock":
            all_items = [i for i in all_items if i.status.lower() == "overstock"]

    total = len(all_items)

    # Sorting
    effective_sort = sort_by or "item_id"
    reverse = (sort_order or "asc").lower() == "desc"

    if effective_sort == "current_stock":
        all_items.sort(key=lambda x: x.current_stock, reverse=reverse)
    elif effective_sort == "item_name":
        all_items.sort(key=lambda x: x.item_name.lower(), reverse=reverse)
    elif effective_sort == "category":
        all_items.sort(key=lambda x: x.category.lower(), reverse=reverse)
    elif effective_sort == "status":
        all_items.sort(key=lambda x: x.status.lower(), reverse=reverse)
    elif effective_sort == "stock_health_ratio":
        all_items.sort(key=lambda x: x.stock_health_ratio, reverse=reverse)
    elif effective_sort == "days_of_supply_remaining":
        all_items.sort(key=lambda x: x.days_of_supply_remaining, reverse=reverse)
    elif effective_sort == "updated_at":
        all_items.sort(key=lambda x: x.updated_at or datetime.min, reverse=reverse)
    else:
        all_items.sort(key=lambda x: x.item_id.lower(), reverse=reverse)

    # Pagination
    if page and page_size:
        start_idx = (page - 1) * page_size
        paginated_items = all_items[start_idx : start_idx + page_size]
    else:
        paginated_items = all_items

    return {
        "items": [item.to_dict() for item in paginated_items],
        "total": total,
        "page": page or 1,
        "page_size": page_size or total,
    }


# ==============================================================================
# INVENTORY QUERY ENDPOINTS
# ==============================================================================

@router.get(
    "/inventory",
    response_model=ApiResponse[List[Dict[str, Any]]],
    summary="List, Search, and Filter Inventory Items",
)
@router.get(
    "/inventory/items",
    response_model=ApiResponse[List[Dict[str, Any]]],
    summary="List, Search, and Filter Inventory Items (Alias)",
)
async def get_inventory(
    search: Optional[str] = Query(None, description="Search by SKU ID, name, or depot"),
    category: Optional[str] = Query("all", description="Filter by supply category"),
    depot: Optional[str] = Query(None, description="Filter by depot location"),
    location: Optional[str] = Query(None, description="Filter by depot location (alias)"),
    status: Optional[str] = Query("all", description="Filter by stock health status ('optimal', 'warning', 'critical', 'overstock')"),
    filter: Optional[str] = Query(None, description="Status filter alias"),
    min_stock: Optional[float] = Query(None, description="Minimum stock threshold"),
    max_stock: Optional[float] = Query(None, description="Maximum stock threshold"),
    sortBy: Optional[str] = Query(None, alias="sortBy", description="Sort field"),
    sort_by: Optional[str] = Query(None, description="Sort field (snake_case)"),
    sortOrder: Optional[str] = Query(None, alias="sortOrder", description="Sort direction ('asc' | 'desc')"),
    sort_order: Optional[str] = Query(None, description="Sort direction (snake_case)"),
    page: Optional[int] = Query(None, ge=1, description="Page number"),
    pageSize: Optional[int] = Query(None, alias="pageSize", ge=1, le=500, description="Page size"),
    page_size: Optional[int] = Query(None, ge=1, le=500, description="Page size (snake_case)"),
    db: Session = Depends(get_db),
):
    """
    Returns inventory items matching search and filter criteria.
    Compatible with frontend array consumption and backend pagination envelopes.
    """
    effective_location = depot or location
    effective_status = filter or status
    effective_sort = sortBy or sort_by
    effective_order = sortOrder or sort_order
    effective_page_size = pageSize or page_size

    res = _query_inventory(
        db=db,
        search=search,
        category=category,
        location=effective_location,
        status_filter=effective_status,
        min_stock=min_stock,
        max_stock=max_stock,
        sort_by=effective_sort,
        sort_order=effective_order,
        page=page,
        page_size=effective_page_size,
    )

    return ApiResponse.success_response(
        data=res["items"],
        message=f"Retrieved {len(res['items'])} inventory records (Total: {res['total']}).",
        meta={"total": res["total"], "page": res["page"], "page_size": res["page_size"]},
    )


# ==============================================================================
# INVENTORY SUMMARY & HEALTH ENDPOINTS
# ==============================================================================

@router.get(
    "/inventory/summary",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Get Multi-Echelon Stock Health Summary",
)
@router.get(
    "/inventory/health",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Get Multi-Echelon Stock Health Summary (Alias)",
)
async def get_inventory_summary(db: Session = Depends(get_db)):
    """
    Computes global supply health percentage, active SKU counts, critical stockout
    risks, pending replenishment orders, and categorical health metrics.
    """
    items = db.query(InventoryItemModel).all()
    total_skus = len(items)

    if total_skus == 0:
        return ApiResponse.success_response(
            data={
                "overall_health_percentage": 0.0,
                "total_active_skus": 0,
                "critical_stockout_risks": 0,
                "pending_reorder_pos": 0,
                "categories_breakdown": [],
            },
            message="No inventory records found.",
        )

    critical_count = 0
    warning_count = 0
    optimal_count = 0
    overstock_count = 0
    total_health_ratio = 0.0

    # Categorical groupings
    cat_map: Dict[str, Dict[str, Any]] = {}

    for item in items:
        item_status = item.status
        health_ratio = item.stock_health_ratio
        total_health_ratio += min(100.0, health_ratio)

        if item_status == "Critical":
            critical_count += 1
        elif item_status == "Warning":
            warning_count += 1
        elif item_status == "Overstock":
            overstock_count += 1
        else:
            optimal_count += 1

        cat = item.category
        if cat not in cat_map:
            cat_map[cat] = {
                "category": cat,
                "total_skus": 0,
                "optimal_count": 0,
                "warning_count": 0,
                "critical_count": 0,
                "health_sum": 0.0,
            }
        cat_map[cat]["total_skus"] += 1
        cat_map[cat]["health_sum"] += min(100.0, health_ratio)
        if item_status == "Critical":
            cat_map[cat]["critical_count"] += 1
        elif item_status == "Warning":
            cat_map[cat]["warning_count"] += 1
        else:
            cat_map[cat]["optimal_count"] += 1

    overall_health = round(total_health_ratio / total_skus, 1)

    categories_breakdown = []
    for cat, info in cat_map.items():
        n = info["total_skus"]
        categories_breakdown.append({
            "category": cat,
            "total_skus": n,
            "optimal_count": info["optimal_count"],
            "warning_count": info["warning_count"],
            "critical_count": info["critical_count"],
            "average_health_percentage": round(info["health_sum"] / max(1, n), 1),
        })

    summary_data = {
        "overall_health_percentage": overall_health,
        "total_active_skus": total_skus,
        "critical_stockout_risks": critical_count,
        "pending_reorder_pos": critical_count + warning_count,
        "categories_breakdown": categories_breakdown,
    }

    return ApiResponse.success_response(
        data=summary_data,
        message="Inventory health summary generated successfully.",
    )


@router.get(
    "/inventory/categories",
    response_model=ApiResponse[List[Dict[str, Any]]],
    summary="Get Inventory Category Breakdown",
)
async def get_inventory_categories(db: Session = Depends(get_db)):
    """Returns aggregated stock health metrics grouped by supply category."""
    summary_resp = await get_inventory_summary(db=db)
    return ApiResponse.success_response(
        data=summary_resp.data["categories_breakdown"],
        message="Category stock summaries retrieved successfully.",
    )


# ==============================================================================
# INVENTORY TRANSACTION LOGGING & AUDIT TRAIL
# ==============================================================================

@router.get(
    "/inventory/transactions",
    response_model=ApiResponse[List[Dict[str, Any]]],
    summary="Query Inventory Stock Transactions",
)
async def get_inventory_transactions(
    item_id: Optional[str] = Query(None, description="Filter by SKU ID"),
    location_id: Optional[str] = Query(None, description="Filter by location/depot"),
    transaction_type: Optional[str] = Query(None, description="Filter by movement type"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=500, description="Page size"),
    db: Session = Depends(get_db),
):
    """Retrieves paginated audit log of stock movements."""
    query = db.query(InventoryTransactionModel)

    if item_id:
        query = query.filter(InventoryTransactionModel.item_id == item_id)
    if location_id:
        query = query.filter(InventoryTransactionModel.location_id == location_id)
    if transaction_type and transaction_type.lower() != "all":
        query = query.filter(InventoryTransactionModel.transaction_type == transaction_type.lower())

    total = query.count()
    txns = (
        query.order_by(desc(InventoryTransactionModel.logged_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return ApiResponse.success_response(
        data=[t.to_dict() for t in txns],
        message=f"Retrieved {len(txns)} transaction audit records (Total: {total}).",
        meta={"total": total, "page": page, "page_size": page_size},
    )


@router.post(
    "/inventory/transactions",
    response_model=ApiResponse[Dict[str, Any]],
    status_code=status.HTTP_201_CREATED,
    summary="Record New Stock Movement Transaction",
)
async def create_inventory_transaction(
    payload: InventoryTransactionCreate,
    db: Session = Depends(get_db),
):
    """
    Records an inventory movement transaction (inflow, outflow, transfer, adjustment, loss)
    and automatically adjusts the target SKU on-hand stock and audit balance.
    """
    item = db.query(InventoryItemModel).filter(InventoryItemModel.item_id == payload.item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory item with SKU '{payload.item_id}' was not found.",
        )

    t_type = payload.transaction_type.value.lower() if hasattr(payload.transaction_type, "value") else str(payload.transaction_type).lower()
    qty = payload.quantity

    # Calculate stock adjustment
    if t_type == "inflow":
        item.current_stock += abs(qty)
    elif t_type in ("outflow", "loss"):
        item.current_stock = max(0.0, item.current_stock - abs(qty))
    elif t_type == "transfer":
        item.current_stock = max(0.0, item.current_stock - abs(qty))
    elif t_type == "adjustment":
        if qty >= 0:
            item.current_stock = qty
        else:
            item.current_stock = max(0.0, item.current_stock + qty)

    item.updated_at = datetime.utcnow()

    # Generate unique transaction ID if not provided or collision
    txn_id = payload.transaction_id
    if not txn_id or db.query(InventoryTransactionModel).filter(InventoryTransactionModel.transaction_id == txn_id).first():
        txn_id = f"TXN-{int(time.time() * 1000)}-{item.item_id[:6]}"

    txn = InventoryTransactionModel(
        transaction_id=txn_id,
        item_id=item.item_id,
        location_id=payload.location_id or item.storage_location_id,
        transaction_type=t_type,
        quantity=qty,
        unit_of_measurement=payload.unit_of_measurement or item.unit_of_measurement,
        balance_after=item.current_stock,
        reference_order_id=payload.reference_order_id,
        notes=payload.notes,
        logged_at=datetime.utcnow(),
    )

    db.add(txn)
    db.commit()
    db.refresh(txn)
    db.refresh(item)

    return ApiResponse.success_response(
        data=txn.to_dict(),
        message="Inventory transaction logged and stock balance updated successfully.",
    )


# ==============================================================================
# SINGLE ITEM CRUD & STOCK ADJUSTMENT ENDPOINTS
# ==============================================================================

@router.get(
    "/inventory/{item_id}",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Get Inventory Item by Identifier",
)
@router.get(
    "/inventory/items/{item_id}",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Get Inventory Item by Identifier (Alias)",
)
async def get_inventory_item(
    item_id: str = Path(..., description="Alphanumeric SKU ID or database integer ID"),
    db: Session = Depends(get_db),
):
    """Retrieves full telemetry, buffer thresholds, and burn rates for a specific SKU."""
    item = None
    if item_id.isdigit():
        item = db.query(InventoryItemModel).filter(InventoryItemModel.id == int(item_id)).first()
    if not item:
        item = db.query(InventoryItemModel).filter(InventoryItemModel.item_id == item_id).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory item with identifier '{item_id}' was not found.",
        )

    return ApiResponse.success_response(
        data=item.to_dict(),
        message=f"Retrieved details for SKU '{item.item_id}'.",
    )


@router.post(
    "/inventory",
    response_model=ApiResponse[Dict[str, Any]],
    status_code=status.HTTP_201_CREATED,
    summary="Create New Inventory Item",
)
@router.post(
    "/inventory/items",
    response_model=ApiResponse[Dict[str, Any]],
    status_code=status.HTTP_201_CREATED,
    summary="Create New Inventory Item (Alias)",
)
async def create_inventory_item(
    payload: InventoryItemCreate,
    db: Session = Depends(get_db),
):
    """Registers a new military inventory item in the database."""
    existing = db.query(InventoryItemModel).filter(InventoryItemModel.item_id == payload.item_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Inventory item with SKU '{payload.item_id}' already exists.",
        )

    cat_val = payload.category.value if hasattr(payload.category, "value") else str(payload.category)

    item = InventoryItemModel(
        item_id=payload.item_id,
        item_name=payload.item_name,
        category=cat_val,
        current_stock=payload.current_stock,
        min_threshold=payload.min_threshold,
        max_capacity=payload.max_capacity,
        reorder_level=payload.reorder_level,
        unit_of_measurement=payload.unit_of_measurement,
        storage_location_id=payload.storage_location_id,
        storage_location_name=payload.storage_location_name or payload.storage_location_id,
        consumption_rate_daily=payload.consumption_rate_daily,
        lead_time_days=payload.lead_time_days,
        is_temperature_sensitive=payload.is_temperature_sensitive,
        target_temp_min=payload.target_temp_min,
        target_temp_max=payload.target_temp_max,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    # Automatically record initial stocking transaction
    initial_txn = InventoryTransactionModel(
        transaction_id=f"TXN-INIT-{item.item_id}",
        item_id=item.item_id,
        location_id=item.storage_location_id,
        transaction_type="inflow",
        quantity=item.current_stock,
        unit_of_measurement=item.unit_of_measurement,
        balance_after=item.current_stock,
        notes="Initial SKU baseline stocking",
        logged_at=datetime.utcnow(),
    )
    db.add(initial_txn)
    db.commit()

    return ApiResponse.success_response(
        data=item.to_dict(),
        message=f"Inventory item '{item.item_id}' created successfully.",
    )


@router.put(
    "/inventory/{item_id}",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Update Inventory Item",
)
@router.put(
    "/inventory/items/{item_id}",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Update Inventory Item (Alias)",
)
@router.patch(
    "/inventory/{item_id}",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Partially Update Inventory Item",
)
@router.patch(
    "/inventory/items/{item_id}",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Partially Update Inventory Item (Alias)",
)
async def update_inventory_item(
    item_id: str = Path(..., description="Alphanumeric SKU ID or database integer ID"),
    payload: InventoryItemUpdate = Body(...),
    db: Session = Depends(get_db),
):
    """Updates fields of an existing inventory item."""
    item = None
    if item_id.isdigit():
        item = db.query(InventoryItemModel).filter(InventoryItemModel.id == int(item_id)).first()
    if not item:
        item = db.query(InventoryItemModel).filter(InventoryItemModel.item_id == item_id).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory item with identifier '{item_id}' was not found.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    if "category" in update_data and update_data["category"] is not None:
        cat = update_data["category"]
        update_data["category"] = cat.value if hasattr(cat, "value") else str(cat)

    for field, val in update_data.items():
        if hasattr(item, field) and val is not None:
            setattr(item, field, val)

    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)

    return ApiResponse.success_response(
        data=item.to_dict(),
        message=f"Inventory item '{item.item_id}' updated successfully.",
    )


@router.patch(
    "/inventory/{item_id}/stock",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Adjust Real-Time Stock Quantity",
)
@router.post(
    "/inventory/{item_id}/stock",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Adjust Real-Time Stock Quantity (POST Alias)",
)
async def adjust_stock_quantity(
    item_id: str = Path(..., description="Alphanumeric SKU ID"),
    payload: Dict[str, Any] = Body(..., description="Stock quantity and reason payload"),
    db: Session = Depends(get_db),
):
    """
    Adjusts the on-hand stock quantity for an SKU and records an audit transaction.
    Accepts: { 'current_stock': float, 'reason': Optional[str] }
    """
    item = db.query(InventoryItemModel).filter(InventoryItemModel.item_id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory item with SKU '{item_id}' was not found.",
        )

    if "current_stock" not in payload:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Field 'current_stock' is required in adjustment payload.",
        )

    try:
        new_qty = float(payload["current_stock"])
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Field 'current_stock' must be a valid non-negative number.",
        )

    if new_qty < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Stock quantity cannot be negative.",
        )

    old_qty = item.current_stock
    delta = new_qty - old_qty
    reason = payload.get("reason", "Manual Inventory Adjustment")

    item.current_stock = new_qty
    item.updated_at = datetime.utcnow()

    # Create audit transaction
    txn = InventoryTransactionModel(
        transaction_id=f"TXN-ADJ-{int(time.time() * 1000)}",
        item_id=item.item_id,
        location_id=item.storage_location_id,
        transaction_type="adjustment",
        quantity=delta,
        unit_of_measurement=item.unit_of_measurement,
        balance_after=new_qty,
        notes=f"{reason} (Previous: {old_qty}, New: {new_qty})",
        logged_at=datetime.utcnow(),
    )
    db.add(txn)
    db.commit()
    db.refresh(item)

    return ApiResponse.success_response(
        data=item.to_dict(),
        message=f"Stock for SKU '{item.item_id}' updated to {new_qty} {item.unit_of_measurement}.",
    )


@router.delete(
    "/inventory/{item_id}",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Delete Inventory Item",
)
@router.delete(
    "/inventory/items/{item_id}",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Delete Inventory Item (Alias)",
)
async def delete_inventory_item(
    item_id: str = Path(..., description="Alphanumeric SKU ID or integer ID"),
    db: Session = Depends(get_db),
):
    """Deletes an inventory item and cascades associated transactions."""
    item = None
    if item_id.isdigit():
        item = db.query(InventoryItemModel).filter(InventoryItemModel.id == int(item_id)).first()
    if not item:
        item = db.query(InventoryItemModel).filter(InventoryItemModel.item_id == item_id).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory item with identifier '{item_id}' was not found.",
        )

    sku = item.item_id
    db.delete(item)
    db.commit()

    return ApiResponse.success_response(
        data={"deleted_item_id": sku, "status": "deleted"},
        message=f"Inventory item '{sku}' was deleted successfully.",
    )
