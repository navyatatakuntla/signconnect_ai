import os
from collections import deque, Counter
from pathlib import Path
import numpy as np
import joblib

from .feature_extraction import HandLandmarkExtractor

MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "isl_model.joblib"

class SignPredictor:
    """
    Inference service for real-time live sign recognition.
    Performs landmark extraction, coordinate normalization, Random Forest inference,
    confidence thresholding, and multi-frame temporal stability filtering.
    """
    def __init__(self, model_path: str = None, min_confidence: float = 0.55, window_size: int = 3):
        self.model_path = Path(model_path) if model_path else MODEL_PATH
        self.min_confidence = min_confidence
        self.window_size = window_size
        self.history = deque(maxlen=window_size)
        
        self.extractor = HandLandmarkExtractor()
        self.model = None
        self._load_model()

    def _load_model(self):
        if self.model_path.exists():
            try:
                self.model = joblib.load(self.model_path)
                print(f"[SignPredictor] Successfully loaded model from {self.model_path}")
            except Exception as e:
                print(f"[SignPredictor] Error loading model: {e}")
                self.model = None
        else:
            print(f"[SignPredictor] Model file not yet found at {self.model_path}")

    def predict_frame_bytes(self, image_bytes: bytes):
        """
        Predict ISL alphabet sign from raw image bytes.
        """
        if self.model is None:
            self._load_model()
            if self.model is None:
                return {
                    "status": "error",
                    "label": None,
                    "confidence": None,
                    "stable": False,
                    "message": "Recognition model is initializing or not available."
                }

        # 1. Feature extraction using MediaPipe
        features, has_hand = self.extractor.extract_from_bytes(image_bytes)
        
        # 2. Handle no-hand detection
        if not has_hand or features is None:
            self.history.clear()
            return {
                "status": "no_hand",
                "label": None,
                "confidence": None,
                "stable": False,
                "message": "No hand detected. Position your hand in frame."
            }

        # 3. Model prediction
        features_2d = features.reshape(1, -1)
        
        # Random Forest supports predict_proba
        try:
            proba = self.model.predict_proba(features_2d)[0]
            max_idx = np.argmax(proba)
            confidence = float(proba[max_idx])
            predicted_label = str(self.model.classes_[max_idx])
        except Exception:
            predicted_label = str(self.model.predict(features_2d)[0])
            confidence = 0.85

        # 4. Confidence Thresholding
        if confidence < self.min_confidence:
            self.history.append((None, confidence))
            return {
                "status": "low_confidence",
                "label": predicted_label,
                "confidence": round(confidence, 2),
                "stable": False,
                "message": f"Low confidence ({round(confidence * 100)}%). Adjust hand angle or lighting."
            }

        # 5. Multi-frame Temporal Smoothing & Stability
        self.history.append((predicted_label, confidence))
        
        # Stable if last `window_size` non-null predictions agree on the same label
        valid_labels = [lbl for lbl, _ in self.history if lbl is not None]
        is_stable = False
        if len(valid_labels) >= self.window_size:
            counter = Counter(valid_labels)
            most_common_label, count = counter.most_common(1)[0]
            if count >= self.window_size:
                is_stable = True
                predicted_label = most_common_label

        return {
            "status": "ok",
            "label": predicted_label,
            "confidence": round(confidence, 2),
            "stable": is_stable,
            "message": f"Recognized sign '{predicted_label}'"
        }
