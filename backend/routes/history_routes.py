from flask import Blueprint, request, jsonify, session
from services.history_service import HistoryService

history_bp = Blueprint("history", __name__)

@history_bp.route("/api/history", methods=["GET"])
def get_history():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    items = HistoryService.get_user_history(user_id)
    return jsonify({"items": items}), 200

@history_bp.route("/api/history", methods=["POST"])
def add_history():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or request.form.to_dict()
    text = data.get("recognized_text", "")
    duration = data.get("duration", 0.0)
    status = data.get("status", "completed")

    res, err = HistoryService.add_history(
        user_id=user_id,
        recognized_text=text,
        duration=duration,
        status=status
    )
    if err:
        return jsonify({"error": err}), 400

    return jsonify({"item": res, "message": "History saved successfully."}), 201

@history_bp.route("/api/history", methods=["DELETE"])
def clear_history():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    HistoryService.clear_user_history(user_id)
    return jsonify({"message": "Recognition history cleared successfully."}), 200
