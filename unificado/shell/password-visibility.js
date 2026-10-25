/* Show or hide passwords only while the person requests it. */
(() => {
  const enhance = input => {
    if (input.dataset.unificadoPasswordVisibility) return;
    input.dataset.unificadoPasswordVisibility = '1';
    const reactField = input.closest('#root');
    const wrap = reactField ? input.parentElement : document.createElement('span');
    if (reactField) wrap.classList.add('unificado-password-react-field');
    else {
      wrap.className = 'unificado-password-wrap';
      input.parentNode.insertBefore(wrap, input);
      wrap.append(input);
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'unificado-password-toggle';
    button.textContent = 'Mostrar';
    button.setAttribute('aria-label', 'Mostrar senha');
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      const visible = input.type === 'password';
      input.type = visible ? 'text' : 'password';
      button.textContent = visible ? 'Ocultar' : 'Mostrar';
      button.setAttribute('aria-label', visible ? 'Ocultar senha' : 'Mostrar senha');
      button.setAttribute('aria-pressed', String(visible));
    });
    wrap.append(button);
  };
  const scan = () => document.querySelectorAll('input[type="password"]:not([data-unificado-password-visibility])').forEach(enhance);
  const start = () => {
    scan();
    new MutationObserver(scan).observe(document.body, {childList: true, subtree: true});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
  else start();
})();
