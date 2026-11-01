/*
 * Feedback form on about.html.
 * Sends POST /api/feedback { name, feedback }
 * The backend stores and emails the feedback to navyatatakuntla99@gmail.com.
 */
(function () {
  "use strict";
  var form = document.getElementById("feedback-form");
  if (!form) return;
  var alertBox = document.getElementById("fb-alert");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    window.SCForms.clearErrors(form);
    window.SCForms.showAlert(alertBox, "");

    var name = form.elements.name.value.trim();
    var feedback = form.elements.feedback.value.trim();
    var ok = true;

    if (!name) { window.SCForms.setError(form, "name", "Please enter your name."); ok = false; }
    if (feedback.length < 5) { window.SCForms.setError(form, "feedback", "Please write at least 5 characters."); ok = false; }
    if (!ok) return;

    var btn = form.querySelector('button[type="submit"]');
    window.SCForms.setBusy(btn, true, "Sending…");
    try {
      await window.SC.api("/api/feedback", { method: "POST", body: { name: name, feedback: feedback } });
      form.reset();
      window.SC.toast("Thank you! Your feedback was sent.", "success");
    } catch (err) {
      window.SCForms.showAlert(alertBox, err.offline
        ? "Cannot reach the server right now. Please try again later."
        : err.message);
    } finally {
      window.SCForms.setBusy(btn, false);
    }
  });
})();
