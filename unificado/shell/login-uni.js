/* Optional convenience stores a username only; authentication stays in auth.js. */
(() => {
  const form = document.getElementById('unificado-login-form');
  if (!form) return;
  const username = form.elements.username;
  const password = form.elements.password;
  const remember = document.getElementById('login-remember-username');
  const feedback = document.getElementById('login-feedback');
  const caps = document.getElementById('login-caps-lock');
  const key = 'unificado_remember_username';
  try {
    const saved = localStorage.getItem(key);
    remember.checked = saved !== null;
    if (saved !== null) username.value = saved;
  } catch { /* Storage is optional. */ }
  const persist = () => {
    try {
      if (remember.checked) localStorage.setItem(key, username.value.trim());
      else localStorage.removeItem(key);
    } catch { /* Storage is optional. */ }
  };
  remember.addEventListener('change', persist);
  username.addEventListener('input', persist);
  form.addEventListener('submit', persist);
  const capsState = event => { caps.hidden = !(document.activeElement === password && event.getModifierState?.('CapsLock')); };
  password.addEventListener('keydown', capsState);
  password.addEventListener('keyup', capsState);
  password.addEventListener('blur', () => { caps.hidden = true; });
  password.addEventListener('input', () => { password.removeAttribute('aria-invalid'); });
  window.UnificadoLoginUI = Object.freeze({
    feedback(text, error = false) {
      feedback.textContent = text;
      feedback.hidden = !text;
      feedback.dataset.kind = error ? 'error' : 'status';
      feedback.setAttribute('role', error ? 'alert' : 'status');
      feedback.setAttribute('aria-live', error ? 'assertive' : 'polite');
      if (error) password.setAttribute('aria-invalid', 'true');
      else password.removeAttribute('aria-invalid');
    }
  });
  fetch(new URL('aviso.json', document.currentScript.src), {cache:'no-store', credentials:'same-origin'})
    .then(response => response.ok ? response.json() : null)
    .then(notice => {
      if (!notice || notice.ativo !== true) return;
      if (notice.ate != null && (!Number.isFinite(Date.parse(notice.ate)) || Date.parse(notice.ate) <= Date.now())) return;
      const box = document.getElementById('login-notice');
      box.querySelector('strong').textContent = typeof notice.titulo === 'string' ? notice.titulo : '';
      box.querySelector('span').textContent = typeof notice.texto === 'string' ? notice.texto : '';
      box.hidden = false;
    }).catch(() => { /* Missing/unavailable notices never block login. */ });
})();
