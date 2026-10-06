"""Apply the approved second-inspection flow only to the unified Mapa build."""

from __future__ import annotations


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"Second-inspection patch {label}: expected 1 match, found {count}")
    return source.replace(old, new, 1)


def replace_nth(source: str, old: str, new: str, occurrence: int, label: str) -> str:
    positions = []
    start = 0
    while (found := source.find(old, start)) >= 0:
        positions.append(found)
        start = found + len(old)
    if len(positions) < occurrence:
        raise RuntimeError(f"Second-inspection patch {label}: expected occurrence {occurrence}, found {len(positions)}")
    found = positions[occurrence - 1]
    return source[:found] + new + source[found + len(old):]


def apply(source: str) -> str:
    source = replace_nth(
        source,
        '  const isRework = (atual?.statusMontagem === "RR");',
        '  const isRework = (atual?.statusMontagem === "RR" || Boolean(posteBase?.segundaInspecao));',
        2,
        "rework entry",
    )
    source = replace_once(
        source,
        '  const isRework = (atual?.statusMontagem === "RR");',
        '  const isRework = (atual?.statusMontagem === "RR" || Boolean(posteBase?.segundaInspecao));',
        "montagem rework entry",
    )
    source = replace_once(
        source,
        '    checklists: isRework ? {} : (atual?.checklists || {})\n  };',
        '    checklists: isRework ? {} : (atual?.checklists || {}),\n    segundaInspecao: Boolean(posteBase?.segundaInspecao)\n  };',
        "montagem second-inspection state",
    )
    source = replace_once(
        source,
        '    etapa: "INSPECAO"\n  };',
        '    etapa: "INSPECAO",\n    segundaInspecao: Boolean(posteBase?.segundaInspecao)\n  };',
        "second-inspection state",
    )
    source = replace_once(
        source,
        'async function saveInspecao() {}\n\nasync function openInspecaoPosteDetalhe(posteBase) {',
        '''async function saveInspecao() {}

function abrirEscolhaPosteReprovado(rawRow, posteBase, modo = "INSPECAO") {
  document.getElementById("unificado-second-choice")?.remove();
  const overlay = document.createElement("div");
  overlay.id = "unificado-second-choice";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "unificado-second-choice-title");
  overlay.innerHTML = `
    <section class="unificado-second-choice-card">
      <h2 id="unificado-second-choice-title">Poste reprovado</h2>
      <p>Escolha como deseja continuar.</p>
      <div class="unificado-second-choice-actions">
        <button type="button" data-action="second">Segunda inspeção (retrabalho)</button>
        <button type="button" data-action="report">Ver relatório</button>
        <button type="button" data-action="cancel" class="secondary">Cancelar</button>
      </div>
    </section>`;
  const close = () => overlay.remove();
  overlay.addEventListener("click", async (event) => {
    if (event.target === overlay || event.target.closest('[data-action="cancel"]')) return close();
    if (event.target.closest('[data-action="report"]')) {
      close();
      return window.abrirVisualizacaoChecklist(rawRow);
    }
    if (event.target.closest('[data-action="second"]')) {
      close();
      if (modo === "MONTAGEM_POSTES") {
        await openMontagemPosteDetalhe({ ...posteBase, segundaInspecao: true });
      } else {
        await openInspecaoPosteDetalhe({ ...posteBase, segundaInspecao: true });
      }
    }
  });
  document.body.appendChild(overlay);
  overlay.querySelector('[data-action="second"]')?.focus();
}

async function openInspecaoPosteDetalhe(posteBase) {''',
        "choice dialog",
    )
    source = replace_once(
        source,
        '''      } else if (target.closest(".ins-ver-checklist-btn") || tr.dataset.inspecaoRaw) {
        const rawJson = tr.dataset.inspecaoRaw;
        if (rawJson) {
          try {
            const rawRow = JSON.parse(rawJson);
            await window.abrirVisualizacaoChecklist(rawRow);
          } catch (e) {
            console.error("Erro ao analisar inspecaoRaw:", e);
          }
        }
      }''',
        '''      } else if (target.closest(".ins-ver-checklist-btn") || tr.dataset.inspecaoRaw) {
        const rawJson = tr.dataset.inspecaoRaw;
        if (rawJson) {
          try {
            const rawRow = JSON.parse(rawJson);
            if (String(rawRow.status_montagem || "").toUpperCase() === "R"
                && !rawRow.checklists?.__segunda_inspecao) {
              abrirEscolhaPosteReprovado(rawRow, posteBase);
            } else {
              await window.abrirVisualizacaoChecklist(rawRow);
            }
          } catch (e) {
            console.error("Erro ao analisar inspecaoRaw:", e);
          }
        }
      }''',
        "rejected-row click",
    )
    source = replace_once(
        source,
        '''            const montRecord = JSON.parse(tr.dataset.montagemRaw);
            window.abrirVisualizacaoChecklist(montRecord);''',
        '''            const montRecord = JSON.parse(tr.dataset.montagemRaw);
            if (String(montRecord.status_montagem || "").toUpperCase() === "R"
                && !montRecord.checklists?.__segunda_inspecao
                && isModeAllowed("MONTAGEM_POSTES")) {
              abrirEscolhaPosteReprovado(montRecord, {
                recordId: tr.dataset.recordId || "",
                dataFabricacao: tr.dataset.dataFabricacao || "",
                setor: tr.dataset.setor || "",
                formaNumero: tr.dataset.formaNumero || "",
                modelo: tr.dataset.modelo || "",
                codigoPoste: tr.dataset.codigoPoste || "",
                descricaoPoste: tr.dataset.descricaoPoste || "",
                codigoProduto: tr.dataset.codigoProduto || ""
              }, "MONTAGEM_POSTES");
            } else {
              window.abrirVisualizacaoChecklist(montRecord);
            }''',
        "montagem rejected-row click",
    )
    source = replace_once(
        source,
        '''    const syncResult = await syncMontagemPosteToApi(updated, "FINALIZACAO", { silent: false });''',
        '''    if (poste.segundaInspecao) {
      const approvedAfterRework = updated.statusMontagem === "A";
      updated.statusMontagem = approvedAfterRework ? "RR" : "R";
      updated.checklists.__segunda_inspecao = {
        primeira_inspecao: "R",
        resultado: approvedAfterRework ? "APROVADO_RETRABALHADO" : "SEGREGADO",
        em: updated.finalizadoEm,
        por: state.authUser?.name || ""
      };
    }

    const syncResult = await syncMontagemPosteToApi(updated, "FINALIZACAO", { silent: false });''',
        "montagem final status",
    )
    source = replace_once(
        source,
        '''    const updated = {
      ...poste,
      checklists: {
        ...(poste.checklists || {}),
        dia_inspecao: diaInspecao,
        horario_dispositivo: horarioDispositivo,
        geolocation: geoResult
      },
      finalizadoEm: nowIso()
    };

    const syncResult = await syncMontagemPosteToApi(updated, "INSPECAO", { silent: false });''',
        '''    const updated = {
      ...poste,
      checklists: {
        ...(poste.checklists || {}),
        dia_inspecao: diaInspecao,
        horario_dispositivo: horarioDispositivo,
        geolocation: geoResult
      },
      finalizadoEm: nowIso()
    };
    if (poste.segundaInspecao) {
      const approvedAfterRework = updated.statusMontagem === "A";
      updated.statusMontagem = approvedAfterRework ? "RR" : "R";
      updated.checklists.__segunda_inspecao = {
        primeira_inspecao: "R",
        resultado: approvedAfterRework ? "APROVADO_RETRABALHADO" : "SEGREGADO",
        em: updated.finalizadoEm,
        por: state.authUser?.name || ""
      };
    }

    const syncResult = await syncMontagemPosteToApi(updated, "INSPECAO", { silent: false });''',
        "final status",
    )
    source = replace_once(
        source,
        '''  elStatus.textContent = statusText;
  elStatus.style.color = statusColor;

  // Render content''',
        '''  elStatus.textContent = statusText;
  elStatus.style.color = statusColor;
  modal.querySelector("#unificado-report-second")?.remove();
  const secondMode = normRow.etapa === "INSPECAO" ? "INSPECAO" : "MONTAGEM_POSTES";
  if (normRow.status_montagem === "R" && normRow.finalizado_em
      && !normRow.checklists?.__segunda_inspecao
      && normRow.etapa !== ETAPA_HISTORICO_REPROVACAO
      && row.record_id && row.setor && isModeAllowed(secondMode)) {
    const button = document.createElement("button");
    button.id = "unificado-report-second";
    button.type = "button";
    button.textContent = "Iniciar segunda inspeção (retrabalho)";
    button.addEventListener("click", async () => {
      button.disabled = true;
      const posteBase = {
        recordId: row.record_id,
        dataFabricacao: normRow.data_fabricacao,
        setor: row.setor,
        formaNumero: normRow.forma_numero,
        modelo: normRow.modelo,
        codigoPoste: row.codigo_poste || producaoConcretagem?.codigo_poste || "",
        descricaoPoste: row.descricao_poste || producaoConcretagem?.descricao_poste || "",
        codigoProduto: row.codigo_produto || producaoConcretagem?.codigo_produto || "",
        segundaInspecao: true
      };
      modal.classList.remove("modal-visible");
      try {
        if (secondMode === "INSPECAO") await openInspecaoPosteDetalhe(posteBase);
        else await openMontagemPosteDetalhe(posteBase);
      } catch (error) {
        modal.classList.add("modal-visible");
        button.disabled = false;
        showMsgBox("Não foi possível abrir a segunda inspeção. Tente novamente.", "error");
      }
    });
    elStatus.parentElement.appendChild(button);
  }

  // Render content''',
        "report entry to second inspection",
    )
    source = source.replace('"Segregado" : "Reprovado · 2ª inspeção pendente"',
                            '"Perda do poste" : "Reprovado · 2ª inspeção pendente"')
    source = source.replace('"Aprovado e Retrabalhado"', '"Retrabalhado e aprovado"')
    return source
