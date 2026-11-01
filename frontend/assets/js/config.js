/*
 * SignConnect AI - frontend configuration.
 * Edit this file only. Every page loads it first.
 */
window.SC_CONFIG = {
  // When running in production (e.g. onrender.com) or served directly by Flask, uses same-origin ("").
  // When running locally on a secondary dev port (e.g. Live Server on 5500), connects to local backend.
  API_BASE: (
    window.location.hostname !== "localhost" && 
    window.location.hostname !== "127.0.0.1"
  ) ? "" : ((window.location.port === "5000" || window.location.port === "") ? "" : "http://127.0.0.1:5000"),

  // Set to false for full real backend mode
  UI_PREVIEW: false,

  // Recognition page tuning
  FRAME_INTERVAL_MS: 350,   // how often a frame is sent (~3 per second)
  FRAME_WIDTH: 480,         // higher resolution for accurate MediaPipe landmarking
  JPEG_QUALITY: 0.75,
  REQUEST_TIMEOUT_MS: 5000,
  MIN_CONFIDENCE_DISPLAY: 0.35  // shown as "low confidence" below this value
};
