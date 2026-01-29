(function () {
  function banner(msg) {
    let el = document.getElementById("apiErrorBanner");
    if (!el) {
      el = document.createElement("div");
      el.id = "apiErrorBanner";
      el.style.position = "fixed";
      el.style.top = "10px";
      el.style.left = "10px";
      el.style.right = "10px";
      el.style.zIndex = "9999";
      el.style.padding = "10px 12px";
      el.style.borderRadius = "10px";
      el.style.border = "1px solid rgba(255,0,0,0.35)";
      el.style.background = "rgba(255,0,0,0.10)";
      el.style.color = "#fff";
      el.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, Arial";
      el.style.fontSize = "14px";
      document.body.appendChild(el);
    }
    el.textContent = msg;
  }

  async function apiGet(path) {
    if (!window.EduForge || !window.EduForge.apiGet) {
      banner("EduForge API helper missing. Load eduforge_config.js + eduforge_auth.js first.");
      return null;
    }

    try {
      return await window.EduForge.apiGet(path, {
        requireAuth: true,
        loginRedirect: "../../auth/login.html",
      });
    } catch (e) {
      console.error("Institution apiGet failed:", e);
      banner("API error: " + (e && e.message ? e.message : "Unknown error"));
      return null;
    }
  }

  window.EDUFORGE = window.EDUFORGE || {};
  window.EDUFORGE.apiGet = apiGet;
})();
