"""
LogiPredict AI - Inventory Schemas
==================================
Pydantic schemas for inventory items, stock buffers, categories, and stock transactions.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class ItemCategory(str, Enum):
    """Categorization aligned with Indian Army forward logistics classes"""
    POL = "POL"  # Petroleum, Oil, and Lubricants (Fuel)
    ORDNANCE = "Ordnance & Ammunition"  # Small arms, artillery, mortar rounds
    RATIONS = "Rations & Subsistence"  # Ready-to-eat packs, grains, potable water
    MEDICAL = "Medical & Cold-Chain"  # Trauma packs, vaccines, plasma, critical meds
    ENGINEERING = "Spares & Engineering"  # Vehicle parts, batteries, runway repair kits
    GENERAL = "General Stores"  # Winter clothing, shelters, defense construction materials


class TransactionType(str, Enum):
    """Inventory movement transaction types"""
    INFLOW = "inflow"  # Stock received from rear depot/supplier
    OUTFLOW = "outflow"  # Issued to forward units / combat posts
    TRANSFER = "transfer"  # Lateral replenishment to neighboring FOB
    ADJUSTMENT = "adjustment"  # Physical count audit correction
    LOSS = "loss"  # Damage, cold-weather spoilage, transit loss


class InventoryItemBase(BaseModel):
    """Base schema for an inventory item (SKU)"""
    item_id: str = Field(..., description="Unique alphanumeric SKU code (e.g., SKU-POL-DSL-01)")
    item_name: str = Field(..., min_length=2, max_length=120, description="Standard military nomenclature")
    category: ItemCategory = Field(..., description="Forward supply echelon category")
    current_stock: float = Field(..., ge=0, description="Real-time on-hand stock quantity")
    min_threshold: float = Field(..., ge=0, description="Safety buffer trigger level")
    max_capacity: float = Field(..., gt=0, description="Maximum storage bunker / silo capacity")
    reorder_level: float = Field(..., ge=0, description="Stock level triggering automatic replenishment PO")
    unit_of_measurement: str = Field(..., description="Unit (e.g. Liters, Rounds, Metric Tonnes, Packs)")
    storage_location_id: str = Field(..., description="Primary depot or forward operating base ID")
    storage_location_name: Optional[str] = Field(None, description="Human-readable base/depot name")
    consumption_rate_daily: float = Field(..., ge=0, description="Average daily consumption rate in base units")
    lead_time_days: int = Field(..., ge=1, description="Replenishment delivery lead time in days")
    is_temperature_sensitive: bool = Field(default=False, description="Flag for cold-chain monitoring")
    target_temp_min: Optional[float] = Field(None, description="Minimum allowed temp in Celsius")
    target_temp_max: Optional[float] = Field(None, description="Maximum allowed temp in Celsius")


class InventoryItemCreate(InventoryItemBase):
    """Payload for creating a new inventory item"""
    pass


class InventoryItemUpdate(BaseModel):
    """Payload for partially updating an inventory item"""
    item_name: Optional[str] = Field(None, min_length=2, max_length=120)
    category: Optional[ItemCategory] = None
    current_stock: Optional[float] = Field(None, ge=0)
    min_threshold: Optional[float] = Field(None, ge=0)
    max_capacity: Optional[float] = Field(None, gt=0)
    reorder_level: Optional[float] = Field(None, ge=0)
    consumption_rate_daily: Optional[float] = Field(None, ge=0)
    lead_time_days: Optional[int] = Field(None, ge=1)
    storage_location_id: Optional[str] = None


class InventoryItemResponse(InventoryItemBase):
    """Full inventory item representation returned by API"""
    id: int = Field(..., description="Internal database integer surrogate key")
    stock_health_ratio: float = Field(
        ...,
        description="Current stock as percentage of optimal capacity (0.0 to 100.0+)",
    )
    days_of_supply_remaining: float = Field(
        ...,
        description="Estimated operational autonomy based on daily consumption rate",
    )
    status: str = Field(..., description="Calculated status: Optimal, Warning, Critical, Overstock")
    created_at: datetime = Field(..., description="Record creation timestamp (ISO 8601)")
    updated_at: datetime = Field(..., description="Last updated timestamp (ISO 8601)")

    model_config = ConfigDict(from_attributes=True)


class InventoryTransactionBase(BaseModel):
    """Base schema for an inventory transaction event"""
    transaction_id: str = Field(..., description="Unique transaction reference ID (e.g. TXN-2026-0042)")
    item_id: str = Field(..., description="Referenced inventory SKU code")
    location_id: str = Field(..., description="Depot or FOB where transaction occurred")
    transaction_type: TransactionType = Field(..., description="Type of stock movement")
    quantity: float = Field(..., description="Quantity transferred (positive for inflow, negative for outflow)")
    unit_of_measurement: str = Field(..., description="Standardized measurement unit")
    reference_order_id: Optional[str] = Field(None, description="Linked PO, Convoy, or Requisition ID")
    notes: Optional[str] = Field(None, max_length=500, description="Operational remarks or military voucher ref")


class InventoryTransactionCreate(InventoryTransactionBase):
    """Payload for logging a new inventory transaction"""
    pass


class InventoryTransactionResponse(InventoryTransactionBase):
    """Response schema for inventory transactions"""
    id: int = Field(..., description="Internal database ID")
    logged_at: datetime = Field(..., description="Transaction execution timestamp (ISO 8601)")
    balance_after: float = Field(..., description="On-hand stock balance immediately following transaction")

    model_config = ConfigDict(from_attributes=True)


class CategoryStockSummary(BaseModel):
    """Aggregated stock health metric for a supply category"""
    category: str = Field(..., description="Category name")
    total_skus: int = Field(..., description="Number of distinct SKUs")
    optimal_count: int = Field(..., description="Number of SKUs in optimal range")
    warning_count: int = Field(..., description="Number of SKUs near reorder buffer")
    critical_count: int = Field(..., description="Number of SKUs in stockout risk")
    average_health_percentage: float = Field(..., description="Average health index (0-100)")


class StockHealthSummary(BaseModel):
    """High-level inventory health summary across all depots"""
    overall_health_percentage: float = Field(..., description="Global supply health index")
    total_active_skus: int = Field(..., description="Total tracked inventory items")
    critical_stockout_risks: int = Field(..., description="Count of SKUs under safety threshold")
    pending_reorder_pos: int = Field(..., description="Active automatic purchase requisitions")
    categories_breakdown: List[CategoryStockSummary] = Field(default_factory=list)
