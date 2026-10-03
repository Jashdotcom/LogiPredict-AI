"""
LogiPredict AI - Supply Requisition & Movement ORM Models
=========================================================
SQLAlchemy models for military supply requisitions, line item allocations,
echelon dispatch status, and audit trails.
"""

from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Integer,
    String,
    Float,
    DateTime,
    Text,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class SupplyRequisitionModel(Base):
    """
    Military supply request from forward operational formations to supply depots.
    """
    __tablename__ = "supply_requisitions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    requisition_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    requesting_unit: Mapped[str] = mapped_column(String(128), nullable=False)
    origin_depot_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    destination_node_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    priority: Mapped[str] = mapped_column(String(32), default="ROUTINE", nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), default="SUBMITTED", nullable=False, index=True)
    total_weight_kg: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_volume_m3: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    estimated_cost_inr: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    required_by_date: Mapped[str] = mapped_column(String(32), nullable=False)  # YYYY-MM-DD
    dispatched_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    items: Mapped[List["RequisitionItemModel"]] = relationship(
        "RequisitionItemModel",
        back_populates="requisition",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("idx_req_status_priority", "status", "priority"),
        Index("idx_req_dest_status", "destination_node_id", "status"),
    )


class RequisitionItemModel(Base):
    """
    Individual SKU line items requested in a military supply requisition.
    """
    __tablename__ = "requisition_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    requisition_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("supply_requisitions.requisition_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    item_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    item_name: Mapped[str] = mapped_column(String(128), nullable=False)
    quantity_requested: Mapped[float] = mapped_column(Float, nullable=False)
    quantity_fulfilled: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    unit_of_measurement: Mapped[str] = mapped_column(String(32), nullable=False)
    unit_cost_inr: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Relationships
    requisition: Mapped["SupplyRequisitionModel"] = relationship(
        "SupplyRequisitionModel",
        back_populates="items",
    )
