from datetime import date
import os
import sqlite3
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI

from backend.database import get_connection
from backend.schemas import (
    CourseCreate,
    CourseUpdate,
    LogCreate,
    LogUpdate,
    LoginRequest,
    ProfileUpdate,
    LogCreate,
    LogUpdate,
    LoginRequest,
    ProfileUpdate,
    ProjectCreate,
    ProjectUpdate,
    RegisterRequest,
)
from backend.security import generate_token, hash_password, verify_password

load_dotenv()

class ChatRequest(BaseModel):
    message: str

app = FastAPI(title="Personal Portfolio & Learning Log")

# Default origins + environment overrides
default_origins = [
    "null",
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
]
env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    ALLOWED_ORIGINS = [origin.strip() for origin in env_origins.split(",") if origin.strip()]
else:
    ALLOWED_ORIGINS = default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def normalize_tags(tags):
    if not tags:
        return None
    if isinstance(tags, str):
        parts = tags.split(",")
    else:
        parts = tags
    cleaned = [str(tag).strip() for tag in parts if str(tag).strip()]
    return ", ".join(cleaned) if cleaned else None


def parse_tags(raw_tags):
    if not raw_tags:
        return []
    return [tag.strip() for tag in raw_tags.split(",") if tag.strip()]


def serialize_log(row):
    data = {
        "id": row["id"],
        "title": row["title"],
        "date": row["log_date"],
        "summary": row["summary"],
        "tags": parse_tags(row["tags"]),
    }
    if "content" in row.keys():
        data["content"] = row["content"]
    return data


def serialize_user(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "phone": row["phone"] if "phone" in row.keys() else None,
        "role": row["role"],
    }


