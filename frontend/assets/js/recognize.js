/*
 * Live recognition page: webcam, throttled frame upload, sentence builder, speech.
 *
 * POST /api/predict  (multipart/form-data, field "frame" = small JPEG)
 *   -> { status: "ok" | "no_hand" | "low_confidence" | "error",
 *        label: "A" | null,
 *        confidence: 0..1 | null,   // only when the model gives a meaningful value
 *        stable: true | false,      // true when recent frames agree
 *        message: "optional text" }
 *
 * POST /api/history { recognized_text, duration, status }  (needs login)
 *
 * No prediction is ever invented here: every letter shown comes from the server.
 */
(function () {
  "use strict";
  var SC = window.SC, CFG = SC.config;
  var $ = function (id) { return document.getElementById(id); };

  var video = $("video"), canvas = $("capture");
  var startBtn = $("start-btn"), stopBtn = $("stop-btn");
  var addBtn = $("add-btn"), autoAdd = $("auto-add");
  var sentence = $("sentence");
  var speakBtn = $("speak-btn"), stopSpeakBtn = $("stop-speak-btn");

  var stream = null, timer = null, inFlight = false;
  var failures = 0;
  var currentLabel = null;      // last confident label from the server
  var lastAutoAdded = null;     // prevents repeating the same letter while the hand stays still
  var sessionStart = null;      // Date when the camera started
  var lettersAdded = 0;

  /* ---------------- UI helpers ---------------- */
  function setStatus(kind, text) {
    $("status-dot").className = "dot " + (kind || "");
    $("status-text").textContent = text;
  }

  function showAlert(message, type) {
    var box = $("rec-alert");
    if (!message) { box.hidden = true; box.innerHTML = ""; return; }
    box.hidden = false;
    box.innerHTML = '<div class="notice notice-' + (type || "error") + '" role="alert">' + SC.icon("alert") + "<p>" + SC.escapeHtml(message) + "</p></div>";
  }

  function showPrediction(label, message, confidence) {
    var letter = $("pred-letter");
    letter.textContent = label || "–";
    letter.classList.toggle("idle", !label);
    $("pred-message").textContent = message || "";
    var wrap = $("conf-wrap");
    if (typeof confidence === "number" && label) {
      var pct = Math.round(confidence * 100);
      wrap.hidden = false;
      $("conf-bar").style.width = pct + "%";
      $("conf-bar").style.background = confidence >= CFG.MIN_CONFIDENCE_DISPLAY ? "var(--blue-600)" : "var(--amber-600)";
      $("conf-text").textContent = pct + "%";
      $("conf-meter").setAttribute("aria-valuenow", String(pct));
    } else {
      wrap.hidden = true;
    }
    addBtn.disabled = !label;
  }

  function resetPrediction(message) {
    currentLabel = null;
    showPrediction(null, message || "");
  }

  /* ---------------- Camera ---------------- */
  async function startCamera() {
    showAlert("");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showAlert("This browser cannot access the camera. Use a recent Chrome, Edge or Firefox, and open the site over HTTPS or localhost.");
      return;
    }
    startBtn.disabled = true;
    setStatus("warn", "Waiting for permission…");
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }, audio: false
      });
    } catch (err) {
      startBtn.disabled = false;
      setStatus("err", "Camera unavailable");
      if (err && (err.name === "NotAllowedError" || err.name === "SecurityError")) {
        showAlert("Camera access was denied. Allow camera permission in your browser's address bar, then press Start camera again.");
      } else if (err && (err.name === "NotFoundError" || err.name === "OverconstrainedError")) {
        showAlert("No camera was found. Connect a webcam and try again.");
      } else if (err && err.name === "NotReadableError") {
        showAlert("The camera is being used by another app. Close it and try again.");
      } else {
        showAlert("Could not start the camera. " + (err && err.message ? err.message : ""));
      }
      return;
    }

    video.srcObject = stream;
    var ph = $("cam-placeholder");
    if (ph) {
      ph.hidden = true;
      ph.style.display = "none";
    }
    stopBtn.disabled = false;
    sessionStart = new Date();
    failures = 0;
    lastAutoAdded = null;

    // Detect a camera that gets unplugged while running.
    stream.getVideoTracks().forEach(function (track) {
      track.addEventListener("ended", function () {
        stopCamera();
        setStatus("err", "Camera disconnected");
        showAlert("The camera was disconnected. Reconnect it and press Start camera.");
      });
    });

    setStatus("live", "Camera on");
    document.getElementById("cam-box").classList.add("cam-active");
    resetPrediction("Show a hand sign to the camera.");
    timer = setInterval(tick, CFG.FRAME_INTERVAL_MS);
  }

  function stopCamera() {
    if (timer) { clearInterval(timer); timer = null; }
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    video.srcObject = null;
    document.getElementById("cam-box").classList.remove("cam-active");
    var ph = $("cam-placeholder");
    if (ph) {
      ph.hidden = false;
      ph.style.display = "";
    }
    startBtn.disabled = false;
    stopBtn.disabled = true;
    setStatus("", "Camera off");
    resetPrediction("Camera stopped.");
  }

  /* ---------------- Frame loop (throttled) ---------------- */
  function grabFrame() {
    return new Promise(function (resolve) {
      var w = CFG.FRAME_WIDTH;
      var ratio = video.videoHeight && video.videoWidth ? video.videoHeight / video.videoWidth : 0.75;
      canvas.width = w;
      canvas.height = Math.round(w * ratio);
      var ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve, "image/jpeg", CFG.JPEG_QUALITY);
    });
  }

  async function tick() {
    // Skip this tick if the previous request is still running or the video is not ready.
    if (inFlight || !stream || video.readyState < 2) return;
    inFlight = true;

    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, CFG.REQUEST_TIMEOUT_MS);
    try {
      var blob = await grabFrame();
      if (!blob) throw new Error("Could not read a frame.");
      var data = new FormData();
      data.append("frame", blob, "frame.jpg");
      var res = await SC.api("/api/predict", { method: "POST", body: data, signal: controller.signal });
      failures = 0;
      handleResult(res);
    } catch (err) {
      failures += 1;
      if (failures >= 3) {
        setStatus("err", "Server problem");
        resetPrediction(err.offline
          ? "Cannot reach the recognition server. Check that the backend is running."
          : "The server returned an error: " + err.message);
      }
    } finally {
      clearTimeout(timeout);
      inFlight = false;
    }
  }

  function handleResult(res) {
    if (!res || typeof res.status !== "string") {
      resetPrediction("Received an invalid response from the server.");
      setStatus("err", "Invalid response");
      return;
    }
    setStatus("live", "Camera on");

    switch (res.status) {
      case "ok":
        if (typeof res.label !== "string" || !res.label) { resetPrediction("Received an invalid response from the server."); return; }
        currentLabel = res.label;
        showPrediction(res.label, res.stable ? "Sign is steady." : "Hold the sign steady…",
          typeof res.confidence === "number" ? res.confidence : null);
        if (autoAdd.checked && res.stable && res.label !== lastAutoAdded) {
          lastAutoAdded = res.label;
          appendText(res.label);
        }
        break;
      case "no_hand":
        lastAutoAdded = null; // allow the same letter again after the hand leaves the frame
        resetPrediction("No hand detected. Place one hand in view.");
        break;
      case "low_confidence":
        if (res.label) {
          currentLabel = res.label;
          showPrediction(res.label, res.message || "Low confidence. Adjust hand angle or lighting.",
            typeof res.confidence === "number" ? res.confidence : null);
        } else {
          resetPrediction(res.message || "Not sure about this sign. Adjust your hand or lighting.");
        }
        break;
      default:
        resetPrediction(res.message || "Recognition error. Please try again.");
    }
  }

  /* ---------------- Sentence builder ---------------- */
  function appendText(text) {
    sentence.value += text;
    lettersAdded += text.trim() ? text.length : 0;
    sentence.scrollTop = sentence.scrollHeight;
  }

  addBtn.addEventListener("click", function () { if (currentLabel) appendText(currentLabel); });
  $("space-btn").addEventListener("click", function () { sentence.value += " "; });
  $("back-btn").addEventListener("click", function () { sentence.value = sentence.value.slice(0, -1); });
  $("clear-btn").addEventListener("click", function () { sentence.value = ""; });
  $("reset-btn").addEventListener("click", function () {
    sentence.value = ""; lastAutoAdded = null; lettersAdded = 0;
    cancelSpeech();
    resetPrediction(stream ? "Show a hand sign to the camera." : "Waiting for the camera.");
    sessionStart = stream ? new Date() : null;
  });

  $("copy-btn").addEventListener("click", async function () {
    var text = sentence.value.trim();
    if (!text) { SC.toast("Nothing to copy yet."); return; }
    try {
      await navigator.clipboard.writeText(text);
      SC.toast("Copied to clipboard.", "success");
    } catch (_) {
      sentence.select();
      var ok = document.execCommand && document.execCommand("copy");
      SC.toast(ok ? "Copied to clipboard." : "Copy failed. Select the text and copy it manually.", ok ? "success" : "error");
    }
  });

  /* ---------------- Text-to-speech (only when the user presses Speak) ---------------- */
  var speechSupported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  if (!speechSupported) {
    speakBtn.disabled = true;
    var note = $("speech-note");
    note.hidden = false;
    note.textContent = "Speech is not supported in this browser. You can still copy the text.";
  }

  function cancelSpeech() {
    if (speechSupported) window.speechSynthesis.cancel();
    stopSpeakBtn.disabled = true;
  }

  speakBtn.addEventListener("click", function () {
    var text = sentence.value.trim();
    if (!text) { SC.toast("Add some text first."); return; }
    cancelSpeech();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = "en-IN";
    u.onstart = function () { stopSpeakBtn.disabled = false; };
    u.onend = u.onerror = function () { stopSpeakBtn.disabled = true; };
    window.speechSynthesis.speak(u);
  });
  stopSpeakBtn.addEventListener("click", cancelSpeech);

  /* ---------------- Save session (user-confirmed text only) ---------------- */
  $("save-btn").addEventListener("click", async function () {
    var text = sentence.value.trim();
    if (!text) { SC.toast("There is no text to save."); return; }
    var seconds = sessionStart ? Math.round((Date.now() - sessionStart.getTime()) / 1000) : null;
    try {
      await SC.api("/api/history", { method: "POST", body: { recognized_text: text, duration: seconds, status: "completed" } });
      SC.toast("Session saved to your history.", "success");
    } catch (err) {
      if (err.status === 401) {
        SC.toast("Please log in to save your session.", "error");
      } else if (err.offline && CFG.UI_PREVIEW) {
        SC.toast("Preview mode: nothing was saved.");
      } else {
        SC.toast(err.offline ? "Cannot reach the server." : err.message, "error");
      }
    }
  });

  /* ---------------- Wire up ---------------- */
  startBtn.addEventListener("click", startCamera);
  stopBtn.addEventListener("click", stopCamera);
  window.addEventListener("beforeunload", function () {
    if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
    if (speechSupported) window.speechSynthesis.cancel();
  });
})();
