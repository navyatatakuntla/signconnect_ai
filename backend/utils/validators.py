import re

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

def validate_registration(data):
    """
    Validate user registration data.
    Returns (is_valid, errors_dict)
    """
    errors = {}
    if not data or not isinstance(data, dict):
        return False, {"general": "Invalid request payload"}
    
    full_name = str(data.get("full_name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    confirm_password = str(data.get("confirm_password", ""))
    
    if not full_name or len(full_name) < 2:
        errors["full_name"] = "Full name must be at least 2 characters long."
    elif len(full_name) > 100:
        errors["full_name"] = "Full name must be under 100 characters."
        
    if not email or not EMAIL_REGEX.match(email):
        errors["email"] = "Please enter a valid email address."
        
    if not password or len(password) < 6:
        errors["password"] = "Password must be at least 6 characters long."
        
    if password != confirm_password:
        errors["confirm_password"] = "Passwords do not match."
        
    return len(errors) == 0, errors

def validate_login(data):
    """
    Validate user login data.
    """
    if not data or not isinstance(data, dict):
        return False, "Invalid request payload"
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    if not email or not password:
        return False, "Email and password are required."
    return True, None
