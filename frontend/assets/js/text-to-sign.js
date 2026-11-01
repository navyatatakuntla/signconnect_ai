/*
 * SignConnect AI - Text & Speech to Indian Sign Language (ISL) Controller
 * Handles text parsing, Web Speech Recognition, playback engine,
 * genuine ISL image mapping, timeline navigation, and A-Z reference gallery.
 */
(function () {
  "use strict";

  // Alphabet A-Z
  var ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  var IMAGE_BASE = "assets/images/isl_alphabet/";

  // Preload cache for smooth instantaneous playback
  var imageCache = {};
  function preloadImages() {
    ALPHABET.forEach(function (char) {
      var img = new Image();
      img.src = IMAGE_BASE + char + ".jpg";
      imageCache[char] = img;
    });
  }

  // DOM Elements
  var textInput = document.getElementById("text-input");
  var translateBtn = document.getElementById("translate-btn");
  var micBtn = document.getElementById("mic-btn");
  var micBtnText = document.getElementById("mic-btn-text");
  var micStatusBox = document.getElementById("mic-status-box");
  var micStatusText = document.getElementById("mic-status-text");
  var micStopBtn = document.getElementById("mic-stop-btn");
  var clearBtn = document.getElementById("clear-btn");

  var signImage = document.getElementById("sign-image");
  var signImageWrapper = document.getElementById("sign-image-wrapper");
  var overlayChar = document.getElementById("overlay-char");
  var spaceIndicatorBox = document.getElementById("space-indicator-box");
  var emptyStateBox = document.getElementById("empty-state-box");
  var charCounter = document.getElementById("char-counter");

  var prevBtn = document.getElementById("prev-btn");
  var playPauseBtn = document.getElementById("play-pause-btn");
  var playBtnText = document.getElementById("play-btn-text");
  var nextBtn = document.getElementById("next-btn");
  var restartBtn = document.getElementById("restart-btn");
  var speedSlider = document.getElementById("speed-slider");
  var speedLabel = document.getElementById("speed-label");
  var loopToggle = document.getElementById("loop-toggle");

  var sequenceChips = document.getElementById("sequence-chips");
  var galleryToggleBtn = document.getElementById("gallery-toggle-btn");
  var galleryToggleHeader = document.getElementById("gallery-toggle-header");
  var alphabetGalleryBody = document.getElementById("alphabet-gallery-body");
  var alphabetGrid = document.getElementById("alphabet-grid");

  // Playback State
  var tokens = [];         // Array of parsed tokens: e.g. ['H', 'E', 'L', 'L', 'O', ' ', 'I', 'N', 'D', 'I', 'A']
  var currentIndex = -1;
  var isPlaying = false;
  var playTimer = null;
  var playbackSpeed = 1000; // ms per sign

  /* ---------------- Text Normalization & Tokenization ---------------- */
  function parseText(input) {
    if (!input || typeof input !== "string") return [];
    var upper = input.toUpperCase();
    var result = [];
    var lastWasSpace = true; // avoid leading spaces

    for (var i = 0; i < upper.length; i++) {
      var ch = upper[i];
      if (ch >= "A" && ch <= "Z") {
        result.push(ch);
        lastWasSpace = false;
      } else if (ch === " " || ch === "\t" || ch === "\n") {
        if (!lastWasSpace) {
          result.push(" ");
          lastWasSpace = true;
        }
      }
      // other characters (numbers, punctuation) are safely ignored
    }

    // Remove trailing space
    if (result.length > 0 && result[result.length - 1] === " ") {
      result.pop();
    }

    return result;
  }

  /* ---------------- Display & UI Rendering ---------------- */
  function renderTimeline() {
    if (!sequenceChips) return;
    sequenceChips.innerHTML = "";

    if (tokens.length === 0) {
      sequenceChips.innerHTML = '<span class="small muted" style="padding:6px 0">Characters will appear here...</span>';
      return;
    }

    tokens.forEach(function (char, idx) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "seq-chip" + (char === " " ? " seq-chip-space" : "") + (idx === currentIndex ? " active" : "");
      chip.setAttribute("data-index", idx);
      chip.title = char === " " ? "Space (Word Break)" : "Jump to " + char;

      if (char === " ") {
        chip.innerHTML = '<span class="seq-chip-char">␣</span>';
      } else {
        chip.innerHTML = '<span class="seq-chip-char">' + char + "</span>";
      }

      chip.addEventListener("click", function () {
        pause();
        showTokenAtIndex(idx);
      });

      sequenceChips.appendChild(chip);
    });

    scrollActiveChipIntoView();
  }

  function scrollActiveChipIntoView() {
    if (!sequenceChips) return;
    var activeChip = sequenceChips.querySelector(".seq-chip.active");
    if (activeChip) {
      activeChip.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }

  function updateControlsState() {
    var hasTokens = tokens.length > 0;
    playPauseBtn.disabled = !hasTokens;
    prevBtn.disabled = !hasTokens || currentIndex <= 0;
    nextBtn.disabled = !hasTokens || currentIndex >= tokens.length - 1;
    restartBtn.disabled = !hasTokens;

    if (playBtnText) {
      playBtnText.textContent = isPlaying ? "Pause" : "Play";
    }

    var playIcon = playPauseBtn.querySelector("i, svg");
    if (playIcon) {
      playIcon.replaceWith(document.createRange().createContextualFragment(
        window.SC && window.SC.icon ? window.SC.icon(isPlaying ? "pause" : "play") : ""
      ));
    }

    if (hasTokens && currentIndex >= 0 && currentIndex < tokens.length) {
      charCounter.textContent = "Sign " + (currentIndex + 1) + " of " + tokens.length;
    } else {
      charCounter.textContent = "Sign 0 of " + (tokens.length || 0);
    }

    // Update active class on chips
    if (sequenceChips) {
      var allChips = sequenceChips.querySelectorAll(".seq-chip");
      allChips.forEach(function (c, i) {
        if (i === currentIndex) {
          c.classList.add("active");
        } else {
          c.classList.remove("active");
        }
      });
      scrollActiveChipIntoView();
    }
  }

  function showTokenAtIndex(idx) {
    if (tokens.length === 0) {
      if (signImageWrapper) signImageWrapper.hidden = true;
      currentIndex = -1;
      updateControlsState();
      return;
    }

    if (idx < 0) idx = 0;
    if (idx >= tokens.length) idx = tokens.length - 1;

    currentIndex = idx;
    var token = tokens[idx];

    if (token === " ") {
      // Space Token: keep viewport clean, no wordspace box
      if (signImageWrapper) {
        signImageWrapper.style.visibility = "hidden";
      }
      if (overlayChar) overlayChar.textContent = "—";
    } else {
      // Alphabet Token: Show genuine ISL image
      if (signImageWrapper) {
        signImageWrapper.hidden = false;
        signImageWrapper.style.visibility = "visible";
      }
      if (signImage) {
        signImage.src = IMAGE_BASE + token + ".jpg";
        signImage.alt = "ISL Sign for letter " + token;
      }
      if (overlayChar) overlayChar.textContent = token;
    }

    updateControlsState();
  }

  /* ---------------- Playback Engine ---------------- */
  function scheduleNext() {
    if (!isPlaying) return;

    if (playTimer) {
      clearTimeout(playTimer);
      playTimer = null;
    }

    playTimer = setTimeout(function () {
      if (!isPlaying) return;

      if (currentIndex < tokens.length - 1) {
        showTokenAtIndex(currentIndex + 1);
        scheduleNext();
      } else {
        // Reached the end
        if (loopToggle && loopToggle.checked) {
          showTokenAtIndex(0);
          scheduleNext();
        } else {
          pause();
        }
      }
    }, playbackSpeed);
  }

  function play() {
    if (tokens.length === 0) {
      convertInput();
      if (tokens.length === 0) return;
    }

    isPlaying = true;

    // If at the end, restart from 0
    if (currentIndex >= tokens.length - 1) {
      showTokenAtIndex(0);
    } else if (currentIndex < 0) {
      showTokenAtIndex(0);
    }

    updateControlsState();
    scheduleNext();
  }

  function pause() {
    isPlaying = false;
    if (playTimer) {
      clearTimeout(playTimer);
      playTimer = null;
    }
    updateControlsState();
  }

  function togglePlayPause() {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }

  function stepNext() {
    pause();
    if (currentIndex < tokens.length - 1) {
      showTokenAtIndex(currentIndex + 1);
    }
  }

  function stepPrev() {
    pause();
    if (currentIndex > 0) {
      showTokenAtIndex(currentIndex - 1);
    }
  }

  function restart() {
    pause();
    if (tokens.length > 0) {
      showTokenAtIndex(0);
      play();
    }
  }

  /* ---------------- Input & Conversion ---------------- */
  function convertInput() {
    pause();
    var rawText = (textInput && textInput.value) || "";
    tokens = parseText(rawText);

    if (tokens.length === 0) {
      renderTimeline();
      showTokenAtIndex(-1);
      if (window.SC && window.SC.toast) {
        window.SC.toast("Please enter English words or letters A–Z.", "warn");
      }
      return;
    }

    renderTimeline();
    showTokenAtIndex(0);
    play();
  }

  /* ---------------- Web Speech Recognition ---------------- */
  var recognition = null;
  var isListening = false;

  function initSpeechRecognition() {
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (micBtn) {
        micBtn.title = "Speech recognition is not supported in this browser. Please use Chrome or Edge.";
      }
      return;
    }

    try {
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-IN"; // Default to English (India) / US fallback

      recognition.onstart = function () {
        isListening = true;
        if (micBtn) micBtn.classList.add("mic-active");
        if (micBtnText) micBtnText.textContent = "Listening...";
      };

      recognition.onresult = function (event) {
        var transcript = "";
        for (var i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }

        if (textInput && transcript) {
          textInput.value = transcript;
        }

        // Check if final
        if (event.results[0] && event.results[0].isFinal) {
          if (window.SC && window.SC.toast) {
            window.SC.toast("Speech recognized: \"" + transcript + "\"");
          }
          // Convert recognized speech automatically
          setTimeout(convertInput, 300);
        }
      };

      recognition.onerror = function (event) {
        console.warn("[TextToSign] Speech recognition error:", event.error);
        stopListening();
        var msg = "Microphone error: " + (event.error || "Could not recognize speech.");
        if (event.error === "not-allowed") {
          msg = "Microphone access was denied. Please allow microphone permissions in your browser.";
        }
        if (window.SC && window.SC.toast) {
          window.SC.toast(msg, "error");
        }
      };

      recognition.onend = function () {
        stopListening();
      };
    } catch (e) {
      console.warn("[TextToSign] Failed to initialize SpeechRecognition:", e);
    }
  }

  function startListening() {
    if (!recognition) {
      if (window.SC && window.SC.toast) {
        window.SC.toast("Speech recognition is not supported by your browser. Try Google Chrome or Microsoft Edge.", "error");
      }
      return;
    }

    try {
      recognition.start();
    } catch (e) {
      // If already started, stop then restart
      try {
        recognition.stop();
        setTimeout(function () { recognition.start(); }, 200);
      } catch (_) {}
    }
  }

  function stopListening() {
    isListening = false;
    if (micBtn) micBtn.classList.remove("mic-active");
    if (micBtnText) micBtnText.textContent = "Speak";
    if (recognition) {
      try { recognition.stop(); } catch (_) {}
    }
  }

  function toggleSpeech() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  /* ---------------- Alphabet Gallery (A–Z) ---------------- */
  function populateAlphabetGallery() {
    if (!alphabetGrid) return;
    alphabetGrid.innerHTML = "";

    ALPHABET.forEach(function (char) {
      var item = document.createElement("div");
      item.className = "alphabet-item";
      item.setAttribute("tabindex", "0");
      item.setAttribute("role", "button");
      item.setAttribute("aria-label", "Letter " + char);

      item.innerHTML =
        '<div class="alphabet-item-img-wrap">' +
        '<img src="' + IMAGE_BASE + char + '.jpg" alt="ISL ' + char + '" loading="lazy" width="72" height="72">' +
        '</div>' +
        '<div class="alphabet-item-char">' + char + '</div>';

      item.addEventListener("click", function () {
        // Preview clicked alphabet in main viewport
        pause();
        tokens = [char];
        if (textInput) textInput.value = char;
        renderTimeline();
        showTokenAtIndex(0);

        // Smooth scroll up to display if on mobile
        if (window.innerWidth < 800) {
          var viewport = document.getElementById("tts-viewport");
          if (viewport) viewport.scrollIntoView({ behavior: "smooth" });
        }
      });

      item.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          item.click();
        }
      });

      alphabetGrid.appendChild(item);
    });
  }

  /* ---------------- Keyboard Shortcuts ---------------- */
  function handleKeydown(e) {
    // If typing in input, don't intercept keys
    if (e.target === textInput || e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        convertInput();
      }
      return;
    }

    if (e.code === "Space") {
      e.preventDefault();
      togglePlayPause();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      stepPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      stepNext();
    }
  }

  /* ---------------- Initialization ---------------- */
  function init() {
    preloadImages();
    initSpeechRecognition();
    populateAlphabetGallery();

    // Event listeners
    if (translateBtn) translateBtn.addEventListener("click", convertInput);
    if (micBtn) micBtn.addEventListener("click", toggleSpeech);
    if (micStopBtn) micStopBtn.addEventListener("click", stopListening);

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        pause();
        if (textInput) textInput.value = "";
        tokens = [];
        renderTimeline();
        showTokenAtIndex(-1);
      });
    }

    if (playPauseBtn) playPauseBtn.addEventListener("click", togglePlayPause);
    if (prevBtn) prevBtn.addEventListener("click", stepPrev);
    if (nextBtn) nextBtn.addEventListener("click", stepNext);
    if (restartBtn) restartBtn.addEventListener("click", restart);

    // Speed Slider
    if (speedSlider) {
      playbackSpeed = parseInt(speedSlider.value, 10) || 1000;
      speedSlider.addEventListener("input", function () {
        playbackSpeed = parseInt(speedSlider.value, 10);
        if (speedLabel) {
          speedLabel.textContent = (playbackSpeed / 1000).toFixed(1) + "s";
        }
      });
    }

    // Sample buttons
    var sampleBtns = document.querySelectorAll(".sample-btn");
    sampleBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var sampleText = btn.getAttribute("data-sample");
        if (textInput && sampleText) {
          textInput.value = sampleText;
          convertInput();
        }
      });
    });

    // Gallery Collapse Toggle
    if (galleryToggleHeader) {
      galleryToggleHeader.addEventListener("click", function () {
        if (!alphabetGalleryBody) return;
        var isHidden = alphabetGalleryBody.hidden;
        alphabetGalleryBody.hidden = !isHidden;
        if (galleryToggleBtn) {
          galleryToggleBtn.textContent = isHidden ? "Hide Reference" : "Show Reference";
        }
      });
    }

    // Keyboard support
    document.addEventListener("keydown", handleKeydown);

    // Initial default: load "HELLO" into tokens and display initial sign
    if (textInput && !textInput.value) {
      textInput.value = "HELLO";
      tokens = parseText("HELLO");
      renderTimeline();
      showTokenAtIndex(0);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
