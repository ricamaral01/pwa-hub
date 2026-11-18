// O servidor valida novamente o usuário, o setor e a identidade de cada registro.
cancelarConcretagemOdin = async function (forma, setor) {
  const allowed = ["user-ricardo", "alex", "philippe"].includes(String(state.authUser?.id || ""));
  if (!allowed) {
    showLibFeedback("Modo ODIN disponível apenas para Ricardo, Alex e Philippe.", "error");
    return;
  }
  if (!navigator.onLine) {
    showLibFeedback("Conecte-se à internet para desfazer um apontamento.", "error");
    return;
  }
  const data = el.libData?.value || todayYmd();
  const formaNormalizada = normalizeUpper(forma);
  const pending = readDb().events.some((event) => event.pendingSync === true
    && event.dataFabricacao === data && event.setor === setor
    && normalizeUpper(event.formaNumero) === formaNormalizada);
  if (pending) {
    showLibFeedback("Sincronize os apontamentos pendentes desta forma antes de usar o ODIN.", "warn");
    return;
  }
  const modal = document.getElementById("correcaoConcretagemModal");
  const box = modal?.querySelector(".modal-box");
  if (!box) return;
  box.replaceChildren();
  box.style.maxWidth = "640px";
  const heading = document.createElement("h2");
  heading.className = "modal-title";
  heading.textContent = "Modo ODIN";
  const subtitle = document.createElement("p");
  subtitle.className = "modal-subtitle";
  subtitle.textContent = `${setor} · ${formaNormalizada} · ${data}`;
  const info = document.createElement("p");
  info.textContent = "Selecione o registro a desfazer. As reversões ficam auditadas e exigem justificativa.";
  const list = document.createElement("div");
  list.style.cssText = "display:grid;gap:8px;max-height:50vh;overflow:auto;margin:14px 0";
  const reasonLabel = document.createElement("label");
  reasonLabel.textContent = "Justificativa da reversão";
  const reason = document.createElement("textarea");
  reason.className = "input-field";
  reason.rows = 3;
  reason.maxLength = 500;
  reason.placeholder = "Descreva o erro e a correção necessária (mínimo 8 caracteres).";
  reason.style.cssText = "width:100%;margin:8px 0 14px";
  const feedback = document.createElement("p");
  feedback.setAttribute("role", "alert");
  const close = document.createElement("button");
  close.className = "btn btn-secondary";
  close.type = "button";
  close.textContent = "Fechar";
  close.onclick = () => modal.classList.remove("modal-visible");
  box.append(heading, subtitle, info, list, reasonLabel, reason, feedback, close);
  modal.classList.add("modal-visible");

  const url = new URL("/unificado/mapa/api/odin/form", location.origin);
  url.search = new URLSearchParams({ data, setor, forma: formaNormalizada }).toString();
  let payload;
  try {
    const response = await fetch(url, { credentials: "same-origin", cache: "no-store" });
    payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Falha ao consultar a forma.");
  } catch (error) {
    feedback.textContent = error.message;
    return;
  }
  const names = {
    programacao: "Programação", programacao_s34: "Programação Setor 3/4",
    liberacao: "Liberação", concretagem: "Concretagem / apontamento de concreto",
    manutencao: "Manutenção da forma"
  };
  const ordering = ["concretagem", "liberacao", "programacao", "programacao_s34", "manutencao"];
  const records = payload.registros || {};
  for (const action of ordering) {
    for (const record of records[action] || []) {
      const actionName = action === "concretagem" && record.status === "INSPECIONADO"
        ? "Inspeção" : names[action];
      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid #cbd5e1;border-radius:8px";
      const detail = document.createElement("span");
      const extra = action === "concretagem" ? ` · ${record.tipo_concreto || "Sem tipo"} · ${record.colaborador || ""}`
        : action === "manutencao" ? ` · ${record.status || ""}` : ` · ${record.modelo || record.colaborador || ""}`;
      detail.textContent = `${actionName}${extra}`;
      const button = document.createElement("button");
      button.className = "btn";
      button.type = "button";
      button.textContent = "Desfazer";
      button.style.cssText = "background:#b91c1c;color:white;flex:none";
      button.onclick = async () => {
        const motivo = reason.value.trim();
        if (motivo.length < 8) {
          feedback.textContent = "Escreva uma justificativa com pelo menos 8 caracteres.";
          reason.focus();
          return;
        }
        const warning = action === "concretagem" && (records.confirmacoes || []).some(item => item.producao_id === record.id)
          ? " A confirmação final da produção também será desfeita." : "";
        if (!confirm(`Desfazer ${actionName} da forma ${formaNormalizada} em ${data}?${warning}`)) return;
        button.disabled = true;
        feedback.textContent = "Revertendo registro...";
        try {
          const response = await fetch("/unificado/mapa/api/odin/undo", {
            method: "POST", credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data, setor, forma: formaNormalizada, acao: action, id: record.id, motivo })
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Falha ao desfazer.");
          const db = readDb();
          db.records = db.records.filter(item => !(item.dataFabricacao === data && item.setor === setor && normalizeUpper(item.formaNumero) === formaNormalizada));
          db.events = db.events.filter(item => !(item.dataFabricacao === data && item.setor === setor && normalizeUpper(item.formaNumero) === formaNormalizada));
          writeDb(db);
          if (action === "programacao" || action === "programacao_s34") {
            writeLocalProgramacao(readLocalProgramacao().filter(item =>
              !(item.data_fabricacao === data && item.setor === setor && normalizeUpper(item.forma) === formaNormalizada)));
          }
          localStorage.removeItem(CLICKED_FORMS_KEY);
          location.reload();
        } catch (error) {
          feedback.textContent = error.message;
          button.disabled = false;
        }
      };
      row.append(detail, button);
      list.append(row);
    }
  }
  if (!list.children.length) {
    list.textContent = "Nenhum apontamento reversível nesta forma e data.";
  }
};
