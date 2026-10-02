"""
LogiPredict AI - Supply & Requisition Schemas
=============================================
Pydantic schemas for forward supply requisitions, purchase orders,
convoy manifests, and consignment tracking.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class RequisitionPriority(str, Enum):
    ROUTINE = "routine"
    PRIORITY = "priority"
    EMERGENCY = "emergency"
    FLASH_OPERATIONAL = "flash_operational"


class RequisitionStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    DISPATCHED = "dispatched"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class RequisitionItem(BaseModel):
    item_id: str = Field(..., description="SKU identifier")
    item_name: str = Field(..., description="Item nomenclature")
    quantity_requested: float = Field(..., gt=0, description="Requested quantity")
    quantity_allocated: float = Field(default=0.0, ge=0, description="Quantity approved by Depot Commander")
    unit_of_measurement: str = Field(..., description="Measurement unit")


class SupplyRequisitionBase(BaseModel):
    requisition_id: str = Field(..., description="Unique requisition code (e.g. REQ-2026-4401)")
    origin_depot_id: str = Field(..., description="Source depot providing supplies")
    destination_fob_id: str = Field(..., description="Requesting Forward Operating Base")
    priority: RequisitionPriority = Field(default=RequisitionPriority.ROUTINE)
    status: RequisitionStatus = Field(default=RequisitionStatus.DRAFT)
    items: List[RequisitionItem] = Field(..., min_length=1)
    assigned_convoy_id: Optional[str] = Field(None, description="Linked convoy transit ID")
    estimated_departure: Optional[datetime] = None
    estimated_delivery: Optional[datetime] = None
    actual_delivery: Optional[datetime] = None
    justification: Optional[str] = Field(None, description="Military supply justification")


class SupplyRequisitionCreate(SupplyRequisitionBase):
    pass


class SupplyRequisitionUpdate(BaseModel):
    status: Optional[RequisitionStatus] = None
    assigned_convoy_id: Optional[str] = None
    actual_delivery: Optional[datetime] = None
    notes: Optional[str] = None


class SupplyRequisitionResponse(SupplyRequisitionBase):
    id: int = Field(..., description="Internal DB ID")
    origin_depot_name: Optional[str] = None
    destination_fob_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
