"""
LogiPredict AI - Database Engine & Session Management
=====================================================
Configures multi-thread safe SQLite engine, WAL mode, foreign key enforcement,
and scoped FastAPI session dependencies.
"""

from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from app.config import DATABASE_URL, DEBUG


# Configure engine with thread-safety for SQLite
connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args["check_same_thread"] = False

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=DEBUG,
    future=True,
)


# Enforce SQLite foreign key constraints and WAL journal mode
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """
    Ensures relational integrity and high-concurrency read performance
    on SQLite database connections.
    """
    if "sqlite" in DATABASE_URL:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()


# Session factory for database operations
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True,
)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a SQLAlchemy database session per request
    and guarantees proper closure upon request completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
