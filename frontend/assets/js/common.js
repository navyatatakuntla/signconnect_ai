/*
 * SignConnect AI - shared helpers used by every page.
 * Provides: icons, header/footer rendering, API helper, toast, modal, auth guard.
 *
 * A page opts in with <body data-layout="public|app" data-page="home|about|...">
 * and two empty placeholders: <div id="site-header"></div> and <div id="site-footer"></div>.
 */
(function () {
  "use strict";

  var CFG = window.SC_CONFIG || {};

  /* ---------------- Icons (inline SVG, stroke style) ---------------- */
  var P = {
    camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    hand: '<path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-5.9-2.4L3.4 16a2 2 0 0 1 3.2-2.4L8 15"/>',
    speaker: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/>',
    brain: '<path d="M9.5 2A2.5 2.5 0 0 0 7 4.5v0A2.5 2.5 0 0 0 4.5 7a3 3 0 0 0-1 5.6A3 3 0 0 0 5 18a3 3 0 0 0 4.5 2.5V2z"/><path d="M14.5 2A2.5 2.5 0 0 1 17 4.5v0A2.5 2.5 0 0 1 19.5 7a3 3 0 0 1 1 5.6A3 3 0 0 1 19 18a3 3 0 0 1-4.5 2.5V2z"/>',
    text: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
    play: '<polygon points="5 3 19 12 5 21 5 3"/>',
    stop: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    backspace: '<path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
    refresh: '<polyline points="23 4 23 10 17 10"/><path d="M20.5 15a9 9 0 1 1-2.1-9.4L23 10"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.5 5.1L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    mic: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',
    pause: '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>',
    skipBack: '<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>',
    skipForward: '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>'
  };

  function icon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || "") + "</svg>";
  }

  /** Replace every <i data-icon="name"></i> inside root with its SVG. */
  function hydrateIcons(root) {
    (root || document).querySelectorAll("i[data-icon]").forEach(function (el) {
      var span = document.createElement("span");
      span.style.display = "contents";
      span.innerHTML = icon(el.getAttribute("data-icon"));
      el.replaceWith(span.firstChild);
    });
  }

  /* ---------------- Small utilities ---------------- */
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function formatDate(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function formatDuration(seconds) {
    if (seconds == null || isNaN(seconds)) return "—";
    var s = Math.round(seconds);
    var m = Math.floor(s / 60);
    return m > 0 ? m + "m " + (s % 60) + "s" : s + "s";
  }

  /* ---------------- Toast ---------------- */
  function toast(message, type) {
    var stack = document.getElementById("toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.id = "toast-stack";
      stack.className = "toast-stack";
      stack.setAttribute("role", "status");
      stack.setAttribute("aria-live", "polite");
      document.body.appendChild(stack);
    }
    var el = document.createElement("div");
    el.className = "toast " + (type || "");
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(function () { el.remove(); }, 3500);
  }

  /* ---------------- Confirm modal ---------------- */
  function confirmDialog(opts) {
    return new Promise(function (resolve) {
      var back = document.createElement("div");
      back.className = "modal-backdrop open";
      back.innerHTML =
        '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-title">' +
        '<h3 id="m-title">' + escapeHtml(opts.title || "Are you sure?") + "</h3>" +
        "<p>" + escapeHtml(opts.message || "") + "</p>" +
        '<div class="modal-actions">' +
        '<button class="btn btn-ghost" data-act="no">' + escapeHtml(opts.cancelText || "Cancel") + "</button>" +
        '<button class="btn ' + (opts.danger ? "btn-danger" : "btn-primary") + '" data-act="yes">' + escapeHtml(opts.confirmText || "Confirm") + "</button>" +
        "</div></div>";
      function close(v) { back.remove(); document.removeEventListener("keydown", onKey); resolve(v); }
      function onKey(e) { if (e.key === "Escape") close(false); }
      back.addEventListener("click", function (e) {
        var act = e.target.getAttribute && e.target.getAttribute("data-act");
        if (act === "yes") close(true);
        else if (act === "no" || e.target === back) close(false);
      });
      document.addEventListener("keydown", onKey);
      document.body.appendChild(back);
      back.querySelector('[data-act="no"]').focus();
    });
  }

  /* ---------------- API helper ----------------
   * All calls go to API_BASE + path with cookies (session auth).
   * Throws an Error with: .status (HTTP code or 0), .offline (true if the
   * server could not be reached), .data (parsed JSON body if any).
   */
  var csrfToken = null;

  function apiUrl(path) {
    return (CFG.API_BASE || "") + path;
  }

  async function getCsrf() {
    if (csrfToken) return csrfToken;
    var res = await fetch(apiUrl("/api/csrf"), { credentials: "include" });
    var data = await res.json();
    csrfToken = data.csrf_token;
    return csrfToken;
  }

  async function api(path, options) {
    options = options || {};
    var method = (options.method || "GET").toUpperCase();
    var headers = Object.assign({}, options.headers || {});
    var body = options.body;

    try {
      if (method !== "GET" && method !== "HEAD") {
        headers["X-CSRF-Token"] = await getCsrf();
      }
      if (body && !(body instanceof FormData) && typeof body === "object") {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(body);
      }
      var res = await fetch(apiUrl(path), {
        method: method, headers: headers, body: body,
        credentials: "include", signal: options.signal
      });
    } catch (err) {
      var e = new Error(err && err.name === "AbortError" ? "The request timed out." : "Cannot reach the server.");
      e.offline = true; e.status = 0; e.aborted = err && err.name === "AbortError";
      throw e;
    }

    var data = null;
    try { data = await res.json(); } catch (_) { /* non-JSON body */ }
    if (!res.ok) {
      var er = new Error((data && (data.error || data.message)) || "Request failed (" + res.status + ").");
      er.status = res.status; er.data = data; er.offline = false;
      throw er;
    }
    return data;
  }

  /* ---------------- Header / footer ---------------- */
  var PUBLIC_LINKS = [
    { id: "home", label: "Home", href: "index.html" },
    { id: "about", label: "About", href: "about.html" },
    { id: "dashboard", label: "Dashboard", href: "dashboard.html" },
    { id: "recognize", label: "Recognition", href: "recognize.html" },
    { id: "text-to-sign", label: "Text to Sign", href: "text-to-sign.html" },
    { id: "contact", label: "Contact", href: "about.html#contact" }
  ];
  var APP_LINKS = [
    { id: "dashboard", label: "Dashboard", href: "dashboard.html" },
    { id: "recognize", label: "Recognize", href: "recognize.html" },
    { id: "text-to-sign", label: "Text to Sign", href: "text-to-sign.html" },
    { id: "history", label: "History", href: "history.html" },
    { id: "evaluation", label: "Model Evaluation", href: "evaluation.html" },
    { id: "about", label: "About", href: "about.html" }
  ];

  function renderHeader() {
    var host = document.getElementById("site-header");
    if (!host) return;
    var layout = document.body.getAttribute("data-layout") || "public";
    var page = document.body.getAttribute("data-page") || "";
    var links = layout === "app" ? APP_LINKS : PUBLIC_LINKS;

    var items = links.map(function (l) {
      var active = l.id === page ? ' class="active" aria-current="page"' : "";
      return '<li><a href="' + l.href + '"' + active + ">" + l.label + "</a></li>";
    }).join("");

    if (layout === "app") {
      items += '<li><a href="#" id="logout-link">Log out</a></li>';
    } else {
      items += '<li><a href="login.html"' + (page === "login" ? ' class="active"' : "") + ">Login</a></li>";
      items += '<li class="nav-cta"><a href="register.html">Register</a></li>';
    }

    var banner = CFG.UI_PREVIEW
      ? '<div class="preview-banner">UI preview mode — no backend connected. Set <code>UI_PREVIEW: false</code> in <code>assets/js/config.js</code> when the backend is ready.</div>'
      : "";

    host.innerHTML =
      banner +
      '<header class="site-header"><div class="container nav">' +
      '<a class="brand" href="' + (layout === "app" ? "dashboard.html" : "index.html") + '">' +
      '<img src="assets/images/logo.svg" alt="" width="34" height="34"><span>SignConnect <b>AI</b></span></a>' +
      '<button class="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="nav-links">' + icon("menu") + "</button>" +
      '<ul class="nav-links" id="nav-links">' + items + "</ul></div></header>";

    var toggle = host.querySelector(".nav-toggle");
    var list = host.querySelector(".nav-links");
    toggle.addEventListener("click", function () {
      var open = list.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    var logout = document.getElementById("logout-link");
    if (logout) {
      logout.addEventListener("click", async function (e) {
        e.preventDefault();
        try { await api("/api/auth/logout", { method: "POST" }); } catch (_) { /* leave anyway */ }
        window.location.href = "login.html";
      });
    }
  }

  function renderFooter() {
    var host = document.getElementById("site-footer");
    if (!host) return;
    host.innerHTML =
      '<footer class="site-footer"><div class="container">' +
      '<div class="footer-grid">' +
      '<div><a class="brand" href="index.html" style="color:#fff"><img src="assets/images/logo.svg" alt="" width="34" height="34"><span>SignConnect <b style="color:#60a5fa">AI</b></span></a>' +
      "<p style=\"margin-top:12px\">AI-based Indian Sign Language recognition and communication assistance.</p></div>" +
      '<div><h4>Explore</h4><ul><li><a href="index.html">Home</a></li><li><a href="about.html">About</a></li><li><a href="recognize.html">Recognition</a></li><li><a href="text-to-sign.html">Text to Sign</a></li><li><a href="evaluation.html">Model Evaluation</a></li></ul></div>' +
      '<div><h4>Account</h4><ul><li><a href="login.html">Login</a></li><li><a href="register.html">Register</a></li><li><a href="dashboard.html">Dashboard</a></li><li><a href="about.html#contact">Feedback</a></li></ul></div>' +
      "</div>" +
      '<div class="footer-bottom">Version 1 recognizes supported static hand signs (alphabet) only. It is not a complete sign language translator. &copy; ' + new Date().getFullYear() + " SignConnect AI.</div>" +
      "</div></footer>";
  }

  /* ---------------- Auth guard for app pages ----------------
   * Resolves with the user object, or null in preview mode / offline.
   * In real mode, redirects to login when not signed in.
   */
  var ADMIN_EMAIL = "navyatatakuntla99@gmail.com";

  /** Remove the "Model Evaluation" nav link if the user is not the admin. */
  function hideEvalNav(user) {
    if (user && user.email === ADMIN_EMAIL) return; // admin keeps the link
    var links = document.querySelectorAll("#nav-links a");
    links.forEach(function (a) {
      if (a.getAttribute("href") === "evaluation.html") {
        a.parentElement.remove();
      }
    });
  }

  async function requireAuth() {
    try {
      var data = await api("/api/auth/me");
      var user = data && data.user ? data.user : null;
      hideEvalNav(user);
      return user;
    } catch (err) {
      if (CFG.UI_PREVIEW) return null;
      if (err.status === 401) { window.location.href = "login.html"; return new Promise(function () {}); }
      throw err; // offline or server error: let the page show its own message
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderHeader();
    renderFooter();
    hydrateIcons(document);
  });

  window.SC = {
    icon: icon, hydrateIcons: hydrateIcons, escapeHtml: escapeHtml,
    formatDate: formatDate, formatDuration: formatDuration,
    toast: toast, confirmDialog: confirmDialog, api: api,
    requireAuth: requireAuth, hideEvalNav: hideEvalNav,
    ADMIN_EMAIL: ADMIN_EMAIL, config: CFG
  };
})();
