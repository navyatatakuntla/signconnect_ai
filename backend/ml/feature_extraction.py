import os
from pathlib import Path
import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions

MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "hand_landmarker.task"

class HandLandmarkExtractor:
    """
    Extracts 21 3D hand landmarks using MediaPipe HandLandmarker API.
    Transforms coordinates into a 63-dimensional normalized feature vector
    invariant to hand position (wrist-centered) and scale.
    """
    def __init__(self, model_asset_path: str = None):
        if model_asset_path is None:
            model_asset_path = str(MODEL_PATH)
            
        if not os.path.exists(model_asset_path):
            raise FileNotFoundError(f"MediaPipe task model not found at {model_asset_path}")
            
        base_options = BaseOptions(model_asset_path=model_asset_path)
        options = vision.HandLandmarkerOptions(
            base_options=base_options,
            num_hands=1,
            min_hand_detection_confidence=0.3,
            min_hand_presence_confidence=0.3,
            min_tracking_confidence=0.3
        )
        self.landmarker = vision.HandLandmarker.create_from_options(options)

    def extract_from_bgr(self, bgr_image: np.ndarray):
        """
        Extract normalized 63 landmarks from a BGR image (OpenCV format).
        Returns:
            features (np.ndarray of shape (63,) or None),
            has_hand (bool)
        """
        if bgr_image is None or bgr_image.size == 0:
            return None, False

        # Convert OpenCV BGR to RGB
        rgb_image = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
        
        result = self.landmarker.detect(mp_image)
        
        if not result.hand_landmarks or len(result.hand_landmarks) == 0:
            return None, False
            
        landmarks = result.hand_landmarks[0]
        if len(landmarks) < 21:
            return None, False

        # 21 landmarks (x, y, z)
        coords = np.zeros((21, 3), dtype=np.float32)
        for i, lm in enumerate(landmarks):
            coords[i] = [lm.x, lm.y, lm.z]

        # Normalization: Translate relative to wrist (landmark 0)
        wrist = coords[0]
        relative_coords = coords - wrist

        # Scale invariance: normalize by max distance or coordinate spread
        max_dist = np.max(np.linalg.norm(relative_coords, axis=1))
        if max_dist > 1e-5:
            normalized = relative_coords / max_dist
        else:
            normalized = relative_coords

        return normalized.flatten(), True

    def extract_from_bytes(self, image_bytes: bytes):
        """Decode image bytes and extract landmarks."""
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return None, False
        return self.extract_from_bgr(img)
