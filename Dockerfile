# ==============================================================================
# SignConnect AI - Production Dockerfile for Render Deployment
# Python 3.11 with MediaPipe, OpenCV, scikit-learn, and Gunicorn WSGI
# ==============================================================================

FROM python:3.11-slim-bookworm

LABEL maintainer="SignConnect AI Team"
LABEL description="Production Docker container for SignConnect AI with MediaPipe and ISL Recognition"

# ------------------------------------------------------------------------------
# 1. Environment Variables Configuration
# ------------------------------------------------------------------------------
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH="/app/backend:/app" \
    FLASK_ENV=production \
    PORT=5000

# ------------------------------------------------------------------------------
# 2. Linux System Dependencies for MediaPipe and OpenCV Headless
# ------------------------------------------------------------------------------
# - libgles2: Provides libGLESv2.so.2 (explicitly fixes MediaPipe runtime shared library error)
# - libegl1: Provides libEGL.so.1 (EGL display and context management for OpenGL ES)
# - libgl1: Provides libGL.so.1 (OpenGL dispatch library)
# - libglib2.0-0: Provides GLib runtime required by OpenCV and MediaPipe
# - libgbm1: Provides Generic Buffer Management for hardware/headless acceleration
# - libgomp1: Provides OpenMP multi-threading runtime for Scikit-Learn and NumPy
# - ca-certificates & curl: Required for HTTPS requests and Docker health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgles2 \
    libegl1 \
    libgl1 \
    libglib2.0-0 \
    libgbm1 \
    libgomp1 \
    ca-certificates \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ------------------------------------------------------------------------------
# 3. Security: Dedicated Non-Root Application User
# ------------------------------------------------------------------------------
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser

# Set working directory to project root
WORKDIR /app

# ------------------------------------------------------------------------------
# 4. Python Dependencies Installation
# ------------------------------------------------------------------------------
# Copy requirements first to take advantage of Docker layer caching
COPY backend/requirements.txt /app/backend/requirements.txt

RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r /app/backend/requirements.txt

# ------------------------------------------------------------------------------
# 5. Application Code & Directory Setup
# ------------------------------------------------------------------------------
# Copy full project repository (filtered by .dockerignore)
COPY --chown=appuser:appuser . /app

# Ensure all runtime directory structures (database, dataset, models) exist with proper permissions
RUN mkdir -p /app/backend/database \
             /app/backend/dataset/raw \
             /app/backend/dataset/processed \
             /app/backend/models && \
    chown -R appuser:appuser /app

# ------------------------------------------------------------------------------
# 6. User and Network Port
# ------------------------------------------------------------------------------
# Switch to unprivileged non-root user
USER appuser

# Expose container port (Render assigns dynamic $PORT at runtime)
EXPOSE 5000

# ------------------------------------------------------------------------------
# 7. Health Check
# ------------------------------------------------------------------------------
# Health check using Flask's dedicated /api/health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://127.0.0.1:${PORT:-5000}/api/health || exit 1

# ------------------------------------------------------------------------------
# 8. Container Entry Point
# ------------------------------------------------------------------------------
# Executes Gunicorn via shell to expand Render's dynamic $PORT environment variable.
# 'exec' replaces the shell process so Gunicorn receives POSIX signals (SIGTERM/SIGINT) directly.
CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT:-5000} --workers 2 --threads 4 --timeout 120 --access-logfile - --error-logfile - wsgi:app"]

