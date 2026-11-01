import os
from pathlib import Path
from flask import Flask, jsonify, request, send_from_directory, redirect
from flask_cors import CORS

from config import Config
from database.db import close_db, init_db
from routes import (
    auth_bp, recognition_bp, history_bp,
    dashboard_bp, evaluation_bp, feedback_bp
)
from utils.security import validate_csrf_token

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

def create_app(test_config=None):
    app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")
    app.config.from_object(Config)

    if test_config:
        app.config.update(test_config)

    # Enable CORS for frontend clients (e.g. Live Server on 5500)
    CORS(
        app,
        supports_credentials=True,
        origins=app.config.get("CORS_ORIGINS", ["http://127.0.0.1:5500", "http://localhost:5500", "http://127.0.0.1:5000"]),
        allow_headers=["Content-Type", "X-CSRF-Token"],
        expose_headers=["X-CSRF-Token"]
    )

    # Register teardown
    app.teardown_appcontext(close_db)

    # Initialize Database
    with app.app_context():
        init_db(app)

    # CSRF Verification Middleware for state-changing requests
    @app.before_request
    def check_csrf():
        # Exempt safe methods and static files
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return None
        # Exempt frontend static or favicon requests
        if not request.path.startswith("/api/"):
            return None
        
        # Verify CSRF token from header
        token = request.headers.get("X-CSRF-Token")
        # Exempt public endpoints that don't require authentication
        if request.path in ["/api/feedback"]:
            return None
        # Allow prediction or validate token
        if token and not validate_csrf_token(token):
            return jsonify({"error": "Invalid or expired CSRF token. Please refresh."}), 403

    # Register API Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(recognition_bp)
    app.register_blueprint(history_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(evaluation_bp)
    app.register_blueprint(feedback_bp)

    # Frontend Route Handling (serving frontend files directly if visited on port 5000)
    @app.route("/")
    def index():
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.route("/<path:filename>")
    def serve_frontend_file(filename):
        target = FRONTEND_DIR / filename
        if target.exists() and not target.is_dir():
            return send_from_directory(FRONTEND_DIR, filename)
        # Check if .html is omitted
        html_target = FRONTEND_DIR / f"{filename}.html"
        if html_target.exists():
            return send_from_directory(FRONTEND_DIR, f"{filename}.html")
        return jsonify({"error": "Not Found"}), 404

    # Central Error Handlers
    @app.errorhandler(404)
    def not_found(e):
        if request.path.startswith("/api/"):
            return jsonify({"error": "Endpoint not found"}), 404
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error occurred."}), 500

    return app

if __name__ == "__main__":
    app = create_app()
    print("=" * 60)
    print("  SignConnect AI Flask Backend Server Running")
    print("  Local URL: http://127.0.0.1:5000")
    print("=" * 60)
    app.run(host="127.0.0.1", port=5000, debug=True)
