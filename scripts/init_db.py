"""
Initialize the SQLite database schema and seed the admin user.

TODO: Add migrations and schema versioning.
"""

import os
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from backend.database import get_connection
from backend.security import hash_password

ADMIN_NAME = "Admin"
ADMIN_EMAIL = "admin@example.com"
ADMIN_ROLE = "admin"
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "change-me")
# TODO: Set ADMIN_PASSWORD in your environment for a real secret.


def create_tables(connection):
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            phone TEXT UNIQUE,
            role TEXT NOT NULL DEFAULT 'admin',
            password_hash TEXT NOT NULL,
            api_token TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS learning_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            summary TEXT NOT NULL,
            content TEXT,
            tags TEXT,
            log_date TEXT NOT NULL DEFAULT (date('now')),
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            target_date TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            summary TEXT,
            details TEXT,
            status TEXT NOT NULL DEFAULT 'draft',
            repo_url TEXT,
            demo_url TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT,
            body TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS university_courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            year_level INTEGER NOT NULL,
            term TEXT NOT NULL,
            course_name TEXT NOT NULL,
            learned_notes TEXT,
            outcome_notes TEXT,
            next_notes TEXT,
            visibility TEXT NOT NULL DEFAULT 'private',
            status TEXT NOT NULL DEFAULT 'draft',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS user_profiles (
            user_id INTEGER PRIMARY KEY,
            headline TEXT,
            summary TEXT,
            nationality TEXT,
            prefecture TEXT,
            city TEXT,
            school_type TEXT,
            school_name TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS news_digests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            summary TEXT NOT NULL,
            image_url TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        """
    )


def ensure_column(connection, table, column, definition):
    columns = [
        row["name"]
        for row in connection.execute(f"PRAGMA table_info({table})").fetchall()
    ]
    if column in columns:
        return
    connection.execute(
        f"ALTER TABLE {table} ADD COLUMN {column} {definition}"
    )


def ensure_index(connection, statement):
    connection.execute(statement)


def migrate_users_email_nullable(connection):
    info = connection.execute("PRAGMA table_info(users)").fetchall()
    columns = {row["name"] for row in info}
    email_info = next((row for row in info if row["name"] == "email"), None)
    if not email_info or email_info["notnull"] == 0:
        return

    select_phone = "phone" if "phone" in columns else "NULL AS phone"
    select_api_token = "api_token" if "api_token" in columns else "NULL AS api_token"

    connection.execute("PRAGMA foreign_keys = OFF")
    connection.executescript(
        f"""
        DROP TABLE IF EXISTS users_new;

        CREATE TABLE users_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            phone TEXT UNIQUE,
            role TEXT NOT NULL DEFAULT 'admin',
            password_hash TEXT NOT NULL,
            api_token TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        INSERT INTO users_new (id, name, email, phone, role, password_hash, api_token, created_at, updated_at)
        SELECT id, name, email, {select_phone}, role, password_hash, {select_api_token}, created_at, updated_at
        FROM users;

        DROP TABLE users;
        ALTER TABLE users_new RENAME TO users;
        """
    )
    connection.execute("PRAGMA foreign_keys = ON")


def seed_admin(connection):
    cursor = connection.execute(
        "SELECT id, password_hash FROM users WHERE email = ?",
        (ADMIN_EMAIL,),
    )
    row = cursor.fetchone()
    if row:
        if not row["password_hash"].startswith("pbkdf2_sha256$"):
            connection.execute(
                """
                UPDATE users
                SET password_hash = ?, updated_at = datetime('now')
                WHERE id = ?
                """,
                (hash_password(ADMIN_PASSWORD), row["id"]),
            )
        return row["id"]

    cursor = connection.execute(
        """
        INSERT INTO users (name, email, role, password_hash)
        VALUES (?, ?, ?, ?)
        """,
        (ADMIN_NAME, ADMIN_EMAIL, ADMIN_ROLE, hash_password(ADMIN_PASSWORD)),
    )
    return cursor.lastrowid


def seed_sample_logs(connection, user_id):
    if not user_id:
        return

    row = connection.execute(
        "SELECT COUNT(*) AS count FROM learning_logs"
    ).fetchone()
    if row and row["count"] > 0:
        return

    sample_logs = [
        (
            user_id,
            "Starter Research Log",
            "Set up the portfolio scaffold and defined research themes.",
            "Outlined research focus areas in AI, robotics, and entrepreneurship.",
            "setup, research",
            "2024-01-01",
        ),
        (
            user_id,
            "Robotics Reading",
            "Reviewed core robotics control papers and drafted takeaways.",
            "Summarized classic control algorithms and noted open questions.",
            "robotics, reading",
            "2024-01-08",
        ),
    ]
    connection.executemany(
        """
        INSERT INTO learning_logs (user_id, title, summary, content, tags, log_date)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        sample_logs,
    )


def main():
    with get_connection() as connection:
        create_tables(connection)
        migrate_users_email_nullable(connection)
        ensure_column(connection, "users", "api_token", "TEXT")
        ensure_column(connection, "users", "phone", "TEXT")
        ensure_column(
            connection,
            "university_courses",
            "visibility",
            "TEXT NOT NULL DEFAULT 'private'",
        )
        ensure_column(
            connection,
            "university_courses",
            "status",
            "TEXT NOT NULL DEFAULT 'draft'",
        )
        ensure_column(connection, "user_profiles", "headline", "TEXT")
        ensure_column(connection, "user_profiles", "summary", "TEXT")
        ensure_column(connection, "user_profiles", "nationality", "TEXT")
        ensure_column(connection, "user_profiles", "prefecture", "TEXT")
        ensure_column(connection, "user_profiles", "city", "TEXT")
        ensure_column(connection, "user_profiles", "school_type", "TEXT")
        ensure_column(connection, "user_profiles", "school_name", "TEXT")
        ensure_column(connection, "projects", "image_url", "TEXT")
        ensure_index(
            connection,
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone)",
        )
        admin_id = seed_admin(connection)
        seed_sample_logs(connection, admin_id)
        connection.commit()


if __name__ == "__main__":
    main()
