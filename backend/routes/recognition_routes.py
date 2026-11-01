from flask import Blueprint, request, jsonify
from ml.inference import SignPredictor

recognition_bp = Blueprint("recognition", __name__)
predictor = SignPredictor()

@recognition_bp.route("/api/predict", methods=["POST"])
def predict():
    if "frame" not in request.files:
        return jsonify({
            "status": "error",
            "label": None,
            "confidence": None,
            "stable": False,
            "message": "Missing 'frame' in upload."
        }), 400

    file = request.files["frame"]
    frame_bytes = file.read()
    if not frame_bytes:
        return jsonify({
            "status": "error",
            "label": None,
            "confidence": None,
            "stable": False,
            "message": "Empty frame submitted."
        }), 400

    result = predictor.predict_frame_bytes(frame_bytes)
    return jsonify(result), 200
