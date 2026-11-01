import json
from pathlib import Path
from flask import Blueprint, jsonify, session
from config import Config

evaluation_bp = Blueprint("evaluation", __name__)

# Only this email is allowed to view model evaluation results
ADMIN_EMAIL = "navyatatakuntla99@gmail.com"

@evaluation_bp.route("/api/model/evaluation", methods=["GET"])
def get_evaluation():
    # Restrict access to admin user only
    user_email = session.get("user_email", "")
    if user_email != ADMIN_EMAIL:
        return jsonify({"error": "Access denied. This page is restricted."}), 403

    metrics_path = Path(Config.METRICS_PATH)
    if not metrics_path.exists():
        return jsonify({"available": False}), 200

    try:
        with open(metrics_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"available": False, "error": str(e)}), 500
