/**
 * API URL helper — avoids broken URLs like /api/api/... or /api/
 *
 * Same tab as Node (any port): returns "/api/..." (relative to current site).
 * Live Server 5500/5501: "http://<host>:5000/api/..."
 * file://: "http://localhost:5000/api/..."
 *
 * Optional override (origin only, no /api): localStorage.setItem("API_ORIGIN", "http://127.0.0.1:5000")
 */
(function () {
  function apiOriginOnly() {
    try {
      var manual = localStorage.getItem("API_ORIGIN");
      if (manual && manual.trim()) {
        return manual.trim().replace(/\/+$/, "").replace(/\/api$/i, "");
      }
    } catch (e) {}

    var pr = window.location.protocol;
    if (pr !== "http:" && pr !== "https:") {
      return "http://localhost:5000";
    }

    var po = String(window.location.port || "");
    if (po === "5500" || po === "5501") {
      var h = window.location.hostname || "localhost";
      return pr + "//" + h + ":5000";
    }

    return window.location.origin;
  }

  window.buildApiUrl = function (pathnameAndQuery) {
    var path = pathnameAndQuery || "/";
    if (path.charAt(0) !== "/") path = "/" + path;

    var pr = window.location.protocol;
    if (pr !== "http:" && pr !== "https:") {
      return "http://localhost:5000" + path;
    }

    var po = String(window.location.port || "");
    if (po === "5500" || po === "5501") {
      var h = window.location.hostname || "localhost";
      return pr + "//" + h + ":5000" + path;
    }

    try {
      var manual = localStorage.getItem("API_ORIGIN");
      if (manual && manual.trim()) {
        var base = manual.trim().replace(/\/+$/, "").replace(/\/api$/i, "");
        return base + path;
      }
    } catch (e2) {}

    return path;
  };

  /** Always use for analytics — never produces a bare /api/ URL */
  window.getAnalyticsApiUrl = function (queryString) {
    var qs = queryString || "";
    var origin = apiOriginOnly();
    return origin + "/api/analytics" + (qs ? "?" + qs : "");
  };
})();
