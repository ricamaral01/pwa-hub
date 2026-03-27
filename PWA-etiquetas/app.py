import datetime
from io import BytesIO

import psycopg2
import psycopg2.extras
import qrcode
from flask import Flask, jsonify, render_template_string, request, send_file
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

app = Flask(__name__)

DB_CONFIG = {
    "host": "127.0.0.1",
    "port": 5432,
    "dbname": "supervisorio_db",
    "user": "usinaapi_user",
    "password": "conectaApi#2026",
}

LBL_W = 90 * mm
LBL_H = 40 * mm
QR_SIZE = 32 * mm

DARK = (0.102, 0.122, 0.180)   # #1a1f2e
ORANGE = (0.910, 0.463, 0.165) # #e8762a


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------

def get_db():
    return psycopg2.connect(**DB_CONFIG)


@app.route("/api/massadas")
def api_massadas():
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        """
        SELECT id, produto, formula,
               TO_CHAR(data, 'DD/MM/YYYY') AS data_fmt,
               TO_CHAR(hora, 'HH24:MI:SS') AS hora_fmt,
               data::text AS data_iso,
               COALESCE(numero_serie::text, '') AS numero_serie
        FROM tbl_massadas
        WHERE data >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY data DESC, hora DESC
        LIMIT 300
        """
    )
    rows = cur.fetchall()
    conn.close()
    return jsonify(
        [
            {
                "id": r["id"],
                "produto": r["produto"],
                "formula": r["formula"],
                "data": r["data_fmt"],
                "hora": r["hora_fmt"] or "",
                "data_iso": r["data_iso"],
                "numero_serie": r["numero_serie"] or "",
            }
            for r in rows
        ]
    )


# ---------------------------------------------------------------------------
# PDF generation
# ---------------------------------------------------------------------------

