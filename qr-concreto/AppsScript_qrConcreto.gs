/***************************************
 * QR → SHEETS API (Apps Script Web App)
 * - Aba: "dados"
 * - MPA/Meta como NÚMERO (pt-BR/en-US)
 * - Dashboard mobile-first (responsivo)
 * - Exportação para PostgreSQL via ?action=exportar_cp
 * - Relatório resultado-cp via ?action=listar
 *
 * COLE ESTE CÓDIGO INTEIRO no Apps Script da planilha:
 * https://docs.google.com/spreadsheets/d/1eC2DGsEUKkX22A0IUaYvUcEj9xbzZr7K-7Eus0iSavw/
 *
 * Depois: Implantar → Nova implantação → App da Web
 ***************************************/

const SPREADSHEET_ID = "1eC2DGsEUKkX22A0IUaYvUcEj9xbzZr7K-7Eus0iSavw";
const SHEET_NAME = "dados";
const VPS_API_URL = "http://31.97.241.84:8086/api/v1/rompimentos";

const HEADERS = [
  "ID (chave)",
  "Timestamp",
  "Traço_ID",
  "Data_Moldagem",
  "Hora_Moldagem",
  "Idade_dias",
  "CP",
  "Data_Ruptura",
  "MPA",
  "Status_Meta",
  "Meta_Min",
  "Meta_Max",
  "Responsavel",
  "QR_Raw"
];

/** Meta Min/Max por idade (Idade_dias) */
const META_FAIXA = {
  1:  { min: 8,  max: 14 },
  3:  { min: 16, max: 24 },
  7:  { min: 22, max: 32 },
  28: { min: 32, max: 42 }
};

