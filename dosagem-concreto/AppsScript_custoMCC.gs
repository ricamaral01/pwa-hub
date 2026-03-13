/**
 * BANCO DE CUSTOS MCC — Apps Script
 * Aba: custo  |  Planilha: https://docs.google.com/spreadsheets/d/13VnYbzJ-9sVtfIoe2twOwK6kwdOWFMxnJC1v1_72Nik/edit?gid=0#gid=0
 *
 * COMO USAR:
 * 1. Abra a planilha acima → Extensões → Apps Script
 * 2. Cole este código inteiro no Código.gs (apague o conteúdo anterior)
 * 3. Salve (Ctrl+S)
 * 4. Clique em Executar → setup  (cria a aba custo_mcc com cabeçalhos)
 * 5. Implantar → Nova implantação
 *    - Tipo: App da Web
 *    - Executar como: Eu (seu e-mail)
 *    - Quem tem acesso: Qualquer pessoa
 * 6. Copie a URL gerada e cole no index.html na variável CUSTO_MCC_WEBAPP_URL
 * URL atual: https://script.google.com/macros/s/AKfycbyNV73sf5uPZ2xAmb0Q-mtXLeZhap251Fi424SJHrEPNHbbWzJ8ETlDhiJzH84oQLYU3A/exec
 */

var SHEET_CUSTO_MCC = "custo";

var HEADERS_CUSTO_MCC = [
  "ID",                    // 1
  "Data Cadastro",         // 2
  "Nome Produto",          // 3
  "Tipo Material",         // 4  ex: Cimento, Areia Natural, Brita 0 ...
  "Chave MCC",             // 5  ex: cim, adic, an, ai, b0, b1, agua, adit
  "Fornecedor",            // 6
  "Unidade Medida",        // 7  kg | t
  "Preço (R$/unid.)",      // 8
  "ICMS (%)",              // 9
  "Deduz ICMS",            // 10 Sim | Não
  "Frete (R$/unid.)",      // 11
  "Unid. Frete",           // 12 kg | t
  "ICMS Frete (%)",        // 13
  "Deduz ICMS Frete",      // 14 Sim | Não
  "Custo Líq. R$/kg",      // 15 calculado
  "Ativo",                 // 16 Sim | Não
  "Observações"            // 17
];

/* -------- Criar / garantir aba custo_mcc -------- */
function getOrCreateSheetCustoMCC() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_CUSTO_MCC);
  if (!sh) sh = ss.insertSheet(SHEET_CUSTO_MCC);

  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS_CUSTO_MCC);
    var r = sh.getRange(1, 1, 1, HEADERS_CUSTO_MCC.length);
    r.setFontWeight("bold");
    r.setBackground("#1b5e20");
    r.setFontColor("#FFFFFF");
    r.setHorizontalAlignment("center");
    r.setWrap(false);
    // larguras
    sh.setColumnWidth(1,  190); // ID
    sh.setColumnWidth(2,  160); // Data
    sh.setColumnWidth(3,  200); // Nome Produto
    sh.setColumnWidth(4,  150); // Tipo Material
    sh.setColumnWidth(5,   90); // Chave MCC
    sh.setColumnWidth(6,  180); // Fornecedor
    sh.setColumnWidth(7,   90); // Unidade
    sh.setColumnWidth(8,  120); // Preço
    sh.setColumnWidth(9,   90); // ICMS %
    sh.setColumnWidth(10,  90); // Ded ICMS
    sh.setColumnWidth(11, 120); // Frete
    sh.setColumnWidth(12,  90); // Unid Frete
    sh.setColumnWidth(13,  90); // ICMS Frete %
    sh.setColumnWidth(14,  90); // Ded ICMS Frete
    sh.setColumnWidth(15, 130); // Custo Líq
    sh.setColumnWidth(16,  70); // Ativo
    sh.setColumnWidth(17, 300); // Obs
    sh.setFrozenRows(1);
  }
  return sh;
}

