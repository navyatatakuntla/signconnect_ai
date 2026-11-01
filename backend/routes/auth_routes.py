from flask import Blueprint, request, jsonify, session
from utils.security import generate_csrf_token, validate_csrf_token
from utils.validators import validate_registration, validate_login
from services.auth_service import AuthService

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/api/csrf", methods=["GET"])
def get_csrf():
    token = generate_csrf_token()
    return jsonify({"csrf_token": token}), 200

@auth_bp.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or request.form.to_dict()
    is_valid, validation_errors = validate_registration(data)
    if not is_valid:
        return jsonify({"error": "Validation failed", "fields": validation_errors}), 400
    
    user, err = AuthService.register_user(
        full_name=data["full_name"],
        email=data["email"],
        password=data["password"]
    )
    if err:
        return jsonify({"error": err}), 409
    
    session["user_id"] = user["id"]
    session["user_email"] = user["email"]
    session["user_name"] = user["full_name"]
    return jsonify({"user": user, "message": "Registration successful."}), 201

@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or request.form.to_dict()
    is_valid, err_msg = validate_login(data)
    if not is_valid:
        return jsonify({"error": err_msg}), 400
        
    user, err = AuthService.authenticate_user(
        email=data["email"],
        password=data["password"]
    )
    if err:
        return jsonify({"error": err}), 401
        
    session["user_id"] = user["id"]
    session["user_email"] = user["email"]
    session["user_name"] = user["full_name"]
    return jsonify({"user": user, "message": "Login successful."}), 200

@auth_bp.route("/api/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Successfully logged out."}), 200

@auth_bp.route("/api/auth/me", methods=["GET"])
def me():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized. Please log in."}), 401
    user = AuthService.get_user_by_id(user_id)
    if not user:
        session.clear()
        return jsonify({"error": "User not found."}), 401
    return jsonify({
        "user": {
            "id": user["id"],
            "full_name": user["full_name"],
            "email": user["email"]
        }
    }), 200
