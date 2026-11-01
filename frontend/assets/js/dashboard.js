/*
 * Dashboard.
 * GET /api/auth/me            -> { user: { id, full_name, email } }
 * GET /api/dashboard/stats    -> { total_sessions, total_signs, recent: [history rows] }
 * History row: { id, recognized_text, created_at, duration, status }
 * Numbers always come from the backend. If unavailable, "—" is shown.
 */
(function () {
  "use strict";
  var SC = window.SC;

  var STATUS_BADGE = { completed: "badge-green", saved: "badge-green", partial: "badge-amber" };

  function showAlert(message) {
    var box = document.getElementById("dash-alert");
    box.hidden = false;
    box.innerHTML = '<div class="notice notice-warn" role="alert">' + SC.icon("alert") + "<p>" + SC.escapeHtml(message) + "</p></div>";
  }

  function renderRecent(rows) {
    var body = document.getElementById("recent-body");
    if (!rows || !rows.length) {
      body.innerHTML = '<div class="empty">' + SC.icon("inbox") +
        "<h3>No history yet</h3><p>Saved recognition sessions will appear here.</p>" +
        '<a class="btn btn-outline" href="recognize.html">Start your first session</a></div>';
      return;
    }
    var html = '<div class="table-wrap"><table class="table"><thead><tr><th>Text</th><th>Date</th><th class="num">Duration</th><th>Status</th></tr></thead><tbody>';
    rows.forEach(function (r) {
      var cls = STATUS_BADGE[r.status] || "badge-gray";
      html += "<tr><td>" + SC.escapeHtml(r.recognized_text) + "</td><td>" + SC.formatDate(r.created_at) +
        '</td><td class="num">' + SC.formatDuration(r.duration) + '</td><td><span class="badge ' + cls + '">' +
        SC.escapeHtml(r.status || "—") + "</span></td></tr>";
    });
    body.innerHTML = html + "</tbody></table></div>";
  }

  async function init() {
    renderRecent([]);
    var user = null;
    try {
      user = await SC.requireAuth();
    } catch (err) {
      showAlert(err.offline ? "Cannot reach the server. Check that the backend is running." : err.message);
      return;
    }

    if (user) {
      document.getElementById("welcome").textContent = "Welcome, " + user.full_name;
      document.getElementById("stat-account").textContent = user.email;
      // Hide Model Evaluation quick-nav link for non-admin users
      if (user.email !== SC.ADMIN_EMAIL) {
        var quickLinks = document.querySelectorAll("aside a.btn");
        quickLinks.forEach(function (a) {
          if (a.getAttribute("href") === "evaluation.html") a.style.display = "none";
        });
      }
    } else if (SC.config.UI_PREVIEW) {
      document.getElementById("welcome").textContent = "Welcome (preview)";
      document.getElementById("stat-account").textContent = "Preview mode";
      showAlert("Preview mode: statistics and history stay empty until the backend is connected.");
      return;
    }

    try {
      var stats = await SC.api("/api/dashboard/stats");
      document.getElementById("stat-sessions").textContent = stats.total_sessions;
      document.getElementById("stat-signs").textContent = stats.total_signs;
      renderRecent(stats.recent);
    } catch (err) {
      showAlert(err.offline ? "Cannot reach the server to load your statistics." : err.message);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