/* ================ ROTEAMENTO POST ================ */
function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);

    /* --- salvar_custo_mcc --- */
    if (d.action === "salvar_custo_mcc") {
      var sh = getOrCreateSheetCustoMCC();

      // Atualiza registro existente se id for passado e found
      if (d.id) {
        var lastRow = sh.getLastRow();
        if (lastRow > 1) {
          var ids = sh.getRange(2, 1, lastRow - 1, 1).getValues();
          for (var i = 0; i < ids.length; i++) {
            if (String(ids[i][0]) === String(d.id)) {
              sh.getRange(i + 2, 1, 1, HEADERS_CUSTO_MCC.length).setValues([[
                d.id,
                d.dataCadastro || new Date().toLocaleString("pt-BR"),
                d.nomeProduto      || "",
                d.tipoMaterial     || "",
                d.chaveMCC         || "",
                d.fornecedor       || "",
                d.unidadeMedida    || "kg",
                d.preco            || 0,
                d.icmsPct          || 0,
                d.deduzICMS        || "Não",
                d.frete            || 0,
                d.unidFrete        || "kg",
                d.icmsFreteP       || 0,
                d.deduzICMSFrete   || "Não",
                d.custoLiq         || 0,
                d.ativo            || "Sim",
                d.observacoes      || ""
              ]]);
              return ContentService
                .createTextOutput(JSON.stringify({ ok: true, message: "Produto atualizado.", id: d.id }))
                .setMimeType(ContentService.MimeType.JSON);
            }
          }
        }
      }

      // Novo registro
      var agora = new Date();
      var newId = "MCC-" + agora.getFullYear()
        + String(agora.getMonth()+1).padStart(2,"0")
        + String(agora.getDate()).padStart(2,"0")
        + "-" + Math.floor(Math.random()*90000+10000);

      sh.appendRow([
        newId,
        agora.toLocaleString("pt-BR"),
        d.nomeProduto      || "",
        d.tipoMaterial     || "",
        d.chaveMCC         || "",
        d.fornecedor       || "",
        d.unidadeMedida    || "kg",
        d.preco            || 0,
        d.icmsPct          || 0,
        d.deduzICMS        || "Não",
        d.frete            || 0,
        d.unidFrete        || "kg",
        d.icmsFreteP       || 0,
        d.deduzICMSFrete   || "Não",
        d.custoLiq         || 0,
        d.ativo            || "Sim",
        d.observacoes      || ""
      ]);

      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, message: "Produto salvo.", id: newId }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    /* --- deletar_custo_mcc --- */
    if (d.action === "deletar_custo_mcc") {
      var sh   = getOrCreateSheetCustoMCC();
      var last = sh.getLastRow();
      if (last > 1) {
        var ids = sh.getRange(2, 1, last - 1, 1).getValues();
        for (var i = ids.length - 1; i >= 0; i--) {
          if (String(ids[i][0]) === String(d.id)) {
            sh.deleteRow(i + 2);
            return ContentService
              .createTextOutput(JSON.stringify({ ok: true, message: "Produto excluído." }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: "ID não encontrado." }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: "action desconhecida: " + (d.action || "vazio") }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* ================ ROTEAMENTO GET ================ */
function doGet(e) {
  // Suporte a JSONP: se callback= for passado, envolve o JSON na função callback
  function respond(obj) {
    var json = JSON.stringify(obj);
    var cb = (e && e.parameter && e.parameter.callback) ? e.parameter.callback : null;
    if (cb) {
      return ContentService
        .createTextOutput(cb + "(" + json + ");")
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "";

    /* --- listar_custo_mcc --- */
    if (action === "listar_custo_mcc") {
      var sh      = getOrCreateSheetCustoMCC();
      var lastRow = sh.getLastRow();
      if (lastRow <= 1) {
        return respond({ ok: true, produtos: [] });
      }
      var data     = sh.getRange(2, 1, lastRow - 1, HEADERS_CUSTO_MCC.length).getValues();
      var produtos = [];
      for (var i = 0; i < data.length; i++) {
        produtos.push({
          id:             String(data[i][0]),
          dataCadastro:   String(data[i][1]),
          nomeProduto:    String(data[i][2]),
          tipoMaterial:   String(data[i][3]),
          chaveMCC:       String(data[i][4]),
          fornecedor:     String(data[i][5]),
          unidadeMedida:  String(data[i][6]),
          preco:          Number(data[i][7])  || 0,
          icmsPct:        Number(data[i][8])  || 0,
          deduzICMS:      String(data[i][9]),
          frete:          Number(data[i][10]) || 0,
          unidFrete:      String(data[i][11]),
          icmsFreteP:     Number(data[i][12]) || 0,
          deduzICMSFrete: String(data[i][13]),
          custoLiq:       Number(data[i][14]) || 0,
          ativo:          String(data[i][15]),
          observacoes:    String(data[i][16])
        });
      }
      var filtroChave = (e.parameter.chave || "").trim().toLowerCase();
      if (filtroChave) {
        produtos = produtos.filter(function(p){ return p.chaveMCC.toLowerCase() === filtroChave; });
      }
      return respond({ ok: true, produtos: produtos });
    }

    /* ping */
    return respond({
      status:  "online",
      aba:     SHEET_CUSTO_MCC,
      colunas: HEADERS_CUSTO_MCC.length,
      actions: ["salvar_custo_mcc", "deletar_custo_mcc", "listar_custo_mcc"]
    });

  } catch (err) {
    return respond({ ok: false, error: err.message });
  }
}

/* ================ SETUP (executar 1 vez) ================ */
function setup() {
  getOrCreateSheetCustoMCC();
  SpreadsheetApp.getUi().alert(
    "✅ Pronto!\n\n" +
    "Aba \"" + SHEET_CUSTO_MCC + "\" criada com " + HEADERS_CUSTO_MCC.length + " colunas.\n\n" +
    "Agora:\n" +
    "1. Implantar → Nova implantação\n" +
    "2. Tipo: App da Web\n" +
    "3. Executar como: Eu\n" +
    "4. Acesso: Qualquer pessoa\n" +
    "5. Copie a URL → cole como CUSTO_MCC_WEBAPP_URL no index.html"
  );
}