def _make_qr_image(text: str) -> ImageReader:
    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_Q,
        box_size=4,
        border=1,
    )
    qr.add_data(text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return ImageReader(buf)


def _draw_label(
    c, x, y,
    traco_id, formula, produto,
    data_mold, hora_mold,
    cp_num, cp_total, idade, data_rupt,
    num_serie="",
):
    W = LBL_W
    H = LBL_H
    HEADER_H = 7 * mm
    TEXT_X = x + 2 * mm
    TEXT_AREA_W = W - QR_SIZE - 3 * mm

    # Outer border
    c.setStrokeColorRGB(*DARK)
    c.setLineWidth(0.5)
    c.rect(x, y, W, H)

    # Header strip
    c.setFillColorRGB(*DARK)
    c.rect(x, y + H - HEADER_H, W - QR_SIZE, HEADER_H, fill=1, stroke=0)

    # "CONCRETRACK" in header
    c.setFillColorRGB(*ORANGE)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(TEXT_X, y + H - HEADER_H + 1.8 * mm, "CONCRETRACK")

    # "CORPO DE PROVA" right of header
    c.setFont("Helvetica", 5)
    c.setFillColorRGB(0.6, 0.6, 0.6)
    c.drawRightString(
        x + W - QR_SIZE - 1.5 * mm,
        y + H - HEADER_H + 2.2 * mm,
        "CORPO DE PROVA",
    )

    # QR area white background
    qr_x = x + W - QR_SIZE
    c.setFillColorRGB(1, 1, 1)
    c.rect(qr_x, y, QR_SIZE, H, fill=1, stroke=0)

    # QR divider
    c.setStrokeColorRGB(*DARK)
    c.setLineWidth(0.4)
    c.line(qr_x, y, qr_x, y + H)

    # QR code image
    qr_payload = (
        f"traco={traco_id}|nome={formula}|cp={cp_num}/{cp_total}"
        f"|idade={idade}|mold={data_mold}|hora={hora_mold}|rupt={data_rupt}|serie={num_serie}"
    )
    qr_img = _make_qr_image(qr_payload)
    qr_img_size = QR_SIZE - 2 * mm
    c.drawImage(qr_img, qr_x + 1 * mm, y + (H - qr_img_size) / 2, qr_img_size, qr_img_size)

    # --- Text content ---
    content_top = y + H - HEADER_H - 2 * mm

    # Produto (muted, small)
    c.setFont("Helvetica", 5.5)
    c.setFillColorRGB(0.5, 0.5, 0.5)
    c.drawString(TEXT_X, content_top, produto.upper())

    # Formula — bold, truncate to fit
    max_w = TEXT_AREA_W
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColorRGB(*DARK)
    # Split long formula into two lines
    words = formula.split()
    line1, line2 = "", ""
    for w in words:
        test = (line1 + " " + w).strip()
        if c.stringWidth(test, "Helvetica-Bold", 7.5) <= max_w:
            line1 = test
        else:
            line2 = (line2 + " " + w).strip()
    c.drawString(TEXT_X, content_top - 4.5 * mm, line1)
    if line2:
        c.setFont("Helvetica", 6.5)
        c.drawString(TEXT_X, content_top - 8.5 * mm, line2)
        mold_y = content_top - 12 * mm
    else:
        mold_y = content_top - 9.5 * mm

    # Moldagem data + hora
    c.setFont("Helvetica", 6)
    c.setFillColorRGB(0.25, 0.25, 0.25)
    hora_short = hora_mold[:5] if hora_mold else ""
    c.drawString(TEXT_X, mold_y, f"Moldagem: {data_mold}  {hora_short}")

    # Separator
    sep_y = mold_y - 2 * mm
    c.setStrokeColorRGB(0.82, 0.82, 0.82)
    c.setLineWidth(0.3)
    c.line(TEXT_X, sep_y, x + W - QR_SIZE - 2 * mm, sep_y)

    # CP / Idade / Ruptura
    bottom_y = sep_y - 4 * mm
    c.setFont("Helvetica-Bold", 8)
    c.setFillColorRGB(*DARK)
    c.drawString(TEXT_X, bottom_y, f"CP {cp_num}/{cp_total}")

    c.setFillColorRGB(*ORANGE)
    c.drawString(TEXT_X + 16 * mm, bottom_y, f"{idade} DIAS")

    c.setFont("Helvetica", 6)
    c.setFillColorRGB(0.25, 0.25, 0.25)
    c.drawString(TEXT_X, bottom_y - 4.5 * mm, f"Ruptura: {data_rupt}")
    if num_serie:
        c.setFont("Helvetica", 6)
        c.setFillColorRGB(0.25, 0.25, 0.25)
        c.drawRightString(
            x + W - QR_SIZE - 2 * mm,
            bottom_y - 4.5 * mm,
            f"Nº {num_serie}",
        )


def _calc_ruptura(data_mold_dd_mm_yyyy: str, idade: int) -> str:
    dd, mm_d, yyyy = data_mold_dd_mm_yyyy.split("/")
    mold = datetime.date(int(yyyy), int(mm_d), int(dd))
    return (mold + datetime.timedelta(days=idade)).strftime("%d/%m/%Y")


def _build_labels(data_mold, hora_mold, idades, cps_por_idade):
    labels = []
    for idade in idades:
        rupt = _calc_ruptura(data_mold, idade)
        for cp_num in range(1, cps_por_idade + 1):
            labels.append(
                {"cp_num": cp_num, "cp_total": cps_por_idade, "idade": idade, "data_rupt": rupt}
            )
    return labels


def gerar_pdf(traco_id, formula, produto, data_mold, hora_mold, idades, cps_por_idade, num_serie="", a4=False):
    buf = BytesIO()
    labels = _build_labels(data_mold, hora_mold, idades, cps_por_idade)

    if a4:
        page_w, page_h = A4
        margin = 10 * mm
        gap = 2 * mm
        cols = max(1, int((page_w - 2 * margin + gap) / (LBL_W + gap)))
        rows_pp = max(1, int((page_h - 2 * margin + gap) / (LBL_H + gap)))
        c = canvas.Canvas(buf, pagesize=A4)
        idx = 0
        while idx < len(labels):
            for row in range(rows_pp):
                for col in range(cols):
                    if idx >= len(labels):
                        break
                    lbl = labels[idx]
                    lx = margin + col * (LBL_W + gap)
                    ly = page_h - margin - (row + 1) * LBL_H - row * gap
                    _draw_label(c, lx, ly, traco_id, formula, produto,
                                data_mold, hora_mold,
                                lbl["cp_num"], lbl["cp_total"], lbl["idade"], lbl["data_rupt"],
                                num_serie)
                    idx += 1
            if idx < len(labels):
                c.showPage()
            else:
                break
    else:
        c = canvas.Canvas(buf, pagesize=(LBL_W, LBL_H))
        for i, lbl in enumerate(labels):
            _draw_label(c, 0, 0, traco_id, formula, produto,
                        data_mold, hora_mold,
                        lbl["cp_num"], lbl["cp_total"], lbl["idade"], lbl["data_rupt"],
                        num_serie)
            if i < len(labels) - 1:
                c.showPage()

    c.save()
    buf.seek(0)
    return buf


def _parse_form(data):
    idades_raw = data.get("idades", "1,3,7,28")
    idades = [int(x.strip()) for x in str(idades_raw).split(",") if x.strip().isdigit()]
    return {
        "traco_id": data.get("id", ""),
        "formula": data.get("formula", ""),
        "produto": data.get("produto", ""),
        "data_mold": data.get("data", ""),
        "hora_mold": data.get("hora", ""),
        "idades": idades,
        "cps_por_idade": max(1, int(data.get("cps", 2))),
        "num_serie": data.get("num_serie", ""),
    }


@app.route("/pdf", methods=["POST"])
def pdf():
    p = _parse_form(request.json or request.form)
    buf = gerar_pdf(**p, a4=False)
    return send_file(buf, mimetype="application/pdf",
                     as_attachment=True, download_name="etiquetas_cp.pdf")


@app.route("/pdf-a4", methods=["POST"])
def pdf_a4():
    p = _parse_form(request.json or request.form)
    buf = gerar_pdf(**p, a4=True)
    return send_file(buf, mimetype="application/pdf",
                     as_attachment=True, download_name="etiquetas_cp_a4.pdf")


# ---------------------------------------------------------------------------
# Frontend (HTML embutido)
# ---------------------------------------------------------------------------

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Etiquetas CP — ConcreTrack</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f2f5;color:#1a1f2e;min-height:100vh}
  header{background:#1a1f2e;border-bottom:3px solid #e8762a;padding:14px 24px;display:flex;align-items:center;gap:14px}
  header h1{color:#fff;font-size:1.2rem;font-weight:700;letter-spacing:.5px}
  header span{color:#e8762a;font-size:.85rem}
  .container{max-width:680px;margin:32px auto;padding:0 16px}
  .card{background:#fff;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.08);padding:28px}
  h2{font-size:1rem;color:#1a1f2e;margin-bottom:20px;padding-bottom:10px;border-bottom:2px solid #e8762a}
  .form-group{margin-bottom:18px}
  label{display:block;font-size:.82rem;font-weight:600;color:#444;margin-bottom:6px}
  select,input[type=text],input[type=number]{
    width:100%;padding:9px 12px;border:1.5px solid #d0d5dd;border-radius:6px;
    font-size:.92rem;color:#1a1f2e;background:#fff;
    transition:border-color .2s
  }
  select:focus,input:focus{outline:none;border-color:#e8762a}
  .row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .info-box{background:#f8f9fb;border:1.5px solid #e2e6ea;border-radius:6px;padding:12px 14px;font-size:.82rem;color:#555;min-height:42px}
  .info-box strong{color:#1a1f2e}
  .actions{display:flex;gap:12px;margin-top:24px;flex-wrap:wrap}
  .btn{flex:1;padding:11px 18px;border:none;border-radius:7px;font-size:.92rem;font-weight:700;cursor:pointer;transition:opacity .2s;min-width:160px}
  .btn-primary{background:#e8762a;color:#fff}
  .btn-secondary{background:#1a1f2e;color:#fff}
  .btn:hover{opacity:.88}
  .btn:disabled{opacity:.45;cursor:not-allowed}
  .status{margin-top:14px;font-size:.82rem;color:#666;text-align:center;min-height:18px}
  .loading{display:inline-block;width:12px;height:12px;border:2px solid #e8762a;border-top-color:transparent;border-radius:50%;animation:spin .7s linear infinite;margin-right:6px;vertical-align:middle}
  @keyframes spin{to{transform:rotate(360deg)}}
  .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:.75rem;font-weight:600;background:#fff3e6;color:#e8762a;margin-left:6px}
  .preview-section{margin-top:28px;display:none}
  .preview-section h2{margin-bottom:12px}
  iframe{width:100%;height:500px;border:1px solid #e2e6ea;border-radius:6px}
</style>
</head>
<body>
<header>
  <h1>ConcreTrack</h1>
  <span>Etiquetas de Corpo de Prova</span>
</header>
<div class="container">
  <div class="card">
    <h2>Selecionar Massada <span class="badge" id="badge-count">...</span></h2>
    <div class="form-group">
      <label for="sel-data">Filtrar por data</label>
      <input type="text" id="sel-data" placeholder="DD/MM/YYYY  (vazio = últimos 7 dias)" oninput="filterSelect()">
    </div>
    <div class="form-group">
      <label for="sel-massada">Massada / Traço</label>
      <select id="sel-massada" onchange="onMassadaChange()" size="1">
        <option value="">— carregando... —</option>
      </select>
    </div>
    <div class="row" id="info-row">
      <div class="form-group">
        <label>Produto</label>
        <div class="info-box" id="info-produto">—</div>
      </div>
      <div class="form-group">
        <label>Data / Hora</label>
        <div class="info-box" id="info-datahora">—</div>
      </div>
      <div class="form-group">
        <label>Nº Série</label>
        <div class="info-box" id="info-serie">—</div>
      </div>
    </div>

    <h2>Parâmetros das Etiquetas</h2>
    <div class="row">
      <div class="form-group">
        <label for="inp-idades">Idades (dias, separados por vírgula)</label>
        <input type="text" id="inp-idades" value="1,3,7,28">
      </div>
      <div class="form-group">
        <label for="inp-cps">CPs por idade</label>
        <input type="number" id="inp-cps" value="2" min="1" max="10">
      </div>
    </div>

    <div class="actions">
      <button class="btn btn-primary" id="btn-pdf" onclick="gerarPDF(false)" disabled>
        Gerar PDF 90×40 mm
      </button>
      <button class="btn btn-secondary" id="btn-a4" onclick="gerarPDF(true)" disabled>
        Gerar PDF A4
      </button>
    </div>
    <div class="status" id="status"></div>
  </div>
</div>

<script>
let allMassadas = [];
let selected = null;

async function loadMassadas() {
  setStatus('<span class="loading"></span> Carregando massadas...');
  try {
    const r = await fetch('./api/massadas');
    allMassadas = await r.json();
    document.getElementById('badge-count').textContent = allMassadas.length;
    populateSelect(allMassadas);
    setStatus('');
  } catch(e) {
    setStatus('Erro ao carregar massadas: ' + e.message);
  }
}

function populateSelect(list) {
  const sel = document.getElementById('sel-massada');
  sel.innerHTML = '<option value="">— selecione uma massada —</option>';
  list.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.data} ${m.hora.substring(0,5)} — ${m.formula}`;
    opt.dataset.json = JSON.stringify(m);
    sel.appendChild(opt);
  });
  if (list.length === 0) {
    sel.innerHTML = '<option value="">Nenhuma massada encontrada</option>';
  }
}

function filterSelect() {
  const q = document.getElementById('sel-data').value.trim();
  const filtered = q
    ? allMassadas.filter(m => m.data.includes(q))
    : allMassadas;
  document.getElementById('badge-count').textContent = filtered.length;
  populateSelect(filtered);
  selected = null;
  updateButtons();
  clearInfo();
}

function onMassadaChange() {
  const sel = document.getElementById('sel-massada');
  const opt = sel.options[sel.selectedIndex];
  if (!opt || !opt.dataset.json) {
    selected = null;
    clearInfo();
    updateButtons();
    return;
  }
  selected = JSON.parse(opt.dataset.json);
  document.getElementById('info-produto').innerHTML = `<strong>${selected.produto}</strong>`;
  document.getElementById('info-datahora').innerHTML =
    `<strong>${selected.data}</strong>  ${selected.hora.substring(0,8)}`;
  document.getElementById('info-serie').innerHTML =
    selected.numero_serie ? `<strong>${selected.numero_serie}</strong>` : '—';
  updateButtons();
}

function clearInfo() {
  document.getElementById('info-produto').innerHTML = '—';
  document.getElementById('info-datahora').innerHTML = '—';
  document.getElementById('info-serie').innerHTML = '—';
}

function updateButtons() {
  const ok = !!selected;
  document.getElementById('btn-pdf').disabled = !ok;
  document.getElementById('btn-a4').disabled = !ok;
}

function setStatus(msg) {
  document.getElementById('status').innerHTML = msg;
}

async function gerarPDF(a4) {
  if (!selected) return;
  const idades = document.getElementById('inp-idades').value;
  const cps = document.getElementById('inp-cps').value;
  const endpoint = a4 ? './pdf-a4' : './pdf';

  setStatus('<span class="loading"></span> Gerando PDF...');
  document.getElementById('btn-pdf').disabled = true;
  document.getElementById('btn-a4').disabled = true;

  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        id: selected.id,
        formula: selected.formula,
        produto: selected.produto,
        data: selected.data,
        hora: selected.hora,
        idades: idades,
        cps: cps,
        num_serie: selected.numero_serie || ''
      })
    });
    if (!r.ok) throw new Error('Erro ' + r.status);
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = a4 ? 'etiquetas_cp_a4.pdf' : 'etiquetas_cp.pdf';
    a.click();
    URL.revokeObjectURL(url);
    const n = idades.split(',').filter(x=>x.trim()).length * parseInt(cps) * 2;
    setStatus(`✓ PDF gerado — ${n} etiquetas (${idades} dias × ${cps} CPs × 2)`);
  } catch(e) {
    setStatus('Erro ao gerar PDF: ' + e.message);
  } finally {
    updateButtons();
  }
}

loadMassadas();
</script>
</body>
</html>"""


@app.route("/")
def index():
    return render_template_string(HTML_TEMPLATE)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050, debug=False)
