import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "signconnect_academic_secure_key_8849204")
    DATABASE_PATH = Path(os.environ.get("DATABASE_PATH", BASE_DIR / "database" / "signconnect.db"))
    MODEL_PATH = Path(os.environ.get("MODEL_PATH", BASE_DIR / "models" / "isl_model.joblib"))
    METRICS_PATH = Path(os.environ.get("METRICS_PATH", BASE_DIR / "models" / "evaluation_metrics.json"))
    
    # Session Configuration
    SESSION_COOKIE_NAME = "signconnect_session"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = False  # Set to True if running in full HTTPS production
    PERMANENT_SESSION_LIFETIME = 86400  # 24 hours
    
    # Prediction Configuration (realistic for 26-class probability distribution)
    MIN_CONFIDENCE_THRESHOLD = float(os.environ.get("MIN_CONFIDENCE_THRESHOLD", 0.25))
    STABILITY_WINDOW = int(os.environ.get("STABILITY_WINDOW", 2))
    
    # Allowed CORS Origins
    CORS_ORIGINS = [
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:5000",
        "http://localhost:5000"
    ]
