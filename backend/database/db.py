import sqlite3
from pathlib import Path
from flask import g, current_app
from config import Config

def get_db():
    """Get or create SQLite connection for current application context."""
    if 'db' not in g:
        db_path = Path(current_app.config.get('DATABASE_PATH', Config.DATABASE_PATH))
        db_path.parent.mkdir(parents=True, exist_ok=True)
        g.db = sqlite3.connect(db_path)
        g.db.row_factory = sqlite3.Row
        # Enable foreign key support in SQLite
        g.db.execute("PRAGMA foreign_keys = ON;")
    return g.db

def close_db(e=None):
    """Close connection at end of request."""
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db(app=None):
    """Initialize database tables from schema.sql."""
    if app is not None:
        db_path = Path(app.config.get('DATABASE_PATH', Config.DATABASE_PATH))
    elif current_app:
        db_path = Path(current_app.config.get('DATABASE_PATH', Config.DATABASE_PATH))
    else:
        db_path = Config.DATABASE_PATH
        
    db_path.parent.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    
    schema_path = Path(__file__).resolve().parent / "schema.sql"
    with open(schema_path, "r", encoding="utf-8") as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()

