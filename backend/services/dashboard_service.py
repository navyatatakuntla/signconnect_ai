from database.db import get_db

class DashboardService:
    @staticmethod
    def get_stats(user_id: int):
        db = get_db()
        # Count total sessions for user
        cur = db.execute("SELECT COUNT(*) AS total FROM recognition_history WHERE user_id = ?", (user_id,))
        total_sessions = cur.fetchone()["total"]

        # Calculate total recognized signs/characters
        cur = db.execute(
            "SELECT recognized_text FROM recognition_history WHERE user_id = ?",
            (user_id,)
        )
        all_texts = cur.fetchall()
        # Count non-whitespace characters
        total_signs = sum(len(row["recognized_text"].replace(" ", "")) for row in all_texts)

        # Recent sessions
        cur = db.execute(
            """
            SELECT id, recognized_text, duration, status, created_at
            FROM recognition_history
            WHERE user_id = ?
            ORDER BY created_at DESC, id DESC
            LIMIT 5
            """,
            (user_id,)
        )
        recent = [dict(r) for r in cur.fetchall()]

        return {
            "total_sessions": total_sessions,
            "total_signs": total_signs,
            "recent": recent
        }

class FeedbackService:
    @staticmethod
    def add_feedback(name: str, email: str = "", message: str = ""):
        if not name or not message:
            return False, "Name and feedback are required."
        db = get_db()
        db.execute(
            "INSERT INTO feedback (name, email, message) VALUES (?, ?, ?)",
            (name.strip(), email.strip(), message.strip())
        )
        db.commit()
        return True, None

