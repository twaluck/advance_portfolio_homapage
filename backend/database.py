import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "database.db"


def get_connection():
    """Create a SQLite connection with row access by column name."""
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON;")
    return connection


# TODO: Add context manager helpers for safe commits/rollbacks
# TODO: Add migration or schema versioning support
# TODO: Make DB path configurable via environment variables