def serialize_course(row):
    visibility = row["visibility"] if "visibility" in row.keys() else None
    status_value = row["status"] if "status" in row.keys() else None
    return {
        "id": row["id"],
        "year_level": row["year_level"],
        "term": row["term"],
        "course_name": row["course_name"],
        "learned_notes": row["learned_notes"],
        "outcome_notes": row["outcome_notes"],
        "next_notes": row["next_notes"],
        "visibility": visibility or "private",
        "status": status_value or "draft",
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def serialize_profile(row):
    return {
        "headline": row["headline"],
        "summary": row["summary"],
        "nationality": row["nationality"],
        "prefecture": row["prefecture"],
        "city": row["city"],
        "school_type": row["school_type"],
        "school_name": row["school_name"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def serialize_project(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "summary": row["summary"],
        "details": row["details"],
        "status": row["status"],
        "repo_url": row["repo_url"],
        "demo_url": row["demo_url"],
        "image_url": row["image_url"] if "image_url" in row.keys() else None,
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def extract_token(authorization, x_admin_token):
    if x_admin_token:
        return x_admin_token
    if not authorization:
        return None
    if authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    return None


def normalize_contact(contact):
    value = contact.strip()
    if "@" in value:
        return {"email": value.lower(), "phone": None}
    return {"email": None, "phone": value}


def get_current_user(
    authorization: Optional[str] = Header(None),
    x_admin_token: Optional[str] = Header(None),
):
    token = extract_token(authorization, x_admin_token)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing auth token",
        )

    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT id, name, email, role
            FROM users
            WHERE api_token = ?
            """,
            (token,),
        ).fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid auth token",
        )
    return row


def get_optional_user(
    authorization: Optional[str] = Header(None),
    x_admin_token: Optional[str] = Header(None),
):
    token = extract_token(authorization, x_admin_token)
    if not token:
        return None

    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT id, name, email, role
            FROM users
            WHERE api_token = ?
            """,
            (token,),
        ).fetchone()
    return row


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Portfolio API is running."}


@app.post("/api/login")
def login(payload: LoginRequest):
    identifier = payload.identifier.strip()
    if "@" in identifier:
        identifier = identifier.lower()
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT id, name, email, phone, role, password_hash
            FROM users
            WHERE email = ? OR phone = ?
            """,
            (identifier, identifier),
        ).fetchone()

        if not row or not verify_password(payload.password, row["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        token = generate_token()
        connection.execute(
            """
            UPDATE users
            SET api_token = ?, updated_at = datetime('now')
            WHERE id = ?
            """,
            (token, row["id"]),
        )
        connection.commit()

    return {"token": token, "user": serialize_user(row)}


@app.post("/api/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest):
    contact = normalize_contact(payload.contact)
    if not contact["email"] and not contact["phone"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or phone is required",
        )

    with get_connection() as connection:
        existing = connection.execute(
            """
            SELECT id FROM users
            WHERE email = ? OR phone = ?
            """,
            (contact["email"], contact["phone"]),
        ).fetchone()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Account already exists",
            )

        token = generate_token()
        cursor = connection.execute(
            """
            INSERT INTO users (name, email, phone, role, password_hash, api_token)
            VALUES (?, ?, ?, 'member', ?, ?)
            """,
            (
                payload.name.strip(),
                contact["email"],
                contact["phone"],
                hash_password(payload.password),
                token,
            ),
        )
        connection.commit()

        row = connection.execute(
            """
            SELECT id, name, email, phone, role
            FROM users
            WHERE id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()

    return {"token": token, "user": serialize_user(row)}


@app.get("/api/logs")
def list_logs():
    # TODO: Add pagination and filtering support
    # TODO: Return full log content on demand
    try:
        with get_connection() as connection:
            rows = connection.execute(
                """
                SELECT id, title, summary, tags, log_date
                FROM learning_logs
                ORDER BY log_date DESC, id DESC
                """
            ).fetchall()
    except sqlite3.OperationalError:
        # TODO: Surface a clearer error when the DB is not initialized.
        return []

    return [serialize_log(row) for row in rows]


@app.get("/api/logs/{log_id}")
def get_log(log_id: int):
    try:
        with get_connection() as connection:
            row = connection.execute(
                """
                SELECT id, title, summary, content, tags, log_date
                FROM learning_logs
                WHERE id = ?
                """,
                (log_id,),
            ).fetchone()
    except sqlite3.OperationalError:
        # TODO: Surface a clearer error when the DB is not initialized.
        raise HTTPException(status_code=500, detail="Database not initialized")

    if not row:
        raise HTTPException(status_code=404, detail="Log not found")

    return serialize_log(row)


@app.post("/api/logs", status_code=status.HTTP_201_CREATED)
def create_log(payload: LogCreate, user=Depends(get_current_user)):
    log_date = payload.log_date or date.today().isoformat()
    tags = normalize_tags(payload.tags)

    try:
        with get_connection() as connection:
            cursor = connection.execute(
                """
                INSERT INTO learning_logs (user_id, title, summary, content, tags, log_date)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    user["id"],
                    payload.title,
                    payload.summary,
                    payload.content,
                    tags,
                    log_date,
                ),
            )
            row = connection.execute(
                """
                SELECT id, title, summary, content, tags, log_date
                FROM learning_logs
                WHERE id = ?
                """,
                (cursor.lastrowid,),
            ).fetchone()
    except sqlite3.OperationalError:
        # TODO: Surface a clearer error when the DB is not initialized.
        raise HTTPException(status_code=500, detail="Database not initialized")

    return serialize_log(row)


@app.put("/api/logs/{log_id}")
def update_log(
    log_id: int,
    payload: LogUpdate,
    user=Depends(get_current_user),
):
    fields = []
    values = []

    if payload.title is not None:
        fields.append("title = ?")
        values.append(payload.title)
    if payload.summary is not None:
        fields.append("summary = ?")
        values.append(payload.summary)
    if payload.content is not None:
        fields.append("content = ?")
        values.append(payload.content)
    if payload.tags is not None:
        fields.append("tags = ?")
        values.append(normalize_tags(payload.tags))
    if payload.log_date is not None:
        fields.append("log_date = ?")
        values.append(payload.log_date)

    if not fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    fields.append("updated_at = datetime('now')")
    values.extend([log_id, user["id"]])

    try:
        with get_connection() as connection:
            cursor = connection.execute(
                f"""
                UPDATE learning_logs
                SET {', '.join(fields)}
                WHERE id = ? AND user_id = ?
                """,
                values,
            )
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Log not found")

            row = connection.execute(
                """
                SELECT id, title, summary, content, tags, log_date
                FROM learning_logs
                WHERE id = ?
                """,
                (log_id,),
            ).fetchone()
    except sqlite3.OperationalError:
        # TODO: Surface a clearer error when the DB is not initialized.
        raise HTTPException(status_code=500, detail="Database not initialized")

    return serialize_log(row)


@app.delete("/api/logs/{log_id}")
def delete_log(log_id: int, user=Depends(get_current_user)):
    try:
        with get_connection() as connection:
            cursor = connection.execute(
                """
                DELETE FROM learning_logs
                WHERE id = ? AND user_id = ?
                """,
                (log_id, user["id"]),
            )
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Log not found")
    except sqlite3.OperationalError:
        # TODO: Surface a clearer error when the DB is not initialized.
        raise HTTPException(status_code=500, detail="Database not initialized")

    return {"status": "deleted", "log_id": log_id}


# Profile
@app.get("/api/profile")
def get_profile(user=Depends(get_current_user)):
    try:
        with get_connection() as connection:
            row = connection.execute(
                """
                SELECT headline, summary, nationality, prefecture, city,
                       school_type, school_name, created_at, updated_at
                FROM user_profiles
                WHERE user_id = ?
                """,
                (user["id"],),
            ).fetchone()

            if not row:
                connection.execute(
                    """
                    INSERT INTO user_profiles (
                        user_id, headline, summary, nationality,
                        prefecture, city, school_type, school_name
                    )
                    VALUES (?, '', '', '', '', '', '', '')
                    """,
                    (user["id"],),
                )
                connection.commit()
                row = connection.execute(
                    """
                    SELECT headline, summary, nationality, prefecture, city,
                           school_type, school_name, created_at, updated_at
                    FROM user_profiles
                    WHERE user_id = ?
                    """,
                    (user["id"],),
                ).fetchone()
    except sqlite3.OperationalError:
        raise HTTPException(status_code=500, detail="Database not initialized")

    return serialize_profile(row)


@app.put("/api/profile")
def update_profile(payload: ProfileUpdate, user=Depends(get_current_user)):
    fields = []
    values = []

    allowed_school_types = {
        "japanese_school",
        "vocational",
        "university",
        "graduate",
        "other",
    }

    if payload.headline is not None:
        fields.append("headline = ?")
        values.append(payload.headline.strip())
    if payload.summary is not None:
        fields.append("summary = ?")
        values.append(payload.summary.strip())
    if payload.nationality is not None:
        fields.append("nationality = ?")
        values.append(payload.nationality.strip())
    if payload.prefecture is not None:
        fields.append("prefecture = ?")
        values.append(payload.prefecture.strip())
    if payload.city is not None:
        fields.append("city = ?")
        values.append(payload.city.strip())
    if payload.school_type is not None:
        if payload.school_type not in allowed_school_types:
            raise HTTPException(status_code=400, detail="Invalid school type")
        fields.append("school_type = ?")
        values.append(payload.school_type)
    if payload.school_name is not None:
        fields.append("school_name = ?")
        values.append(payload.school_name.strip())

    if not fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    fields.append("updated_at = datetime('now')")
    values.append(user["id"])

    try:
        with get_connection() as connection:
            connection.execute(
                f"""
                UPDATE user_profiles
                SET {', '.join(fields)}
                WHERE user_id = ?
                """,
                values,
            )
            connection.commit()
            row = connection.execute(
                """
                SELECT headline, summary, nationality, prefecture, city,
                       school_type, school_name, created_at, updated_at
                FROM user_profiles
                WHERE user_id = ?
                """,
                (user["id"],),
            ).fetchone()
    except sqlite3.OperationalError:
        raise HTTPException(status_code=500, detail="Database not initialized")

    return serialize_profile(row)


# Courses (University)
@app.get("/api/courses")
def list_courses(user=Depends(get_optional_user)):
    try:
        with get_connection() as connection:
            if user:
                rows = connection.execute(
                    """
                    SELECT id, user_id, year_level, term, course_name,
                           learned_notes, outcome_notes, next_notes,
                           visibility, status, created_at, updated_at
                    FROM university_courses
                    WHERE (status = 'published' AND visibility = 'public')
                       OR user_id = ?
                    ORDER BY year_level DESC, term DESC, id DESC
                    """,
                    (user["id"],),
                ).fetchall()
            else:
                rows = connection.execute(
                    """
                    SELECT id, user_id, year_level, term, course_name,
                           learned_notes, outcome_notes, next_notes,
                           visibility, status, created_at, updated_at
                    FROM university_courses
                    WHERE status = 'published' AND visibility = 'public'
                    ORDER BY year_level DESC, term DESC, id DESC
                    """
                ).fetchall()
    except sqlite3.OperationalError:
        return []

    current_user_id = user["id"] if user else None
    data = []
    for row in rows:
        course = serialize_course(row)
        course["is_owner"] = bool(current_user_id and row["user_id"] == current_user_id)
        course["can_edit"] = course["is_owner"]
        data.append(course)
    return data


@app.post("/api/courses", status_code=status.HTTP_201_CREATED)
def create_course(payload: CourseCreate, user=Depends(get_current_user)):
    try:
        with get_connection() as connection:
            cursor = connection.execute(
                """
                INSERT INTO university_courses (
                    user_id, year_level, term, course_name,
                    learned_notes, outcome_notes, next_notes,
                    visibility, status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user["id"],
                    payload.year_level,
                    payload.term.strip(),
                    payload.course_name.strip(),
                    payload.learned_notes,
                    payload.outcome_notes,
                    payload.next_notes,
                    "private",
                    "draft",
                ),
            )
            row = connection.execute(
                """
                SELECT id, user_id, year_level, term, course_name,
                       learned_notes, outcome_notes, next_notes,
                       visibility, status, created_at, updated_at
                FROM university_courses
                WHERE id = ?
                """,
                (cursor.lastrowid,),
            ).fetchone()
    except sqlite3.OperationalError:
        raise HTTPException(status_code=500, detail="Database not initialized")

    return serialize_course(row)


@app.put("/api/courses/{course_id}")
def update_course(
    course_id: int,
    payload: CourseUpdate,
    user=Depends(get_current_user),
):
    fields = []
    values = []

    if payload.year_level is not None:
        fields.append("year_level = ?")
        values.append(payload.year_level)
    if payload.term is not None:
        fields.append("term = ?")
        values.append(payload.term.strip())
    if payload.course_name is not None:
        fields.append("course_name = ?")
        values.append(payload.course_name.strip())
    if payload.learned_notes is not None:
        fields.append("learned_notes = ?")
        values.append(payload.learned_notes)
    if payload.outcome_notes is not None:
        fields.append("outcome_notes = ?")
        values.append(payload.outcome_notes)
    if payload.next_notes is not None:
        fields.append("next_notes = ?")
        values.append(payload.next_notes)
    if payload.visibility is not None:
        if payload.visibility not in {"public", "private"}:
            raise HTTPException(status_code=400, detail="Invalid visibility")
        fields.append("visibility = ?")
        values.append(payload.visibility)
    if payload.status is not None:
        if payload.status not in {"draft", "published"}:
            raise HTTPException(status_code=400, detail="Invalid status")
        fields.append("status = ?")
        values.append(payload.status)

    if not fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    fields.append("updated_at = datetime('now')")
    values.extend([course_id, user["id"]])

    try:
        with get_connection() as connection:
            cursor = connection.execute(
                f"""
                UPDATE university_courses
                SET {', '.join(fields)}
                WHERE id = ? AND user_id = ?
                """,
                values,
            )
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Course not found")

            row = connection.execute(
                """
                SELECT id, user_id, year_level, term, course_name,
                       learned_notes, outcome_notes, next_notes,
                       visibility, status, created_at, updated_at
                FROM university_courses
                WHERE id = ?
                """,
                (course_id,),
            ).fetchone()
    except sqlite3.OperationalError:
        raise HTTPException(status_code=500, detail="Database not initialized")

    return serialize_course(row)


# TODO: Add CRUD endpoints for users
# TODO: Add CRUD endpoints for goals
# Projects
@app.get("/api/projects")
def list_projects():
    try:
        with get_connection() as connection:
            rows = connection.execute(
                """
                SELECT id, user_id, title, summary, details, status,
                       repo_url, demo_url, image_url, created_at, updated_at
                FROM projects
                ORDER BY created_at DESC
                """
            ).fetchall()
    except sqlite3.OperationalError:
        return []

    return [serialize_project(row) for row in rows]


@app.post("/api/projects", status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, user=Depends(get_current_user)):
    try:
        with get_connection() as connection:
            cursor = connection.execute(
                """
                INSERT INTO projects (
                    user_id, title, summary, details, status,
                    repo_url, demo_url, image_url
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user["id"],
                    payload.title.strip(),
                    payload.summary,
                    payload.details,
                    payload.status or "draft",
                    payload.repo_url,
                    payload.demo_url,
                    payload.image_url,
                ),
            )
            row = connection.execute(
                """
                SELECT id, user_id, title, summary, details, status,
                       repo_url, demo_url, image_url, created_at, updated_at
                FROM projects
                WHERE id = ?
                """,
                (cursor.lastrowid,),
            ).fetchone()
    except sqlite3.OperationalError:
        raise HTTPException(status_code=500, detail="Database not initialized")

    return serialize_project(row)


@app.put("/api/projects/{project_id}")
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    user=Depends(get_current_user),
):
    fields = []
    values = []

    if payload.title is not None:
        fields.append("title = ?")
        values.append(payload.title.strip())
    if payload.summary is not None:
        fields.append("summary = ?")
        values.append(payload.summary)
    if payload.details is not None:
        fields.append("details = ?")
        values.append(payload.details)
    if payload.status is not None:
        fields.append("status = ?")
        values.append(payload.status)
    if payload.repo_url is not None:
        fields.append("repo_url = ?")
        values.append(payload.repo_url)
    if payload.demo_url is not None:
        fields.append("demo_url = ?")
        values.append(payload.demo_url)
    if payload.image_url is not None:
        fields.append("image_url = ?")
        values.append(payload.image_url)

    if not fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    fields.append("updated_at = datetime('now')")
    values.extend([project_id, user["id"]])

    try:
        with get_connection() as connection:
            cursor = connection.execute(
                f"""
                UPDATE projects
                SET {', '.join(fields)}
                WHERE id = ? AND user_id = ?
                """,
                values,
            )
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Project not found")

            row = connection.execute(
                """
                SELECT id, user_id, title, summary, details, status,
                       repo_url, demo_url, image_url, created_at, updated_at
                FROM projects
                WHERE id = ?
                """,
                (project_id,),
            ).fetchone()
    except sqlite3.OperationalError:
        raise HTTPException(status_code=500, detail="Database not initialized")

    return serialize_project(row)


@app.delete("/api/projects/{project_id}")
def delete_project(project_id: int, user=Depends(get_current_user)):
    try:
        with get_connection() as connection:
            cursor = connection.execute(
                """
                DELETE FROM projects
                WHERE id = ? AND user_id = ?
                """,
                (project_id, user["id"]),
            )
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Project not found")
    except sqlite3.OperationalError:
        raise HTTPException(status_code=500, detail="Database not initialized")

    return {"status": "deleted", "project_id": project_id}
# TODO: Add CRUD endpoints for messages
# TODO: Add logout and token rotation endpoints.
# ... (existing code)

# Assistant Chat
@app.post("/api/chat")
async def chat(payload: ChatRequest):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API Key not configured")

    client = OpenAI(api_key=api_key)
    user_msg = payload.message.lower()

    # Simple command parsing (similar to legacy main.py)
    if "open google" in user_msg:
        return {"response": "Opening Google...", "action": "open_url", "url": "https://www.google.com/"}
    elif "open youtube" in user_msg:
        return {"response": "Opening YouTube...", "action": "open_url", "url": "https://www.youtube.com/"}
    elif "open facebook" in user_msg:
        return {"response": "Opening Facebook...", "action": "open_url", "url": "https://www.facebook.com/"}
    elif "open tiktok" in user_msg:
        return {"response": "Opening TikTok...", "action": "open_url", "url": "https://www.tiktok.com/"}
    elif user_msg.startswith("play"):
        # Legacy music library support
        song = user_msg.split(" ")[1] if len(user_msg.split(" ")) > 1 else ""
        music = {
            "skyfall": "https://youtu.be/5eBBdBEbbXQ",
            "run": "https://youtu.be/MbJ72KO5khs", # 'run it up' simplified
            "believer": "https://youtu.be/W0DM5lcj6mw"
        }
        # Fuzzy match or direct lookup could go here, keeping it simple for now
        link = music.get(song)
        if link:
            return {"response": f"Playing {song}...", "action": "open_url", "url": link}
        else:
             return {"response": f"I couldn't find the song {song}. playing fallback...", "action": "open_url", "url": "https://www.youtube.com/results?search_query=" + song}


    # Verify OpenAI call
    try:
        completion = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a virtual assistant named Jarvis, skilled in educational and general tasks. You speak Japanese by default unless asked otherwise."},
                {"role": "user", "content": payload.message}
            ]
        )
        response_text = completion.choices[0].message.content
        return {"response": response_text, "action": "none"}
    except Exception as e:
        print(f"OpenAI Error: {e}")
        return {"response": "申し訳ありません、エラーが発生しました。", "action": "error"}

# News Agent
from backend.news_service import fetch_and_save_digest, get_latest_digest

@app.get("/api/news")
def get_news():
    digest = get_latest_digest()
    if not digest:
        return {"summary": None, "image_url": None, "first_run": True}
    return digest

@app.post("/api/news")
def trigger_news_update():
    digest = fetch_and_save_digest()
    if not digest:
        raise HTTPException(status_code=500, detail="Failed to fetch or summarize news")
    return digest
