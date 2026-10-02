"""
LogiPredict AI - Schemas Package
=================================
Centralized Pydantic schemas enforcing data contracts between FastAPI and React.
"""

from app.schemas.common import (
    ErrorDetail,
    ApiErrorResponse,
    PaginationMeta,
    ApiResponse,
    MessageResponse,
    HealthCheckResponse,
)
from app.schemas.inventory import (
    ItemCategory,
    TransactionType,
    InventoryItemBase,
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryItemResponse,
    InventoryTransactionBase,
    InventoryTransactionCreate,
    InventoryTransactionResponse,
    CategoryStockSummary,
    StockHealthSummary,
)
from app.schemas.forecast import (
    ForecastModelType,
    ForecastDataPoint,
    ModelEvaluationMetrics,
    ForecastRequest,
    DemandForecastResponse,
)
from app.schemas.location_route import (
    LocationType,
    RoadCondition,
    Waypoint,
    SupplyLocationBase,
    SupplyLocationCreate,
    SupplyLocationResponse,
    SupplyRouteBase,
    SupplyRouteCreate,
    SupplyRouteResponse,
    RouteOptimizationRequest,
    RouteOptimizationResponse,
)
from app.schemas.alert import (
    AlertSeverity,
    AlertType,
    AlertBase,
    AlertCreate,
    AlertUpdate,
    AlertResponse,
    AlertSummary,
)
from app.schemas.simulation import (
    DisruptionScenarioType,
    DisruptionScenario,
    InitialStockOverride,
    SimulationRequest,
    ProjectedStockPoint,
    StockoutEvent,
    ReplenishmentRecommendation,
    SimulationSummaryMetrics,
    SimulationResultResponse,
)
from app.schemas.supplies import (
    RequisitionPriority,
    RequisitionStatus,
    RequisitionItem,
    SupplyRequisitionBase,
    SupplyRequisitionCreate,
    SupplyRequisitionUpdate,
    SupplyRequisitionResponse,
)
from app.schemas.analytics import (
    KpiMetric,
    ActivityLogEntry,
    DashboardSummaryResponse,
    AuditReportResponse,
)

__all__ = [
    # Common
    "ErrorDetail",
    "ApiErrorResponse",
    "PaginationMeta",
    "ApiResponse",
    "MessageResponse",
    "HealthCheckResponse",
    # Inventory
    "ItemCategory",
    "TransactionType",
    "InventoryItemBase",
    "InventoryItemCreate",
    "InventoryItemUpdate",
    "InventoryItemResponse",
    "InventoryTransactionBase",
    "InventoryTransactionCreate",
    "InventoryTransactionResponse",
    "CategoryStockSummary",
    "StockHealthSummary",
    # Forecast
    "ForecastModelType",
    "ForecastDataPoint",
    "ModelEvaluationMetrics",
    "ForecastRequest",
    "DemandForecastResponse",
    # Location & Route
    "LocationType",
    "RoadCondition",
    "Waypoint",
    "SupplyLocationBase",
    "SupplyLocationCreate",
    "SupplyLocationResponse",
    "SupplyRouteBase",
    "SupplyRouteCreate",
    "SupplyRouteResponse",
    "RouteOptimizationRequest",
    "RouteOptimizationResponse",
    # Alerts
    "AlertSeverity",
    "AlertType",
    "AlertBase",
    "AlertCreate",
    "AlertUpdate",
    "AlertResponse",
    "AlertSummary",
    # Simulation
    "DisruptionScenarioType",
    "DisruptionScenario",
    "InitialStockOverride",
    "SimulationRequest",
    "ProjectedStockPoint",
    "StockoutEvent",
    "ReplenishmentRecommendation",
    "SimulationSummaryMetrics",
    "SimulationResultResponse",
    # Supplies
    "RequisitionPriority",
    "RequisitionStatus",
    "RequisitionItem",
    "SupplyRequisitionBase",
    "SupplyRequisitionCreate",
    "SupplyRequisitionUpdate",
    "SupplyRequisitionResponse",
    # Analytics
    "KpiMetric",
    "ActivityLogEntry",
    "DashboardSummaryResponse",
    "AuditReportResponse",
]
