/*
 * Model evaluation page.
 * GET /api/model/evaluation ->
 * {
 *   available: true,
 *   dataset: { train: int, validation: int, test: int },
 *   classes: ["A","B",...],
 *   metrics: { accuracy, precision, recall, f1 },            // 0..1, from the test set
 *   per_class: [{ label, precision, recall, f1, support }],
 *   confusion_matrix: { labels: [...], matrix: [[int,...],...] },
 *   model: { type, trained_at, feature_count, library_versions, ... }   // any key/value pairs
 * }
 * When no model has been trained: { available: false }.
 */
(function () {
  "use strict";
  var SC = window.SC;
  var $ = function (id) { return document.getElementById(id); };

  function pct(v) { return typeof v === "number" ? (v * 100).toFixed(2) + "%" : "—"; }
  function num(v) { return typeof v === "number" ? v.toLocaleString() : "—"; }

  function showAlert(message) {
    var box = $("eval-alert");
    box.hidden = false;
    box.innerHTML = '<div class="notice notice-warn" role="alert">' + SC.icon("alert") + "<p>" + SC.escapeHtml(message) + "</p></div>";
  }

  function renderMatrix(cm) {
    var host = $("cm");
    if (!cm || !cm.labels || !cm.matrix) { host.innerHTML = '<p class="muted">Not available.</p>'; return; }
    var max = 0;
    cm.matrix.forEach(function (row) { row.forEach(function (v) { if (v > max) max = v; }); });
    var html = '<table class="cm"><thead><tr><th></th>';
    cm.labels.forEach(function (l) { html += "<th>" + SC.escapeHtml(l) + "</th>"; });
    html += "</tr></thead><tbody>";
    cm.matrix.forEach(function (row, i) {
      html += "<tr><th>" + SC.escapeHtml(cm.labels[i]) + "</th>";
      row.forEach(function (v, j) {
        var a = max ? v / max : 0;
        var bg = v === 0 ? "var(--ink-50)" : "rgba(37, 99, 235, " + (0.12 + a * 0.88).toFixed(2) + ")";
        var color = a > 0.55 ? "#fff" : "var(--ink-900)";
        var tip = "True " + cm.labels[i] + ", predicted " + cm.labels[j] + ": " + v;
        html += '<td style="background:' + bg + ";color:" + color + '" title="' + SC.escapeHtml(tip) + '">' + v + "</td>";
      });
      html += "</tr>";
    });
    host.innerHTML = html + "</tbody></table>";
  }

  function render(d) {
    $("eval-content").hidden = false;
    $("n-train").textContent = num(d.dataset && d.dataset.train);
    $("n-val").textContent = num(d.dataset && d.dataset.validation);
    $("n-test").textContent = num(d.dataset && d.dataset.test);
    $("n-classes").textContent = d.classes ? d.classes.length : "—";

    var m = d.metrics || {};
    $("m-acc").textContent = pct(m.accuracy);
    $("m-prec").textContent = pct(m.precision);
    $("m-rec").textContent = pct(m.recall);
    $("m-f1").textContent = pct(m.f1);

    var info = $("model-info");
    info.innerHTML = "";
    Object.keys(d.model || {}).forEach(function (k) {
      var v = d.model[k];
      if (v && typeof v === "object") v = JSON.stringify(v);
      info.insertAdjacentHTML("beforeend", "<dt>" + SC.escapeHtml(k.replace(/_/g, " ")) + "</dt><dd>" + SC.escapeHtml(v) + "</dd>");
    });
    if (!info.children.length) info.innerHTML = '<dt>Details</dt><dd>Not provided</dd>';

    $("class-list").innerHTML = (d.classes || []).map(function (c) {
      return '<span class="badge badge-blue">' + SC.escapeHtml(c) + "</span>";
    }).join("") || '<span class="muted">Not available.</span>';

    renderMatrix(d.confusion_matrix);

    var rows = (d.per_class || []).map(function (r) {
      return "<tr><td>" + SC.escapeHtml(r.label) + '</td><td class="num">' + pct(r.precision) + '</td><td class="num">' +
        pct(r.recall) + '</td><td class="num">' + pct(r.f1) + '</td><td class="num">' + num(r.support) + "</td></tr>";
    }).join("");
    $("report-body").innerHTML = rows || '<tr><td colspan="5" class="muted">Not available.</td></tr>';
  }

  var ADMIN_EMAIL = "navyatatakuntla99@gmail.com";

  async function init() {
    var user = null;
    try {
      user = await SC.requireAuth();
    } catch (err) {
      showAlert(err.offline ? "Cannot reach the server. Check that the backend is running." : err.message);
      $("eval-empty").hidden = false;
      return;
    }

    // Only admin user can view this page
    if (!user || user.email !== ADMIN_EMAIL) {
      window.location.href = "dashboard.html";
      return;
    }

    try {
      var data = await SC.api("/api/model/evaluation");
      if (!data || !data.available) { $("eval-empty").hidden = false; return; }
      render(data);
    } catch (err) {
      $("eval-empty").hidden = false;
      if (err.status === 403) {
        showAlert("Access denied. This page is restricted.");
      } else if (err.offline && SC.config.UI_PREVIEW) {
        showAlert("Preview mode: results appear here once the backend is connected and a model is trained.");
      } else {
        showAlert(err.offline ? "Cannot reach the server to load the evaluation." : err.message);
      }
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
