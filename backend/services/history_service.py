from database.db import get_db

class HistoryService:
    @staticmethod
    def add_history(user_id: int, recognized_text: str, duration: float = 0.0, status: str = "completed"):
        if not recognized_text or not recognized_text.strip():
            return None, "Recognized text cannot be empty."
        
        db = get_db()
        cur = db.execute(
            """
            INSERT INTO recognition_history (user_id, recognized_text, duration, status)
            VALUES (?, ?, ?, ?)
            """,
            (user_id, recognized_text.strip(), float(duration or 0.0), status or "completed")
        )
        db.commit()
        return {"id": cur.lastrowid, "user_id": user_id, "recognized_text": recognized_text.strip()}, None

    @staticmethod
    def get_user_history(user_id: int, limit: int = 50):
        db = get_db()
        cur = db.execute(
            """
            SELECT id, recognized_text, duration, status, created_at
            FROM recognition_history
            WHERE user_id = ?
            ORDER BY created_at DESC, id DESC
            LIMIT ?
            """,
            (user_id, limit)
        )
        rows = cur.fetchall()
        return [dict(row) for row in rows]

    @staticmethod
    def clear_user_history(user_id: int):
        db = get_db()
        db.execute("DELETE FROM recognition_history WHERE user_id = ?", (user_id,))
        db.commit()
        return True
