"""
LogiPredict AI - Master ORM Models Registry
============================================
Exports all SQLAlchemy models for relational integrity, table reflection,
and migration/seeding routines.
"""

from app.database.base import Base, TimestampMixin
from app.models.inventory import InventoryItemModel, InventoryTransactionModel
from app.models.demand import DemandHistoryModel
from app.models.forecast import ForecastRecordModel
from app.models.alert import PredictiveAlertModel
from app.models.simulation import (
    SimulationScenarioModel,
    SimulationRunModel,
    SimulationRecommendationModel,
)
from app.models.supplies import SupplyRequisitionModel, RequisitionItemModel
from app.models.locations import (
    MilitaryLocationModel,
    ConvoyRouteModel,
    RouteWaypointModel,
)

__all__ = [
    "Base",
    "TimestampMixin",
    "InventoryItemModel",
    "InventoryTransactionModel",
    "DemandHistoryModel",
    "ForecastRecordModel",
    "PredictiveAlertModel",
    "SimulationScenarioModel",
    "SimulationRunModel",
    "SimulationRecommendationModel",
    "SupplyRequisitionModel",
    "RequisitionItemModel",
    "MilitaryLocationModel",
    "ConvoyRouteModel",
    "RouteWaypointModel",
]
