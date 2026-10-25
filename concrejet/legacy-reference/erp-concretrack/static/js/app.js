const BASE_PATH = "/concretrack";
const LOGIN_PAGE = `${BASE_PATH}/frontend/pages/login.html`;

function url(path) {
  return `${BASE_PATH}${path}`;
}

function go(path) {
  window.location.href = url(path);
}

async function loadFragment(targetId, fragmentPath) {
  try {
    const res = await fetch(`${BASE_PATH}${fragmentPath}`);
    const html = await res.text();
    const el = document.getElementById(targetId);
    if (el) el.innerHTML = html;
  } catch (err) {
    console.error("[loadFragment]", err);
  }
}

async function ensureAuth() {
  const pathname = window.location.pathname;
  const isLogin = pathname.endsWith("/login.html") || pathname.endsWith("/frontend/pages/login.html");
  if (!pathname.startsWith(`${BASE_PATH}/`) || isLogin) return true;
  try {
    const res = await fetch(`${BASE_PATH}/api/auth/me`, { credentials: "include", cache: "no-store" });
    if (res.status !== 200) {
      window.location.replace(LOGIN_PAGE);
      return false;
    }
    return true;
  } catch (err) {
    window.location.replace(LOGIN_PAGE);
    return false;
  }
}

function init() {
  ensureAuth();
}

document.addEventListener("DOMContentLoaded", init);

// Expondo no escopo global para uso em onclick e scripts inline
window.ct = { BASE_PATH, LOGIN_PAGE, url, go, loadFragment, ensureAuth };
window.go = go;
window.url = url;
window.loadFragment = loadFragment;
