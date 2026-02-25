const CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbzgro8m_TssbzMo_5OWcF98_2nuZndVOIGrGs3hKF6iHvNJ-rthNQQQTo-KYY15yUdx/exec"
};

const el = (id) => document.getElementById(id);

const frm = el("frm");
const statusPill = el("statusPill");
const btnEnviar = el("btnEnviar");
const btnAgora = el("btnAgora");
const btnLimpar = el("btnLimpar");

const pv = {
  temp: el("pvTemp"),
  umid: el("pvUmid"),
  nivel: el("pvNivel"),
  cura: el("pvCura"),
  match: el("pvMatch"),
  diff: el("pvDiff")
};

function setPill(kind, text) {
  statusPill.className = "pill " + (kind || "neutral");
  statusPill.textContent = text;
}

function pad2(n) { return String(n).padStart(2, "0"); }

function setNow() {
  const d = new Date();
  el("data").value = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  el("hora").value = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function clearPreview() {
  pv.temp.textContent = "—";
  pv.umid.textContent = "—";
  pv.nivel.textContent = "—";
  pv.cura.textContent = "—";
  pv.match.textContent = "—";
  pv.diff.textContent = "—";
}

function setActive(group, value) {
  document.querySelectorAll(`.segBtn[data-group="${group}"]`).forEach(b => {
    b.classList.toggle("active", b.dataset.value === value);
  });
  if (group === "resultado") el("resultado").value = value;
  if (group === "cp") el("cp").value = value;
}

document.querySelectorAll(".segBtn").forEach(btn => {
  btn.addEventListener("click", () => {
    setActive(btn.dataset.group, btn.dataset.value);
  });
});

// ===== Preview =====
let previewTimer = null;

async function fetchPreview() {
  const data = el("data").value;
  const hora = el("hora").value;
  if (!data || !hora) return;

  setPill("neutral", "Buscando clima...");

  const url = `${CONFIG.API_URL}?action=preview&data=${encodeURIComponent(data)}&hora=${encodeURIComponent(hora)}`;

  try {
    const res = await fetch(url);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "Preview ok=false");

    const p = json.preview;
    pv.temp.textContent = (p.temperatura ?? "—") + " °C";
    pv.umid.textContent = (p.umidade ?? "—") + " %";
    pv.nivel.textContent = p.nivel_de_risco ?? "—";
    pv.cura.textContent = p.risco_de_cura ?? "—";
    pv.match.textContent = p.matched_datahora ? new Date(p.matched_datahora).toLocaleString("pt-BR") : "—";
    pv.diff.textContent = (p.diff_minutes ?? "—") + " min";

    setPill("ok", "Pronto");
  } catch (err) {
    console.error(err);
    clearPreview();
    setPill("bad", "Erro preview");
  }
}

function schedulePreview() {
  if (previewTimer) clearTimeout(previewTimer);
  previewTimer = setTimeout(fetchPreview, 250);
}

el("data").addEventListener("change", schedulePreview);
el("hora").addEventListener("change", schedulePreview);

btnAgora.addEventListener("click", () => {
  setNow();
  schedulePreview();
});

btnLimpar.addEventListener("click", () => {
  frm.reset();
  clearPreview();
  setNow();

  setActive("resultado", "");
  setActive("cp", "");
  el("resultado").value = "";
  el("cp").value = "";

  setPill("neutral", "Pronto");
  schedulePreview();
});

// ===== Salvar (via GET) =====
async function saveViaGet(payload) {
  const qs =
    `action=save` +
    `&data=${encodeURIComponent(payload.data)}` +
    `&hora=${encodeURIComponent(payload.hora)}` +
    `&lote=${encodeURIComponent(payload.lote)}` +
    `&traco=${encodeURIComponent(payload.traco)}` +
    `&flow_mm=${encodeURIComponent(String(payload.flow_mm))}` +
    `&resultado=${encodeURIComponent(payload.resultado)}` +
    `&corpo_de_prova=${encodeURIComponent(payload.corpo_de_prova)}`;

  const url = `${CONFIG.API_URL}?${qs}`;

  const res = await fetch(url);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Falha ao salvar");
  return json;
}

frm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!el("resultado").value) return alert("Selecione o Resultado (Aprovado/Reprovado).");
  if (!el("cp").value) return alert("Selecione Corpo de Prova (Sim/Não).");

  btnEnviar.disabled = true;
  setPill("neutral", "Salvando...");

  const payload = {
    data: el("data").value,
    hora: el("hora").value,
    lote: el("lote").value.trim(),
    traco: el("traco").value.trim(),
    flow_mm: Number(el("flow").value),
    resultado: el("resultado").value,
    corpo_de_prova: el("cp").value
  };

  try {
    const out = await saveViaGet(payload);
    await fetchPreview();

    setPill("ok", "Salvo ✅");

    alert(
      "Salvo ✅\n" +
      `Temp: ${out.saved.temperatura}°C | Umid: ${out.saved.umidade}%\n` +
      `Nível: ${out.saved.nivel_de_risco} | Cura: ${out.saved.risco_de_cura}`
    );

    const keepData = el("data").value;
    const keepHora = el("hora").value;

    frm.reset();
    clearPreview();
    el("data").value = keepData;
    el("hora").value = keepHora;

    setActive("resultado", "");
    setActive("cp", "");
    el("resultado").value = "";
    el("cp").value = "";

    schedulePreview();
  } catch (err) {
    console.error(err);
    setPill("bad", "Erro ❌");
    alert("Erro ao salvar: " + err.message);
  } finally {
    btnEnviar.disabled = false;
  }
});

// init
setNow();
clearPreview();
setPill("neutral", "Pronto");
schedulePreview();
