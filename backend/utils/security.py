import secrets
from flask import session, request
from werkzeug.security import generate_password_hash, check_password_hash

def hash_password(password: str) -> str:
    """Securely hash a password using pbkdf2:sha256."""
    return generate_password_hash(password, method="pbkdf2:sha256", salt_length=16)

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against its hash."""
    return check_password_hash(hashed, password)

def generate_csrf_token() -> str:
    """Generate or retrieve the CSRF token stored in session."""
    if "_csrf_token" not in session:
        session["_csrf_token"] = secrets.token_hex(32)
    return session["_csrf_token"]

def validate_csrf_token(token: str) -> bool:
    """Validate incoming CSRF token against session token."""
    session_token = session.get("_csrf_token")
    if not session_token or not token:
        return False
    return secrets.compare_digest(session_token, token)
