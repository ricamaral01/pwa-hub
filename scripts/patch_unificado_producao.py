"""Apply production-only behavior to the generated Unificado Mapa."""

from __future__ import annotations


def _replace_once(source: str, old: str, new: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"Unificado Mapa source changed (expected one match, found {count}): {old[:90]}")
    return source.replace(old, new, 1)


def _replace_between(source: str, start: str, end: str, replacement: str) -> str:
    if source.count(start) != 1 or source.count(end) != 1:
        raise RuntimeError(f"Unificado Mapa function boundary changed: {start}")
    before, tail = source.split(start, 1)
    _, after = tail.split(end, 1)
    return before + replacement.rstrip() + "\n\n" + end + after


def apply(source: str) -> str:
    # Production is recorded in `producao`; `liberacao_formas` is a separate
    # earlier step. A standard-concrete row is already a production entry.
    start = "async function loadClickedFormsFromSupabase(dateOverride) {"
    end = "function getOperationalFormsForSector(setor) {"
    before, rest = source.split(start, 1)
    body, after = rest.split(end, 1)
    body = _replace_once(body,
        "if (row.prod_id && row.prod_tipo_concreto !== 'Padrão') {",
        "if (row.prod_id) {")
    body = _replace_once(body,
        "} else if (row.lib_id || (row.prod_id && row.prod_tipo_concreto === 'Padrão')) {",
        "} else if (row.lib_id) {")
    body = _replace_once(body,
        "          const key = row.setor + \"||\" + normalizeUpper(row.forma);",
        """          const modeloBanco = row.prod_id ? (row.prod_modelo || "") : (row.prog_modelo || "");
          const codigoProdutoBanco = row.prod_id ? (row.prod_codigo_produto || "") : (row.prog_codigo_produto || "");
          const descricaoPosteBanco = row.prod_id ? (row.prod_descricao_poste || "") : (row.prog_descricao_poste || "");
          const key = row.setor + "||" + normalizeUpper(row.forma);""")
    body = _replace_once(body,
        "              concretoTipo: tipoConcreto,",
        """              concretoTipo: tipoConcreto,
              modelo: modeloBanco,
              codigoProduto: codigoProdutoBanco,
              descricaoPoste: descricaoPosteBanco,""")
    body = _replace_once(body,
        'record.concretoTipo !== tipoConcreto || (hasVibradoFromRow && record.vibrado !== vibrado)) {',
        'record.concretoTipo !== tipoConcreto || (hasVibradoFromRow && record.vibrado !== vibrado) ||\n'
        '            (modeloBanco && record.modelo !== modeloBanco) ||\n'
        '            record.codigoProduto !== codigoProdutoBanco || record.descricaoPoste !== descricaoPosteBanco) {')
    body = _replace_once(body,
        "            record.concretoTipo = tipoConcreto;",
        """            record.concretoTipo = tipoConcreto;
            if (modeloBanco) record.modelo = modeloBanco;
            record.codigoProduto = codigoProdutoBanco;
            record.descricaoPoste = descricaoPosteBanco;""")
    source = before + start + body + end + after

    source = _replace_once(source,
        '        prod_tipo_concreto: row.tipo_concreto || "Padrão",',
        '''        prod_tipo_concreto: row.tipo_concreto || "Padrão",
        prod_modelo: row.modelo || "",
        prod_codigo_produto: row.codigo_produto || "",
        prod_descricao_poste: row.descricao_poste || "",''')

    # The Setor 3 product is selected at mandrel withdrawal, after concreting.
    source = _replace_once(source,
        '  el.concretoTipoSubtitle.textContent = `Forma ${forma} . ${setor}`;',
        '''  el.concretoTipoSubtitle.textContent = `Forma ${forma} . ${setor}`;
  const modeloDefinidoNoSaque = setor === "Setor 3";
  document.getElementById("concretoModeloField")?.classList.toggle("hidden", modeloDefinidoNoSaque);''')
    source = _replace_once(source,
        '''        const modeloProduzido = el.concretoModeloSelect.value;
        if (!modelosPermitidos.includes(modeloProduzido)) {''',
        '''        const modeloProduzido = modeloDefinidoNoSaque ? "SC" : el.concretoModeloSelect.value;
        if (!modeloDefinidoNoSaque && !modelosPermitidos.includes(modeloProduzido)) {''')
    source = _replace_once(source,
        '  const resolvedPosteFields = getProductionPosteFields(forma, setor, modeloFinal, card);',
        '''  const resolvedPosteFields = setor === "Setor 3"
    ? { codigoPoste: "", descricaoPoste: "", codigoProduto: "" }
    : getProductionPosteFields(forma, setor, modeloFinal, card);''')

    source = _replace_once(source,
        'function renderMandrilModeloSelect(forma, modeloSelecionado, concretada, producaoId = "", pendingSync = false) {',
        'function renderMandrilModeloSelect(forma, modeloSelecionado, concretada, producaoId = "", pendingSync = false, saqueRegistrado = false) {')
    source = _replace_once(source,
        'aria-label="Modelo produzido na forma ${escapeHtml(forma)}">',
        'aria-label="Modelo produzido na forma ${escapeHtml(forma)}"${saqueRegistrado ? " disabled" : ""}>')
    source = _replace_once(source,
        'Boolean(savedEntry?.pendingSync || (modeloPersistido && !modeloDoRegistro)))}</td>',
        'Boolean(savedEntry?.pendingSync || (modeloPersistido && !modeloDoRegistro)), Boolean(savedIso))}</td>')
    source = _replace_once(source,
        '''    select.addEventListener("change", () => salvarMandrilModeloProduzido(select));''',
        '''    select.addEventListener("change", () => {
      const status = select.closest(".mc-modelo-field")?.querySelector(".mc-modelo-status");
      if (status) status.textContent = "Será salvo ao sacar o mandril";
    });''')
    source = _replace_once(source,
        '''      const saque = saques[`${data}||${normalizeForma(forma)}`];
      cell.innerHTML''',
        '''      const saque = saques[`${data}||${normalizeForma(forma)}`];
      const select = cell.closest("tr")?.querySelector(".mc-modelo-select");
      if (select) select.disabled = Boolean(saque);
      cell.innerHTML''')

    source = _replace_between(source,
        "async function salvarMandrilModeloProduzido(select) {",
        "const SAQUE_MANDRIL_API =",
        '''async function salvarMandrilModeloProduzido(select) {
  const selectedDate = el.mcFiltroData?.value;
  const forma = normalizeMandrilForma(select?.dataset?.mcForma || "");
  const modelo = select?.value || "";
  const status = select?.closest(".mc-modelo-field")?.querySelector(".mc-modelo-status");
  if (!selectedDate || !forma || !modelo) return false;
  if (!getMandrilModelosPermitidos(forma).includes(modelo)) {
    showMsgBox(`O modelo ${modelo} não é permitido para a forma ${forma}.`, "error");
    return false;
  }
  select.disabled = true;
  if (status) {
    status.textContent = "Salvando no banco...";
    status.className = "mc-modelo-status is-saving";
  }
  let saved;
  if (hasApiConfigured() && navigator.onLine) {
    try {
      saved = await persistirMandrilModeloNaConcretagem(
        selectedDate, forma, modelo, select.dataset.mcProducaoId || "");
    } catch (error) {
      console.error(`Erro ao salvar modelo produzido da forma ${forma}:`, error);
    }
  }
  select.disabled = false;
  if (!saved) {
    if (status) {
      status.textContent = "Modelo não salvo; saque não registrado";
      status.className = "mc-modelo-status is-local";
    }
    setSyncStatus("error", `Não foi possível confirmar o modelo da forma ${forma} no banco.`);
    return false;
  }
  const savedData = readMandrilModelosProduzidos();
  savedData[getMandrilModeloKey(selectedDate, forma)] = {
    modelo, producaoId: saved.id, pendingSync: false, updatedAt: new Date().toISOString()
  };
  writeMandrilModelosProduzidos(savedData);
  select.dataset.mcProducaoId = saved.id;
  const product = getProductionPosteFields(forma, "Setor 3", modelo);
  const db = readDb();
  let localChanged = false;
  db.records.forEach((record) => {
    if (record.dataFabricacao === selectedDate && record.setor === "Setor 3" &&
        normalizeMandrilForma(record.formaNumero || "") === forma) {
      record.modelo = modelo;
      record.descricaoPoste = product.descricaoPoste || modelo;
      record.codigoProduto = product.codigoProduto || "";
      record.updatedAt = new Date().toISOString();
      localChanged = true;
    }
  });
  if (localChanged) writeDb(db);
  if (status) {
    status.textContent = "Salvo no banco";
    status.className = "mc-modelo-status is-saved";
  }
  return true;
}''')
    source = _replace_once(source,
        '''window.registrarSaque = async function(forma) {
  const selectedDate = el.mcFiltroData?.value;
  if (!selectedDate) return;
  const timestamp = new Date().toISOString();''',
        '''window.registrarSaque = async function(forma) {
  const selectedDate = el.mcFiltroData?.value;
  if (!selectedDate) return;
  const select = el.mcTabelaBody?.querySelector(`.mc-modelo-select[data-mc-forma="${normalizeMandrilForma(forma)}"]`);
  if (!select?.value) {
    showMsgBox(`Selecione o modelo produzido na forma ${forma} antes de sacar o mandril.`, "error");
    select?.focus();
    return;
  }
  if (!await salvarMandrilModeloProduzido(select)) {
    showMsgBox("Não foi possível confirmar o produto produzido. O saque não foi registrado.", "error");
    return;
  }
  const timestamp = new Date().toISOString();''')
    source = _replace_once(source,
        'showMsgBox("Não foi possível salvar o saque no banco. Tente novamente.", "error");',
        'showMsgBox("O produto foi salvo, mas o saque não. Tente registrar o saque novamente.", "error");')
    return source
