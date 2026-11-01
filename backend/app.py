import os
from pathlib import Path
from flask import Flask, jsonify, request, send_from_directory, redirect
from flask_cors import CORS

from config import Config, BASE_DIR
from database.db import close_db, init_db
from routes import (
    auth_bp, recognition_bp, history_bp,
    dashboard_bp, evaluation_bp, feedback_bp
)
from utils.security import validate_csrf_token
from werkzeug.middleware.proxy_fix import ProxyFix

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

def create_app(test_config=None):
    app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")
    app.config.from_object(Config)

    if test_config:
        app.config.update(test_config)

    # Apply ProxyFix middleware for reverse proxies (Render, NGINX)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

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

    # Dedicated Health Check Endpoint for Render / Load Balancers
    @app.route("/api/health", methods=["GET"])
    def health_check():
        model_exists = Config.MODEL_PATH.exists()
        landmarker_exists = (BASE_DIR / "models" / "hand_landmarker.task").exists()
        return jsonify({
            "status": "healthy",
            "service": "SignConnect AI",
            "model_ready": model_exists,
            "landmarker_ready": landmarker_exists,
            "version": "1.0.0"
        }), 200

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

# WSGI Application entry point for Gunicorn (e.g. gunicorn "app:application")
application = create_app()
app = application  # Alias for conventions expecting app:app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    host = os.environ.get("HOST", "0.0.0.0" if os.environ.get("RENDER") else "127.0.0.1")
    debug = os.environ.get("FLASK_ENV") != "production" and not os.environ.get("RENDER")
    print("=" * 60)
    print("  SignConnect AI Flask Server Running")
    print(f"  URL: http://{host}:{port}")
    print("=" * 60)
    application.run(host=host, port=port, debug=debug)
