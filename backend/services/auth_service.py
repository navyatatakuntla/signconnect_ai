from database.db import get_db
from utils.security import hash_password, verify_password
import sqlite3

class AuthService:
    @staticmethod
    def register_user(full_name: str, email: str, password: str):
        db = get_db()
        email_clean = email.strip().lower()
        
        # Check if user already exists
        cur = db.execute("SELECT id FROM users WHERE email = ?", (email_clean,))
        if cur.fetchone():
            return None, "An account with this email address already exists."
        
        pwd_hash = hash_password(password)
        try:
            cursor = db.execute(
                "INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)",
                (full_name.strip(), email_clean, pwd_hash)
            )
            db.commit()
            user_id = cursor.lastrowid
            return {
                "id": user_id,
                "full_name": full_name.strip(),
                "email": email_clean
            }, None
        except sqlite3.IntegrityError:
            return None, "Email address already registered."

    @staticmethod
    def authenticate_user(email: str, password: str):
        db = get_db()
        email_clean = email.strip().lower()
        cur = db.execute(
            "SELECT id, full_name, email, password_hash FROM users WHERE email = ?",
            (email_clean,)
        )
        user = cur.fetchone()
        if not user or not verify_password(password, user["password_hash"]):
            return None, "Invalid email or password."
        
        return {
            "id": user["id"],
            "full_name": user["full_name"],
            "email": user["email"]
        }, None

    @staticmethod
    def get_user_by_id(user_id: int):
        db = get_db()
        cur = db.execute(
            "SELECT id, full_name, email, created_at FROM users WHERE id = ?",
            (user_id,)
        )
        user = cur.fetchone()
        if not user:
            return None
        return dict(user)
