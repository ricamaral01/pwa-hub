const stylesheetURL = new URL('./dialog.css', import.meta.url);
stylesheetURL.search = new URL(import.meta.url).search;
const stylesheet = stylesheetURL.href;
if (!document.querySelector('link[data-sup-dialog]')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet'; link.href = stylesheet; link.dataset.supDialog = 'true';
  document.head.append(link);
}

let dialogNumber = 0;
export function supDialog({title, message = '', content = '', submit = 'Confirmar', danger = false, onSubmit = null}) {
  return new Promise(resolve => {
    const previousFocus = document.activeElement;
    const node = document.createElement('dialog');
    const id = `sup-dialog-title-${++dialogNumber}`;
    node.className = 'sup-dialog';
    node.setAttribute('aria-labelledby', id);
    const form = document.createElement('form');
    form.method = 'dialog';
    const head = document.createElement('div'); head.className = 'sup-dialog-head';
    const heading = document.createElement('h2'); heading.id = id; heading.textContent = title;
    const close = document.createElement('button'); close.type = 'button'; close.className = 'sup-dialog-close'; close.setAttribute('aria-label', 'Fechar'); close.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>';
    head.append(heading, close); form.append(head);
    if (message) { const paragraph = document.createElement('p'); paragraph.className = 'sup-dialog-message'; paragraph.textContent = message; form.append(paragraph); }
    if (content) { const body = document.createElement('div'); body.className = 'sup-dialog-body'; body.innerHTML = content; form.append(body); }
    const actions = document.createElement('div'); actions.className = 'sup-dialog-actions';
    const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'sup-dialog-cancel'; cancel.textContent = 'Cancelar';
    const accept = document.createElement('button'); accept.type = 'submit'; accept.className = `sup-dialog-submit${danger ? ' danger' : ''}`; accept.textContent = submit;
    actions.append(cancel, accept); form.append(actions); node.append(form); document.body.append(node);
    const finish = value => { if (node.open) node.close(); node.remove(); if (previousFocus?.isConnected) previousFocus.focus(); resolve(value); };
    close.onclick = cancel.onclick = () => finish(null);
    node.addEventListener('cancel', event => { event.preventDefault(); finish(null); });
    node.addEventListener('click', event => { if (event.target === node) finish(null); });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const values = new FormData(form);
      if (onSubmit) {
        accept.disabled = true;
        cancel.disabled = true; close.disabled = true;
        accept.textContent = 'Salvando…';
        try { await onSubmit(values); }
        catch (error) {
          let notice = form.querySelector('.sup-dialog-error');
          if (!notice) { notice = document.createElement('p'); notice.className = 'sup-dialog-error'; actions.before(notice); }
          notice.textContent = error?.message || 'Não foi possível concluir. Tente novamente.';
          accept.disabled = false; cancel.disabled = false; close.disabled = false; accept.textContent = submit;
          return;
        }
      }
      finish(values);
    });
    node.showModal(); (form.querySelector('input, textarea, select') || cancel).focus();
  });
}

export async function supAsk(title, {message = '', label = 'Resposta', value = '', required = true, multiline = false, type = 'text', submit = 'Confirmar'} = {}) {
  const safe = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const input = multiline
    ? `<textarea name="answer" rows="4" ${required ? 'required' : ''}>${safe(value)}</textarea>`
    : `<input name="answer" type="${safe(type)}" value="${safe(value)}" ${required ? 'required' : ''}>`;
  const result = await supDialog({title, message, content:`<label class="sup-dialog-field"><span>${safe(label)}</span>${input}</label>`, submit});
  return result ? String(result.get('answer') ?? '').trim() : null;
}

export async function supConfirm(title, message, {danger = false, submit = 'Confirmar'} = {}) {
  return (await supDialog({title, message, danger, submit})) !== null;
}
