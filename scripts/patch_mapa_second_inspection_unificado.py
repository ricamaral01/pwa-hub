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
        '    etapa: "INSPECAO"\n  };',
        '    etapa: "INSPECAO",\n    segundaInspecao: Boolean(posteBase?.segundaInspecao)\n  };',
        "second-inspection state",
    )
    source = replace_once(
        source,
        'async function saveInspecao() {}\n\nasync function openInspecaoPosteDetalhe(posteBase) {',
        '''async function saveInspecao() {}

function abrirEscolhaPosteReprovado(rawRow, posteBase) {
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
      await openInspecaoPosteDetalhe({ ...posteBase, segundaInspecao: true });
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
    source = source.replace('"Segregado" : "Reprovado · 2ª inspeção pendente"',
                            '"Perda do poste" : "Reprovado · 2ª inspeção pendente"')
    source = source.replace('"Aprovado e Retrabalhado"', '"Retrabalhado e aprovado"')
    return source
