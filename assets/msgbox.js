/**
 * MsgBox — Componente global de mensagem de sucesso
 * ConcreTrack / PWA-HUB
 *
 * Uso básico:
 *   <script src="../assets/msgbox.js"></script>
 *   showMsgBox('Operação realizada com sucesso!');
 *
 * API:
 *   showMsgBox(mensagem)  — exibe o modal com o texto/HTML fornecido
 *   closeMsgBox()         — fecha o modal
 *
 * O componente injeta o HTML no final do <body> e carrega o CSS
 * automaticamente a partir do mesmo diretório do script.
 */
(function (global) {
  'use strict';

  /* ── Resolve o diretório base do próprio script ── */
  var _baseUrl = (function () {
    // Tenta document.currentScript (mais confiável, não funciona em IE)
    if (document.currentScript && document.currentScript.src) {
      return document.currentScript.src.replace(/msgbox\.js(\?.*)?$/, '');
    }
    // Fallback: percorre scripts carregados
    var scripts = document.querySelectorAll('script[src]');
    for (var i = 0; i < scripts.length; i++) {
      if (/msgbox\.js(\?.*)?$/i.test(scripts[i].src)) {
        return scripts[i].src.replace(/msgbox\.js(\?.*)?$/, '');
      }
    }
    return '';
  })();

  /* ── Injeta o <link> do CSS se ainda não estiver presente ── */
  function _injectStyles() {
    if (document.getElementById('msgbox-style')) return;
    var link = document.createElement('link');
    link.id   = 'msgbox-style';
    link.rel  = 'stylesheet';
    link.href = _baseUrl + 'msgbox.css';
    document.head.appendChild(link);
  }

  /* ── Injeta o HTML do overlay no final do <body> ── */
  function _injectHtml() {
    if (document.getElementById('msgbox-overlay')) return;

    var overlay = document.createElement('div');
    overlay.id = 'msgbox-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'msgbox-msg');

    overlay.innerHTML = [
      '<div id="msgbox-card">',
        '<div class="msgbox-icon" aria-hidden="true">',
          '<svg viewBox="0 0 24 24" fill="none"',
              ' stroke="currentColor" stroke-width="2.5"',
              ' stroke-linecap="round" stroke-linejoin="round">',
            '<polyline points="20 6 9 17 4 12"></polyline>',
          '</svg>',
        '</div>',
        '<p class="msgbox-msg" id="msgbox-msg"></p>',
        '<button class="msgbox-btn" type="button" onclick="closeMsgBox()">OK</button>',
      '</div>',
    ].join('');

    document.body.appendChild(overlay);

    /* Fecha ao clicar fora do card (no backdrop) */
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) global.closeMsgBox();
    });
  }

  /* ── Garante que tudo está pronto antes de exibir ── */
  function _ensureReady() {
    _injectStyles();
    _injectHtml();
  }

  /* ── Fecha com tecla Escape ── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') global.closeMsgBox();
  });

  /* ────────────────────────────────────────────────
     API pública
  ──────────────────────────────────────────────── */

  /* Ícones SVG por tipo */
  var _ICONS = {
    success: '<polyline points="20 6 9 17 4 12"></polyline>',
    error:   '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>',
    warn:    '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>'
  };

  /**
   * Exibe o modal de mensagem.
   * @param {string} mensagem  Texto ou HTML da mensagem.
   * @param {'success'|'error'|'warn'} [type='success']  Tipo visual do modal.
   */
  global.showMsgBox = function (mensagem, type) {
    _ensureReady();

    var t       = type || 'success';
    var overlay = document.getElementById('msgbox-overlay');
    var msg     = document.getElementById('msgbox-msg');
    var iconSvg = overlay ? overlay.querySelector('.msgbox-icon svg') : null;

    /* Atualiza classe de tipo no overlay */
    if (overlay) {
      overlay.classList.remove('msgbox-type-error', 'msgbox-type-warn');
      if (t === 'error') overlay.classList.add('msgbox-type-error');
      else if (t === 'warn') overlay.classList.add('msgbox-type-warn');
    }

    /* Troca o ícone conforme o tipo */
    if (iconSvg) iconSvg.innerHTML = _ICONS[t] || _ICONS.success;

    if (msg)     msg.innerHTML = mensagem;
    if (overlay) {
      overlay.classList.add('msgbox-visible');
      var btn = overlay.querySelector('.msgbox-btn');
      if (btn) setTimeout(function () { btn.focus(); }, 40);
    }
  };

  /**
   * Fecha o modal de mensagem.
   */
  global.closeMsgBox = function () {
    var overlay = document.getElementById('msgbox-overlay');
    if (overlay) overlay.classList.remove('msgbox-visible');
  };

  /* ── Inicialização antecipada (injeção silenciosa ao carregar) ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _ensureReady);
  } else {
    _ensureReady();
  }

})(window);
