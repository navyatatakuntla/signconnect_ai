import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent / ".env")
except ImportError:
    pass

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
    # Enable secure cookies in production, over HTTPS, or on Render
    SESSION_COOKIE_SECURE = (
        os.environ.get("SESSION_COOKIE_SECURE", "").lower() in ("true", "1", "yes")
        or os.environ.get("FLASK_ENV") == "production"
        or os.environ.get("RENDER") is not None
    )
    PERMANENT_SESSION_LIFETIME = 86400  # 24 hours
    
    # Prediction Configuration (realistic for 26-class probability distribution)
    MIN_CONFIDENCE_THRESHOLD = float(os.environ.get("MIN_CONFIDENCE_THRESHOLD", 0.25))
    STABILITY_WINDOW = int(os.environ.get("STABILITY_WINDOW", 2))
    
    # Allowed CORS Origins (supports comma-separated env var or local fallbacks)
    _env_origins = os.environ.get("CORS_ORIGINS", "")
    if _env_origins:
        CORS_ORIGINS = [o.strip() for o in _env_origins.split(",") if o.strip()]
    else:
        CORS_ORIGINS = [
            "http://127.0.0.1:5500",
            "http://localhost:5500",
            "http://127.0.0.1:5000",
            "http://localhost:5000"
        ]
