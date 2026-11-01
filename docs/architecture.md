# SignConnect AI — System Architecture

## 1. High-Level Architecture Overview

SignConnect AI is designed as a decoupled, professional multi-tier architecture:

```
[ Client Browser (HTML5 / Vanilla JS / WebRTC / Web Speech) ]
                             │
            HTTP/JSON & Multipart Form-Data (CORS + Cookies)
                             │
                             ▼
              [ Flask Application Server (Port 5000) ]
       ┌─────────────────────┼─────────────────────┐
       ▼                     ▼                     ▼
[ Blueprints / APIs ]  [ CSRF / Session ]   [ Static Frontend ]
       │                     │
       ▼                     ▼
[ Services Layer ]    [ SQLite DB ]
       │
       ▼
[ ML & CV Pipeline ]
 ├── MediaPipe HandLandmarker (63 features)
 ├── Translation & Scale Normalization
 ├── Random Forest Classifier (Inference)
 └── Multi-Frame Temporal Stability Queue
```

## 2. Computer Vision & ML Pipeline

1. **Webcam Capture**: Downscaled JPEG (320px width) captured at ~2.5 FPS.
2. **Landmark Detection**: MediaPipe HandLandmarker processes RGB frames and extracts 21 key points in 3D $(x_i, y_i, z_i)$.
3. **Feature Preprocessing**:
   - Landmark 0 (wrist) subtracted from all points to achieve translation invariance:
     $$\Delta x_i = x_i - x_0, \quad \Delta y_i = y_i - y_0, \quad \Delta z_i = z_i - z_0$$
   - Maximum distance scaling to achieve camera distance/hand size invariance:
     $$s = \max_i \|\Delta p_i\|, \quad \hat{p}_i = \frac{\Delta p_i}{s}$$
   - Flattened into a 63-dimensional feature vector.
4. **Model Inference**:
   - Random Forest Classifier with 100 estimators predicts class probabilities.
   - Evaluated against Support Vector Machine (RBF kernel) and K-Nearest Neighbors.
5. **Confidence & Stability Logic**:
   - Minimum confidence threshold (0.55).
   - Temporal smoothing window (deque of length 3) requires consecutive agreement before marking prediction as stable.

## 3. Security Considerations

- **Password Hashing**: PBKDF2-HMAC-SHA256 with 16-byte random salts.
- **CSRF Protection**: Cryptographically secure token generated per session and validated on state-changing API calls.
- **Session Cookies**: `HttpOnly`, `SameSite=Lax`.
- **SQL Injection Prevention**: Parameterized queries across all database operations.
- **Image Privacy**: Uploaded frames are processed in-memory and never persisted on disk.
