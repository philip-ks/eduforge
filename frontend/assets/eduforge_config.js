/* EduForge Frontend Config (global)
   - API base is overrideable via localStorage "eduforge_api_base"
   - Token stored in localStorage "token"
*/
(function () {
  // IMPORTANT: Use localhost (NOT 127.0.0.1) to avoid proxy/bypass issues in browsers
  const DEFAULT_API_BASE = "http://localhost:4000/api";

  const API_BASE_KEY = "eduforge_api_base";
  const TOKEN_KEY = "token";

  const storedApiBase =
    typeof localStorage !== "undefined" ? localStorage.getItem(API_BASE_KEY) : null;

  window.EduForgeConfig = {
    DEFAULT_API_BASE,
    API_BASE_KEY,
    TOKEN_KEY,
    API_BASE: storedApiBase && storedApiBase.trim() ? storedApiBase.trim() : DEFAULT_API_BASE,
  };
})();
