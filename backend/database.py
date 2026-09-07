"""Database setup and session management."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./printstation.db")

# Normalize postgres:// to postgresql:// for SQLAlchemy 2.0
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite requires check_same_thread=False; PostgreSQL does not
is_sqlite = DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

# Engine configuration with pre-ping to keep cloud connections healthy
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=300 if not is_sqlite else -1,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency to get a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables and migrate new columns if missing."""
    from models import PrintJob  # noqa: F401
    Base.metadata.create_all(bind=engine)

    # Safe migration for existing SQLite database only
    if is_sqlite:
        import sqlite3
        db_path = DATABASE_URL.replace("sqlite:///./", "").replace("sqlite:///", "")
        if os.path.exists(db_path):
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(print_jobs);")
            existing_cols = {row[1] for row in cursor.fetchall()}
            
            migrations = [
                ("physical_sheets", "INTEGER DEFAULT 1"),
                ("color_mode", "VARCHAR(20) DEFAULT 'bw'"),
                ("duplex", "VARCHAR(20) DEFAULT 'simplex'"),
                ("pages_per_sheet", "INTEGER DEFAULT 1"),
                ("page_range", "VARCHAR(100) DEFAULT 'all'"),
                ("orientation", "VARCHAR(20) DEFAULT 'portrait'"),
            ]
            for col_name, col_def in migrations:
                if col_name not in existing_cols:
                    try:
                        cursor.execute(f"ALTER TABLE print_jobs ADD COLUMN {col_name} {col_def};")
                    except Exception:
                        pass
            conn.commit()
            conn.close()
