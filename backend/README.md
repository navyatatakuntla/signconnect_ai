# SignConnect AI — Backend & ML Pipeline

The Flask backend and Machine Learning subsystem for Indian Sign Language recognition.

## Architecture

- **`app.py`**: Flask application factory, CORS with credentials, CSRF verification middleware, and static frontend router.
- **`config.py`**: Environment and runtime configuration.
- **`database/`**: SQLite database initialization (`schema.sql`) and connection pooling (`db.py`).
- **`routes/`**: Modular API endpoints:
  - `auth_routes.py`: Register, login, logout, me, and CSRF token endpoints.
  - `recognition_routes.py`: Multipart frame prediction endpoint (`/api/predict`).
  - `history_routes.py`: Recognition history CRUD endpoints (`/api/history`).
  - `dashboard_routes.py`: Aggregated user statistics (`/api/dashboard/stats`).
  - `evaluation_routes.py`: ML model metrics & confusion matrix (`/api/model/evaluation`).
  - `feedback_routes.py`: User feedback submission (`/api/feedback`).
- **`services/`**: Business logic layer isolating database queries and rules.
- **`ml/`**: Machine Learning pipeline:
  - `feature_extraction.py`: MediaPipe HandLandmarker API extracting 21 normalized 3D landmarks (63 features).
  - `dataset_pipeline.py`: Dataset loader, landmark feature generator, and Random Forest / SVM / KNN training.
  - `inference.py`: Live frame prediction with temporal smoothing & confidence thresholding.
- **`models/`**: Serialized Random Forest model (`isl_model.joblib`), evaluation metrics (`evaluation_metrics.json`), and MediaPipe model (`hand_landmarker.task`).
- **`tests/`**: Unit and integration test suite (`test_auth.py`, `test_api.py`, `test_inference.py`).

## Running Tests

```bash
python -m unittest discover -s tests
```

## Running the Server

```bash
python app.py
```
Backend runs on `http://127.0.0.1:5000`.
