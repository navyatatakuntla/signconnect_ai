/*
 * History page.
 * GET    /api/history -> { items: [{ id, recognized_text, created_at, duration, status }] }
 * DELETE /api/history -> clears only the logged-in user's records (after confirmation).
 */
(function () {
  "use strict";
  var SC = window.SC;
  var clearBtn = document.getElementById("clear-btn");
  var body = document.getElementById("hist-body");

  var STATUS_BADGE = { completed: "badge-green", saved: "badge-green", partial: "badge-amber" };

  function showAlert(message, type) {
    var box = document.getElementById("hist-alert");
    if (!message) { box.hidden = true; box.innerHTML = ""; return; }
    box.hidden = false;
    box.innerHTML = '<div class="notice notice-' + (type || "warn") + '" role="alert">' + SC.icon("alert") + "<p>" + SC.escapeHtml(message) + "</p></div>";
  }

  function render(items) {
    clearBtn.disabled = !items.length;
    if (!items.length) {
      body.innerHTML = '<div class="card empty">' + SC.icon("inbox") +
        "<h3>Your history is empty</h3><p>Save a session from the recognition page and it will show up here.</p>" +
        '<a class="btn btn-primary" href="recognize.html">Start Recognition</a></div>';
      return;
    }
    var html = '<div class="table-wrap"><table class="table"><thead><tr><th>Recognized text</th><th>Date and time</th><th class="num">Duration</th><th>Status</th></tr></thead><tbody>';
    items.forEach(function (r) {
      var cls = STATUS_BADGE[r.status] || "badge-gray";
      html += "<tr><td>" + SC.escapeHtml(r.recognized_text) + "</td><td>" + SC.formatDate(r.created_at) +
        '</td><td class="num">' + SC.formatDuration(r.duration) + '</td><td><span class="badge ' + cls + '">' +
        SC.escapeHtml(r.status || "—") + "</span></td></tr>";
    });
    body.innerHTML = html + "</tbody></table></div>";
  }

  async function load() {
    render([]);
    try {
      await SC.requireAuth();
    } catch (err) {
      showAlert(err.offline ? "Cannot reach the server. Check that the backend is running." : err.message);
      return;
    }
    try {
      var data = await SC.api("/api/history");
      render(data.items || []);
    } catch (err) {
      if (err.offline && SC.config.UI_PREVIEW) {
        showAlert("Preview mode: history stays empty until the backend is connected.");
      } else {
        showAlert(err.offline ? "Cannot reach the server to load your history." : err.message);
      }
    }
  }

  clearBtn.addEventListener("click", async function () {
    var yes = await SC.confirmDialog({
      title: "Clear all history?",
      message: "This permanently deletes all of your saved recognition sessions. This cannot be undone.",
      confirmText: "Yes, clear it", danger: true
    });
    if (!yes) return;
    try {
      await SC.api("/api/history", { method: "DELETE" });
      render([]);
      SC.toast("History cleared.", "success");
    } catch (err) {
      SC.toast(err.offline ? "Cannot reach the server." : err.message, "error");
    }
  });

  document.addEventListener("DOMContentLoaded", load);
})();
