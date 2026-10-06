/* Convite informativo do Mapa antigo para o sistema unificado.
   Não instala aplicativos nem altera a navegação ou os lançamentos existentes. */
(() => {
  const destination = "https://concrefer.concretrack.com.br/unificado/";
  const storageKey = "mapa-unificado-invite-hidden-v1";

  try {
    if (sessionStorage.getItem(storageKey) === "1") return;
  } catch (_) {
    // Armazenamento indisponível: o convite continua visível.
  }

  const style = document.createElement("style");
  style.textContent = `
    .login-screen { overflow-y: auto; }
    .unificado-invite {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px 12px;
      padding: 10px 14px;
      background: #eaf4ff;
      border: 1px solid #a9cbea;
      color: #102c4d;
      font: 600 13px/1.4 "Segoe UI", system-ui, sans-serif;
    }
    .app-main > .unificado-invite { width: 100%; }
    .login-card .unificado-invite { border-width: 1px 0 0; }
    .unificado-invite strong { font-weight: 800; }
    .unificado-invite a {
      display: inline-flex;
      align-items: center;
      min-height: 34px;
      padding: 4px 12px;
      border-radius: 8px;
      background: #e8762a;
      color: #102c4d;
      text-decoration: none;
      font-weight: 800;
    }
    .unificado-invite a:hover, .unificado-invite a:focus-visible { background: #f29956; }
    .unificado-invite details { font-weight: 400; }
    .unificado-invite summary { cursor: pointer; font-weight: 700; }
    .unificado-invite details p { margin: 6px 0 0; opacity: 1; font-size: 12px; }
    .unificado-invite-dismiss {
      margin-left: auto;
      padding: 6px;
      border: 0;
      background: transparent;
      color: #102c4d;
      font: 800 18px/1 system-ui, sans-serif;
      cursor: pointer;
    }
    @media (max-width: 600px) {
      .unificado-invite { padding: 8px 10px; font-size: 12px; }
      .unificado-invite a { min-height: 38px; }
    }
    @media print { .unificado-invite { display: none !important; } }
  `;
  document.head.appendChild(style);

  function createInvite() {
    const box = document.createElement("aside");
    box.className = "unificado-invite";
    box.setAttribute("aria-label", "Acesso ao sistema unificado");
    box.innerHTML = `
      <span><strong>Sistema unificado disponível.</strong> O Mapa atual continua funcionando.</span>
      <a href="${destination}" target="_blank" rel="noopener noreferrer">Abrir sistema unificado</a>
      <details>
        <summary>Como instalar no aparelho</summary>
        <p>Android: abra o link no Chrome e escolha “Instalar aplicativo” no menu ⋮.
           iPad/iPhone: abra no Safari e escolha Compartilhar → Adicionar à Tela de Início.</p>
      </details>
      <button class="unificado-invite-dismiss" type="button" aria-label="Fechar este aviso" title="Fechar este aviso">×</button>
    `;
    box.querySelector("button").addEventListener("click", () => {
      document.querySelectorAll(".unificado-invite").forEach((invite) => invite.remove());
      try { sessionStorage.setItem(storageKey, "1"); } catch (_) {}
    });
    return box;
  }

  const loginCard = document.querySelector("#loginScreen .login-card");
  const appMain = document.querySelector("#appShell .app-main");
  const topbar = appMain && appMain.querySelector(".topbar");
  if (loginCard) loginCard.appendChild(createInvite());
  if (topbar) topbar.insertAdjacentElement("afterend", createInvite());
})();
