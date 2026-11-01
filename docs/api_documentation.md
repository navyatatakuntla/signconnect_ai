# SignConnect AI — API Documentation

Base URL: `http://127.0.0.1:5000`

All non-GET requests require credentials (`cookies`) and the `X-CSRF-Token` header retrieved from `GET /api/csrf`.

---

### Authentication Endpoints

#### 1. `GET /api/csrf`
Generates and returns the active session CSRF token.
- **Response**: `200 OK`
```json
{
  "csrf_token": "a1b2c3d4..."
}
```

#### 2. `POST /api/auth/register`
Registers a new user account.
- **Request Body**:
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "SecretPassword123",
  "confirm_password": "SecretPassword123"
}
```
- **Response**: `201 Created`
```json
{
  "user": { "id": 1, "full_name": "John Doe", "email": "john@example.com" },
  "message": "Registration successful."
}
```
- **Errors**: `400 Bad Request` (validation failed), `409 Conflict` (email already exists).

#### 3. `POST /api/auth/login`
Authenticates existing user credentials and creates a session.
- **Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecretPassword123"
}
```
- **Response**: `200 OK`
```json
{
  "user": { "id": 1, "full_name": "John Doe", "email": "john@example.com" },
  "message": "Login successful."
}
```
- **Errors**: `401 Unauthorized` (invalid email or password).

#### 4. `POST /api/auth/logout`
Destroys the current user session.
- **Response**: `200 OK`

#### 5. `GET /api/auth/me`
Retrieves information about the currently logged-in user.
- **Response**: `200 OK` or `401 Unauthorized`.

---

### Machine Learning & Recognition Endpoints

#### 6. `POST /api/predict`
Accepts a single camera frame (JPEG) in multipart form-data.
- **Form Data**: `frame: <binary data>`
- **Response**: `200 OK`
```json
{
  "status": "ok",
  "label": "A",
  "confidence": 0.88,
  "stable": true,
  "message": "Recognized sign 'A'"
}
```
Status options: `ok`, `no_hand`, `low_confidence`, `error`.

#### 7. `GET /api/model/evaluation`
Returns actual empirical metrics from the test set evaluation.
- **Response**: `200 OK`
```json
{
  "available": true,
  "dataset": { "name": "...", "train": 270, "validation": 58, "test": 59 },
  "classes": ["A", "B", ...],
  "metrics": { "accuracy": 0.5932, "precision": 0.5441, "recall": 0.5932, "f1": 0.5425 },
  "model_comparison": { "Random Forest": 0.5932, "Support Vector Machine": 0.5593, "K-Nearest Neighbors": 0.5932 },
  "per_class": [{ "label": "A", "precision": 1.0, "recall": 1.0, "f1": 1.0, "support": 2 }],
  "confusion_matrix": { "labels": [...], "matrix": [[...]] },
  "model": { "algorithm": "Random Forest Classifier", "n_estimators": 100 }
}
```

---

### Dashboard & History Endpoints

#### 8. `GET /api/dashboard/stats`
Returns session count and recent history for the authenticated user.
- **Response**: `200 OK`

#### 9. `GET /api/history`
Returns full history records for the authenticated user.
- **Response**: `200 OK`
```json
{
  "items": [
    {
      "id": 1,
      "recognized_text": "HELLO WORLD",
      "duration": 12.4,
      "status": "completed",
      "created_at": "2026-11-01 12:00:00"
    }
  ]
}
```

#### 10. `POST /api/history`
Persists a user-confirmed recognition sentence session.
- **Request Body**:
```json
{
  "recognized_text": "NAMASTE",
  "duration": 5.2,
  "status": "completed"
}
```

#### 11. `DELETE /api/history`
Deletes all recognition history for the logged-in user.
