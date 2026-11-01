import unittest
import tempfile
import os
from pathlib import Path
import sys

backend_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_path))

from app import create_app

class TestAPI(unittest.TestCase):
    def setUp(self):
        self.db_fd, self.db_path = tempfile.mkstemp()
        self.app = create_app({
            "TESTING": True,
            "DATABASE_PATH": Path(self.db_path),
            "SECRET_KEY": "test_secret_key"
        })
        self.client = self.app.test_client()
        
        # Register and login a test user
        self.client.post("/api/auth/register", json={
            "full_name": "API Tester",
            "email": "apitester@example.com",
            "password": "Password123",
            "confirm_password": "Password123"
        })

    def tearDown(self):
        os.close(self.db_fd)
        try:
            os.unlink(self.db_path)
        except Exception:
            pass

    def test_model_evaluation_endpoint(self):
        # 1. Non-admin gets 403
        res = self.client.get("/api/model/evaluation")
        self.assertEqual(res.status_code, 403)

        # 2. Admin user gets 200
        with self.client.session_transaction() as sess:
            sess["user_email"] = "navyatatakuntla99@gmail.com"
        res_admin = self.client.get("/api/model/evaluation")
        self.assertEqual(res_admin.status_code, 200)
        data = res_admin.get_json()
        self.assertTrue(data.get("available"))
        self.assertIn("metrics", data)
        self.assertIn("accuracy", data["metrics"])
        self.assertIn("classes", data)

    def test_history_crud_and_stats(self):
        # 1. Add recognition history
        add_res = self.client.post("/api/history", json={
            "recognized_text": "HELLO ISL",
            "duration": 4.5,
            "status": "completed"
        })
        self.assertEqual(add_res.status_code, 201)

        # 2. Get history
        get_res = self.client.get("/api/history")
        self.assertEqual(get_res.status_code, 200)
        items = get_res.get_json()["items"]
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["recognized_text"], "HELLO ISL")

        # 3. Check dashboard stats
        stats_res = self.client.get("/api/dashboard/stats")
        self.assertEqual(stats_res.status_code, 200)
        stats = stats_res.get_json()
        self.assertEqual(stats["total_sessions"], 1)
        self.assertEqual(stats["total_signs"], 8) # "HELLOISL" = 8 chars

        # 4. Clear history
        del_res = self.client.delete("/api/history")
        self.assertEqual(del_res.status_code, 200)
        
        # 5. Verify history is empty
        empty_res = self.client.get("/api/history")
        self.assertEqual(len(empty_res.get_json()["items"]), 0)

    def test_feedback_submission(self):
        res = self.client.post("/api/feedback", json={
            "name": "Student",
            "email": "student@college.edu",
            "message": "Great ISL recognition demo!"
        })
        self.assertEqual(res.status_code, 201)

if __name__ == "__main__":
    unittest.main()
