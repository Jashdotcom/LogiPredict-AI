"""
LogiPredict AI - Military Locations & Convoy Route Telematics ORM Models
========================================================================
SQLAlchemy models for multi-echelon forward operating bases, supply depots,
strategic passes, convoy transit corridors, and GPS waypoint telematics.
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


class MilitaryLocationModel(Base):
    """
    Military node, base depot, or forward operating base in the Northern Command sector.
    """
    __tablename__ = "military_locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    location_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    echelon_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    altitude_meters: Mapped[float] = mapped_column(Float, default=1000.0, nullable=False)
    capacity_tonnes: Mapped[float] = mapped_column(Float, default=500.0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class ConvoyRouteModel(Base):
    """
    Strategic transit corridor connecting military depots and forward operating bases.
    """
    __tablename__ = "convoy_routes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    route_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    route_name: Mapped[str] = mapped_column(String(128), nullable=False)
    origin_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    destination_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    distance_km: Mapped[float] = mapped_column(Float, nullable=False)
    estimated_duration_hours: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="ACTIVE", nullable=False)  # ACTIVE, BLOCKED, RESTRICTED
    risk_level: Mapped[str] = mapped_column(String(32), default="LOW", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    waypoints: Mapped[List["RouteWaypointModel"]] = relationship(
        "RouteWaypointModel",
        back_populates="route",
        cascade="all, delete-orphan",
        order_by="RouteWaypointModel.sequence_order",
    )

    __table_args__ = (
        Index("idx_route_origin_dest", "origin_id", "destination_id"),
    )


class RouteWaypointModel(Base):
    """
    Geographic waypoint and elevation checkpoint along a strategic military transit route.
    """
    __tablename__ = "route_waypoints"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    route_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("convoy_routes.route_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sequence_order: Mapped[int] = mapped_column(Integer, nullable=False)
    waypoint_name: Mapped[str] = mapped_column(String(128), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    altitude_meters: Mapped[float] = mapped_column(Float, default=1000.0, nullable=False)
    pass_name: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    current_condition: Mapped[str] = mapped_column(String(64), default="CLEAR", nullable=False)

    # Relationships
    route: Mapped["ConvoyRouteModel"] = relationship(
        "ConvoyRouteModel",
        back_populates="waypoints",
    )
