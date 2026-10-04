const UNIFICADO_ROOT = new URL('../', document.currentScript.src);
const MAPA_API = new URL('mapa/api/', UNIFICADO_ROOT);
const requestedNext = new URLSearchParams(location.search).get('next');

function destination(modules) {
  const allowed = new Set(['mapa/consulta/', 'mapa/operacao/', 'testar/']);
  const pcpPages = new Set(['acompanhamento-mensal','acompanhamento-mensal-setor-34',
    'apontamento-mega','comparacao','dashboard','etiquetas','etiquetas-armaduras',
    'etiquetas-sc','formas-por-setor','maodeobra','maodeobra-rateio','pcp-diario',
    'primeiro-acesso','producao','programacao','programacao-alex',
    'programacao-circular-s3','programacao-circular-s4','programacao-final',
    'relatorio-producao','relatorio-programacao-s3','relatorio-programacao-s4',
    'teste-programacao','usuarios']);
  if (requestedNext === 'testar/') return new URL(requestedNext, UNIFICADO_ROOT);
  if (modules.includes('mapa') && allowed.has(requestedNext)) return new URL(requestedNext, UNIFICADO_ROOT);
  if (modules.includes('pcp') && (requestedNext === 'pcp/' ||
      pcpPages.has((requestedNext || '').match(/^pcp\/([^/?]+)\/$/)?.[1]))) {
    return new URL(requestedNext, UNIFICADO_ROOT);
  }
  if (modules.includes('mapa') && /^mapa\/operacao\/\?tela=[A-Z0-9_]+$/.test(requestedNext || '')) {
    return new URL(requestedNext, UNIFICADO_ROOT);
  }
  return new URL(modules.includes('pcp') ? 'pcp/' : 'mapa/', UNIFICADO_ROOT);
}

function storeModuleSessions(result) {
  if (result.pcp?.access_token && result.pcp?.usuario) {
    localStorage.setItem('pcp_token', result.pcp.access_token);
    localStorage.setItem('pcp_user', JSON.stringify(result.pcp.usuario));
  }
  if (result.mapa?.id && result.mapa?.role) {
    localStorage.setItem('pwa_mapa_auth_session_v1', JSON.stringify({
      id: result.mapa.id, name: result.mapa.name, role: result.mapa.role,
      setor: result.mapa.setor || 'Todos'
    }));
  }
}

window.UnificadoAuth = Object.freeze({
  async me() {
    const response = await fetch(new URL('me', MAPA_API), {
      credentials: 'same-origin', cache: 'no-store'
    });
    return response.ok ? response.json() : null;
  },
  async logout() {
    localStorage.removeItem('pcp_token');
    localStorage.removeItem('pcp_user');
    localStorage.removeItem('pwa_mapa_auth_session_v1');
    await fetch(new URL('logout', MAPA_API), {
      method: 'POST', credentials: 'same-origin'
    });
    location.assign(new URL('login.html', UNIFICADO_ROOT));
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('unificado-login-form');
  if (!form) return;
  const feedback = document.getElementById('login-feedback');
  const button = form.querySelector('button[type="submit"]');
  const firstAccessForm = document.getElementById('first-access-form');
  let passwordToken = null;
  let passwordMode = null;
  let modulesAfterChange = [];

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    button.disabled = true;
    feedback.textContent = 'Verificando acesso…';
    try {
      const response = await fetch(new URL('unified/login', MAPA_API), {
        method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.elements.username.value.trim(),
          password: form.elements.password.value
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Não foi possível entrar.');
      }
      if (result.reset_required || result.first_access_token) {
        passwordToken = result.reset_token || result.first_access_token;
        passwordMode = result.reset_required ? 'pair' :
          (result.first_access_module === 'pcp' ? 'pcp' : 'mapa');
        modulesAfterChange = result.modules || (passwordMode === 'pcp' ? ['pcp'] : ['mapa']);
        form.hidden = true;
        firstAccessForm.hidden = false;
        feedback.textContent = result.reset_required
          ? 'Defina uma senha única para os dois módulos.'
          : 'Defina uma senha nova para o primeiro acesso.';
        return;
      }
      storeModuleSessions(result);
      location.assign(destination(result.modules || []));
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
      const endpoint = passwordMode === 'pair' ? 'unified/reset' :
        passwordMode === 'pcp' ? 'unified/pcp-first-access' : 'first-access';
      const response = await fetch(new URL(endpoint, MAPA_API), {
        method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: passwordToken, password })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Não foi possível atualizar a senha.');
      }
      if (passwordMode === 'mapa' && result.user) result.mapa = result.user;
      storeModuleSessions(result);
      location.assign(destination(result.modules || modulesAfterChange));
    } catch (error) {
      feedback.textContent = error.message || 'Falha de conexão.';
    } finally {
      firstAccessForm.reset();
      submit.disabled = false;
    }
  });
});
