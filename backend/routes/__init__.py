from .auth_routes import auth_bp
from .recognition_routes import recognition_bp
from .history_routes import history_bp
from .dashboard_routes import dashboard_bp
from .evaluation_routes import evaluation_bp
from .feedback_routes import feedback_bp

__all__ = [
    "auth_bp",
    "recognition_bp",
    "history_bp",
    "dashboard_bp",
    "evaluation_bp",
    "feedback_bp"
]
