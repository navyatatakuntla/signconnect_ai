/*
 * SignConnect AI - frontend configuration.
 * Edit this file only. Every page loads it first.
 */
window.SC_CONFIG = {
  // Where the Flask backend runs. If served from port 5000, uses same-origin ("").
  // If served from a live server (port 5500, etc.), uses http://127.0.0.1:5000.
  API_BASE: (window.location.port === "5000" || window.location.port === "") ? "" : "http://127.0.0.1:5000",

  // Set to false for full real backend mode
  UI_PREVIEW: false,

  // Recognition page tuning
  FRAME_INTERVAL_MS: 350,   // how often a frame is sent (~3 per second)
  FRAME_WIDTH: 480,         // higher resolution for accurate MediaPipe landmarking
  JPEG_QUALITY: 0.75,
  REQUEST_TIMEOUT_MS: 5000,
  MIN_CONFIDENCE_DISPLAY: 0.35  // shown as "low confidence" below this value
};
