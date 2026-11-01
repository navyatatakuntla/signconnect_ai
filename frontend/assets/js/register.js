/*
 * Registration page.
 * Sends POST /api/auth/register { full_name, email, password, confirm_password }.
 * The server must also validate everything again and hash the password.
 * Duplicate email -> HTTP 409 with { error: "..." }.
 */
(function () {
  "use strict";
  var F = window.SCForms, SC = window.SC;
  var form = document.getElementById("register-form");
  var alertBox = document.getElementById("register-alert");
  var bar = document.getElementById("strength-bar");
  F.initPasswordToggles();

  var COLORS = ["#ef4444", "#f59e0b", "#eab308", "#22c55e", "#16a34a"];
  form.elements.password.addEventListener("input", function () {
    var pw = form.elements.password.value;
    var score = pw ? F.passwordStrength(pw) : 0;
    bar.style.width = pw ? (score / 4) * 100 + "%" : "0";
    bar.style.background = COLORS[score];
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    F.clearErrors(form);
    F.showAlert(alertBox, "");

    var fullName = form.elements.full_name.value.trim();
    var email = form.elements.email.value.trim();
    var password = form.elements.password.value;
    var confirm = form.elements.confirm_password.value;
    var ok = true;

    if (fullName.length < 2) { F.setError(form, "full_name", "Please enter your full name."); ok = false; }
    if (!email) { F.setError(form, "email", "Please enter your email."); ok = false; }
    else if (!F.EMAIL_RE.test(email)) { F.setError(form, "email", "Enter a valid email address."); ok = false; }
    if (password.length < 8) { F.setError(form, "password", "Password must be at least 8 characters."); ok = false; }
    else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) { F.setError(form, "password", "Use both letters and at least one number."); ok = false; }
    if (!confirm) { F.setError(form, "confirm_password", "Please confirm your password."); ok = false; }
    else if (confirm !== password) { F.setError(form, "confirm_password", "Passwords do not match."); ok = false; }
    if (!ok) return;

    var btn = form.querySelector('button[type="submit"]');
    F.setBusy(btn, true, "Creating account…");
    try {
      await SC.api("/api/auth/register", {
        method: "POST",
        body: { full_name: fullName, email: email, password: password, confirm_password: confirm }
      });
      SC.toast("Account created. Please log in.", "success");
      setTimeout(function () { window.location.href = "login.html"; }, 800);
    } catch (err) {
      if (err.offline && SC.config.UI_PREVIEW) {
        F.showAlert(alertBox, "Preview mode: the backend is not connected, so no account was created. The form checks passed.", "info");
      } else if (err.offline) {
        F.showAlert(alertBox, "Cannot reach the server. Check that the backend is running and try again.");
      } else if (err.status === 409) {
        F.setError(form, "email", "An account with this email already exists.");
      } else if (err.data && err.data.fields) {
        Object.keys(err.data.fields).forEach(function (k) { F.setError(form, k, err.data.fields[k]); });
      } else {
        F.showAlert(alertBox, err.message);
      }
    } finally {
      F.setBusy(btn, false);
    }
  });
})();
