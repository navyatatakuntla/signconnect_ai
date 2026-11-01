/*
 * Shared form helpers for login, register and feedback pages.
 */
(function () {
  "use strict";

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setError(form, name, message) {
    var input = form.elements[name];
    var slot = form.querySelector('[data-error-for="' + name + '"]');
    if (slot) slot.textContent = message || "";
    if (input) {
      input.classList.toggle("invalid", !!message);
      input.setAttribute("aria-invalid", message ? "true" : "false");
    }
  }

  function clearErrors(form) {
    Array.prototype.forEach.call(form.querySelectorAll("[data-error-for]"), function (el) {
      setError(form, el.getAttribute("data-error-for"), "");
    });
  }

  function showAlert(el, message, type) {
    if (!el) return;
    if (!message) { el.hidden = true; el.innerHTML = ""; return; }
    el.hidden = false;
    el.innerHTML = '<div class="notice notice-' + (type || "error") + '" role="alert">' +
      window.SC.icon(type === "success" ? "check" : "alert") +
      "<p>" + window.SC.escapeHtml(message) + "</p></div>";
  }

  function setBusy(button, busy, busyText) {
    if (!button) return;
    if (busy) {
      button.dataset.label = button.textContent;
      button.textContent = busyText || "Please wait…";
      button.disabled = true;
    } else {
      button.textContent = button.dataset.label || button.textContent;
      button.disabled = false;
    }
  }

  /** Show / hide password toggle buttons: <button class="pw-toggle" data-target="id"> */
  function initPasswordToggles() {
    document.querySelectorAll(".pw-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var input = document.getElementById(btn.getAttribute("data-target"));
        if (!input) return;
        var show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.textContent = show ? "Hide" : "Show";
        btn.setAttribute("aria-pressed", String(show));
      });
    });
  }

  /** Rough 0-4 password strength score for the meter (display only). */
  function passwordStrength(pw) {
    var score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }

  window.SCForms = {
    EMAIL_RE: EMAIL_RE, setError: setError, clearErrors: clearErrors,
    showAlert: showAlert, setBusy: setBusy,
    initPasswordToggles: initPasswordToggles, passwordStrength: passwordStrength
  };
})();
