import unittest
import tempfile
import os
from pathlib import Path
import sys

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_path))

from app import create_app
from database.db import init_db

class TestAuth(unittest.TestCase):
    def setUp(self):
        self.db_fd, self.db_path = tempfile.mkstemp()
        self.app = create_app({
            "TESTING": True,
            "DATABASE_PATH": Path(self.db_path),
            "SECRET_KEY": "test_secret_key"
        })
        self.client = self.app.test_client()

    def tearDown(self):
        os.close(self.db_fd)
        try:
            os.unlink(self.db_path)
        except Exception:
            pass

    def test_csrf_token_generation(self):
        res = self.client.get("/api/csrf")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("csrf_token", data)
        self.assertTrue(len(data["csrf_token"]) > 10)

    def test_registration_and_login_flow(self):
        # 1. Register new user
        reg_payload = {
            "full_name": "Test Student",
            "email": "student@example.com",
            "password": "Password123",
            "confirm_password": "Password123"
        }
        res = self.client.post("/api/auth/register", json=reg_payload)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertEqual(data["user"]["email"], "student@example.com")

        # 2. Check /api/auth/me while logged in
        me_res = self.client.get("/api/auth/me")
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.get_json()["user"]["email"], "student@example.com")

        # 3. Prevent duplicate email registration
        dup_res = self.client.post("/api/auth/register", json=reg_payload)
        self.assertEqual(dup_res.status_code, 409)

        # 4. Logout
        logout_res = self.client.post("/api/auth/logout")
        self.assertEqual(logout_res.status_code, 200)

        # 5. Check /api/auth/me after logout (should be 401)
        unauth_res = self.client.get("/api/auth/me")
        self.assertEqual(unauth_res.status_code, 401)

        # 6. Re-login
        login_res = self.client.post("/api/auth/login", json={
            "email": "student@example.com",
            "password": "Password123"
        })
        self.assertEqual(login_res.status_code, 200)
        self.assertEqual(login_res.get_json()["user"]["full_name"], "Test Student")

if __name__ == "__main__":
    unittest.main()
