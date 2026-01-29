/* EduForge Auth + API helper (global)
   Depends on window.EduForgeConfig (load eduforge_config.js first)
*/
(function () {
  if (!window.EduForgeConfig) {
    console.error("EduForgeConfig missing. Load eduforge_config.js before eduforge_auth.js");
  }

  const cfg = window.EduForgeConfig || {
    API_BASE: "http://127.0.0.1:4000/api",
    TOKEN_KEY: "token",
    API_BASE_KEY: "eduforge_api_base",
    DEFAULT_API_BASE: "http://127.0.0.1:4000/api",
  };

  function safeTrim(s) {
    return typeof s === "string" ? s.trim() : "";
  }

  function getToken() {
    try {
      return safeTrim(localStorage.getItem(cfg.TOKEN_KEY));
    } catch {
      return "";
    }
  }

  function setToken(token) {
    try {
      localStorage.setItem(cfg.TOKEN_KEY, safeTrim(token));
    } catch {}
  }

  function clearToken() {
    try {
      localStorage.removeItem(cfg.TOKEN_KEY);
    } catch {}
  }

  function getApiBase() {
    return cfg.API_BASE;
  }

  function setApiBase(apiBase) {
    const v = safeTrim(apiBase);
    if (!v) return;
    try {
      localStorage.setItem(cfg.API_BASE_KEY, v);
    } catch {}
    cfg.API_BASE = v;
    if (window.EduForgeConfig) window.EduForgeConfig.API_BASE = v;
  }

  function requireTokenOrRedirect(loginPathRelative) {
    const token = getToken();
    if (!token) {
      if (loginPathRelative) window.location.href = loginPathRelative;
      return null;
    }
    return token;
  }

  function logout(loginPathRelative) {
    clearToken();
    if (loginPathRelative) window.location.href = loginPathRelative;
  }

  async function apiFetch(path, options, opts) {
    const o = options || {};
    const extra = opts || {};

    const token = getToken();
    if (!token && extra.requireAuth) {
      if (extra.loginRedirect) window.location.href = extra.loginRedirect;
      throw new Error("Missing auth token");
    }

    const url = getApiBase() + path;

    const headers = Object.assign({}, o.headers || {});
    if (token) headers["Authorization"] = "Bearer " + token;

    let res;
    try {
      res = await fetch(url, Object.assign({}, o, { headers }));
    } catch (e) {
      const err = new Error("Network error calling " + url);
      err.cause = e;
      throw err;
    }

    if (res.status === 401) {
      clearToken();
      if (extra.loginRedirect) {
        window.location.href = extra.loginRedirect;
        return null;
      }
      throw new Error("Unauthorized (401)");
    }

    if (res.status === 403) {
      // keep token, but surface message
      const err = new Error("Forbidden (403)");
      err.status = 403;
      throw err;
    }

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (!res.ok) {
      if (isJson) {
        const errJson = await res.json().catch(() => null);
        const msg =
          errJson && (errJson.error || errJson.message)
            ? errJson.error || errJson.message
            : "Request failed";
        const e = new Error(msg);
        e.details = errJson;
        e.status = res.status;
        throw e;
      } else {
        const errText = await res.text().catch(() => "");
        const e = new Error(errText || `Request failed (${res.status})`);
        e.status = res.status;
        throw e;
      }
    }

    if (res.status === 204) return null;
    if (isJson) return await res.json();
    return await res.text();
  }

  async function apiGet(path, opts) {
    return apiFetch(path, { method: "GET" }, opts);
  }

  async function apiPost(path, body, opts) {
    return apiFetch(
      path,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
      },
      opts
    );
  }

  async function apiPatch(path, body, opts) {
    return apiFetch(
      path,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
      },
      opts
    );
  }

  window.EduForge = {
    config: cfg,
    getApiBase,
    setApiBase,
    getToken,
    setToken,
    clearToken,
    requireTokenOrRedirect,
    logout,
    apiFetch,
    apiGet,
    apiPost,
    apiPatch,
  };
})();
