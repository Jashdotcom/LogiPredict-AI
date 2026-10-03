"""
LogiPredict AI - Inventory & Stock Transaction ORM Models
=========================================================
SQLAlchemy models for multi-echelon forward depot inventory items, safety buffers,
burn rates, and stock movement transaction logs.
"""

from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class InventoryItemModel(Base):
    """
    Tracks inventory SKU stock levels across forward operating bases and base depots.
    """
    __tablename__ = "inventory_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    item_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    item_name: Mapped[str] = mapped_column(String(128), nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    current_stock: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    min_threshold: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    max_capacity: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)
    reorder_level: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    unit_of_measurement: Mapped[str] = mapped_column(String(32), nullable=False)
    storage_location_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    storage_location_name: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    consumption_rate_daily: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    lead_time_days: Mapped[int] = mapped_column(Integer, default=7, nullable=False)
    is_temperature_sensitive: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    target_temp_min: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    target_temp_max: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    transactions: Mapped[List["InventoryTransactionModel"]] = relationship(
        "InventoryTransactionModel",
        back_populates="item",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("idx_inv_item_cat_loc", "category", "storage_location_id"),
    )

    @property
    def stock_health_ratio(self) -> float:
        """Percentage of maximum capacity currently held (0.0 to 100.0+)"""
        if self.max_capacity > 0:
            return round((self.current_stock / self.max_capacity) * 100.0, 1)
        return 0.0

    @property
    def days_of_supply_remaining(self) -> float:
        """Estimated operational autonomy in days based on burn rate"""
        if self.consumption_rate_daily > 0:
            return round(self.current_stock / self.consumption_rate_daily, 1)
        return 999.0

    @property
    def status(self) -> str:
        """Computed stock status tier"""
        if self.current_stock <= 0:
            return "Critical"
        if self.current_stock <= self.min_threshold:
            return "Critical"
        if self.current_stock <= self.reorder_level:
            return "Warning"
        if self.current_stock > self.max_capacity:
            return "Overstock"
        return "Optimal"

    def to_dict(self) -> dict:
        """Serialize model to dictionary with dual schema field compatibility."""
        return {
            "id": self.id,
            "item_id": self.item_id,
            "item_name": self.item_name,
            "category": self.category,
            "current_stock": self.current_stock,
            "min_threshold": self.min_threshold,
            "minimum_stock": self.min_threshold,
            "max_capacity": self.max_capacity,
            "maximum_capacity": self.max_capacity,
            "reorder_level": self.reorder_level,
            "reorder_point": self.reorder_level,
            "unit_of_measurement": self.unit_of_measurement,
            "unit": self.unit_of_measurement,
            "storage_location_id": self.storage_location_id,
            "storage_location_name": self.storage_location_name or self.storage_location_id,
            "storage_location": self.storage_location_name or self.storage_location_id,
            "consumption_rate_daily": self.consumption_rate_daily,
            "daily_consumption": self.consumption_rate_daily,
            "lead_time_days": self.lead_time_days,
            "is_temperature_sensitive": self.is_temperature_sensitive,
            "target_temp_min": self.target_temp_min,
            "target_temp_max": self.target_temp_max,
            "stock_health_ratio": self.stock_health_ratio,
            "days_of_supply_remaining": self.days_of_supply_remaining,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_updated": self.updated_at.isoformat() if self.updated_at else None,
            "is_synthetic": True,
        }


class InventoryTransactionModel(Base):
    """
    Audit log of all stock movements (inflow, outflow, transfer, adjustment, loss).
    """
    __tablename__ = "inventory_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    transaction_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    item_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("inventory_items.item_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    location_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    transaction_type: Mapped[str] = mapped_column(String(32), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    unit_of_measurement: Mapped[str] = mapped_column(String(32), nullable=False)
    balance_after: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    reference_order_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    logged_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    item: Mapped["InventoryItemModel"] = relationship(
        "InventoryItemModel",
        back_populates="transactions",
    )

    __table_args__ = (
        Index("idx_txn_item_loc_date", "item_id", "location_id", "logged_at"),
    )

    def to_dict(self) -> dict:
        """Serialize transaction model to dictionary."""
        return {
            "id": self.id,
            "transaction_id": self.transaction_id,
            "item_id": self.item_id,
            "location_id": self.location_id,
            "transaction_type": self.transaction_type,
            "quantity": self.quantity,
            "unit_of_measurement": self.unit_of_measurement,
            "balance_after": self.balance_after,
            "reference_order_id": self.reference_order_id,
            "notes": self.notes,
            "logged_at": self.logged_at.isoformat() if self.logged_at else None,
        }

