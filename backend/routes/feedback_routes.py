import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Blueprint, request, jsonify
from services.dashboard_service import FeedbackService

feedback_bp = Blueprint("feedback", __name__)

# Recipient email – where feedback is delivered
FEEDBACK_RECIPIENT = "navyatatakuntla99@gmail.com"

# SMTP credentials are read from environment variables only.
# Set these in a .env file or your system environment – never hard-code them.
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")          # e.g. yourapp@gmail.com
SMTP_PASS = os.environ.get("SMTP_PASS", "")          # Gmail App Password


def _send_email(sender_name: str, feedback_text: str) -> bool:
    """
    Send a feedback email using SMTP.
    Returns True on success, False if SMTP credentials are not configured.
    Raises on SMTP delivery errors so the caller can log them.
    """
    if not SMTP_USER or not SMTP_PASS:
        return False  # credentials not configured; skip email

    subject = f"[SignConnect AI Feedback] from {sender_name}"
    body = (
        f"New feedback received via SignConnect AI.\n\n"
        f"Name: {sender_name}\n\n"
        f"Feedback:\n{feedback_text}\n"
    )

    msg = MIMEMultipart()
    msg["From"] = SMTP_USER
    msg["To"] = FEEDBACK_RECIPIENT
    msg["Subject"] = subject
    msg["Reply-To"] = SMTP_USER
    msg.attach(MIMEText(body, "plain", "utf-8"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
        server.ehlo()
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, FEEDBACK_RECIPIENT, msg.as_string())

    return True


@feedback_bp.route("/api/feedback", methods=["POST"])
def submit_feedback():
    data = request.get_json(silent=True) or request.form.to_dict()
    name = (data.get("name") or "").strip()
    feedback = (data.get("feedback") or data.get("message") or "").strip()

    if not name or not feedback:
        return jsonify({"error": "Name and feedback are required."}), 400
    if len(feedback) < 5:
        return jsonify({"error": "Feedback must be at least 5 characters."}), 400

    # Persist to database
    success, err = FeedbackService.add_feedback(name, "", feedback)
    if err:
        return jsonify({"error": err}), 400

    # Attempt email delivery
    email_sent = False
    email_warning = None
    try:
        email_sent = _send_email(name, feedback)
        if not email_sent:
            email_warning = (
                "Feedback saved, but email delivery is not configured. "
                "Set SMTP_USER and SMTP_PASS environment variables to enable email notifications."
            )
    except Exception as exc:
        # Log the error server-side but do not expose SMTP details to the client
        print(f"[FeedbackRoute] SMTP error: {exc}")
        email_warning = "Feedback saved, but the email could not be delivered right now. Please try again later."

    response = {"message": "Thank you! Your feedback has been recorded."}
    if email_warning:
        response["warning"] = email_warning

    return jsonify(response), 201
