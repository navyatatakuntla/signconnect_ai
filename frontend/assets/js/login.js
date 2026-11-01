/*
 * Login page.
 * Sends POST /api/auth/login { email, password }.
 * Success response: { user: { id, full_name, email } } and a session cookie.
 */
(function () {
  "use strict";
  var F = window.SCForms, SC = window.SC;
  var form = document.getElementById("login-form");
  var alertBox = document.getElementById("login-alert");
  F.initPasswordToggles();

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    F.clearErrors(form);
    F.showAlert(alertBox, "");

    var email = form.elements.email.value.trim();
    var password = form.elements.password.value;
    var ok = true;

    if (!email) { F.setError(form, "email", "Please enter your email."); ok = false; }
    else if (!F.EMAIL_RE.test(email)) { F.setError(form, "email", "Enter a valid email address."); ok = false; }
    if (!password) { F.setError(form, "password", "Please enter your password."); ok = false; }
    if (!ok) return;

    var btn = form.querySelector('button[type="submit"]');
    F.setBusy(btn, true, "Logging in…");
    try {
      await SC.api("/api/auth/login", { method: "POST", body: { email: email, password: password } });
      window.location.href = "dashboard.html";
    } catch (err) {
      if (err.offline && SC.config.UI_PREVIEW) {
        F.showAlert(alertBox, "Preview mode: the backend is not connected, so login is skipped. You can open the dashboard to review the layout.", "info");
        alertBox.innerHTML += '<p style="margin-top:8px"><a class="btn btn-outline btn-sm" href="dashboard.html">Open dashboard (preview)</a></p>';
      } else if (err.offline) {
        F.showAlert(alertBox, "Cannot reach the server. Check that the backend is running and try again.");
      } else if (err.status === 401) {
        F.showAlert(alertBox, "Incorrect email or password.");
      } else {
        F.showAlert(alertBox, err.message);
      }
    } finally {
      F.setBusy(btn, false);
    }
  });
})();
