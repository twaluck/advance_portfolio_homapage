
import sqlite3
import os

def populate_projects():
    # Use absolute path to ensure we hit the right DB
    db_path = "/Users/jishiteiraku/Desktop/my_hmpg/database.db"
    
    print(f"Connecting to database at: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get user id (assuming first user)
    try:
        cursor.execute("SELECT id FROM users LIMIT 1")
    except sqlite3.OperationalError:
         print("Error: 'users' table not found. Is the database initialized?")
         # Try init_db logic if needed, but let's just exit
         return

    user = cursor.fetchone()
    if not user:
        print("No user found. Please register a user first.")
        # Create a dummy user if none exists
        print("Creating dummy user...")
        cursor.execute("INSERT INTO users (name, email, role, password_hash) VALUES ('Admin', 'admin@example.com', 'admin', 'dummyhash')")
        user_id = cursor.lastrowid
    else:
        user_id = user[0]

    projects = [
        {
            "title": "Kanji Connect",
            "summary": "An interactive, particle-based game to learn Kanji components.",
            "details": "A web-based game using HTML5 Canvas and particles to make learning Kanji fun and engaging. Features mission-based mechanics and score tracking.",
            "status": "completed",
            "demo_url": "/game.html",
            "image_url": "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&q=80&w=800" # Placeholder
        },
        {
            "title": "TilkuAI Assistant",
            "summary": "Voice-enabled AI assistant interface (Jarvis).",
            "details": "A web interface for an AI assistant capable of voice interaction, command execution (opening websites), and general conversation.",
            "status": "prototype",
            "demo_url": "/assistant.html",
            "image_url": "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800" # Placeholder
        },
        {
            "title": "AI News Agent",
            "summary": "Automated daily tech and world news digest.",
            "details": "An autonomous agent that scrapes, summarizes, and presents the latest developments in AI and global affairs.",
            "status": "ongoing",
            "demo_url": "/news",
            "image_url": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800" # Placeholder
        }
    ]

    for p in projects:
        cursor.execute("SELECT id FROM projects WHERE title = ?", (p["title"],))
        existing = cursor.fetchone()
        
        if existing:
            print(f"Updating '{p['title']}'...")
            cursor.execute("""
                UPDATE projects 
                SET summary=?, details=?, status=?, demo_url=?, image_url=?, updated_at=datetime('now')
                WHERE title=?
            """, (p["summary"], p["details"], p["status"], p["demo_url"], p["image_url"], p["title"]))
        else:
            print(f"Inserting '{p['title']}'...")
            cursor.execute("""
                INSERT INTO projects (user_id, title, summary, details, status, demo_url, image_url)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (user_id, p["title"], p["summary"], p["details"], p["status"], p["demo_url"], p["image_url"]))

    conn.commit()
    conn.close()
    print("Projects populated successfully.")

if __name__ == "__main__":
    populate_projects()
