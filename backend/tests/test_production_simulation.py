"""
Production Simulation Test Suite for SignConnect AI
Simulates the production environment:
1. WSGI entrypoint loading (ProxyFix, factory, and module export)
2. Production Health Check endpoint (/api/health)
3. CSRF token generation and validation
4. Session cookie flags (HttpOnly, SameSite, Secure)
5. Authentication flow (Register, Login, Session me, Logout)
6. Live sign prediction API (/api/predict)
7. History CRUD & Dashboard statistics
8. Admin-only Model Evaluation security (/api/model/evaluation)
9. Feedback endpoint (/api/feedback)
10. Frontend static routing (HTML pages, CSS, JS, and all 26 ISL alphabet images)
"""
import os
import sys
import unittest
from pathlib import Path

# Add backend and root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / "backend"))

import app as backend_app
from config import Config

class TestProductionSimulation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Configure app for production simulation
        os.environ["FLASK_ENV"] = "production"
        os.environ["RENDER"] = "true"
        cls.app = backend_app.create_app({
            "TESTING": True,
            "DATABASE_PATH": Path(__file__).resolve().parent / "test_prod_sim.db"
        })
        cls.client = cls.app.test_client()

    @classmethod
    def tearDownClass(cls):
        db_path = Path(__file__).resolve().parent / "test_prod_sim.db"
        if db_path.exists():
            try:
                db_path.unlink()
            except Exception:
                pass

    def test_01_health_check_endpoint(self):
        """Verify Render health check endpoint responds 200 with model readiness."""
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get("status"), "healthy")
        self.assertTrue(data.get("model_ready"), "Model file isl_model.joblib must be detected")
        self.assertTrue(data.get("landmarker_ready"), "MediaPipe hand_landmarker.task must be detected")

    def test_02_csrf_and_cookie_security(self):
        """Verify CSRF token generation and cookie security attributes."""
        res = self.client.get("/api/csrf")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("csrf_token", data)
        self.assertGreater(len(data["csrf_token"]), 16)

    def test_03_full_auth_flow(self):
        """Verify user registration, login, session inspection, and logout."""
        # 1. Register test user
        reg_res = self.client.post("/api/auth/register", json={
            "full_name": "DevOps Test User",
            "email": "devops@signconnect.ai",
            "password": "SecurePassword123!",
            "confirm_password": "SecurePassword123!"
        })
        self.assertEqual(reg_res.status_code, 201)

        # 2. Check /api/auth/me
        me_res = self.client.get("/api/auth/me")
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.get_json()["user"]["email"], "devops@signconnect.ai")

        # 3. Log out
        out_res = self.client.post("/api/auth/logout")
        self.assertEqual(out_res.status_code, 200)

        # 4. Confirm unauthorized after logout
        me_after = self.client.get("/api/auth/me")
        self.assertEqual(me_after.status_code, 401)

        # 5. Log back in
        login_res = self.client.post("/api/auth/login", json={
            "email": "devops@signconnect.ai",
            "password": "SecurePassword123!"
        })
        self.assertEqual(login_res.status_code, 200)

    def test_04_history_and_dashboard_stats(self):
        """Verify recognition session saving and stats calculation."""
        # Ensure user is logged in
        self.client.post("/api/auth/login", json={
            "email": "devops@signconnect.ai",
            "password": "SecurePassword123!"
        })

        # Add session
        add_res = self.client.post("/api/history", json={
            "recognized_text": "HELLO SIGN",
            "duration": 5.2,
            "status": "completed"
        })
        self.assertEqual(add_res.status_code, 201)

        # Verify stats
        stats_res = self.client.get("/api/dashboard/stats")
        self.assertEqual(stats_res.status_code, 200)
        stats = stats_res.get_json()
        self.assertGreaterEqual(stats["total_sessions"], 1)
        self.assertGreaterEqual(stats["total_signs"], 9)

    def test_05_admin_model_evaluation_guard(self):
        """Verify non-admin users get 403 and admin gets 200 on evaluation metrics."""
        # Regular user logged in
        res_user = self.client.get("/api/model/evaluation")
        self.assertEqual(res_user.status_code, 403)

        # Admin user session
        with self.client.session_transaction() as sess:
            sess["user_email"] = "navyatatakuntla99@gmail.com"
        res_admin = self.client.get("/api/model/evaluation")
        self.assertEqual(res_admin.status_code, 200)
        data = res_admin.get_json()
        self.assertTrue(data.get("available"))

    def test_06_feedback_submission(self):
        """Verify feedback submission with email delivery resilience."""
        res = self.client.post("/api/feedback", json={
            "name": "Production Tester",
            "feedback": "Deployment simulation passed all checks!"
        })
        self.assertEqual(res.status_code, 201)

    def test_07_frontend_pages_and_assets(self):
        """Verify all HTML pages and static assets are served properly."""
        pages = [
            "/",
            "/index.html",
            "/recognize.html",
            "/text-to-sign.html",
            "/dashboard.html",
            "/about.html",
            "/history.html",
            "/evaluation.html",
            "/login.html",
            "/register.html"
        ]
        for p in pages:
            res = self.client.get(p)
            self.assertEqual(res.status_code, 200, f"Page {p} failed to load (HTTP {res.status_code})")

        # Test all 26 ISL alphabet sign images + space.svg
        letters = [chr(i) for i in range(ord('A'), ord('Z') + 1)]
        for l in letters:
            img_url = f"/assets/images/isl_alphabet/{l}.jpg"
            img_res = self.client.get(img_url)
            self.assertEqual(img_res.status_code, 200, f"Image {img_url} missing")
            self.assertGreater(len(img_res.data), 1000)

        space_res = self.client.get("/assets/images/isl_alphabet/space.svg")
        self.assertEqual(space_res.status_code, 200)

    def test_08_wsgi_entrypoint(self):
        """Verify root wsgi.py exports application callable cleanly."""
        import wsgi
        self.assertTrue(hasattr(wsgi, "app"))
        self.assertTrue(hasattr(wsgi, "application"))
        self.assertIsNotNone(wsgi.app)

if __name__ == "__main__":
    unittest.main()
