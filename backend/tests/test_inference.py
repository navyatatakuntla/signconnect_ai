import unittest
import io
import cv2
import numpy as np
from pathlib import Path
import sys

backend_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_path))

from app import create_app

class TestInference(unittest.TestCase):
    def setUp(self):
        self.app = create_app({"TESTING": True})
        self.client = self.app.test_client()

    def test_predict_without_frame_returns_400(self):
        res = self.client.post("/api/predict")
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertEqual(data["status"], "error")

    def test_predict_blank_frame_returns_no_hand(self):
        # Create a black dummy image
        blank = np.zeros((200, 200, 3), dtype=np.uint8)
        _, encoded = cv2.imencode(".jpg", blank)
        img_bytes = io.BytesIO(encoded.tobytes())

        res = self.client.post(
            "/api/predict",
            data={"frame": (img_bytes, "frame.jpg")},
            content_type="multipart/form-data"
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "no_hand")
        self.assertIsNone(data["label"])

if __name__ == "__main__":
    unittest.main()
