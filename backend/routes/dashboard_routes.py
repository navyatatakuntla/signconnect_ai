from flask import Blueprint, jsonify, session
from services.dashboard_service import DashboardService

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/api/dashboard/stats", methods=["GET"])
def get_stats():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    stats = DashboardService.get_stats(user_id)
    return jsonify(stats), 200