/* ============== UTIL ============== */
function parseNumberPt_(v) {
  if (v === null || v === undefined) return null;
  const s0 = String(v).trim();
  if (!s0) return null;
  let s = s0.replace(/[^0-9,.\-]/g, "");
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(",", ".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function getSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) throw new Error(`Aba "${SHEET_NAME}" não encontrada.`);
  return sh;
}

function ensureHeaders_(sh) {
  const lastCol = HEADERS.length;
  const lastRow = sh.getLastRow();
  if (lastRow === 0) {
    sh.getRange(1, 1, 1, lastCol).setValues([HEADERS]);
    return;
  }
  const first = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  if (first.join("||") !== HEADERS.join("||")) {
    sh.insertRowBefore(1);
    sh.getRange(1, 1, 1, lastCol).setValues([HEADERS]);
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function calcStatusMeta_(idadeDias, mpaNum) {
  const idade = Number(idadeDias);
  const meta = META_FAIXA[idade];
  if (!meta || mpaNum === null) return { status: "", min: "", max: "" };
  if (mpaNum < meta.min) return { status: "ABAIXO", min: meta.min, max: meta.max };
  if (mpaNum > meta.max) return { status: "ACIMA",  min: meta.min, max: meta.max };
  return { status: "DENTRO", min: meta.min, max: meta.max };
}

function syncRompimentoToVps_(payload) {
  try {
    const response = UrlFetchApp.fetch(VPS_API_URL, {
      method: 'post',
      contentType: 'application/json; charset=utf-8',
      muteHttpExceptions: true,
      payload: JSON.stringify(payload),
    });
    const text = response.getContentText() || '';
    let data = null;
    try { data = JSON.parse(text); } catch (err) {}
    if (response.getResponseCode() >= 200 && response.getResponseCode() < 300 && data && data.ok) {
      return { ok: true, code: response.getResponseCode(), data: data };
    }
    return { ok: false, code: response.getResponseCode(), error: (data && data.error) || text || 'Falha no sync VPS' };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/* ============== WEB APP ============== */
function doGet(e) {
  const view   = (e && e.parameter && e.parameter.view)   ? String(e.parameter.view)   : "";
  const action = (e && e.parameter && e.parameter.action) ? String(e.parameter.action) : "";

  /* ---- listar: para resultado-cp.html ---- */
  if (action === "listar") {
    try {
      const sh   = getSheet_();
      const data = sh.getDataRange().getValues();
      if (data.length < 2) return json_({ ok: true, rows: [] });

      const headers = data[0].map(function(h){ return String(h).trim(); });
      const rows = [];
      for (let i = 1; i < data.length; i++) {
        const row = {};
        headers.forEach(function(h, j){
          const cell = data[i][j];
          row[h] = (cell !== null && cell !== undefined) ? String(cell) : "";
        });
        // mapeia para os campos esperados pelo resultado-cp.html
        row["traco_id"]      = row["Traço_ID"]      || row["traco_id"]      || "";
        row["traco_nome"]    = row["Traço_ID"]      || "";   // usa ID como nome se não houver
        row["cp"]            = row["CP"]             || row["cp"]            || "";
        row["idade_dias"]    = row["Idade_dias"]     || row["idade_dias"]    || "";
        row["data_moldagem"] = row["Data_Moldagem"]  || row["data_moldagem"] || "";
        row["hora_moldagem"] = row["Hora_Moldagem"]  || row["hora_moldagem"] || "";
        row["data_ruptura"]  = row["Data_Ruptura"]   || row["data_ruptura"]  || "";
        row["mpa"]           = row["MPA"]            || row["mpa"]           || "";
        row["status_meta"]   = row["Status_Meta"]    || row["status_meta"]   || "";
        row["meta_min"]      = row["Meta_Min"]       || row["meta_min"]      || "";
        row["meta_max"]      = row["Meta_Max"]       || row["meta_max"]      || "";
        row["operador"]      = row["Responsavel"]    || row["operador"]      || "";
        row["timestamp"]     = row["Timestamp"]      || row["timestamp"]     || "";

        if (row["timestamp"] || row["mpa"]) rows.push(row);
      }
      return json_({ ok: true, rows: rows });
    } catch(err) {
      return json_({ ok: false, error: String(err) });
    }
  }

  /* ---- exportar_cp: para PostgreSQL ---- */
  if (action === "exportar_cp") {
    return exportarCP_();
  }

  /* ---- dashboard ---- */
  if (view === "dashboard") {
    return HtmlService.createHtmlOutput(getDashboardHtml_())
      .setTitle("Dashboard • Controle Tecnológico");
  }

  return ContentService
    .createTextOutput("OK - QR API online. Use ?view=dashboard para o painel.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    if (!e?.postData?.contents) return json_({ ok:false, error:"POST sem corpo" });
    const body = JSON.parse(e.postData.contents);

    const sh = getSheet_();
    ensureHeaders_(sh);

    const mpaNum = parseNumberPt_(body.mpa);
    const idade = body.idade_dias ?? "";

    const auto = calcStatusMeta_(idade, mpaNum);
    const statusMeta = (body.status_meta || auto.status || "");
    const metaMin = (body.meta_min !== undefined && body.meta_min !== null) ? parseNumberPt_(body.meta_min) : auto.min;
    const metaMax = (body.meta_max !== undefined && body.meta_max !== null) ? parseNumberPt_(body.meta_max) : auto.max;

    const rowIndex = sh.getLastRow() + 1;

    const row = [
      Utilities.getUuid(),
      body.timestamp || new Date().toISOString(),
      body.traco_id || "",
      body.data_moldagem || "",
      body.hora_moldagem || "",
      idade,
      body.cp || "",
      body.data_ruptura || "",
      (mpaNum === null ? "" : mpaNum),
      statusMeta,
      (metaMin === null || metaMin === undefined ? "" : metaMin),
      (metaMax === null || metaMax === undefined ? "" : metaMax),
      body.operador || "",
      body.qr_raw || ""
    ];

    sh.getRange(rowIndex, 1, 1, HEADERS.length).setValues([row]);

    const colMPA = HEADERS.indexOf("MPA") + 1;
    const colMin = HEADERS.indexOf("Meta_Min") + 1;
    const colMax = HEADERS.indexOf("Meta_Max") + 1;
    sh.getRange(rowIndex, colMPA).setNumberFormat("0.00");
    sh.getRange(rowIndex, colMin).setNumberFormat("0.00");
    sh.getRange(rowIndex, colMax).setNumberFormat("0.00");

    const vpsSync = syncRompimentoToVps_({
      id: row[0],
      source: 'apps-script-qr-concreto',
      timestamp: row[1],
      traco_id: row[2],
      data_moldagem: row[3],
      hora_moldagem: row[4],
      idade_dias: row[5],
      cp: row[6],
      data_ruptura: row[7],
      mpa: row[8],
      status_meta: row[9],
      meta_min: row[10],
      meta_max: row[11],
      operador: row[12],
      qr_raw: row[13]
    });

    return json_({ ok:true, vps_sync: vpsSync });

  } catch (err) {
    return json_({ ok:false, error:String(err) });
  }
}

/* ============== EXPORTAR PARA POSTGRESQL ============== */
function exportarCP_() {
  const sh = getSheet_();
  ensureHeaders_(sh);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return json_({ total: 0, rows: [] });

  const data = sh.getDataRange().getValues();
  const tz = "America/Sao_Paulo";

  const rows = data.slice(1).filter(r => r[0]).map(r => ({
    id:             String(r[0]),
    timestamp:      String(r[1] || ""),
    traco_id:       String(r[2] || ""),
    data_moldagem:  (r[3] instanceof Date) ? Utilities.formatDate(r[3], tz, "yyyy-MM-dd") : String(r[3] || ""),
    hora_moldagem:  String(r[4] || ""),
    idade_dias:     r[5],
    cp:             String(r[6] || ""),
    data_ruptura:   (r[7] instanceof Date) ? Utilities.formatDate(r[7], tz, "yyyy-MM-dd") : String(r[7] || ""),
    mpa:            r[8],
    status_meta:    String(r[9] || ""),
    meta_min:       r[10],
    meta_max:       r[11],
    responsavel:    String(r[12] || ""),
    qr_raw:         String(r[13] || "")
  }));

  return json_({ total: rows.length, rows: rows });
}

/* ============== DASH DATA API ============== */
function getDashboardRaw_() {
  const sh = getSheet_();
  ensureHeaders_(sh);

  const lastRow = sh.getLastRow();
  if (lastRow < 2) return { ok:true, rows:[], lastUpdateIso:"" };

  const nMax = 5000;
  const n = Math.min(lastRow - 1, nMax);
  const startRow = lastRow - n + 1;

  const values = sh.getRange(startRow, 1, n, HEADERS.length).getValues();
  const idx = {};
  HEADERS.forEach((h,i)=> idx[h]=i);

  const rows = values.map(r => ({
    ts: String(r[idx["Timestamp"]] || ""),
    traco: String(r[idx["Traço_ID"]] || ""),
    idade: String(r[idx["Idade_dias"]] || ""),
    cp: String(r[idx["CP"]] || ""),
    mpa: (r[idx["MPA"]] === "" || r[idx["MPA"]] === null) ? "" : Number(r[idx["MPA"]]),
    status: String(r[idx["Status_Meta"]] || ""),
    min: (r[idx["Meta_Min"]] === "" || r[idx["Meta_Min"]] === null) ? "" : Number(r[idx["Meta_Min"]]),
    max: (r[idx["Meta_Max"]] === "" || r[idx["Meta_Max"]] === null) ? "" : Number(r[idx["Meta_Max"]]),
    op: String(r[idx["Responsavel"]] || "")
  }));

  let lastUpdateIso = "";
  for (let i = values.length - 1; i >= 0; i--) {
    const v = values[i][idx["Timestamp"]];
    if (v) { lastUpdateIso = String(v); break; }
  }

  return { ok:true, rows, lastUpdateIso };
}

/* ============== DASHBOARD HTML ============== */
function getDashboardHtml_() {
  return `<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
  <title>Dashboard • Controle Tecnológico</title>
  <style>
    :root{
      --bg1:#0b1220; --bg2:#0f1724;
      --card: rgba(17,26,51,.92);
      --line: rgba(255,255,255,.10);
      --text:#f3f6ff; --muted:#a9b4d0;
      --ok:#22c55e; --warn:#f59e0b; --err:#ef4444;
      --shadow: 0 16px 40px rgba(0,0,0,.45);
    }
    *{ box-sizing:border-box; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; }
    body{ margin:0; color:var(--text); background: linear-gradient(180deg,var(--bg1),var(--bg2)); }
    .wrap{ max-width: 980px; margin:0 auto; padding: 14px; padding-bottom: 40px; }
    .top{ display:flex; gap:10px; align-items:flex-end; justify-content:space-between; flex-wrap:wrap; }
    .h1{ font-size: 22px; font-weight: 1000; margin: 6px 0 2px; }
    .sub{ color:var(--muted); margin:0; font-size: 13px; font-weight: 800; }
    .pill{
      display:inline-flex; gap:8px; align-items:center;
      padding:10px 12px; border-radius:999px;
      border:1px solid var(--line); background: rgba(0,0,0,.18);
      font-weight: 1000; font-size: 12px; color: var(--muted);
    }
    .dot{ width:10px; height:10px; border-radius:999px; background: var(--muted); }
    .dot.ok{ background: var(--ok); }
    .dot.warn{ background: var(--warn); }
    .dot.err{ background: var(--err); }
    .grid{
      display:grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-top: 12px;
    }
    @media(min-width:720px){
      .grid{ grid-template-columns: repeat(4, 1fr); }
    }
    .card{
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 12px;
      box-shadow: var(--shadow);
    }
    .k{ color: var(--muted); font-size: 12px; font-weight: 900; }
    .v{ font-size: 26px; font-weight: 1000; margin-top: 6px; }
    .v.small{ font-size: 20px; }
    .filters{
      display:grid;
      grid-template-columns: 1fr;
      gap: 10px;
      margin-top: 10px;
    }
    @media(min-width:720px){
      .filters{ grid-template-columns: 1fr 1fr 1fr; }
    }
    label{ display:block; color: var(--muted); font-size: 12px; font-weight: 1000; margin-bottom: 6px; }
    select{
      width:100%;
      padding: 12px 12px;
      border-radius: 14px;
      border: 1px solid var(--line);
      background: rgba(0,0,0,.22);
      color: var(--text);
      font-weight: 1000;
      outline: none;
    }
    .winRow{ display:flex; gap:10px; flex-wrap:wrap; margin-top: 10px; }
    .btn{
      padding: 10px 14px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: rgba(0,0,0,.22);
      color: var(--text);
      font-weight: 1000;
      cursor: pointer;
      user-select:none;
      font-size: 13px;
    }
    .btn.sel{ outline: 3px solid rgba(96,165,250,.75); }
    .split{
      display:grid;
      grid-template-columns: 1fr;
      gap: 10px;
      margin-top: 10px;
    }
    @media(min-width:720px){
      .split{ grid-template-columns: 1fr 1fr; }
    }
    .bars{ display:grid; gap:10px; margin-top: 8px; }
    .bar{
      display:grid;
      grid-template-columns: 92px 1fr 70px;
      gap: 10px;
      align-items:center;
      padding: 10px;
      border-radius: 14px;
      border:1px solid var(--line);
      background: rgba(0,0,0,.15);
    }
    .bar .lbl{ font-weight: 1000; color: var(--text); font-size: 13px; }
    .track{ height: 12px; border-radius: 999px; background: rgba(255,255,255,.08); overflow:hidden; }
    .fill{ height:100%; width: 0%; background: var(--ok); }
    .pct{ text-align:right; font-weight: 1000; color: var(--muted); font-size: 12px; }
    table{ width:100%; border-collapse: collapse; }
    th,td{ padding: 10px; border-bottom:1px solid rgba(255,255,255,.08); font-size: 12px; }
    th{ color: var(--muted); font-weight: 1000; text-transform: uppercase; letter-spacing: .04em; }
    .tag{
      display:inline-flex; align-items:center; gap:6px;
      padding: 5px 10px; border-radius: 999px;
      border: 1px solid rgba(255,255,255,.12);
      font-weight: 1000;
    }
    .tag.ok{ border-color: rgba(34,197,94,.45); }
    .tag.warn{ border-color: rgba(245,158,11,.45); }
    .tag.err{ border-color: rgba(239,68,68,.45); }
    .mono{ font-variant-numeric: tabular-nums; }
    .muted{ color: var(--muted); }
    .errBox{
      display:none;
      padding:12px;
      border-radius:14px;
      border:1px solid rgba(239,68,68,.45);
      background: rgba(239,68,68,.12);
      font-weight: 1000;
      white-space: pre-wrap;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <div>
        <div class="h1">📊 Dashboard • Controle Tecnológico</div>
        <p class="sub">Legível no celular • Atualiza sozinho (10s) • Filtros por Traço e Operador</p>
      </div>
      <div class="pill"><span id="dot" class="dot"></span><span id="upd" class="mono">última: —</span></div>
    </div>
    <div id="err" class="errBox"></div>
    <div class="grid">
      <div class="card"><div class="k">Registros (janela)</div><div id="k_total" class="v mono">—</div></div>
      <div class="card"><div class="k">% dentro</div><div id="k_inside" class="v mono">—</div></div>
      <div class="card"><div class="k">Abaixo</div><div id="k_below" class="v mono">—</div></div>
      <div class="card"><div class="k">Acima</div><div id="k_above" class="v mono">—</div></div>
    </div>
    <div class="filters">
      <div class="card">
        <label>Filtro: Traço_ID</label>
        <select id="f_traco"></select>
      </div>
      <div class="card">
        <label>Filtro: Operador</label>
        <select id="f_op"></select>
      </div>
      <div class="card">
        <label>Janela</label>
        <select id="f_mode">
          <option value="age" selected>Por Idade (Idade_dias)</option>
          <option value="time">Por Tempo (últimos dias)</option>
        </select>
      </div>
    </div>
    <div class="winRow" id="winRow">
      <div class="btn sel" data-win="1">24h / 1d</div>
      <div class="btn" data-win="3">3d</div>
      <div class="btn" data-win="7">7d</div>
      <div class="btn" data-win="28">28d</div>
    </div>
    <div class="split">
      <div class="card">
        <div class="k">Pass/Fail (ABAIXO / DENTRO / ACIMA)</div>
        <div class="grid" style="grid-template-columns:1fr 1fr 1fr; margin-top:10px;">
          <div class="card" style="box-shadow:none;">
            <div class="k">ABAIXO</div><div id="s_below" class="v small mono">—</div>
          </div>
          <div class="card" style="box-shadow:none;">
            <div class="k">DENTRO</div><div id="s_inside" class="v small mono">—</div>
          </div>
          <div class="card" style="box-shadow:none;">
            <div class="k">ACIMA</div><div id="s_above" class="v small mono">—</div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="k">% dentro do esperado por Idade</div>
        <div id="bars" class="bars"></div>
        <div class="muted" style="margin-top:8px; font-size:12px; font-weight:900;">
          * No modo "Por Idade", a janela pega exatamente Idade_dias = 1/3/7/28.
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:10px;">
      <div class="k" style="margin-bottom:8px;">Últimos registros (filtrados)</div>
      <div style="overflow:auto;">
        <table>
          <thead>
            <tr>
              <th>TS</th><th>Traço</th><th>Op</th><th>Idade</th><th>CP</th><th>MPA</th><th>Status</th><th>Faixa</th>
            </tr>
          </thead>
          <tbody id="tb"></tbody>
        </table>
      </div>
    </div>
  </div>
<script>
let RAW = [];
let lastSeen = "";
let currentWin = 1;
const $ = (id)=>document.getElementById(id);
function showErr(msg){
  $("err").style.display = "block";
  $("err").textContent = "ERRO NO DASHBOARD:\\n" + msg;
}
function uniq(arr){ return Array.from(new Set(arr)).filter(x=>String(x).trim().length).sort(); }
function fillSelect(el, values, allLabel){
  el.innerHTML = "";
  const all = document.createElement("option");
  all.value = ""; all.textContent = allLabel;
  el.appendChild(all);
  values.forEach(v=>{
    const o = document.createElement("option");
    o.value = v; o.textContent = v;
    el.appendChild(o);
  });
}
function parseTS(ts){
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}
function getMode(){ return $("f_mode").value; }
function getTraco(){ return $("f_traco").value; }
function getOp(){ return $("f_op").value; }
document.querySelectorAll("#winRow .btn").forEach(b=>{
  b.addEventListener("click", ()=>{
    currentWin = Number(b.dataset.win);
    document.querySelectorAll("#winRow .btn").forEach(x=>{
      x.classList.toggle("sel", Number(x.dataset.win) === currentWin);
    });
    renderAll();
  });
});
$("f_traco").addEventListener("change", renderAll);
$("f_op").addEventListener("change", renderAll);
$("f_mode").addEventListener("change", renderAll);
function applyFilters(){
  const traco = getTraco();
  const op = getOp();
  const mode = getMode();
  const now = new Date();
  const msWindow = currentWin * 24 * 60 * 60 * 1000;
  return RAW.filter(r=>{
    if (traco && r.traco !== traco) return false;
    if (op && r.op !== op) return false;
    if (mode === "age"){
      return Number(r.idade) === currentWin;
    } else {
      const dt = parseTS(r.ts);
      if(!dt) return false;
      return (now - dt) <= msWindow;
    }
  });
}
function computeKPIs(rows){
  let total = rows.length, below=0, inside=0, above=0;
  rows.forEach(r=>{
    const st = String(r.status||"").toUpperCase();
    if(st === "ABAIXO") below++;
    else if(st === "DENTRO") inside++;
    else if(st === "ACIMA") above++;
  });
  return { total, below, inside, above, pctInside: total ? inside/total : 0 };
}
function groupAgePct(rows){
  const map = new Map();
  rows.forEach(r=>{
    const idade = String(r.idade||"");
    if(!idade) return;
    if(!map.has(idade)) map.set(idade,{ idade, total:0, inside:0 });
    const g = map.get(idade);
    g.total++;
    if(String(r.status||"").toUpperCase() === "DENTRO") g.inside++;
  });
  return Array.from(map.values()).sort((a,b)=>Number(a.idade)-Number(b.idade));
}
function renderBars(groups){
  const host = $("bars");
  host.innerHTML = "";
  if(!groups.length){
    host.innerHTML = '<div class="muted" style="font-weight:1000;">Sem dados nesta janela/filtro.</div>';
    return;
  }
  groups.forEach(g=>{
    const pct = g.total ? Math.round((g.inside/g.total)*100) : 0;
    const row = document.createElement("div");
    row.className = "bar";
    row.innerHTML = \`
      <div class="lbl">Idade ${g.idade}d</div>
      <div class="track"><div class="fill" style="width:${pct}%"></div></div>
      <div class="pct mono">${pct}%</div>
    \`;
    host.appendChild(row);
  });
}
function renderTable(rows){
  const tb = $("tb");
  tb.innerHTML = "";
  const last = rows.slice().sort((a,b)=> (a.ts < b.ts ? 1 : -1)).slice(0, 30);
  last.forEach(r=>{
    const st = String(r.status||"").toUpperCase();
    let cls = "";
    if(st==="DENTRO") cls="ok";
    else if(st==="ABAIXO") cls="err";
    else if(st==="ACIMA") cls="warn";
    const faixa = (r.min!=="" && r.max!=="") ? (r.min + "–" + r.max) : "";
    const tr = document.createElement("tr");
    tr.innerHTML = \`
      <td class="mono">${r.ts}</td>
      <td class="mono">${r.traco}</td>
      <td>${r.op}</td>
      <td class="mono">${r.idade}</td>
      <td class="mono">${r.cp}</td>
      <td><span class="tag ${cls} mono">${(r.mpa!=="" ? r.mpa.toFixed(2) : "")}</span></td>
      <td><span class="tag ${cls}">${r.status}</span></td>
      <td class="mono muted">${faixa}</td>
    \`;
    tb.appendChild(tr);
  });
}
function hydrateFilters(){
  fillSelect($("f_traco"), uniq(RAW.map(r=>r.traco)), "Todos os Traços");
  fillSelect($("f_op"), uniq(RAW.map(r=>r.op)), "Todos os Operadores");
}
function setUpdateLabel(ts){
  $("upd").textContent = "última: " + (ts || "—");
  const dot = $("dot");
  dot.className = "dot";
  if(!ts) return;
  dot.classList.add("ok");
}
function renderAll(){
  const rows = applyFilters();
  const k = computeKPIs(rows);
  $("k_total").textContent = String(k.total);
  $("k_inside").textContent = Math.round(k.pctInside*100) + "%";
  $("k_below").textContent = String(k.below);
  $("k_above").textContent = String(k.above);
  $("s_below").textContent = String(k.below);
  $("s_inside").textContent = String(k.inside);
  $("s_above").textContent = String(k.above);
  renderBars(groupAgePct(rows));
  renderTable(rows);
}
function loadRaw(){
  google.script.run
    .withSuccessHandler((data)=>{
      if(!data || !data.ok) { showErr("Resposta inválida do servidor."); return; }
      RAW = data.rows || [];
      setUpdateLabel(data.lastUpdateIso || "");
      if(!lastSeen){
        hydrateFilters();
        renderAll();
        lastSeen = data.lastUpdateIso || "";
        return;
      }
      if(data.lastUpdateIso && data.lastUpdateIso !== lastSeen){
        hydrateFilters();
        renderAll();
        lastSeen = data.lastUpdateIso;
      }
    })
    .withFailureHandler((err)=>{
      showErr(String(err));
    })
    .getDashboardRaw_();
}
loadRaw();
setInterval(loadRaw, 10000);
</script>
</body>
</html>`;
}
