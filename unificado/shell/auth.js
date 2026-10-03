const UNIFICADO_ROOT = new URL('../', document.currentScript.src);
const MAPA_API = new URL('mapa/api/', UNIFICADO_ROOT);
const requestedNext = new URLSearchParams(location.search).get('next');
const afterLogin = requestedNext === 'mapa/consulta/'
  ? new URL(requestedNext, UNIFICADO_ROOT)
  : new URL('mapa/', UNIFICADO_ROOT);

window.UnificadoAuth = Object.freeze({
  async me() {
    const response = await fetch(new URL('me', MAPA_API), { credentials: 'same-origin', cache: 'no-store' });
    return response.ok ? response.json() : null;
  },
  async logout() {
    await fetch(new URL('logout', MAPA_API), { method: 'POST', credentials: 'same-origin' });
    location.assign(new URL('login.html', UNIFICADO_ROOT));
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('unificado-login-form');
  if (!form) return;
  const feedback = document.getElementById('login-feedback');
  const button = form.querySelector('button[type="submit"]');
  const firstAccessForm = document.getElementById('first-access-form');
  let firstAccessToken = null;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    button.disabled = true;
    feedback.textContent = 'Verificando acesso…';
    try {
      const response = await fetch(new URL('login', MAPA_API), {
        method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.elements.username.value.trim(),
          password: form.elements.password.value
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'Não foi possível entrar.');
      if (result.user.primeiro_acesso) {
        firstAccessToken = result.first_access_token;
        form.hidden = true;
        firstAccessForm.hidden = false;
        feedback.textContent = 'Defina uma senha nova para o primeiro acesso.';
        return;
      }
      location.assign(afterLogin);
    } catch (error) {
      feedback.textContent = error.message || 'Falha de conexão.';
    } finally {
      form.elements.password.value = '';
      button.disabled = false;
    }
  });
  firstAccessForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = firstAccessForm.elements.newPassword.value;
    if (password !== firstAccessForm.elements.confirmPassword.value) {
      feedback.textContent = 'As senhas não coincidem.';
      return;
    }
    const submit = firstAccessForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      const response = await fetch(new URL('first-access', MAPA_API), {
        method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: firstAccessToken, password })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'Não foi possível atualizar a senha.');
      location.assign(afterLogin);
    } catch (error) {
      feedback.textContent = error.message || 'Falha de conexão.';
    } finally {
      firstAccessForm.reset();
      submit.disabled = false;
    }
  });
});
