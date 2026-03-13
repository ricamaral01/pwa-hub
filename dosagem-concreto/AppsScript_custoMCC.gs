/**
 * BANCO DE CUSTOS MCC — Apps Script
 * Aba: custo  |  Planilha: https://docs.google.com/spreadsheets/d/13VnYbzJ-9sVtfIoe2twOwK6kwdOWFMxnJC1v1_72Nik/edit?gid=0#gid=0
 * URL: https://script.google.com/macros/s/AKfycbyNV73sf5uPZ2xAmb0Q-mtXLeZhap251Fi424SJHrEPNHbbWzJ8ETlDhiJzH84oQLYU3A/exec
 *
 * CAMPOS ADICIONADOS v2:
 * - Unidade: Campinas | Pederneiras | Ribeirão | Noroeste
 * - Versão: número inteiro (1, 2, 3...)
 * - Ao salvar novo registro com mesmo Nome+Fornecedor+Unidade, versão anterior é inativada automaticamente
 */

var SHEET_CUSTO_MCC = "custo";

var HEADERS_CUSTO_MCC = [
  "ID",                    // 1
  "Data Cadastro",         // 2
  "Nome Produto",          // 3
  "Tipo Material",         // 4
  "Chave MCC",             // 5
  "Fornecedor",            // 6
  "Unidade (MCC)",         // 7  Campinas | Pederneiras | Ribeirão | Noroeste
  "Versão",                // 8  1, 2, 3...
  "Unidade Medida",        // 9  kg | t
  "Preço (R$/unid.)",      // 10
  "ICMS (%)",              // 11
  "Deduz ICMS",            // 12 Sim | Não
  "Frete (R$/unid.)",      // 13
  "Unid. Frete",           // 14 kg | t
  "ICMS Frete (%)",        // 15
  "Deduz ICMS Frete",      // 16 Sim | Não
  "Custo Líq. R$/kg",      // 17 calculado
  "Ativo",                 // 18 Sim | Não
  "Observações"            // 19
];

/* -------- Criar / garantir aba custo -------- */
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
    sh.setColumnWidth(1,  190); // ID
    sh.setColumnWidth(2,  160); // Data
    sh.setColumnWidth(3,  200); // Nome Produto
    sh.setColumnWidth(4,  150); // Tipo Material
    sh.setColumnWidth(5,   90); // Chave MCC
    sh.setColumnWidth(6,  180); // Fornecedor
    sh.setColumnWidth(7,  130); // Unidade (MCC)
    sh.setColumnWidth(8,   70); // Versão
    sh.setColumnWidth(9,   90); // Unidade Medida
    sh.setColumnWidth(10, 120); // Preço
    sh.setColumnWidth(11,  90); // ICMS %
    sh.setColumnWidth(12,  90); // Ded ICMS
    sh.setColumnWidth(13, 120); // Frete
    sh.setColumnWidth(14,  90); // Unid Frete
    sh.setColumnWidth(15,  90); // ICMS Frete %
    sh.setColumnWidth(16,  90); // Ded ICMS Frete
    sh.setColumnWidth(17, 130); // Custo Líq
    sh.setColumnWidth(18,  70); // Ativo
    sh.setColumnWidth(19, 300); // Obs
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
      var lastRow = sh.getLastRow();

      // Atualiza registro existente (edição direta por ID)
      if (d.id) {
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
                d.unidadeMCC       || "",
                Number(d.versao)   || 1,
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

      // Novo registro — verifica versionamento (mesmo Nome+Fornecedor+Unidade)
      var nomeProduto  = d.nomeProduto  || "";
      var fornecedor   = d.fornecedor   || "";
      var unidadeMCC   = d.unidadeMCC   || "";
      var maxVersao    = 0;

      if (lastRow > 1) {
        var allData = sh.getRange(2, 1, lastRow - 1, HEADERS_CUSTO_MCC.length).getValues();
        for (var j = 0; j < allData.length; j++) {
          var nomeJ  = String(allData[j][2]).trim().toLowerCase();
          var fornJ  = String(allData[j][5]).trim().toLowerCase();
          var unidJ  = String(allData[j][6]).trim().toLowerCase();
          var versaoJ = Number(allData[j][7]) || 1;
          if (nomeJ  === nomeProduto.trim().toLowerCase() &&
              fornJ  === fornecedor.trim().toLowerCase()  &&
              unidJ  === unidadeMCC.trim().toLowerCase()) {
            // Inativa versão anterior
            sh.getRange(j + 2, 18).setValue("Não"); // col 18 = Ativo
            if (versaoJ > maxVersao) maxVersao = versaoJ;
          }
        }
      }

      var novaVersao = maxVersao + 1;
      var agora = new Date();
      var newId = "MCC-" + agora.getFullYear()
        + String(agora.getMonth()+1).padStart(2,"0")
        + String(agora.getDate()).padStart(2,"0")
        + "-" + Math.floor(Math.random()*90000+10000);

      sh.appendRow([
        newId,
        agora.toLocaleString("pt-BR"),
        nomeProduto,
        d.tipoMaterial     || "",
        d.chaveMCC         || "",
        fornecedor,
        unidadeMCC,
        novaVersao,
        d.unidadeMedida    || "kg",
        d.preco            || 0,
        d.icmsPct          || 0,
        d.deduzICMS        || "Não",
        d.frete            || 0,
        d.unidFrete        || "kg",
        d.icmsFreteP       || 0,
        d.deduzICMSFrete   || "Não",
        d.custoLiq         || 0,
        "Sim",
        d.observacoes      || ""
      ]);

      var msg = novaVersao > 1
        ? "Versão " + novaVersao + " salva. Versão anterior inativada automaticamente."
        : "Produto salvo.";

      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, message: msg, id: newId, versao: novaVersao }))
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
          unidadeMCC:     String(data[i][6]),
          versao:         Number(data[i][7])  || 1,
          unidadeMedida:  String(data[i][8]),
          preco:          Number(data[i][9])  || 0,
          icmsPct:        Number(data[i][10]) || 0,
          deduzICMS:      String(data[i][11]),
          frete:          Number(data[i][12]) || 0,
          unidFrete:      String(data[i][13]),
          icmsFreteP:     Number(data[i][14]) || 0,
          deduzICMSFrete: String(data[i][15]),
          custoLiq:       Number(data[i][16]) || 0,
          ativo:          String(data[i][17]),
          observacoes:    String(data[i][18])
        });
      }
      var filtroChave = (e.parameter.chave || "").trim().toLowerCase();
      if (filtroChave) {
        produtos = produtos.filter(function(p){ return p.chaveMCC.toLowerCase() === filtroChave; });
      }
      var filtroUnidade = (e.parameter.unidade || "").trim().toLowerCase();
      if (filtroUnidade) {
        produtos = produtos.filter(function(p){ return p.unidadeMCC.toLowerCase() === filtroUnidade; });
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
    "Aba \"" + SHEET_CUSTO_MCC + "\" criada com " + HEADERS_CUSTO_MCC.length + " colunas (v2: Unidade + Versão).\n\n" +
    "Campos novos: Unidade (MCC) e Versão.\n" +
    "Versionamento automático: ao salvar o mesmo produto/fornecedor/unidade, a versão anterior é inativada."
  );
}
