const STORAGE_KEY = "pwa_liberacao_inspecao_v1";
const SUBMIT_LOCKS_KEY = "pwa_liberacao_submit_locks_v1";
const CLICKED_FORMS_KEY = "pwa_formas_clicadas_hoje";
const MONTAGEM_POSTES_KEY = "pwa_montagem_postes_v1";
const AUTH_SESSION_KEY = "pwa_mapa_auth_session_v1";

const ROLE_PERMISSIONS = {
  GERENCIA: {
    label: "Gerência",
    modes: ["DASHBOARD", "LIBERACAO", "INSPECAO", "MONTAGEM_POSTES", "RELATORIO", "HISTORICO", "ACOMPANHAMENTO", "ACMP_CONCRETAGEM", "USUARIOS"]
  },
  GESTOR: {
    label: "Gestor",
    modes: ["DASHBOARD", "MONTAGEM_POSTES"]
  },
  MONTADOR: {
    label: "Montador",
    modes: ["LIBERACAO", "MONTAGEM_POSTES"]
  }
};

const MONTAGEM_CHECKLIST_SECTIONS = [
  {
    id: "inspecao_visual",
    titulo: "Inspeção visual",
    itens: [
      { id: "falhas_preenchimento", texto: "Falhas de preenchimento" },
      { id: "excesso_bolhas", texto: "Excesso de bolhas" },
      { id: "rebarbas", texto: "Rebarbas" },
      { id: "fissuras", texto: "Fissuras" },
      { id: "ausencia_buchas", texto: "Ausência de buchas" },
      { id: "ausencia_prisioneiro", texto: "Ausência de prisioneiro" }
    ]
  },
  {
    id: "inspecao_tubulacao",
    titulo: "Checklist Inspeção Tubulação",
    itens: [
      { id: "entrada", texto: "Entrada" },
      { id: "saida_aerea", texto: "Saída aérea" },
      { id: "saida_subterranea", texto: "Saída subterrânea" }
    ]
  }
];

function getClickedFormsToday() {
  const raw = localStorage.getItem(CLICKED_FORMS_KEY);
  if (!raw) return { dia: "", formas: {} };
  try {
    const parsed = JSON.parse(raw);
    const hoje = new Date().toLocaleDateString("pt-BR");
    if (parsed.dia !== hoje) return { dia: hoje, formas: {} };
    return parsed;
  } catch { return { dia: "", formas: {} }; }
}

function markFormaClicked(forma, setor) {
  const data = getClickedFormsToday();
  data.dia = new Date().toLocaleDateString("pt-BR");
  const key = setor + "||" + normalizeUpper(forma);
  data.formas[key] = true;
  localStorage.setItem(CLICKED_FORMS_KEY, JSON.stringify(data));
}

function isFormaClicked(forma, setor) {
  const data = getClickedFormsToday();
  const key = setor + "||" + normalizeUpper(forma);
  return !!data.formas[key];
}
const CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbx83KmaFs3O3_RqfThs_0SCnaMBc3mb-RP30QKvtfJuEfnqft4eaFQVgYwuHxx3F-RttQ/exec",
  MONTAGEM_API_URL: "https://script.google.com/macros/s/AKfycbz6m9a2w1aRIGcw9_yZoocwQdcCRLdm4yldeeGSEEb_d6PJBYfJ3utvD0Pyat0STVvgYQ/exec"
};

const CHECKLIST_INSPECAO_CODIGOS = [
  { codigo: "A", descricao: "Falha na Concretagem" },
  { codigo: "B", descricao: "Cano entupido" },
  { codigo: "C", descricao: "Excesso de Bolhas" },
  { codigo: "D", descricao: "Problema na caixa do Relógio ou Disjuntor" },
  { codigo: "E", descricao: "Furos Obstruídos ou Faltando" },
  { codigo: "F", descricao: "Identificação do poste (Carimbos)" },
  { codigo: "G", descricao: "Presença de Trincas" },
  { codigo: "H", descricao: "Bolha nas caixas" },
  { codigo: "I", descricao: "Trincas em toda a extensão do Poste" },
  { codigo: "J", descricao: "Pequenas Avarias" },
  { codigo: "K", descricao: "Manchas Brancas Superficiais" },
  { codigo: "L", descricao: "Buchas das cxs e/ou Buchas fixação abraç. EDP" },
  { codigo: "M", descricao: "Parafuso Lacre da caixa do Medidor" }
];

const SETOR_1_LEFT_FORMS = [
  { forma: "IE-01", modelo: "3 CXS VL" },
  { forma: "BD-01", modelo: "1 CX VL" },
  { forma: "BD-02", modelo: "1 CX VL" },
  { forma: "BD-03", modelo: "1 CX VL" },
  { forma: "BD-04", modelo: "1 CX VL" },
  { forma: "BD-05", modelo: "1 CX VL" },
  { forma: "BD-06", modelo: "1 CX VL" },
  { forma: "BD-07", modelo: "1 CX VL" },
  { forma: "BD-08", modelo: "1 CX VL" },
  { forma: "BD-09", modelo: "1 CX VL" },
  { forma: "BD-10", modelo: "1 CX VL" },
  { forma: "BD-11", modelo: "1 CX VL" },
  { forma: "BD-12", modelo: "1 CX VL" },
  { forma: "BD-13", modelo: "1 CX VL" },
  { forma: "BD-14", modelo: "1 CX VL" },
  { forma: "BD-15", modelo: "1 CX VL" },
  { forma: "AE-27", modelo: "1 CX VR" },
  { forma: "AE-26", modelo: "1 CX VR" },
  { forma: "AE-25", modelo: "1 CX VR" },
  { forma: "AE-24", modelo: "1 CX VR" },
  { forma: "AE-23", modelo: "1 CX VR" },
  { forma: "AE-22", modelo: "1 CX VR" },
  { forma: "AE-21", modelo: "1 CX VR" },
  { forma: "AE-20", modelo: "1 CX VR" },
  { forma: "AE-19", modelo: "1 CX VR" },
  { forma: "AE-18", modelo: "1 CX VR" },
  { forma: "AE-17", modelo: "1 CX VR" },
  { forma: "AE-16", modelo: "1 CX VR" },
  { forma: "AE-15", modelo: "1 CX VR" },
  { forma: "AE-14", modelo: "1 CX VR" },
  { forma: "AE-13", modelo: "1 CX VR" },
  { forma: "AE-12", modelo: "1 CX VR" },
  { forma: "AE-11", modelo: "1 CX VR" },
  { forma: "AE-10", modelo: "1 CX VR" },
  { forma: "AE-09", modelo: "1 CX VR" },
  { forma: "AE-08", modelo: "1 CX VR" },
  { forma: "AE-07", modelo: "1 CX VR" },
  { forma: "AE-06", modelo: "1 CX VR" },
  { forma: "AE-05", modelo: "1 CX VR" },
  { forma: "AE-04", modelo: "1 CX VR" },
  { forma: "AE-03", modelo: "1 CX VR" },
  { forma: "AE-02", modelo: "1 CX VR" },
  { forma: "AE-01", modelo: "1 CX VR" },
  { forma: "100-1", modelo: "SUB. 100-AMP" },
  { forma: "100-2", modelo: "SUB. 100-AMP" },
  { forma: "100-3", modelo: "SUB. 100-AMP" }
];

const SETOR_1_RIGHT_FORMS = [
  { forma: "L-01", modelo: "4 CXS VR" },
  { forma: "L-02", modelo: "4 CXS VR" },
  { forma: "J-01", modelo: "4 CXS VL" },
  { forma: "H-01", modelo: "3 CXS VR" },
  { forma: "H-02", modelo: "3 CXS VR" },
  { forma: "I-01", modelo: "3 CXS VL" },
  { forma: "P-01", modelo: "Ec. 3 CXS" },
  { forma: "P-02", modelo: "Ec. 3 CXS" },
  { forma: "BE-04", modelo: "1 CX VL" },
  { forma: "BE-03", modelo: "1 CX VL" },
  { forma: "BE-02", modelo: "1 CX VL" },
  { forma: "BE-01", modelo: "1 CX VL" },
  { forma: "G-01", modelo: "Ec. 2 CXS VR" },
  { forma: "G-02", modelo: "Ec. 2 CXS VR" },
  { forma: "G-03", modelo: "Ec. 2 CXS VR" },
  { forma: "G-04", modelo: "Ec. 2 CXS VR" },
  { forma: "G-05", modelo: "Ec. 2 CXS VR" },
  { forma: "E-01", modelo: "Ec. 1 CX VR" },
  { forma: "E-02", modelo: "Ec. 1 CX VR" },
  { forma: "E-03", modelo: "Ec. 1 CX VR" },
  { forma: "E-04", modelo: "Ec. 1 CX VR" },
  { forma: "E-05", modelo: "Ec. 1 CX VR" },
  { forma: "E-06", modelo: "Ec. 1 CX VR" },
  { forma: "D-03", modelo: "2 CXS VL" },
  { forma: "D-04", modelo: "2 CXS VL" },
  { forma: "D-05", modelo: "2 CXS VL" },
  { forma: "D-06", modelo: "2 CXS VL" },
  { forma: "D-07", modelo: "2 CXS VL" },
  { forma: "M-01", modelo: "1 CX VR - 600" },
  { forma: "CE-13", modelo: "2 CXS VR" },
  { forma: "CE-12", modelo: "2 CXS VR" },
  { forma: "CE-11", modelo: "2 CXS VR" },
  { forma: "CE-10", modelo: "2 CXS VR" },
  { forma: "CE-09", modelo: "2 CXS VR" },
  { forma: "CE-05", modelo: "2 CXS VR" },
  { forma: "CE-04", modelo: "2 CXS VR" },
  { forma: "CE-03", modelo: "2 CXS VR" },
  { forma: "100-4", modelo: "SUB. 100 AMP." },
  { forma: "100-5", modelo: "SUB. 100 AMP." },
  { forma: "SB-E1", modelo: "SUB. 100-AMP-E" },
  { forma: "100-6", modelo: "SUB. 100 AMP." },
  { forma: "200-1", modelo: "SUB. 200-AMP C/ TC" },
  { forma: "200-2", modelo: "SUB. 200-AMP C/ TC" },
  { forma: "DE-03", modelo: "2 CXS VL" },
  { forma: "DE-02", modelo: "2 CXS VL" },
  { forma: "DE-01", modelo: "2 CXS VL" }
];

const SETOR_2_LEFT_FORMS = [
  { forma: "300-VL", modelo: "2 CXS VL" },
  { forma: "300-VR", modelo: "2 CXS VR" },
  { forma: "PL - 2", modelo: "7,5x300 c/ Lente" },
  { forma: "PL - 1", modelo: "7,5x300 c/ Lente" },
  { forma: "A-28", modelo: "1 CX VR" },
  { forma: "A-85", modelo: "1 CX VR" },
  { forma: "A-10", modelo: "1 CX VR" },
  { forma: "A-36", modelo: "1 CX VR" },
  { forma: "A-82", modelo: "1 CX VR" },
  { forma: "A-22", modelo: "1 CX VR" },
  { forma: "A-11", modelo: "1 CX VR" },
  { forma: "ESTOQ", modelo: "ESTOQUE" },
  { forma: "A-52", modelo: "1 CX VR" },
  { forma: "A-70", modelo: "1 CX VR" },
  { forma: "A-83", modelo: "1 CX VR" },
  { forma: "A-18", modelo: "1 CX VR" },
  { forma: "A-42", modelo: "1 CX VR" },
  { forma: "A-54", modelo: "1 CX VR" },
  { forma: "A-31", modelo: "1 CX VR" },
  { forma: "A-63", modelo: "1 CX VR" },
  { forma: "A-62", modelo: "1 CX VR" },
  { forma: "A-61", modelo: "1 CX VR" },
  { forma: "A-60", modelo: "1 CX VR" },
  { forma: "A-14", modelo: "1 CX VR" },
  { forma: "A-58", modelo: "1 CX VR" },
  { forma: "A-57", modelo: "1 CX VR" },
  { forma: "A-30", modelo: "1 CX VR" },
  { forma: "A-55", modelo: "1 CX VR" },
  { forma: "A-02", modelo: "1 CX VR" },
  { forma: "A-03", modelo: "1 CX VR" },
  { forma: "B-22", modelo: "1 CX VL" },
  { forma: "B-21", modelo: "1 CX VL" },
  { forma: "B-08", modelo: "1 CX VL" },
  { forma: "B-09", modelo: "1 CX VL" },
  { forma: "B-07", modelo: "1 CX VL" },
  { forma: "B-20", modelo: "1 CX VL" },
  { forma: "B-10", modelo: "1 CX VL" },
  { forma: "B-17", modelo: "1 CX VL" },
  { forma: "B-14", modelo: "1 CX VL" },
  { forma: "B-05", modelo: "1 CX VL" },
  { forma: "B-16", modelo: "1 CX VL" },
  { forma: "B-15", modelo: "1 CX VL" }
];

const SETOR_2_RIGHT_FORMS = [
  { forma: "TCL-1", modelo: "600-VL" },
  { forma: "TCL-2", modelo: "600-VL" },
  { forma: "TCR-4", modelo: "600-VR" },
  { forma: "TCR-2", modelo: "600-VR" },
  { forma: "PL - 3", modelo: "7,5x300 c/ Lente" },
  { forma: "PL - 4", modelo: "7,5x300 c/ Lente" },
  { forma: "A-23", modelo: "1 CX VR" },
  { forma: "A-17", modelo: "1 CX VR" },
  { forma: "A-35", modelo: "1 CX VR" },
  { forma: "A-24", modelo: "1 CX VR" },
  { forma: "A-59", modelo: "1 CX VR" },
  { forma: "A-34", modelo: "1 CX VR" },
  { forma: "A-33", modelo: "1 CX VR" },
  { forma: "A-07", modelo: "1 CX VR" },
  { forma: "A-05", modelo: "1 CX VR" },
  { forma: "A-06", modelo: "1 CX VR" },
  { forma: "A-16", modelo: "1 CX VR" },
  { forma: "A-43", modelo: "1 CX VR" },
  { forma: "A-32", modelo: "1 CX VR" },
  { forma: "A-84", modelo: "1 CX VR" },
  { forma: "A-19", modelo: "1 CX VR" },
  { forma: "A-15", modelo: "1 CX VR" },
  { forma: "A-12", modelo: "1 CX VR" },
  { forma: "A-38", modelo: "1 CX VR" },
  { forma: "A-39", modelo: "1 CX VR" },
  { forma: "A-44", modelo: "1 CX VR" },
  { forma: "A-45", modelo: "1 CX VR" },
  { forma: "A-48", modelo: "1 CX VR" },
  { forma: "C-03", modelo: "1 CX VR" },
  { forma: "C-14", modelo: "2 CXS VR" },
  { forma: "C-16", modelo: "2 CXS VR" },
  { forma: "C-18", modelo: "2 CXS VR" },
  { forma: "C-11", modelo: "2 CXS VR" },
  { forma: "C-19", modelo: "2 CXS VR" },
  { forma: "C-20", modelo: "2 CXS VR" },
  { forma: "C-21", modelo: "2 CXS VR" },
  { forma: "C-22", modelo: "2 CXS VR" },
  { forma: "C-23", modelo: "2 CXS VR" },
  { forma: "C-12", modelo: "2 CXS VR" },
  { forma: "C-25", modelo: "2 CXS VR" }
];

const SETOR_3_LEFT_FORMS = [
  { forma: "SC01", modelo: "SC" },
  { forma: "SC03", modelo: "SC" },
  { forma: "SC05", modelo: "SC" },
  { forma: "SC07", modelo: "SC" },
  { forma: "SC09", modelo: "SC" },
  { forma: "SC11", modelo: "SC" },
  { forma: "SC13", modelo: "SC" },
  { forma: "SC15", modelo: "SC" },
  { forma: "SC17", modelo: "SC" },
  { forma: "SC19", modelo: "SC" },
  { forma: "SC21", modelo: "SC" },
  { forma: "SC23", modelo: "SC" },
  { forma: "SC25", modelo: "SC" },
  { forma: "SC27", modelo: "SC" },
  { forma: "SC29", modelo: "SC" },
  { forma: "SC31", modelo: "SC" },
  { forma: "SC33", modelo: "SC" },
  { forma: "SC35", modelo: "SC" },
  { forma: "SC37", modelo: "SC" },
  { forma: "SC39", modelo: "SC" },
  { forma: "SC41", modelo: "SC" },
  { forma: "SC43", modelo: "SC" },
  { forma: "SC45", modelo: "SC" },
  { forma: "SC47", modelo: "SC" },
  { forma: "SC49", modelo: "SC" },
  { forma: "SC51", modelo: "SC" }
];

const SETOR_3_RIGHT_FORMS = [
  { forma: "SC02", modelo: "SC" },
  { forma: "SC04", modelo: "SC" },
  { forma: "SC06", modelo: "SC" },
  { forma: "SC08", modelo: "SC" },
  { forma: "SC10", modelo: "SC" },
  { forma: "SC12", modelo: "SC" },
  { forma: "SC14", modelo: "SC" },
  { forma: "SC16", modelo: "SC" },
  { forma: "SC18", modelo: "SC" },
  { forma: "SC20", modelo: "SC" },
  { forma: "SC22", modelo: "SC" },
  { forma: "SC24", modelo: "SC" },
  { forma: "SC26", modelo: "SC" },
  { forma: "SC28", modelo: "SC" },
  { forma: "SC30", modelo: "SC" },
  { forma: "SC32", modelo: "SC" },
  { forma: "SC34", modelo: "SC" },
  { forma: "SC36", modelo: "SC" },
  { forma: "SC38", modelo: "SC" },
  { forma: "SC40", modelo: "SC" },
  { forma: "SC42", modelo: "SC" },
  { forma: "SC44", modelo: "SC" },
  { forma: "SC46", modelo: "SC" },
  { forma: "SC48", modelo: "SC" },
  { forma: "SC50", modelo: "SC" },
  { forma: "SC52", modelo: "SC" }
];

const SETOR_4_COL1_FORMS = [
  { forma: "L-*1",     label: "*1",      modelo: "12 x 200" },
  { forma: "L-*2",     label: "*2",      modelo: "12 x 600" },
  { forma: "L-*3",     label: "*3",      modelo: "12 x 600" },
  { forma: "L-*4",     label: "*4",      modelo: "12 x 600" },
  { forma: "L-*6",     label: "*6",      modelo: "12 x 600" },
  { forma: "L-*7",     label: "*7",      modelo: "12 x 600" },
  { forma: "L-*8",     label: "*8",      modelo: "12 x 600" },
  { forma: "L-MD",     label: "MD",      modelo: "200-300-400-600" },
  { forma: "Lx-*1",   label: "*1",      modelo: "x" },
  { forma: "Lx-*2",   label: "*2",      modelo: "x" },
  { forma: "Lx-*3",   label: "*3",      modelo: "x" },
  { forma: "Lx-*4",   label: "*4",      modelo: "x" },
  { forma: "Lx-*6",   label: "*6",      modelo: "x" },
  { forma: "Lx-*7",   label: "*7",      modelo: "x" },
  { forma: "Lx-*8",   label: "*8",      modelo: "x" },
  { forma: "Lx-MD",   label: "MD",      modelo: "200-300-400-600" },
  { forma: "A-CX40",   label: "CX40x40", modelo: "Cx. Passagem 40x40" },
  { forma: "A-ST100",  label: "ST-100",  modelo: "Placa Stai 1000x200" },
  { forma: "A-ST140",  label: "ST-140",  modelo: "Placa Stai 1400x200" },
  { forma: "A-PEDST",  label: "PEDST",   modelo: "Pedestal Cx. Sabesp" },
  { forma: "A-CH100",  label: "CH-100",  modelo: "Chapeu Sub.100" },
  { forma: "A-CH200",  label: "CH-200",  modelo: "Chapeu Sub.200" },
  { forma: "A-CH200TC",label: "CH200TC", modelo: "Chapu Sub.200 C/TC" },
  { forma: "A-TOTEM",  label: "TOTEM",   modelo: "Totem Med. Indireta" }
];

const SETOR_4_COL2_FORMS = [
  { forma: "C-F1-1",   label: "1",  modelo: "6,0 x 90" },
  { forma: "C-F1-2",   label: "2",  modelo: "6,0 x 90" },
  { forma: "C-F2-9",   label: "9",  modelo: "7,5 x 200" },
  { forma: "C-F2-5",   label: "5",  modelo: "7,5 x 200" },
  { forma: "C-F2-8",   label: "8",  modelo: "7,5 x 200" },
  { forma: "C-F2-7",   label: "7",  modelo: "7,5 x 200" },
  { forma: "C-F2-6",   label: "6",  modelo: "7,5 x 200" },
  { forma: "C-F3-15",  label: "15", modelo: "7,5 x 90" },
  { forma: "C-F3-14",  label: "14", modelo: "7,5 x 90" },
  { forma: "C-F3-13",  label: "13", modelo: "7,5 x 90" },
  { forma: "C-F3-12",  label: "12", modelo: "7,5 x 90" },
  { forma: "C-F3-11",  label: "11", modelo: "7,5 x 90" },
  { forma: "C-F3-10",  label: "10", modelo: "7,5 x 90" },
  { forma: "C-F3-9",   label: "9",  modelo: "7,5 x 90" },
  { forma: "C-F3-8",   label: "8",  modelo: "7,5 x 90" },
  { forma: "C-F3-7",   label: "7",  modelo: "7,5 x 90" },
  { forma: "C-F3-6",   label: "6",  modelo: "7,5 x 90" },
  { forma: "C-F3-5",   label: "5",  modelo: "7,5 x 90" },
  { forma: "C-F3-4",   label: "4",  modelo: "7,5 x 90" },
  { forma: "C-F3-3",   label: "3",  modelo: "7,5 x 90" },
  { forma: "C-F3-2",   label: "2",  modelo: "7,5 x 90" },
  { forma: "C-F3-1",   label: "1",  modelo: "7,5 x 90" },
  { forma: "C-F3-16",  label: "16", modelo: "7,5 x 90" },
  { forma: "C-T1",     label: "T1", modelo: "13,5x600/300-1000" },
  { forma: "C-F4-*4",  label: "*4", modelo: "12 x 600" },
  { forma: "C-F4-*3",  label: "*3", modelo: "12 x 600" },
  { forma: "C-F4-*2",  label: "*2", modelo: "12 x 600" },
  { forma: "C-F4-MD",  label: "MD", modelo: "200-300-400-600" },
  { forma: "C-F5-1a",  label: "1",  modelo: "12 x 1000" },
  { forma: "C-F5-1b",  label: "1",  modelo: "12 x 200" },
  { forma: "C-F5-2",   label: "2",  modelo: "12 x 200" },
  { forma: "C-F6-*4",  label: "*4", modelo: "x" },
  { forma: "C-F6-*3",  label: "*3", modelo: "x" },
  { forma: "C-F6-*2",  label: "*2", modelo: "x" },
  { forma: "C-F6-MD",  label: "MD", modelo: "200-300-400-600" },
  { forma: "C-F7-*1a", label: "*1", modelo: "x" },
  { forma: "C-F7-*1b", label: "*1", modelo: "x" },
  { forma: "C-F7-*2",  label: "*2", modelo: "x" }
];

const SETOR_4_COL3_FORMS = [
  { forma: "R-F1-3",  label: "3",   modelo: "6,0 x 90" },
  { forma: "R-F2-9",  label: "9",   modelo: "* 7,5 x 300" },
  { forma: "R-F2-8",  label: "8",   modelo: "* 7,5 x 300" },
  { forma: "R-F2-7",  label: "7",   modelo: "* 7,5 x 300" },
  { forma: "R-F2-6",  label: "6",   modelo: "* 7,5 x 300" },
  { forma: "R-F2-5",  label: "5",   modelo: "* 7,5 x 300" },
  { forma: "R-F3-4",  label: "4",   modelo: "* 7,5 x" },
  { forma: "R-F3-3",  label: "3",   modelo: "* 7,5 x" },
  { forma: "R-F3-2",  label: "2",   modelo: "* 7,5 x" },
  { forma: "R-MD",    label: "MD",  modelo: "300,400,600,700,800" },
  { forma: "R-E17",   label: "17",  modelo: "7,5 x 90" },
  { forma: "R-E22",   label: "22",  modelo: "7,5 x 90" },
  { forma: "R-E21",   label: "21",  modelo: "7,5 x 90" },
  { forma: "R-E23",   label: "23",  modelo: "7,5 x 90" },
  { forma: "R-E24",   label: "24",  modelo: "7,5 x 90" },
  { forma: "R-E20",   label: "20",  modelo: "7,5 x 90" },
  { forma: "R-E19",   label: "19",  modelo: "7,5 x 90" },
  { forma: "R-E18",   label: "18",  modelo: "7,5 x 90" },
  { forma: "R-G6",    label: "6",   modelo: "7,0 x 150" },
  { forma: "R-G5",    label: "5",   modelo: "7,0 x 150" },
  { forma: "R-G3",    label: "3",   modelo: "7,0 x 150" },
  { forma: "R-G4",    label: "4",   modelo: "7,0 x 150" },
  { forma: "R-G1",    label: "1",   modelo: "7,0 x 150" },
  { forma: "R-G2",    label: "2",   modelo: "7,0 x 150" }
];

const SECTOR_FORMS = {
  "Setor 1": { left: SETOR_1_LEFT_FORMS, right: SETOR_1_RIGHT_FORMS },
  "Setor 2": { left: SETOR_2_LEFT_FORMS, right: SETOR_2_RIGHT_FORMS },
  "Setor 3": { left: SETOR_3_LEFT_FORMS, right: SETOR_3_RIGHT_FORMS },
  "Setor 4": { col1: SETOR_4_COL1_FORMS, col2: SETOR_4_COL2_FORMS, col3: SETOR_4_COL3_FORMS }
};

function getSectorForms(setor) {
  return SECTOR_FORMS[setor] || SECTOR_FORMS["Setor 2"];
}

const state = {
  mode: "HUB",
  authUser: null,
  allowedModes: new Set(["HUB"]),
  hasBootstrapped: false,
  usersCache: [],
  libPhotos: [],
  insPhotos: [],
  montagemPostesAtual: null,
  isSendingLiberacao: false,
  isSendingInspecao: false,
  submitLocks: readSubmitLocks()
};

const el = {
  appShell: document.getElementById("appShell"),
  loginScreen: document.getElementById("loginScreen"),
  loginNome: document.getElementById("loginNome"),
  loginSenha: document.getElementById("loginSenha"),
  loginEntrar: document.getElementById("loginEntrar"),
  loginFeedback: document.getElementById("loginFeedback"),
  authUserBadge: document.getElementById("authUserBadge"),
  authLogoutBtn: document.getElementById("authLogoutBtn"),
  backMain: document.getElementById("btnBackMain"),
  backButtons: Array.from(document.querySelectorAll("[data-back-btn]")),
  hubView: document.getElementById("viewHub"),
  viewDashboard: document.getElementById("viewDashboard"),
  hubLiberacao: document.getElementById("hubLiberacao"),
  hubInspecao: document.getElementById("hubInspecao"),
  hubMontagemPostes: document.getElementById("hubMontagemPostes"),
  hubRelatorio: document.getElementById("hubRelatorio"),
  hubHistorico: document.getElementById("hubHistorico"),
  hubAcompanhamento: document.getElementById("hubAcompanhamento"),
  viewLiberacao: document.getElementById("viewLiberacao"),
  viewInspecao: document.getElementById("viewInspecao"),
  viewMontagemPostes: document.getElementById("viewMontagemPostes"),
  viewMontagemPostesDetalhe: document.getElementById("viewMontagemPostesDetalhe"),
  viewRelatorio: document.getElementById("viewRelatorio"),
  viewHistorico: document.getElementById("viewHistorico"),
  viewAcompanhamento: document.getElementById("viewAcompanhamento"),
  hubAcmpConcretagem: document.getElementById("hubAcmpConcretagem"),
  viewAcmpConcretagem: document.getElementById("viewAcmpConcretagem"),
  navUsuarios: document.getElementById("navUsuarios"),
  viewUsuarios: document.getElementById("viewUsuarios"),
  ugNome: document.getElementById("ugNome"),
  ugPerfil: document.getElementById("ugPerfil"),
  ugSenha: document.getElementById("ugSenha"),
  ugCriarBtn: document.getElementById("ugCriarBtn"),
  ugFeedback: document.getElementById("ugFeedback"),
  ugListaBody: document.getElementById("ugListaBody"),
  syncStatus: document.getElementById("syncStatus"),

  libData: document.getElementById("libData"),
  libColaborador: document.getElementById("libColaborador"),
  libFeedback: document.getElementById("libFeedback"),
  sheetSetorLabel: document.getElementById("sheetSetorLabel"),
  sheetLeftBody: document.getElementById("sheetLeftBody"),
  sheetRightBody: document.getElementById("sheetRightBody"),
  btnLimparFormas: document.getElementById("btnLimparFormas"),

  insFiltroData: document.getElementById("insFiltroData"),
  insModoCarga: document.getElementById("insModoCarga"),
  insSetor: document.getElementById("insSetor"),
  insColaborador: document.getElementById("insColaborador"),
  insCarregarLiberados: document.getElementById("insCarregarLiberados"),
  insLiberadosBody: document.getElementById("insLiberadosBody"),
  insQtdItens: document.getElementById("insQtdItens"),
  insChecklistCodigos: document.getElementById("insChecklistCodigos"),
  insObs: document.getElementById("insObs"),
  insFotos: document.getElementById("insFotos"),
  insFotosPreview: document.getElementById("insFotosPreview"),
  salvarInspecao: document.getElementById("salvarInspecao"),
  insFormaFiltro: document.getElementById("insFormaFiltro"),
  salvarInspecaoFloat: document.getElementById("salvarInspecaoFloat"),

  mpFiltroData: document.getElementById("mpFiltroData"),
  mpModoCarga: document.getElementById("mpModoCarga"),
  mpSetor: document.getElementById("mpSetor"),
  mpCarregarLiberados: document.getElementById("mpCarregarLiberados"),
  mpLiberadosBody: document.getElementById("mpLiberadosBody"),
  mpQtdItens: document.getElementById("mpQtdItens"),
  mpFormaFiltro: document.getElementById("mpFormaFiltro"),
  mpDetalheHeader: document.getElementById("mpDetalheHeader"),
  mpStatusButtons: document.getElementById("mpStatusButtons"),
  mpStatusAprovado: document.getElementById("mpStatusAprovado"),
  mpStatusReprovado: document.getElementById("mpStatusReprovado"),
  mpStatusRR: document.getElementById("mpStatusRR"),
  mpMotivoWrap: document.getElementById("mpMotivoWrap"),
  mpMotivoSelect: document.getElementById("mpMotivoSelect"),
  mpObservacoes: document.getElementById("mpObservacoes"),
  mpChecklistSections: document.getElementById("mpChecklistSections"),
  mpFinalizarPoste: document.getElementById("mpFinalizarPoste"),
  mpResumoModal: document.getElementById("mpResumoModal"),
  mpResumoBody: document.getElementById("mpResumoBody"),
  mpResumoOkBtn: document.getElementById("mpResumoOkBtn"),

  histData: document.getElementById("histData"),
  histTipo: document.getElementById("histTipo"),
  histForma: document.getElementById("histForma"),
  dashData: document.getElementById("dashData"),
  atualizarDashboard: document.getElementById("atualizarDashboard"),
  dashSetor1Count: document.getElementById("dashSetor1Count"),
  dashSetor2Count: document.getElementById("dashSetor2Count"),
  dashTotalCount: document.getElementById("dashTotalCount"),
  dashSetor1Meta: document.getElementById("dashSetor1Meta"),
  dashSetor2Meta: document.getElementById("dashSetor2Meta"),
  dashBarSetor1: document.getElementById("dashBarSetor1"),
  dashBarSetor2: document.getElementById("dashBarSetor2"),
  dashBarSetor1Label: document.getElementById("dashBarSetor1Label"),
  dashBarSetor2Label: document.getElementById("dashBarSetor2Label"),
  dashStatus: document.getElementById("dashStatus"),
  acmpData: document.getElementById("acmpData"),
  acmpModoCarga: document.getElementById("acmpModoCarga"),
  acmpSetor: document.getElementById("acmpSetor"),
  acmpCarregar: document.getElementById("acmpCarregar"),
  acmpSalvar: document.getElementById("acmpSalvar"),
  acmpImprimir: document.getElementById("acmpImprimir"),
  acmpFeedback: document.getElementById("acmpFeedback"),
  acmpOutput: document.getElementById("acmpOutput"),
  filtrarHistorico: document.getElementById("filtrarHistorico"),
  historicoLista: document.getElementById("historicoLista"),
  relData: document.getElementById("relData"),
  relSetor: document.getElementById("relSetor"),
  relEncarregado: document.getElementById("relEncarregado"),
  gerarRelatorioSetor: document.getElementById("gerarRelatorioSetor"),
  relatorioSetorOutput: document.getElementById("relatorioSetorOutput")
};

/* ── Chart.js instance tracker ───────────────────── */
const chartInstances = {};
function destroyChart(id) {
  if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; }
}

function nowIso() {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 19).replace("T", "T");
}

function uuid() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.floor(Math.random() * 999999)}`;
}

function todayYmd() {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - tzOffset);
  return local.toISOString().slice(0, 10);
}

function normalizeUpper(text) {
  return String(text || "").trim().toUpperCase();
}

function dateToYmd(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value).trim())) return String(value).trim();
  const d = new Date(String(value));
  if (!Number.isNaN(d.getTime())) {
    const tzOffset = d.getTimezoneOffset() * 60000;
    const local = new Date(d.getTime() - tzOffset);
    return local.toISOString().slice(0, 10);
  }
  return String(value).trim();
}

function readDb() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { records: [], events: [] };
  try {
    const parsed = JSON.parse(raw);
    return {
      records: Array.isArray(parsed.records) ? parsed.records : [],
      events: Array.isArray(parsed.events) ? parsed.events : []
    };
  } catch {
    return { records: [], events: [] };
  }
}

function readSubmitLocks() {
  const raw = localStorage.getItem(SUBMIT_LOCKS_KEY);
  if (!raw) return { liberacao: "", inspecao: "" };
  try {
    const parsed = JSON.parse(raw);
    return {
      liberacao: typeof parsed.liberacao === "string" ? parsed.liberacao : "",
      inspecao: typeof parsed.inspecao === "string" ? parsed.inspecao : ""
    };
  } catch {
    return { liberacao: "", inspecao: "" };
  }
}

function writeSubmitLocks(submitLocks) {
  localStorage.setItem(SUBMIT_LOCKS_KEY, JSON.stringify(submitLocks));
}

function payloadToken(payload) {
  return JSON.stringify(payload);
}

function setSubmitButtonState(button, isLoading) {
  if (!button) return;
  if (!button.dataset.originalText) {
    button.dataset.originalText = button.textContent || "Salvar";
  }
  button.disabled = isLoading;
  button.textContent = isLoading ? "Enviando..." : button.dataset.originalText;
}

function clearSubmitLock(type) {
  if (!state.submitLocks[type]) return;
  state.submitLocks[type] = "";
  writeSubmitLocks(state.submitLocks);
}

function setSubmitLock(type, token) {
  state.submitLocks[type] = token;
  writeSubmitLocks(state.submitLocks);
}

function writeDb(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function addEvent(db, event) {
  db.events.push(event);
}

function upsertRecord(db, record) {
  const idx = db.records.findIndex((r) => r.id === record.id);
  if (idx === -1) db.records.push(record);
  else db.records[idx] = record;
}

function hasApiConfigured() {
  return CONFIG.API_URL && CONFIG.API_URL.startsWith("https://script.google.com/");
}

function hasMontagemApiConfigured() {
  return CONFIG.MONTAGEM_API_URL && CONFIG.MONTAGEM_API_URL.startsWith("https://script.google.com/");
}

function setSyncStatus(kind, message) {
  if (!el.syncStatus) return;
  el.syncStatus.className = "sync-status";
  if (kind === "ok") el.syncStatus.classList.add("sync-ok");
  if (kind === "warn") el.syncStatus.classList.add("sync-warn");
  if (kind === "error") el.syncStatus.classList.add("sync-error");
  if (kind === "pending") el.syncStatus.classList.add("sync-pending");
  el.syncStatus.textContent = message;
}

async function checkApiStatus() {
  if (!hasApiConfigured()) {
    setSyncStatus("warn", "API não configurada: salvando apenas localmente.");
    return;
  }

  try {
    const resp = await fetch(`${CONFIG.API_URL}?action=status`);
    const text = await resp.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      setSyncStatus("error", "API respondeu formato inválido.");
      return;
    }

    if (data && data.ok) {
      setSyncStatus("ok", "Conectado com planilha: sincronização online ativa.");
    } else {
      setSyncStatus("error", "Falha ao verificar API da planilha.");
    }
  } catch {
    setSyncStatus("error", "Sem conexão com API da planilha no momento.");
  }
}

async function postToApi(action, payload) {
  if (!hasApiConfigured()) {
    return { ok: false, skipped: true, error: "API não configurada" };
  }

  const body = new URLSearchParams();
  body.set("action", action);
  body.set("payload", JSON.stringify(payload));

  try {
    const response = await fetch(CONFIG.API_URL, {
      method: "POST",
      body
    });

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { ok: false, error: "Resposta inválida do servidor", raw: text };
    }
  } catch (error) {
    return { ok: false, error: `Falha de rede: ${String(error)}` };
  }
}

async function postToMontagemApi(action, payload) {
  if (!hasMontagemApiConfigured()) {
    return { ok: false, skipped: true, error: "API de montagem não configurada" };
  }

  const body = new URLSearchParams();
  body.set("action", action);
  body.set("payload", JSON.stringify(payload));

  try {
    const response = await fetch(CONFIG.MONTAGEM_API_URL, {
      method: "POST",
      body
    });

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { ok: false, error: "Resposta inválida do servidor de montagem", raw: text };
    }
  } catch (error) {
    return { ok: false, error: `Falha de rede (montagem): ${String(error)}` };
  }
}

function formatDateTime(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("pt-BR");
}

function fmtDate(value) {
  const ymd = dateToYmd(value);
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

function montagemStatusLabel(status) {
  if (status === "A") return "Aprovado";
  if (status === "R") return "Reprovado";
  if (status === "RR") return "Reprovado e Retrabalhado";
  return "-";
}

function getMontagemMotivoOptions() {
  return CHECKLIST_INSPECAO_CODIGOS.map((item) => ({
    value: item.codigo,
    label: `${item.codigo} — ${item.descricao}`
  }));
}

function getMotivoRecusaLabel(value) {
  if (!value) return "-";
  const found = CHECKLIST_INSPECAO_CODIGOS.find((item) => item.codigo === value);
  if (found) return `${found.codigo} — ${found.descricao}`;
  return value;
}

function statusFluxoFromRecord(record) {
  if (!record.liberacao) return "SEM_LIBERACAO";
  if (!record.inspecoes || record.inspecoes.length === 0) return "PENDENTE_INSPECAO";
  const last = record.inspecoes[record.inspecoes.length - 1];
  if (last.status === "A") return "CONCLUIDO_APROVADO";
  if (last.status === "RR") return "CONCLUIDO_RETRABALHO";
  return "CONCLUIDO_REPROVADO";
}

function findRecordByKey(db, dataFabricacao, setor, formaNumero) {
  return db.records.find(
    (record) => record.dataFabricacao === dataFabricacao && record.setor === setor && record.formaNumero === formaNumero
  );
}

function getInspecaoResumo(record) {
  if (!record || !Array.isArray(record.inspecoes) || !record.inspecoes.length) return { status: "", cod: "" };
  const ultima = record.inspecoes[record.inspecoes.length - 1];
  const cod = Array.isArray(ultima.codigos) ? ultima.codigos.join("/") : "";
  return { status: ultima.status || "", cod };
}

function statusFlagsFromCode(statusCodigo) {
  return {
    liberado: statusCodigo === "1" ? 1 : 0,
    naoMontado: statusCodigo === "D" ? 1 : 0,
    manutencao: statusCodigo === "M" ? 1 : 0
  };
}

function getLiberacaoSelectOptions(selectedStatus) {
  const status = selectedStatus || "";
  return `
    <div class="lib-actions" data-lib-actions>
      <input type="hidden" data-lib-status value="${status}">
      <button type="button" class="lib-btn ${status === "1" ? "active btn-liberado" : ""}" data-lib-btn="1">Liberado</button>
      <button type="button" class="lib-btn ${status === "D" ? "active btn-nao" : ""}" data-lib-btn="D">Não montado</button>
      <button type="button" class="lib-btn ${status === "M" ? "active btn-manut" : ""}" data-lib-btn="M">Manutenção</button>
    </div>
  `;
}

function renderInspecaoCodigosChecklist() {
  el.insChecklistCodigos.innerHTML = "";
  CHECKLIST_INSPECAO_CODIGOS.forEach((item) => {
    const row = document.createElement("div");
    row.className = "check-row";
    row.innerHTML = `<span><strong>${item.codigo}</strong> — ${item.descricao}</span>`;
    el.insChecklistCodigos.appendChild(row);
  });
}

function renderPhotoPreview(container, photos) {
  container.innerHTML = "";
  photos.forEach((photo) => {
    const img = document.createElement("img");
    img.className = "thumb";
    img.src = photo.dataUrl;
    img.alt = photo.name || "foto";
    container.appendChild(img);
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function compressImage(dataUrl, maxWidth, quality) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
      const width = Math.round(img.width * ratio);
      const height = Math.round(img.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = dataUrl;
  });
}

async function filesToCompressedDataUrls(fileList) {
  const files = Array.from(fileList || []);
  const out = [];
  for (const file of files) {
    const dataUrl = await fileToDataUrl(file);
    const compressed = await compressImage(dataUrl, 1280, 0.72);
    out.push({ id: uuid(), name: file.name, type: file.type, dataUrl: compressed });
  }
  return out;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function buildFormaRange(prefix, start, end) {
  const out = [];
  const step = start <= end ? 1 : -1;
  for (let i = start; step > 0 ? i <= end : i >= end; i += step) {
    out.push(`${prefix}${pad2(i)}`);
  }
  return out;
}

function mapCatalogByForma(catalog) {
  const map = new Map();
  (catalog || []).forEach((item) => {
    map.set(normalizeUpper(item.forma), item);
  });
  return map;
}

function resolveFormasFromCatalog(catalog, formas) {
  const map = mapCatalogByForma(catalog);
  return formas.map((forma) => map.get(normalizeUpper(forma))).filter(Boolean);
}

function buildSetor1LeftBlocks(catalog) {
  const block1 = ["100-3", "100-2", "100-1", ...buildFormaRange("AE-", 1, 11)];
  const block2 = buildFormaRange("AE-", 12, 25);
  const block3 = ["AE-26", "AE-27", ...buildFormaRange("BD-", 15, 1), "IE-01"];

  return [
    resolveFormasFromCatalog(catalog, block1),
    resolveFormasFromCatalog(catalog, block2),
    resolveFormasFromCatalog(catalog, block3)
  ];
}

function buildSetor1RightBlocks(catalog) {
  const bottomUp = Array.isArray(catalog) ? [...catalog].reverse() : [];
  return [
    bottomUp.slice(0, 14),
    bottomUp.slice(14, 28),
    bottomUp.slice(28)
  ];
}

function createFormaButton(item, setor) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "lib-btn";
  const setBtnLabel = (done = false) => {
    const check = done ? " ✓" : "";
    btn.innerHTML = `<span class="lib-btn-model">${item.modelo || "-"}</span> <span class="lib-btn-forma">${item.forma}${check}</span>`;
  };
  setBtnLabel(false);
  btn.dataset.formaNumero = normalizeUpper(item.forma);
  btn.dataset.modelo = item.modelo;

  if (setor && isFormaClicked(item.forma, setor)) {
    btn.classList.add("active", "btn-liberado");
    setBtnLabel(true);
    btn.disabled = true;
  } else {
    btn.addEventListener("click", () => {
      salvarFormaClicada(item.forma, setor, btn);
    });
  }

  return btn;
}

function createLiberacaoRow(item, setor) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td class="lib-cell"></td>
    <td>${item.modelo || ""}</td>
    <td class="ins-related">-</td>
    <td class="ins-related">-</td>
  `;
  const formaCell = tr.querySelector("td.lib-cell");
  const btn = createFormaButton(item, setor);
  if (setor && isFormaClicked(item.forma, setor)) {
    tr.classList.add("row-liberada");
  }
  formaCell.appendChild(btn);
  return tr;
}

async function getSetorRowsByDate(setor, dataFabricacao) {
  if (!hasApiConfigured() || !dataFabricacao || !setor) return [];

  try {
    const url = `${CONFIG.API_URL}?action=relatorio_setor&dataFabricacao=${encodeURIComponent(dataFabricacao)}&setor=${encodeURIComponent(setor)}`;
    const response = await fetch(url);
    const text = await response.text();
    const payload = JSON.parse(text);
    if (payload.ok && Array.isArray(payload.rows)) return payload.rows;
  } catch {
    // Usa catalogo local quando a API nao responder.
  }
  return [];
}

async function getSectorFormsForLiberacao(setor) {
  const forms = getSectorForms(setor);
  return forms;
}

function renderSheetBlocks(blocks, container, setor, labels = []) {
  container.innerHTML = "";
  container.classList.add("forma-grid-blocos");

  blocks.forEach((blockItems, index) => {
    const blockWrap = document.createElement("div");
    blockWrap.className = "forma-block-wrap";

    const divider = document.createElement("div");
    divider.className = "forma-block-divider";
    divider.textContent = labels[index] || `Bloco ${index + 1}`;

    const block = document.createElement("div");
    block.className = "forma-block";
    (blockItems || []).forEach((item) => {
      block.appendChild(createFormaButton(item, setor));
    });

    blockWrap.appendChild(divider);
    blockWrap.appendChild(block);
    container.appendChild(blockWrap);
  });
}

function renderSheetSide(items, container, options = {}) {
  const setor = el.libSetor?.value || "";
  container.innerHTML = "";
  container.classList.remove("forma-grid-blocos");

  const catalog = Array.isArray(items) ? items : [];
  const isTableBody = container.tagName === "TBODY";

  if (Array.isArray(options.blocks) && options.blocks.length) {
    renderSheetBlocks(options.blocks, container, setor, options.blockLabels || []);
    return;
  }

  catalog.forEach((item) => {
    if (isTableBody) {
      container.appendChild(createLiberacaoRow(item, setor));
      return;
    }
    const btn = createFormaButton(item, setor);
    container.appendChild(btn);
  });
}

function setCardState(card, state) {
  card.classList.remove("is-idle", "is-saving", "is-saved", "is-error");
  card.classList.add("is-" + state);
  const statusEl = card.querySelector(".fc-status");
  if (!statusEl) return;
  if (state === "saving") {
    statusEl.textContent = "⋯";
    card.disabled = true;
  } else if (state === "saved") {
    statusEl.textContent = "✓";
    card.disabled = true;
  } else if (state === "error") {
    statusEl.textContent = "✗";
    card.disabled = false;
  } else {
    statusEl.textContent = "";
    card.disabled = false;
  }
}

function createFormaCard(item, setor) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "forma-card is-idle";
  card.dataset.formaNumero = normalizeUpper(item.forma);
  card.dataset.modelo = item.modelo || "";

  const numEl = document.createElement("span");
  numEl.className = "fc-number";
  numEl.textContent = setor === "Setor 4" ? (item.modelo || item.label || item.forma) : (item.label || item.forma);

  const statusEl = document.createElement("span");
  statusEl.className = "fc-status";

  card.appendChild(numEl);
  card.appendChild(statusEl);

  if (isFormaClicked(item.forma, setor)) {
    setCardState(card, "saved");
  } else {
    card.addEventListener("click", () => {
      const data = el.libData?.value;
      const colaborador = (el.libColaborador?.value || "").trim();
      if (!data) {
        showLibFeedback("Preencha a data de fabricação antes de registrar.", "error");
        el.libData?.focus();
        return;
      }
      if (!colaborador) {
        showLibFeedback("Preencha o colaborador antes de registrar.", "error");
        el.libColaborador?.focus();
        return;
      }
      salvarFormaClicada(item.forma, setor, card, item.modelo || "");
    });
  }

  return card;
}

function renderSectorCols(container, leftForms, rightForms, setor) {
  if (!container) return;
  container.innerHTML = "";
  const leftCol = document.createElement("div");
  leftCol.className = "lib-forms-col";
  const rightCol = document.createElement("div");
  rightCol.className = "lib-forms-col";
  leftForms.forEach((item) => leftCol.appendChild(createFormaCard(item, setor)));
  rightForms.forEach((item) => rightCol.appendChild(createFormaCard(item, setor)));
  container.appendChild(leftCol);
  container.appendChild(rightCol);
}

function renderSector3Cols(container, col1Forms, col2Forms, col3Forms, setor) {
  if (!container) return;
  container.innerHTML = "";
  const col1 = document.createElement("div");
  col1.className = "lib-forms-col";
  const col2 = document.createElement("div");
  col2.className = "lib-forms-col";
  const col3 = document.createElement("div");
  col3.className = "lib-forms-col";
  col1Forms.forEach((item) => col1.appendChild(createFormaCard(item, setor)));
  col2Forms.forEach((item) => col2.appendChild(createFormaCard(item, setor)));
  col3Forms.forEach((item) => col3.appendChild(createFormaCard(item, setor)));
  container.appendChild(col1);
  container.appendChild(col2);
  container.appendChild(col3);
}

function renderLiberacaoDual() {
  renderSectorCols(
    document.getElementById("libSetor1Cols"),
    SETOR_1_LEFT_FORMS,
    SETOR_1_RIGHT_FORMS,
    "Setor 1"
  );
  renderSectorCols(
    document.getElementById("libSetor2Cols"),
    SETOR_2_LEFT_FORMS,
    SETOR_2_RIGHT_FORMS,
    "Setor 2"
  );
  renderSectorCols(
    document.getElementById("libSetor3Cols"),
    SETOR_3_LEFT_FORMS,
    SETOR_3_RIGHT_FORMS,
    "Setor 3"
  );
  renderSector3Cols(
    document.getElementById("libSetor4Cols"),
    SETOR_4_COL1_FORMS,
    SETOR_4_COL2_FORMS,
    SETOR_4_COL3_FORMS,
    "Setor 4"
  );
  updateSectorCounters();
}

function updateSectorCounters() {
  const clicked = getClickedFormsToday();
  const formas = clicked.formas || {};

  const s1All = SETOR_1_LEFT_FORMS.concat(SETOR_1_RIGHT_FORMS);
  const s2All = SETOR_2_LEFT_FORMS.concat(SETOR_2_RIGHT_FORMS);
  const s3All = SETOR_3_LEFT_FORMS.concat(SETOR_3_RIGHT_FORMS);
  const s4All = SETOR_4_COL1_FORMS.concat(SETOR_4_COL2_FORMS).concat(SETOR_4_COL3_FORMS);

  let s1Count = 0;
  s1All.forEach((item) => {
    if (formas["Setor 1||" + normalizeUpper(item.forma)]) s1Count++;
  });

  let s2Count = 0;
  s2All.forEach((item) => {
    if (formas["Setor 2||" + normalizeUpper(item.forma)]) s2Count++;
  });

  let s3Count = 0;
  s3All.forEach((item) => {
    if (formas["Setor 3||" + normalizeUpper(item.forma)]) s3Count++;
  });

  let s4Count = 0;
  s4All.forEach((item) => {
    if (formas["Setor 4||" + normalizeUpper(item.forma)]) s4Count++;
  });

  const c1 = document.getElementById("libCounterSetor1");
  const c2 = document.getElementById("libCounterSetor2");
  const c3 = document.getElementById("libCounterSetor3");
  const c4 = document.getElementById("libCounterSetor4");
  if (c1) {
    c1.textContent = s1Count + " / " + s1All.length;
    c1.classList.toggle("counter-done", s1Count === s1All.length && s1All.length > 0);
  }
  if (c2) {
    c2.textContent = s2Count + " / " + s2All.length;
    c2.classList.toggle("counter-done", s2Count === s2All.length && s2All.length > 0);
  }
  if (c3) {
    c3.textContent = s3Count + " / " + s3All.length;
    c3.classList.toggle("counter-done", s3Count === s3All.length && s3All.length > 0);
  }
  if (c4) {
    c4.textContent = s4Count + " / " + s4All.length;
    c4.classList.toggle("counter-done", s4Count === s4All.length && s4All.length > 0);
  }
}

async function renderSheetGrid() {
  const setor = el.sheetSetorLabel?.textContent || "Setor 2";
  const forms = await getSectorFormsForLiberacao(setor);
  if (el.sheetLeftBody) renderSheetSide(forms.left, el.sheetLeftBody);
  if (el.sheetRightBody) renderSheetSide(forms.right, el.sheetRightBody);
}

function showLibFeedback(message, type) {
  if (!el.libFeedback) return;
  el.libFeedback.textContent = message;
  el.libFeedback.className = "lib-feedback";
  if (type === "ok") el.libFeedback.classList.add("feedback-ok");
  if (type === "error") el.libFeedback.classList.add("feedback-error");
  el.libFeedback.classList.remove("hidden");
  setTimeout(() => el.libFeedback.classList.add("hidden"), 3000);
}

async function salvarFormaClicada(forma, setor, card, modelo) {
  setCardState(card, "saving");

  const agora = new Date();
  const dia = agora.toLocaleDateString("pt-BR");
  const hora = agora.toLocaleTimeString("pt-BR");
  const dataFabricacao = el.libData?.value || todayYmd();
  const colaborador = (el.libColaborador?.value || "").trim();
  const modeloFinal = modelo || card.dataset.modelo || "";

  const payload = {
    dia,
    hora,
    setor,
    forma,
    dataFabricacao,
    colaborador,
    modelo: modeloFinal
  };

  const apiResult = await postToApi("salvar_forma_click", payload);

  if (apiResult.ok || apiResult.skipped) {
    const db = readDb();
    let record = findRecordByKey(db, dataFabricacao, setor, normalizeUpper(forma));
    if (!record) {
      record = {
        id: uuid(),
        dataFabricacao,
        setor,
        formaNumero: normalizeUpper(forma),
        modelo: modeloFinal,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        liberacao: null,
        inspecoes: []
      };
    }
    if (!record.liberacao || record.liberacao.status !== "1") {
      record.liberacao = { status: "1", colaborador, observacoes: "", fotos: [], timestamp: nowIso() };
      record.updatedAt = nowIso();
    }
    upsertRecord(db, record);
    writeDb(db);
  }

  if (apiResult.ok) {
    markFormaClicked(forma, setor);
    setCardState(card, "saved");
    updateSectorCounters();
    setSyncStatus("ok", `Forma ${forma} registrada com sucesso.`);
    showLibFeedback(`${forma} — registrado!`, "ok");
  } else if (apiResult.skipped) {
    markFormaClicked(forma, setor);
    setCardState(card, "saved");
    updateSectorCounters();
    setSyncStatus("warn", "API não configurada. Forma salva localmente.");
    showLibFeedback(`${forma} — salvo localmente.`, "ok");
  } else {
    setCardState(card, "error");
    setSyncStatus("error", `Falha ao registrar ${forma}: ${apiResult.error || "erro desconhecido"}`);
    showLibFeedback(`${forma} — falha no envio!`, "error");
  }
}

function getInspecaoCodeOptions(selectedCode) {
  const first = '<option value="">Selecione</option>';
  const options = CHECKLIST_INSPECAO_CODIGOS.map((item) => {
    const selected = selectedCode === item.codigo ? "selected" : "";
    return `<option value="${item.codigo}" ${selected}>${item.codigo} — ${item.descricao}</option>`;
  }).join("");
  return first + options;
}

async function getInspecaoRowsFromApi(filtroData, modoCarga, setor) {
  if (!hasApiConfigured()) return null;

  const params = new URLSearchParams();
  params.set("action", "inspecao_pendentes");
  // O backend pode estar com datas em formato textual longo; filtramos por data no cliente.
  if (setor) params.set("setor", setor);

  try {
    const response = await fetch(`${CONFIG.API_URL}?${params.toString()}`);
    const text = await response.text();
    const payload = JSON.parse(text);
    if (payload.ok && Array.isArray(payload.rows)) return payload.rows;
    console.error("[inspecao_pendentes] resposta inesperada:", payload);
  } catch (err) {
    console.error("[inspecao_pendentes] erro na requisição:", err);
    return null;
  }

  return null;
}

function filtrarFormasTabela() {
  const texto = (el.insFormaFiltro?.value || "").trim().toUpperCase();
  Array.from(el.insLiberadosBody.querySelectorAll("tr[data-forma-numero]")).forEach((tr) => {
    const forma = (tr.dataset.formaNumero || "").toUpperCase();
    tr.style.display = !texto || forma.includes(texto) ? "" : "none";
  });
}

function showInspecaoModal(counts, syncStatus) {
  const modal = document.getElementById("inspecaoModal");
  const icon = document.getElementById("modalIcon");
  const subtitle = document.getElementById("modalSubtitle");
  const stats = document.getElementById("modalStats");
  const okBtn = document.getElementById("modalOkBtn");
  if (!modal) return;

  const total = (counts.A || 0) + (counts.R || 0) + (counts.RR || 0);

  if (syncStatus === "ok") {
    icon.textContent = "✅";
    subtitle.textContent = "Sincronizado com a planilha com sucesso.";
  } else if (syncStatus === "warn") {
    icon.textContent = "📲";
    subtitle.textContent = "Salvo localmente. Configure a API para sincronizar com a planilha.";
  } else {
    icon.textContent = "⚠️";
    subtitle.textContent = "Salvo localmente, mas falhou atualização na planilha.";
  }

  const rows = [
    { label: "✅ Aprovados (Liberados)", count: counts.A || 0, cls: "stat-ok" },
    { label: "🔧 Retrabalhados", count: counts.RR || 0, cls: "stat-rr" },
    { label: "❌ Rejeitados", count: counts.R || 0, cls: "stat-r" }
  ];

  stats.innerHTML = rows.map((row) =>
    `<div class="stat-row ${row.cls}">
      <span class="stat-label">${row.label}</span>
      <span class="stat-count">${row.count} poste${row.count !== 1 ? "s" : ""}</span>
    </div>`
  ).join("");

  modal.classList.add("modal-visible");

  const close = () => {
    modal.classList.remove("modal-visible");
    okBtn.removeEventListener("click", close);
    modal.removeEventListener("click", onOverlay);
  };
  const onOverlay = (e) => { if (e.target === modal) close(); };
  okBtn.addEventListener("click", close);
  modal.addEventListener("click", onOverlay);
}

async function renderInspecaoLiberados() {
  const db = readDb();
  const filtroData = el.insFiltroData.value;
  const modoCarga = el.insModoCarga?.value || "data";
  const setor = el.insSetor?.value || "";

  el.insLiberadosBody.innerHTML = "";
  if (modoCarga === "data" && !filtroData) {
    el.insQtdItens.textContent = "0";
    el.insLiberadosBody.innerHTML = '<tr><td colspan="5" class="muted">Selecione a data de produção para carregar os itens liberados.</td></tr>';
    return;
  }

  const apiRows = await getInspecaoRowsFromApi(filtroData, modoCarga, setor);
  // Usa API se retornou dados; se retornou vazio ou null, usa localStorage
  if (Array.isArray(apiRows) && apiRows.length > 0) {
    const rows = apiRows
      .filter((record) => String(record.liberacao_status || "") === "1")
      .filter((record) => !setor || String(record.setor || "") === setor)
      .filter((record) => (modoCarga === "data" ? dateToYmd(record.data_fabricacao || "") === filtroData : true))
      .filter((record) => !String(record.ins_status || "").trim())
      .sort((a, b) => String(a.forma_numero || "").localeCompare(String(b.forma_numero || "")));

    el.insQtdItens.textContent = String(rows.length);

    if (!rows.length) {
      el.insLiberadosBody.innerHTML = '<tr><td colspan="5" class="muted">Nenhuma forma pendente de inspeção para os filtros informados.</td></tr>';
      return;
    }

    rows.forEach((record) => {
      const tr = document.createElement("tr");
      tr.dataset.recordId = String(record.record_id || "");
      tr.dataset.dataFabricacao = String(record.data_fabricacao || "");
      tr.dataset.setor = String(record.setor || "");
      tr.dataset.formaNumero = String(record.forma_numero || "");
      tr.dataset.modelo = String(record.modelo || "");

      tr.innerHTML = `
        <td>${record.forma_numero || ""}</td>
        <td>${record.modelo || ""}</td>
        <td>
          <select data-ins-status>
            <option value="">Selecione</option>
            <option value="A">A - Aprovado</option>
            <option value="R">R - Reprovado</option>
            <option value="RR">RR - Reprovado e retrabalhado</option>
          </select>
        </td>
        <td>
          <select data-ins-code>${getInspecaoCodeOptions("")}</select>
        </td>
        <td>${fmtDate(record.data_fabricacao || "")}</td>
      `;

      const statusSelect = tr.querySelector("select[data-ins-status]");
      const codeSelect = tr.querySelector("select[data-ins-code]");
      if (statusSelect && codeSelect) {
        statusSelect.addEventListener("change", () => {
          if (statusSelect.value === "A") {
            codeSelect.value = "";
            codeSelect.disabled = true;
          } else {
            codeSelect.disabled = false;
          }
        });
      }

      el.insLiberadosBody.appendChild(tr);
    });
    filtrarFormasTabela();
    return;
  }

  const rows = db.records
    .filter((record) => record.liberacao && record.liberacao.status === "1")
    .filter((record) => (modoCarga === "data" ? record.dataFabricacao === filtroData : true))
    .filter((record) => !setor || record.setor === setor)
    .filter((record) => !Array.isArray(record.inspecoes) || record.inspecoes.length === 0)
    .sort((a, b) => (a.formaNumero > b.formaNumero ? 1 : -1));

  el.insQtdItens.textContent = String(rows.length);

  if (!rows.length) {
    el.insLiberadosBody.innerHTML = '<tr><td colspan="5" class="muted">Nenhuma forma liberada para os filtros informados.</td></tr>';
    return;
  }

  rows.forEach((record) => {
    const ultima = Array.isArray(record.inspecoes) && record.inspecoes.length ? record.inspecoes[record.inspecoes.length - 1] : null;
    const tr = document.createElement("tr");
    tr.dataset.recordId = record.id;
    tr.dataset.dataFabricacao = record.dataFabricacao || "";
    tr.dataset.setor = record.setor || "";
    tr.dataset.formaNumero = record.formaNumero || "";
    tr.dataset.modelo = record.modelo || "";
    tr.innerHTML = `
      <td>${record.formaNumero}</td>
      <td>${record.modelo || ""}</td>
      <td>
        <select data-ins-status>
          <option value="">Selecione</option>
          <option value="A" ${ultima?.status === "A" ? "selected" : ""}>A - Aprovado</option>
          <option value="R" ${ultima?.status === "R" ? "selected" : ""}>R - Reprovado</option>
          <option value="RR" ${ultima?.status === "RR" ? "selected" : ""}>RR - Reprovado e retrabalhado</option>
        </select>
      </td>
      <td>
        <select data-ins-code>${getInspecaoCodeOptions(ultima?.codigos?.[0] || "")}</select>
      </td>
      <td>${fmtDate(record.dataFabricacao || "")}</td>
    `;

    const statusSelect = tr.querySelector("select[data-ins-status]");
    const codeSelect = tr.querySelector("select[data-ins-code]");
    if (statusSelect && codeSelect) {
      const syncCodeState = () => {
        if (statusSelect.value === "A") {
          codeSelect.value = "";
          codeSelect.disabled = true;
        } else {
          codeSelect.disabled = false;
        }
      };
      statusSelect.addEventListener("change", syncCodeState);
      syncCodeState();
    }

    el.insLiberadosBody.appendChild(tr);
  });
  filtrarFormasTabela();
}

function readMontagemPostesDb() {
  const raw = localStorage.getItem(MONTAGEM_POSTES_KEY);
  if (!raw) return { postes: {} };
  try {
    const parsed = JSON.parse(raw);
    return parsed && parsed.postes && typeof parsed.postes === "object" ? parsed : { postes: {} };
  } catch {
    return { postes: {} };
  }
}

function writeMontagemPostesDb(db) {
  localStorage.setItem(MONTAGEM_POSTES_KEY, JSON.stringify(db));
}

function getMontagemPosteKey({ recordId, dataFabricacao, setor, formaNumero }) {
  return [recordId || "", dataFabricacao || "", setor || "", formaNumero || ""].join("||");
}

function getMontagemPosteByKey(key) {
  const db = readMontagemPostesDb();
  return db.postes[key] || null;
}

function upsertMontagemPoste(entry) {
  const db = readMontagemPostesDb();
  db.postes[entry.key] = entry;
  writeMontagemPostesDb(db);
}

function buildMontagemPostePayload(entry, etapa = "") {
  return {
    banco: "montagem_poste",
    etapa,
    key: entry.key || "",
    recordId: entry.recordId || "",
    dataFabricacao: entry.dataFabricacao || "",
    setor: entry.setor || "",
    formaNumero: entry.formaNumero || "",
    modelo: entry.modelo || "",
    statusMontagem: entry.statusMontagem || "",
    motivoRecusa: entry.motivoRecusa || "",
    inicioInspecaoMontagem: entry.inicioInspecaoMontagem || "",
    finalizadoEm: entry.finalizadoEm || "",
    observacoesMontagem: entry.observacoesMontagem || "",
    montadorNome: state.authUser?.name || "",
    checklists: entry.checklists || {}
  };
}

async function syncMontagemPosteToApi(entry, etapa = "", options = {}) {
  const payload = buildMontagemPostePayload(entry, etapa);
  const apiResult = await postToMontagemApi("salvar_montagem_poste", payload);

  if (apiResult.ok) {
    if (!options.silent) setSyncStatus("ok", "Montagem de poste sincronizada com a planilha.");
    return { ok: true, synced: true };
  }

  if (apiResult.skipped) {
    if (!options.silent) setSyncStatus("warn", "API não configurada. Montagem de poste salva localmente.");
    return { ok: true, synced: false, skipped: true };
  }

  if (!options.silent) setSyncStatus("warn", "Montagem salva localmente, mas sem sincronização no momento.");
  return { ok: false, synced: false, error: apiResult.error || "falha de sincronização" };
}

function isChecklistSectionComplete(sectionId, respostas = {}) {
  const section = MONTAGEM_CHECKLIST_SECTIONS.find((s) => s.id === sectionId);
  if (!section) return false;
  return section.itens.every((item) => respostas[sectionId]?.[item.id] === "sim" || respostas[sectionId]?.[item.id] === "nao");
}

function renderMontagemChecklistSections() {
  if (!el.mpChecklistSections || !state.montagemPostesAtual) return;
  const current = state.montagemPostesAtual;
  el.mpChecklistSections.innerHTML = "";

  MONTAGEM_CHECKLIST_SECTIONS.forEach((section) => {
    const article = document.createElement("article");
    article.className = "mp-checklist-section";

    const isComplete = isChecklistSectionComplete(section.id, current.checklists || {});
    const rows = section.itens.map((item) => {
      const selected = current.checklists?.[section.id]?.[item.id] || "";
      const row = document.createElement("div");
      row.className = "mp-checklist-item";
      row.innerHTML = `
        <span class="mp-checklist-item-text">${item.texto}</span>
        <div class="mp-yn-group">
          <button type="button" class="mp-yn-btn ${selected === "sim" ? "active" : ""}" data-mp-section="${section.id}" data-mp-item="${item.id}" data-mp-value="sim">Sim</button>
          <button type="button" class="mp-yn-btn ${selected === "nao" ? "active" : ""}" data-mp-section="${section.id}" data-mp-item="${item.id}" data-mp-value="nao">Não</button>
        </div>
      `;
      return row;
    });

    const sectionHeader = document.createElement("div");
    sectionHeader.className = "mp-checklist-header";
    sectionHeader.innerHTML = `
      <strong>${section.titulo}</strong>
      <span class="mp-checklist-flag ${isComplete ? "ok" : "pendente"}">${isComplete ? "OK" : "Pendente"}</span>
    `;
    article.appendChild(sectionHeader);
    rows.forEach((r) => article.appendChild(r));
    el.mpChecklistSections.appendChild(article);
  });
}

function setMontagemChecklistAnswer(sectionId, itemId, value) {
  if (!state.montagemPostesAtual) return;
  const current = { ...state.montagemPostesAtual };
  if (!current.checklists) current.checklists = {};
  if (!current.checklists[sectionId]) current.checklists[sectionId] = {};
  current.checklists[sectionId][itemId] = value;
  state.montagemPostesAtual = current;
  upsertMontagemPoste(current);
  syncMontagemPosteToApi(current, "CHECKLIST", { silent: true }).catch(() => {});
  renderMontagemChecklistSections();
}

function renderMontagemStatusUI() {
  const poste = state.montagemPostesAtual;
  if (!poste || !el.mpStatusButtons) return;

  const status = poste.statusMontagem || "";
  el.mpStatusButtons.querySelectorAll("[data-mp-status]").forEach((btn) => {
    if (!(btn instanceof HTMLElement)) return;
    btn.classList.toggle("active", btn.dataset.mpStatus === status);
  });

  if (el.mpMotivoWrap && el.mpMotivoSelect) {
    const precisaMotivo = status === "R" || status === "RR";
    el.mpMotivoWrap.classList.toggle("hidden", !precisaMotivo);
    el.mpMotivoSelect.value = poste.motivoRecusa || "";
    el.mpMotivoSelect.disabled = !precisaMotivo || !!poste.finalizadoEm;
  }

  if (poste.finalizadoEm && el.mpStatusButtons) {
    el.mpStatusButtons.querySelectorAll("button").forEach((btn) => {
      btn.disabled = true;
    });
  }
}

function setMontagemStatus(status) {
  if (!state.montagemPostesAtual) return;
  const current = { ...state.montagemPostesAtual };
  current.statusMontagem = status;
  if (status === "A") current.motivoRecusa = "";
  state.montagemPostesAtual = current;
  upsertMontagemPoste(current);
  syncMontagemPosteToApi(current, "CHECKLIST", { silent: true }).catch(() => {});
  renderMontagemStatusUI();
}

function setMontagemMotivoRecusa(value) {
  if (!state.montagemPostesAtual) return;
  const current = { ...state.montagemPostesAtual, motivoRecusa: value || "" };
  state.montagemPostesAtual = current;
  upsertMontagemPoste(current);
  syncMontagemPosteToApi(current, "CHECKLIST", { silent: true }).catch(() => {});
}

function showMontagemResumoModal(poste) {
  if (!el.mpResumoModal || !el.mpResumoBody || !el.mpResumoOkBtn) return;
  const statusLabel = montagemStatusLabel(poste.statusMontagem || "");
  const motivo = poste.statusMontagem === "A" ? "-" : getMotivoRecusaLabel(poste.motivoRecusa || "");
  const dtMontagem = formatDateTime(poste.finalizadoEm || "");

  el.mpResumoBody.innerHTML = `
    <div><strong>Montador:</strong> ${escapeHtml(state.authUser?.name || "-")}</div>
    <div><strong>Setor:</strong> ${escapeHtml(poste.setor || "-")}</div>
    <div><strong>Poste Modelo:</strong> ${escapeHtml(poste.modelo || "-")}</div>
    <div><strong>Forma:</strong> ${escapeHtml(poste.formaNumero || "-")}</div>
    <div><strong>Dt. Produção:</strong> ${fmtDate(poste.dataFabricacao || "") || "-"}</div>
    <div><strong>Dt. Montagem:</strong> ${dtMontagem}</div>
    <div><strong>Status:</strong> ${statusLabel}</div>
    <div><strong>Motivo da recusa:</strong> ${motivo}</div>
    <div><strong>Observações:</strong> ${escapeHtml(poste.observacoesMontagem || "-")}</div>
    <div><strong>Registro:</strong> ${escapeHtml(poste.key || "-")}</div>
    <div><strong>Persistência:</strong> ${escapeHtml(poste.resumoSync || "-")}</div>
  `;

  const close = () => {
    el.mpResumoModal.classList.remove("modal-visible");
    el.mpResumoOkBtn.removeEventListener("click", close);
    el.mpResumoModal.removeEventListener("click", onOverlay);
  };
  const onOverlay = (event) => {
    if (event.target === el.mpResumoModal) close();
  };

  el.mpResumoModal.classList.add("modal-visible");
  el.mpResumoOkBtn.addEventListener("click", close);
  el.mpResumoModal.addEventListener("click", onOverlay);
}

function renderMontagemPosteDetalhe() {
  if (!el.mpDetalheHeader || !state.montagemPostesAtual) return;
  const poste = state.montagemPostesAtual;
  el.mpDetalheHeader.innerHTML = `
    <div><strong>Forma:</strong> ${poste.formaNumero || "-"}</div>
    <div><strong>Modelo:</strong> ${poste.modelo || "-"}</div>
    <div><strong>Setor:</strong> ${poste.setor || "-"}</div>
    <div><strong>Data Produção:</strong> ${fmtDate(poste.dataFabricacao || "") || "-"}</div>
    <div><strong>Início inspeção/montagem:</strong> ${formatDateTime(poste.inicioInspecaoMontagem || "")}</div>
    <div><strong>Finalizado em:</strong> ${poste.finalizadoEm ? formatDateTime(poste.finalizadoEm) : "-"}</div>
  `;

  if (el.mpMotivoSelect) {
    const options = getMontagemMotivoOptions();
    const currentValue = poste.motivoRecusa || "";
    const first = '<option value="">Selecione o motivo</option>';
    const html = options
      .map((opt) => `<option value="${opt.value}" ${opt.value === currentValue ? "selected" : ""}>${opt.label}</option>`)
      .join("");
    el.mpMotivoSelect.innerHTML = first + html;
  }

  renderMontagemChecklistSections();
  if (el.mpObservacoes) {
    el.mpObservacoes.value = poste.observacoesMontagem || "";
    el.mpObservacoes.disabled = !!poste.finalizadoEm;
  }
  renderMontagemStatusUI();

  if (el.mpFinalizarPoste) {
    el.mpFinalizarPoste.disabled = !!poste.finalizadoEm;
    el.mpFinalizarPoste.textContent = poste.finalizadoEm ? "Salvo" : "Salvar";
  }
}

async function openMontagemPosteDetalhe(posteBase) {
  const key = getMontagemPosteKey(posteBase);
  const now = nowIso();
  const atual = getMontagemPosteByKey(key);

  const merged = {
    key,
    recordId: posteBase.recordId || "",
    dataFabricacao: posteBase.dataFabricacao || "",
    setor: posteBase.setor || "",
    formaNumero: posteBase.formaNumero || "",
    modelo: posteBase.modelo || "",
    statusMontagem: atual?.statusMontagem || "",
    motivoRecusa: atual?.motivoRecusa || "",
    inicioInspecaoMontagem: atual?.inicioInspecaoMontagem || now,
    finalizadoEm: atual?.finalizadoEm || "",
    observacoesMontagem: atual?.observacoesMontagem || "",
    checklists: atual?.checklists || {}
  };

  upsertMontagemPoste(merged);
  await syncMontagemPosteToApi(merged, "INICIO", { silent: true });
  state.montagemPostesAtual = merged;
  setMode("MONTAGEM_POSTES_DETALHE");
  renderMontagemPosteDetalhe();
}

async function finalizarMontagemPosteAtual() {
  const poste = state.montagemPostesAtual;
  if (!poste) {
    showMsgBox("Nenhum poste selecionado.", "error");
    return;
  }

  const allSectionsOk = MONTAGEM_CHECKLIST_SECTIONS.every((section) =>
    isChecklistSectionComplete(section.id, poste.checklists || {})
  );

  if (!allSectionsOk) {
    showMsgBox("Responda todos os itens (Sim/Não) de todas as seções antes de finalizar.", "error");
    return;
  }

  const status = poste.statusMontagem || "";
  if (!status) {
    showMsgBox("Selecione o status da montagem: Aprovado, Reprovado ou Reprovado e Retrabalhado.", "error");
    return;
  }

  if ((status === "R" || status === "RR") && !poste.motivoRecusa) {
    showMsgBox("Selecione o motivo da recusa para continuar.", "error");
    return;
  }

  const updated = {
    ...poste,
    finalizadoEm: nowIso()
  };
  upsertMontagemPoste(updated);
  state.montagemPostesAtual = updated;

  const syncResult = await syncMontagemPosteToApi(updated, "FINALIZACAO", { silent: false });
  renderMontagemPosteDetalhe();
  showMontagemResumoModal({
    ...updated,
    resumoSync: syncResult.synced ? "Sincronizado" : "Salvo localmente"
  });
}

function filtrarMontagemTabela() {
  const texto = (el.mpFormaFiltro?.value || "").trim().toUpperCase();
  Array.from(el.mpLiberadosBody?.querySelectorAll("tr[data-forma-numero]") || []).forEach((tr) => {
    const forma = (tr.dataset.formaNumero || "").toUpperCase();
    tr.style.display = !texto || forma.includes(texto) ? "" : "none";
  });
}

async function renderMontagemPostesLiberados() {
  if (!el.mpLiberadosBody || !el.mpQtdItens) return;

  const filtroData = el.mpFiltroData?.value || "";
  const modoCarga = el.mpModoCarga?.value || "data";
  const setor = el.mpSetor?.value || "";

  el.mpLiberadosBody.innerHTML = "";
  if (modoCarga === "data" && !filtroData) {
    el.mpQtdItens.textContent = "0";
    el.mpLiberadosBody.innerHTML = '<tr><td colspan="4" class="muted">Selecione a data de produção para carregar os itens liberados.</td></tr>';
    return;
  }

  const montagemDb = readMontagemPostesDb();
  let rows = [];
  const apiRows = await getInspecaoRowsFromApi(filtroData, modoCarga, setor);

  if (Array.isArray(apiRows) && apiRows.length > 0) {
    rows = apiRows
      .filter((record) => String(record.liberacao_status || "") === "1")
      .filter((record) => !setor || String(record.setor || "") === setor)
      .filter((record) => (modoCarga === "data" ? dateToYmd(record.data_fabricacao || "") === filtroData : true))
      .map((record) => ({
        recordId: String(record.record_id || ""),
        dataFabricacao: String(record.data_fabricacao || ""),
        setor: String(record.setor || ""),
        formaNumero: String(record.forma_numero || ""),
        modelo: String(record.modelo || "")
      }))
      .filter((record) => {
        if (modoCarga !== "pendentes") return true;
        const key = getMontagemPosteKey(record);
        return !montagemDb.postes[key]?.finalizadoEm;
      })
      .sort((a, b) => a.formaNumero.localeCompare(b.formaNumero));
  } else {
    const db = readDb();
    rows = db.records
      .filter((record) => record.liberacao && record.liberacao.status === "1")
      .filter((record) => (modoCarga === "data" ? record.dataFabricacao === filtroData : true))
      .filter((record) => !setor || record.setor === setor)
      .map((record) => ({
        recordId: record.id || "",
        dataFabricacao: record.dataFabricacao || "",
        setor: record.setor || "",
        formaNumero: record.formaNumero || "",
        modelo: record.modelo || ""
      }))
      .filter((record) => {
        if (modoCarga !== "pendentes") return true;
        const key = getMontagemPosteKey(record);
        return !montagemDb.postes[key]?.finalizadoEm;
      })
      .sort((a, b) => a.formaNumero.localeCompare(b.formaNumero));
  }

  el.mpQtdItens.textContent = String(rows.length);

  if (!rows.length) {
    el.mpLiberadosBody.innerHTML = '<tr><td colspan="4" class="muted">Nenhum poste liberado para os filtros informados.</td></tr>';
    return;
  }

  rows.forEach((record) => {
    const key = getMontagemPosteKey(record);
    const controle = montagemDb.postes[key];
    const isFinalizado = !!controle?.finalizadoEm;
    const label = isFinalizado ? "Revisar Poste Montado" : "Inspecionar / Montar Poste";

    const tr = document.createElement("tr");
    tr.dataset.recordId = record.recordId;
    tr.dataset.dataFabricacao = record.dataFabricacao;
    tr.dataset.setor = record.setor;
    tr.dataset.formaNumero = record.formaNumero;
    tr.dataset.modelo = record.modelo;
    tr.innerHTML = `
      <td data-label="N Forma">${record.formaNumero || ""}</td>
      <td data-label="Modelo">${record.modelo || ""}</td>
      <td data-label="Data Prod.">${fmtDate(record.dataFabricacao || "")}</td>
      <td data-label="Ação"><button type="button" class="btn mp-open-btn">${label}</button></td>
    `;
    el.mpLiberadosBody.appendChild(tr);
  });

  filtrarMontagemTabela();
}

async function saveInspecao() {
  if (state.isSendingInspecao) return;

  const colaborador = el.insColaborador.value.trim();
  const observacaoGlobal = el.insObs.value.trim();

  if (!colaborador) {
    showMsgBox("Preencha o colaborador da inspeção.", "error");
    return;
  }

  const linhasInspecao = Array.from(document.querySelectorAll("#insLiberadosBody tr[data-record-id]"));
  const selectedRows = linhasInspecao.filter((linha) => {
    const status = linha.querySelector("select[data-ins-status]")?.value || "";
    return Boolean(status);
  });

  if (!selectedRows.length) {
    showMsgBox("Preencha o Status em ao menos uma forma para salvar a inspeção.", "error");
    return;
  }

  const lockPayloadRows = selectedRows
    .map((tr) => {
      return {
        recordId: tr?.dataset.recordId || "",
        status: tr?.querySelector("select[data-ins-status]")?.value || "",
        codigo: tr?.querySelector("select[data-ins-code]")?.value || "",
        observacoes: ""
      };
    })
    .sort((a, b) => a.recordId.localeCompare(b.recordId));

  const lockPayload = {
    action: "salvar_inspecao_lote",
    colaborador,
    observacaoGlobal,
    fotos: state.insPhotos.map((photo) => photo.id || photo.name || ""),
    rows: lockPayloadRows
  };
  const lockToken = payloadToken(lockPayload);

  if (state.submitLocks.inspecao && state.submitLocks.inspecao === lockToken) {
    setSyncStatus("warn", "Envio de inspeção já realizado para este mesmo conteúdo. Altere os dados para reenviar.");
    showMsgBox("Este envio de inspeção já foi realizado. Altere os dados para enviar novamente.", "warn");
    return;
  }

  state.isSendingInspecao = true;
  setSubmitButtonState(el.salvarInspecao, true);
  if (el.salvarInspecaoFloat) setSubmitButtonState(el.salvarInspecaoFloat, true);

  const loadingModal = document.getElementById("loadingModal");
  if (loadingModal) loadingModal.classList.add("modal-visible");

  try {

    const db = readDb();
    let saved = 0;
    const inspecaoEntries = [];

    for (const tr of selectedRows) {
      const dataFabricacao = tr?.dataset.dataFabricacao || el.insFiltroData.value;
      const setor = tr?.dataset.setor || el.insSetor.value || "";
      const formaNumero = normalizeUpper(tr?.dataset.formaNumero || "");
      const modelo = tr?.dataset.modelo || "";
      const recordId = tr?.dataset.recordId || uuid();
      const status = tr?.querySelector("select[data-ins-status]")?.value || "";
      const codigo = tr?.querySelector("select[data-ins-code]")?.value || "";
      const codigoFinal = status === "A" ? "" : codigo;
      const obsLinha = "";

      if (!recordId || !status) {
        showMsgBox("Cada forma selecionada deve ter Status preenchido.", "error");
        return;
      }

      if (status !== "A" && !codigoFinal) {
        showMsgBox("Para status R ou RR, preencha o Código (A-M).", "error");
        return;
      }

      let record = db.records.find((item) => item.id === recordId);
      if (!record) {
        record = findRecordByKey(db, dataFabricacao, setor, formaNumero);
      }
      if (!record) {
        record = {
          id: recordId,
          dataFabricacao,
          setor,
          formaNumero,
          modelo,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          liberacao: {
            status: "1",
            statusFlags: statusFlagsFromCode("1"),
            colaborador: "",
            observacoes: "",
            fotos: [],
            timestamp: nowIso()
          },
          inspecoes: []
        };
      }
      if (!record.liberacao || record.liberacao.status !== "1") {
        record.liberacao = {
          status: "1",
          statusFlags: statusFlagsFromCode("1"),
          colaborador: record.liberacao?.colaborador || "",
          observacoes: record.liberacao?.observacoes || "",
          fotos: Array.isArray(record.liberacao?.fotos) ? record.liberacao.fotos : [],
          timestamp: record.liberacao?.timestamp || nowIso()
        };
      }

      const tipo = Array.isArray(record.inspecoes) && record.inspecoes.length ? "REINSPECAO" : "INSPECAO";
      const observacoes = obsLinha || observacaoGlobal;

      const inspecao = {
        id: uuid(),
        tipo,
        colaborador,
        status,
        codigos: [codigoFinal],
        observacoes,
        fotos: [...state.insPhotos],
        timestamp: nowIso()
      };

      record.inspecoes = Array.isArray(record.inspecoes) ? record.inspecoes : [];
      record.inspecoes.push(inspecao);
      record.updatedAt = nowIso();
      record.statusFluxo = statusFluxoFromRecord(record);
      upsertRecord(db, record);

      addEvent(db, {
        id: uuid(),
        recordId: record.id,
        etapa: tipo,
        status,
        colaborador,
        setor: record.setor || setor,
        formaNumero: record.formaNumero || formaNumero,
        dataFabricacao: record.dataFabricacao || dataFabricacao,
        codigos: [codigoFinal],
        observacoes,
        fotosCount: state.insPhotos.length,
        timestamp: nowIso()
      });

      inspecaoEntries.push({
        recordId: record.id,
        dataFabricacao: record.dataFabricacao || dataFabricacao,
        setor: record.setor || setor,
        formaNumero: record.formaNumero || formaNumero,
        tipo,
        status,
        codigo: codigoFinal,
        colaborador,
        observacoes,
        fotosCount: state.insPhotos.length,
        timestamp: inspecao.timestamp
      });

      saved += 1;
    }

    writeDb(db);
    setSubmitLock("inspecao", lockToken);

    state.insPhotos = [];
    el.insObs.value = "";
    el.insFotos.value = "";
    renderPhotoPreview(el.insFotosPreview, state.insPhotos);

    renderInspecaoLiberados();
    renderLiberacaoDual();
    renderHistorico();

    const counts = { A: 0, R: 0, RR: 0 };
    inspecaoEntries.forEach((e) => { if (e.status in counts) counts[e.status]++; });

    const apiResult = await postToApi("salvar_inspecao_lote", { entries: inspecaoEntries });
    if (apiResult.ok) {
      setSyncStatus("ok", `Inspeção sincronizada com sucesso (${apiResult.updated || saved} atualizações).`);
      showInspecaoModal(counts, "ok");
    } else if (apiResult.skipped) {
      setSyncStatus("warn", "Inspeções salvas localmente. Configure a URL da API para sincronizar.");
      showInspecaoModal(counts, "warn");
    } else {
      setSyncStatus("error", "Inspeções salvas localmente, mas falhou atualização na planilha.");
      showInspecaoModal(counts, "error");
    }
  } finally {
    if (loadingModal) loadingModal.classList.remove("modal-visible");
    state.isSendingInspecao = false;
    setSubmitButtonState(el.salvarInspecao, false);
    if (el.salvarInspecaoFloat) setSubmitButtonState(el.salvarInspecaoFloat, false);
  }
}

function renderDashboardCharts() {
  const db = readDb();
  const dbDataEl = document.getElementById("dbData");
  const selectedDate = dbDataEl ? dbDataEl.value : "";

  // Aggregate events by date
  const prodByDate = {};
  const insByDate = {};
  const insStatusTotal = { A: 0, R: 0, RR: 0 };
  const prodS1ByDate = {};
  const prodS2ByDate = {};
  const insS1 = { A: 0, R: 0, RR: 0 };
  const insS2 = { A: 0, R: 0, RR: 0 };
  const ncCount = {};

  db.events.forEach((ev) => {
    const etapa = (ev.etapa || "").toUpperCase();
    const d = ev.dataFabricacao || "";
    const setor = (ev.setor || "").toLowerCase();
    const isS1 = setor.includes("1");
    const isS2 = setor.includes("2");
    if (etapa === "LIBERACAO") {
      prodByDate[d] = (prodByDate[d] || 0) + 1;
      if (isS1) prodS1ByDate[d] = (prodS1ByDate[d] || 0) + 1;
      if (isS2) prodS2ByDate[d] = (prodS2ByDate[d] || 0) + 1;
    } else if (etapa === "INSPECAO" || etapa === "REINSPECAO") {
      if (!insByDate[d]) insByDate[d] = { A: 0, R: 0, RR: 0, total: 0 };
      insByDate[d].total++;
      const s = (ev.status || "").toUpperCase();
      if (s in insStatusTotal) {
        insStatusTotal[s]++;
        insByDate[d][s]++;
        if (isS1 && s in insS1) insS1[s]++;
        if (isS2 && s in insS2) insS2[s]++;
      }
      const codigos = Array.isArray(ev.codigos) ? ev.codigos : [];
      codigos.forEach((c) => { if (c) ncCount[c.toUpperCase()] = (ncCount[c.toUpperCase()] || 0) + 1; });
    }
  });

  // KPI for selected date or all
  let kpiProd = 0, kpiIns = 0, kpiA = 0, kpiR = 0, kpiRR = 0;
  if (selectedDate) {
    kpiProd = prodByDate[selectedDate] || 0;
    const iv = insByDate[selectedDate] || { A: 0, R: 0, RR: 0, total: 0 };
    kpiIns = iv.total; kpiA = iv.A; kpiR = iv.R; kpiRR = iv.RR;
  } else {
    kpiProd = Object.values(prodByDate).reduce((s, v) => s + v, 0);
    kpiA = insStatusTotal.A; kpiR = insStatusTotal.R; kpiRR = insStatusTotal.RR;
    kpiIns = kpiA + kpiR + kpiRR;
  }
  const rejPct = kpiIns > 0 ? Math.round(((kpiR + kpiRR) / kpiIns) * 100) : 0;

  const setTxt = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  setTxt("dbKpiProd", kpiProd);
  setTxt("dbKpiIns", kpiIns);
  setTxt("dbKpiA", kpiA);
  setTxt("dbKpiR", kpiR);
  setTxt("dbKpiRR", kpiRR);
  setTxt("dbKpiRejPct", rejPct + "%");

  // Last 7 dates sorted asc
  const allDates = [...new Set([...Object.keys(prodByDate), ...Object.keys(insByDate)])]
    .sort((a, b) => (a < b ? -1 : 1)).slice(-7);
  const labels = allDates.map((d) => d.split("-").reverse().join("/"));
  const prodData = allDates.map((d) => prodByDate[d] || 0);
  const insData = allDates.map((d) => (insByDate[d] || {}).total || 0);

  // Bar chart: production vs inspection by day
  destroyChart("chartProd");
  const ctxProd = document.getElementById("chartProd");
  if (ctxProd && typeof Chart !== "undefined") {
    chartInstances["chartProd"] = new Chart(ctxProd, {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: "Produção", data: prodData, backgroundColor: "#1e40af", borderRadius: 6 },
          { label: "Inspecionados", data: insData, backgroundColor: "#059669", borderRadius: 6 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "top" } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } } }
      }
    });
  }

  // Doughnut: inspection status
  destroyChart("chartIns");
  const ctxIns = document.getElementById("chartIns");
  if (ctxIns && typeof Chart !== "undefined") {
    chartInstances["chartIns"] = new Chart(ctxIns, {
      type: "doughnut",
      data: {
        labels: ["Aprovados", "Rejeitados", "Retrabalho"],
        datasets: [{ data: [kpiA, kpiR, kpiRR], backgroundColor: ["#059669", "#dc2626", "#d97706"], borderWidth: 2 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } }
      }
    });
  }

  // Bar: produção por setor por dia (7 dias)
  destroyChart("chartProdSetor");
  const ctxProdSetor = document.getElementById("chartProdSetor");
  if (ctxProdSetor && typeof Chart !== "undefined") {
    chartInstances["chartProdSetor"] = new Chart(ctxProdSetor, {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: "Setor 1", data: allDates.map((d) => prodS1ByDate[d] || 0), backgroundColor: "#1e40af", borderRadius: 6 },
          { label: "Setor 2", data: allDates.map((d) => prodS2ByDate[d] || 0), backgroundColor: "#059669", borderRadius: 6 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "top" } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } } }
      }
    });
  }

  // Grouped bar: resultado inspeção por setor
  destroyChart("chartInsSetor");
  const ctxInsSetor = document.getElementById("chartInsSetor");
  if (ctxInsSetor && typeof Chart !== "undefined") {
    chartInstances["chartInsSetor"] = new Chart(ctxInsSetor, {
      type: "bar",
      data: {
        labels: ["Aprovados", "Rejeitados", "Retrabalho"],
        datasets: [
          { label: "Setor 1", data: [insS1.A, insS1.R, insS1.RR], backgroundColor: "#1e40af", borderRadius: 6 },
          { label: "Setor 2", data: [insS2.A, insS2.R, insS2.RR], backgroundColor: "#059669", borderRadius: 6 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "top" } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } } }
      }
    });
  }

  // Horizontal bar: não conformidades por código
  destroyChart("chartNc");
  const ctxNc = document.getElementById("chartNc");
  if (ctxNc && typeof Chart !== "undefined") {
    const ncCodes = CHECKLIST_INSPECAO_CODIGOS.filter((item) => ncCount[item.codigo] > 0)
      .sort((a, b) => (ncCount[b.codigo] || 0) - (ncCount[a.codigo] || 0));
    const allNcCodes = ncCodes.length
      ? ncCodes
      : CHECKLIST_INSPECAO_CODIGOS.slice(0, 5);
    const ncLabels = allNcCodes.map((item) => `${item.codigo} – ${item.descricao}`);
    const ncData = allNcCodes.map((item) => ncCount[item.codigo] || 0);
    chartInstances["chartNc"] = new Chart(ctxNc, {
      type: "bar",
      data: {
        labels: ncLabels,
        datasets: [{ label: "Ocorrências", data: ncData, backgroundColor: "#7c3aed", borderRadius: 6 }]
      },
      options: {
        indexAxis: "y",
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } } }
      }
    });
  }

  // History rows (last 7 dates sorted desc)
  const histEl = document.getElementById("dbHistory");
  if (!histEl) return;
  const histDates = [...allDates].reverse();
  const maxProd = histDates.reduce((m, d) => Math.max(m, prodByDate[d] || 0), 1);
  if (!histDates.length) {
    histEl.innerHTML = '<p class="muted" style="font-size:.82rem;margin:0">Nenhum registro encontrado.</p>';
    return;
  }
  histEl.innerHTML = histDates.map((d) => {
    const prod = prodByDate[d] || 0;
    const ins = (insByDate[d] || {}).total || 0;
    const rj = (insByDate[d] || { R: 0, RR: 0 }).R + (insByDate[d] || { R: 0, RR: 0 }).RR;
    const pct = Math.round((prod / maxProd) * 100);
    const fmt = d.split("-").reverse().join("/");
    return `<div class="ins-dash-hist-row">
  <span class="ins-dash-hist-date">${fmt}</span>
  <div class="ins-dash-hist-bar-track"><div class="ins-dash-hist-bar" style="width:${pct}%"></div></div>
  <span class="ins-dash-hist-count">${prod}</span>
  <span style="color:#065f46;font-size:.78rem;min-width:50px">✔ ${ins}</span>
  <span style="color:#991b1b;font-size:.78rem;min-width:46px">✘ ${rj}</span>
</div>`;
  }).join("");
}

function renderDashboardStats() {
  const db = readDb();
  const dataInput = document.getElementById("insDashData");
  const selectedDate = dataInput ? dataInput.value : "";

  // Aggregate inspection events from local DB
  // Group by dataFabricacao, count statuses
  const byDate = {};
  db.events.forEach((ev) => {
    const etapa = (ev.etapa || "").toUpperCase();
    if (etapa !== "INSPECAO" && etapa !== "REINSPECAO") return;
    const d = ev.dataFabricacao || "";
    if (!byDate[d]) byDate[d] = { total: 0, A: 0, R: 0, RR: 0 };
    byDate[d].total++;
    const s = (ev.status || "").toUpperCase();
    if (s === "A") byDate[d].A++;
    else if (s === "R") byDate[d].R++;
    else if (s === "RR") byDate[d].RR++;
  });

  // Summary for selected date (or all if no date)
  const summary = selectedDate && byDate[selectedDate]
    ? byDate[selectedDate]
    : Object.values(byDate).reduce((acc, v) => {
        acc.total += v.total; acc.A += v.A; acc.R += v.R; acc.RR += v.RR;
        return acc;
      }, { total: 0, A: 0, R: 0, RR: 0 });

  const rejeitados = summary.R + summary.RR;
  const rejPct = summary.total > 0 ? Math.round((rejeitados / summary.total) * 100) : 0;

  const setTxt = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  setTxt("insDashTotal", summary.total);
  setTxt("insDashAprovados", summary.A);
  setTxt("insDashRejeitados", summary.R);
  setTxt("insDashRetrabalho", summary.RR);
  setTxt("insDashRatePct", rejPct + "%");
  const rateBar = document.getElementById("insDashRateBar");
  if (rateBar) rateBar.style.width = rejPct + "%";

  // History rows (last 7 dates sorted desc)
  const histEl = document.getElementById("insDashHistory");
  if (!histEl) return;
  const dates = Object.keys(byDate).sort((a, b) => (a < b ? 1 : -1)).slice(0, 7);
  const maxTotal = dates.reduce((m, d) => Math.max(m, byDate[d].total), 1);

  if (!dates.length) {
    histEl.innerHTML = '<p class="muted" style="font-size:0.82rem;margin:0">Nenhum registro de inspeção encontrado.</p>';
    return;
  }

  histEl.innerHTML = dates.map((d) => {
    const row = byDate[d];
    const pct = Math.round((row.total / maxTotal) * 100);
    const fmt = d.split("-").reverse().join("/");
    const rj = row.R + row.RR;
    return `<div class="ins-dash-hist-row">
  <span class="ins-dash-hist-date">${fmt}</span>
  <div class="ins-dash-hist-bar-track"><div class="ins-dash-hist-bar" style="width:${pct}%"></div></div>
  <span class="ins-dash-hist-count">${row.total}</span>
  <span style="color:#991b1b;font-size:0.78rem;min-width:46px">❌ ${rj}</span>
</div>`;
  }).join("");
}

async function renderHistorico() {
  const db = readDb();
  const data = el.histData.value;
  const tipo = (el.histTipo?.value || "").trim();
  const forma = normalizeUpper(el.histForma.value);

  let rows = db.events
    .filter((event) => !data || event.dataFabricacao === data)
    .filter((event) => {
      if (!tipo) return true;
      if (tipo === "LIBERACAO") return event.etapa === "LIBERACAO";
      if (tipo === "INSPECAO") return event.etapa === "INSPECAO" || event.etapa === "REINSPECAO";
      return true;
    })
    .filter((event) => !forma || event.formaNumero === forma)
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

  if (!rows.length && hasApiConfigured() && data) {
    const [setor1, setor2] = await Promise.all([
      getRowsForDashboard(data, "Setor 1"),
      getRowsForDashboard(data, "Setor 2")
    ]);
    const apiRows = [...(setor1.rows || []), ...(setor2.rows || [])];
    const apiEvents = [];
    apiRows.forEach((row) => {
      const formaNumero = String(row.forma_numero || "");
      const setor = String(row.setor || "");
      const baseTs = row.lib_timestamp || row.updated_at || nowIso();
      if (String(row.liberacao_status || "") === "1") {
        apiEvents.push({
          etapa: "LIBERACAO",
          status: String(row.liberacao_status || ""),
          dataFabricacao: String(row.data_fabricacao || data),
          setor,
          formaNumero,
          colaborador: String(row.lib_colaborador || ""),
          timestamp: baseTs,
          fotosCount: 0,
          codigos: [],
          observacoes: ""
        });
      }
      if (String(row.ins_status || "").trim()) {
        apiEvents.push({
          etapa: "INSPECAO",
          status: String(row.ins_status || ""),
          dataFabricacao: String(row.data_fabricacao || data),
          setor,
          formaNumero,
          colaborador: String(row.ins_colaborador || ""),
          timestamp: row.ins_timestamp || baseTs,
          fotosCount: 0,
          codigos: row.ins_codigo ? [String(row.ins_codigo)] : [],
          observacoes: String(row.ins_observacoes || "")
        });
      }
    });

    rows = apiEvents
      .filter((event) => {
        if (!tipo) return true;
        if (tipo === "LIBERACAO") return event.etapa === "LIBERACAO";
        if (tipo === "INSPECAO") return event.etapa === "INSPECAO" || event.etapa === "REINSPECAO";
        return true;
      })
      .filter((event) => !forma || normalizeUpper(event.formaNumero) === forma)
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  }

  el.historicoLista.innerHTML = "";
  if (!rows.length) {
    el.historicoLista.innerHTML = '<p class="muted">Sem eventos para o filtro informado.</p>';
    return;
  }

  rows.forEach((evt) => {
    const item = document.createElement("article");
    item.className = "item";
    item.innerHTML = `
      <div class="item-main">
        <strong>${evt.etapa} • ${evt.status}</strong>
        <div class="item-meta">${evt.dataFabricacao} • ${evt.setor} • ${evt.formaNumero}</div>
        <div class="item-meta">${evt.colaborador || "-"} • ${formatDateTime(evt.timestamp)} • Fotos: ${evt.fotosCount || 0}</div>
        ${Array.isArray(evt.codigos) && evt.codigos.length ? `<div class="item-meta">Códigos: ${evt.codigos.join(", ")}</div>` : ""}
        ${evt.statusFlags ? `<div class="item-meta">1/0: L=${evt.statusFlags.liberado} D=${evt.statusFlags.naoMontado} M=${evt.statusFlags.manutencao}</div>` : ""}
        ${evt.observacoes ? `<div class="item-meta">Obs: ${evt.observacoes}</div>` : ""}
      </div>
    `;
    el.historicoLista.appendChild(item);
  });
}

function statusLabelFromCode(code) {
  if (code === "1") return "Liberado";
  if (code === "D") return "Não montado";
  if (code === "M") return "Manutenção";
  return "-";
}

function formatTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const ACMP_NOTES_KEY = "pwa_acmp_notas_v1";

function getAcmpNoteKey(data, setor, forma) {
  return `${data}||${setor}||${forma}`;
}

function readAcmpNotes() {
  try { return JSON.parse(localStorage.getItem(ACMP_NOTES_KEY) || "{}"); } catch { return {}; }
}

function writeAcmpNotes(notes) {
  localStorage.setItem(ACMP_NOTES_KEY, JSON.stringify(notes));
}

function showAcmpFeedback(msg, type) {
  if (!el.acmpFeedback) return;
  el.acmpFeedback.textContent = msg;
  el.acmpFeedback.className = "lib-feedback";
  el.acmpFeedback.classList.add(type === "ok" ? "feedback-ok" : "feedback-error");
  el.acmpFeedback.classList.remove("hidden");
  setTimeout(() => el.acmpFeedback.classList.add("hidden"), 3000);
}

function salvarAcmp() {
  const output = el.acmpOutput;
  if (!output) return;
  const data = el.acmpData?.value || "";
  const notes = readAcmpNotes();
  output.querySelectorAll("tr[data-acmp-forma]").forEach((tr) => {
    const forma = tr.dataset.acmpForma;
    const setor = tr.dataset.acmpSetor;
    const traco = tr.querySelector("input[data-acmp-traco]")?.value || "";
    const obs = tr.querySelector("input[data-acmp-obs]")?.value || "";
    notes[getAcmpNoteKey(data, setor, forma)] = { traco, obs };
  });
  writeAcmpNotes(notes);
  showAcmpFeedback("Dados salvos com sucesso!", "ok");
}

function imprimirAcmp() {
  window.print();
}

async function renderAcmpConcretagem() {
  const output = el.acmpOutput;
  if (!output) return;

  const data = el.acmpData?.value || "";
  const modoCarga = el.acmpModoCarga?.value || "data";
  const setorFiltro = el.acmpSetor?.value || "";

  if (modoCarga === "data" && !data) {
    output.innerHTML = '<p class="muted">Selecione a data para carregar o relatório.</p>';
    return;
  }

  output.innerHTML = '<p class="muted">Carregando...</p>';
  const notes = readAcmpNotes();

  const setores = setorFiltro ? [setorFiltro] : ["Setor 1", "Setor 2"];
  const allRows = [];

  for (const setor of setores) {
    let fetched = false;
    if (hasApiConfigured()) {
      try {
        const params = new URLSearchParams({ action: "relatorio_setor", setor });
        if (data) params.set("dataFabricacao", data);
        const response = await fetch(`${CONFIG.API_URL}?${params}`);
        const payload = JSON.parse(await response.text());
        if (payload.ok && Array.isArray(payload.rows)) {
          let rows = payload.rows.filter((r) => String(r.liberacao_status || "") === "1");
          if (modoCarga === "pendentes") rows = rows.filter((r) => !String(r.ins_status || "").trim());
          rows.forEach((r) => allRows.push({ ...r, _setor: setor }));
          fetched = true;
        }
      } catch { /* fallback local */ }
    }
    if (!fetched) {
      const db = readDb();
      db.records
        .filter((r) => r.setor === setor && r.liberacao && r.liberacao.status === "1")
        .filter((r) => modoCarga === "data" ? r.dataFabricacao === data : true)
        .filter((r) => modoCarga === "pendentes" ? (!r.inspecoes || !r.inspecoes.length) : true)
        .forEach((r) => allRows.push({
          forma_numero: r.formaNumero,
          modelo: r.modelo || "",
          lib_timestamp: r.liberacao.timestamp || "",
          _setor: setor
        }));
    }
  }

  if (!allRows.length) {
    output.innerHTML = '<p class="muted">Nenhuma forma concretada para os filtros informados.</p>';
    return;
  }

  const grouped = {};
  allRows.forEach((r) => {
    const s = r._setor || r.setor || "Sem Setor";
    if (!grouped[s]) grouped[s] = [];
    grouped[s].push(r);
  });

  let totalCount = 0;
  let html = "";
  Object.keys(grouped).sort().forEach((setor) => {
    const rows = grouped[setor].sort((a, b) =>
      formatTime(a.lib_timestamp).localeCompare(formatTime(b.lib_timestamp))
    );
    totalCount += rows.length;
    const linhas = rows.map((r) => {
      const forma = r.forma_numero || "";
      const saved = notes[getAcmpNoteKey(data, setor, forma)] || {};
      return `<tr data-acmp-forma="${forma}" data-acmp-setor="${setor}">
        <td>${forma}</td>
        <td>${r.modelo || ""}</td>
        <td>${formatTime(r.lib_timestamp)}</td>
        <td><input type="text" class="acmp-input" data-acmp-traco placeholder="" value="${saved.traco || ""}"></td>
        <td><input type="text" class="acmp-input" data-acmp-obs placeholder="" value="${saved.obs || ""}"></td>
      </tr>`;
    }).join("");
    html += `
      <div class="acmp-setor-grupo">
        <div class="acmp-setor-header">${setor} — ${rows.length} formas concretadas</div>
        <table class="sheet-table acmp-table">
          <thead><tr><th>Nº Forma</th><th>Modelo</th><th>Horário</th><th>Traço</th><th>Obs</th></tr></thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>`;
  });

  output.innerHTML = `<div class="acmp-total">Total: ${totalCount} formas concretadas | Data: ${data}</div>` + html;
}

function buildReportDataFromRows(rows) {
  const total = rows.length;
  const liberado = rows.filter((r) => String(r.liberacao_status || r.liberacaoStatus || "") === "1").length;
  const manutencao = rows.filter((r) => String(r.liberacao_status || r.liberacaoStatus || "") === "M").length;
  const naoMontado = rows.filter((r) => String(r.liberacao_status || r.liberacaoStatus || "") === "D").length;
  return { total, liberado, naoMontado, manutencao };
}

function getRowsFromLocalForDashboard(data, setor) {
  const db = readDb();
  return db.records
    .filter((r) => r.dataFabricacao === data)
    .filter((r) => r.setor === setor)
    .map((r) => ({
      forma_numero: r.formaNumero,
      modelo: r.modelo,
      liberacao_status: r.liberacao?.status || ""
    }));
}

async function getRowsForDashboard(data, setor) {
  if (!hasApiConfigured()) {
    return { rows: getRowsFromLocalForDashboard(data, setor), source: "local" };
  }

  try {
    const url = `${CONFIG.API_URL}?action=relatorio_setor&dataFabricacao=${encodeURIComponent(data)}&setor=${encodeURIComponent(setor)}`;
    const response = await fetch(url);
    const text = await response.text();
    const payload = JSON.parse(text);
    if (payload.ok && Array.isArray(payload.rows)) {
      return { rows: payload.rows, source: "api" };
    }
  } catch {
    // Fallback local em caso de falha temporária da API.
  }

  return { rows: getRowsFromLocalForDashboard(data, setor), source: "local" };
}

function renderDashboardConcretagem({ setor1, setor2, source, data }) {
  const concretadasSetor1 = buildReportDataFromRows(setor1).liberado;
  const concretadasSetor2 = buildReportDataFromRows(setor2).liberado;
  const totalConcretadas = concretadasSetor1 + concretadasSetor2;

  const max = Math.max(concretadasSetor1, concretadasSetor2, 1);
  const width1 = Math.round((concretadasSetor1 / max) * 100);
  const width2 = Math.round((concretadasSetor2 / max) * 100);

  el.dashSetor1Count.textContent = String(concretadasSetor1);
  el.dashSetor2Count.textContent = String(concretadasSetor2);
  el.dashTotalCount.textContent = String(totalConcretadas);

  el.dashSetor1Meta.textContent = `${concretadasSetor1} de ${setor1.length} leituras concretadas`;
  el.dashSetor2Meta.textContent = `${concretadasSetor2} de ${setor2.length} leituras concretadas`;

  el.dashBarSetor1.style.width = `${width1}%`;
  el.dashBarSetor2.style.width = `${width2}%`;
  el.dashBarSetor1Label.textContent = String(concretadasSetor1);
  el.dashBarSetor2Label.textContent = String(concretadasSetor2);

  // Canvas chart for Acompanhamento
  destroyChart("chartAcmp");
  const ctxAcmp = document.getElementById("chartAcmp");
  if (ctxAcmp && typeof Chart !== "undefined") {
    chartInstances["chartAcmp"] = new Chart(ctxAcmp, {
      type: "bar",
      data: {
        labels: ["Setor 1", "Setor 2"],
        datasets: [{
          label: "Produzidos",
          data: [concretadasSetor1, concretadasSetor2],
          backgroundColor: ["#1e40af", "#059669"],
          borderRadius: 10
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } } }
      }
    });
  }

  el.dashStatus.textContent = `Painel atualizado para ${data} (${source === "api" ? "dados da planilha" : "cache local"}).`;
}

async function carregarDashboardConcretagem() {
  if (!el.dashData?.value) {
    el.dashStatus.textContent = "Selecione uma data para atualizar o painel.";
    return;
  }

  const data = el.dashData.value;
  el.dashStatus.textContent = "Atualizando painel de concretagem...";

  const [setor1Result, setor2Result] = await Promise.all([
    getRowsForDashboard(data, "Setor 1"),
    getRowsForDashboard(data, "Setor 2")
  ]);

  const source = setor1Result.source === "api" && setor2Result.source === "api" ? "api" : "local";
  renderDashboardConcretagem({
    setor1: setor1Result.rows,
    setor2: setor2Result.rows,
    source,
    data
  });
}

function renderRelatorioSetor({ data, setor, encarregado, rows }) {
  if (!el.relatorioSetorOutput) return;
  const resumo = buildReportDataFromRows(rows);
  const linhas = rows
    .sort((a, b) => String(a.forma_numero || a.formaNumero || "").localeCompare(String(b.forma_numero || b.formaNumero || "")))
    .map((r) => {
      const forma = r.forma_numero || r.formaNumero || "";
      const modelo = r.modelo || "";
      const status = statusLabelFromCode(String(r.liberacao_status || r.liberacaoStatus || ""));
      return `<tr><td>${forma}</td><td>${modelo}</td><td>${status}</td></tr>`;
    })
    .join("");

  el.relatorioSetorOutput.innerHTML = `
    <div class="report-header">
      <strong>Relatório de Produção</strong><br>
      Data: ${data} • ${setor}
    </div>
    <div class="report-summary">
      Total: ${resumo.total} • Produzido (Liberado): ${resumo.liberado} • Não Produzido: ${resumo.naoMontado} • Manutenção: ${resumo.manutencao}
    </div>
    <table class="sheet-table report-table">
      <thead>
        <tr><th>Forma</th><th>Modelo</th><th>Status</th></tr>
      </thead>
      <tbody>${linhas || '<tr><td colspan="3">Sem registros</td></tr>'}</tbody>
    </table>
    <div class="report-sign">Encarregado: ${encarregado || "____________________________"}</div>
    <div class="report-sign-line">Assinatura: ___________________________________________</div>
  `;
}

async function gerarRelatorioSetor() {
  const data = el.relData.value;
  const setor = el.relSetor.value;
  const encarregado = el.relEncarregado.value.trim();

  if (!data || !setor) {
    showMsgBox("Informe data e setor para gerar o relatório.", "error");
    return;
  }

  if (hasApiConfigured()) {
    try {
      const url = `${CONFIG.API_URL}?action=relatorio_setor&dataFabricacao=${encodeURIComponent(data)}&setor=${encodeURIComponent(setor)}`;
      const response = await fetch(url);
      const text = await response.text();
      const payload = JSON.parse(text);
      if (payload.ok && Array.isArray(payload.rows)) {
        renderRelatorioSetor({ data, setor, encarregado, rows: payload.rows });
        setSyncStatus("ok", `Relatório do ${setor} em ${data} gerado pela planilha.`);
        return;
      }
    } catch {
      setSyncStatus("warn", "Falha ao buscar relatório na planilha. Gerando pelo cache local.");
    }
  }

  const db = readDb();
  const rows = db.records
    .filter((r) => r.dataFabricacao === data)
    .filter((r) => r.setor === setor)
    .map((r) => ({ forma_numero: r.formaNumero, modelo: r.modelo, liberacao_status: r.liberacao?.status || "" }));

  renderRelatorioSetor({ data, setor, encarregado, rows });
}

function getRoleConfig(role) {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.MONTADOR;
}

function setAccessByRole(role) {
  const cfg = getRoleConfig(role);
  const next = new Set(["HUB", ...cfg.modes]);
  if (next.has("MONTAGEM_POSTES")) next.add("MONTAGEM_POSTES_DETALHE");
  state.allowedModes = next;
}

function isModeAllowed(mode) {
  if (mode === "HUB") return true;
  if (!state.authUser) return false;
  return state.allowedModes.has(mode);
}

function readAuthSession() {
  const raw = localStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.role || !ROLE_PERMISSIONS[parsed.role]) return null;
    return {
      name: String(parsed.name || "").trim() || "Usuário",
      role: parsed.role,
      roleLabel: getRoleConfig(parsed.role).label
    };
  } catch {
    return null;
  }
}

function saveAuthSession(auth) {
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ name: auth.name, role: auth.role }));
}

function clearAuthSession() {
  localStorage.removeItem(AUTH_SESSION_KEY);
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function listUsersFromApi(options = {}) {
  const result = await postToMontagemApi("listar_usuarios", {});
  if (result.ok) {
    state.usersCache = Array.isArray(result.users) ? result.users : [];
    return { ok: true, users: state.usersCache };
  }

  if (!options.silent) {
    setUgFeedback(result.error || "Não foi possível carregar os usuários da planilha.", false);
  }
  return { ok: false, error: result.error || "Falha ao carregar usuários.", users: [] };
}

async function authenticateUserInApi(name, password) {
  return postToMontagemApi("autenticar_usuario", { name, password });
}

async function createUserInApi(name, role, password) {
  return postToMontagemApi("criar_usuario", { name, role, password });
}

async function deleteUserInApi(id) {
  return postToMontagemApi("excluir_usuario", { id });
}

function setUgFeedback(message, isOk) {
  if (!el.ugFeedback) return;
  if (!message) {
    el.ugFeedback.classList.add("hidden");
    el.ugFeedback.textContent = "";
    return;
  }
  el.ugFeedback.textContent = message;
  el.ugFeedback.style.background = isOk ? "#dcfce7" : "#fef2f2";
  el.ugFeedback.style.borderColor = isOk ? "#86efac" : "#fecaca";
  el.ugFeedback.style.color = isOk ? "#166534" : "#991b1b";
  el.ugFeedback.classList.remove("hidden");
}

async function renderUsuarios() {
  if (!el.ugListaBody) return;
  el.ugListaBody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#64748b;">Carregando usuários...</td></tr>';
  const result = await listUsersFromApi({ silent: true });
  if (!result.ok) {
    el.ugListaBody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#991b1b;">Falha ao carregar usuários da planilha.</td></tr>';
    return;
  }

  const users = result.users;
  if (users.length === 0) {
    el.ugListaBody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#64748b;">Nenhum usuário cadastrado.</td></tr>';
    return;
  }
  el.ugListaBody.innerHTML = users.map((u) => `
    <tr>
      <td style="text-align:center">${escapeHtml(u.name)}</td>
      <td style="text-align:center">${escapeHtml(getRoleConfig(u.role).label)}</td>
      <td style="text-align:center"><button class="ug-del-btn" type="button" data-ug-id="${escapeHtml(u.id)}">Excluir</button></td>
    </tr>
  `).join("");

  el.ugListaBody.querySelectorAll(".ug-del-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const userId = String(btn.dataset.ugId || "").trim();
      const removed = state.usersCache.find((user) => user.id === userId);
      if (!userId || !removed) return;

      const resultDelete = await deleteUserInApi(userId);
      if (!resultDelete.ok) {
        setUgFeedback(resultDelete.error || "Não foi possível excluir o usuário.", false);
        return;
      }

      await renderUsuarios();
      setUgFeedback(`Usuário "${removed.name}" excluído.`, true);
    });
  });
}

function setLoginFeedback(message) {
  if (!el.loginFeedback) return;
  if (!message) {
    el.loginFeedback.classList.add("hidden");
    el.loginFeedback.textContent = "";
    return;
  }
  el.loginFeedback.textContent = message;
  el.loginFeedback.classList.remove("hidden");
}

function lockAppForLogin() {
  document.body.classList.add("auth-locked");
  if (el.loginScreen) el.loginScreen.classList.remove("hidden");
}

function unlockAppAfterLogin() {
  document.body.classList.remove("auth-locked");
  if (el.loginScreen) el.loginScreen.classList.add("hidden");
}

function applyRoleVisibility() {
  const navByMode = {
    DASHBOARD: "navDashboard",
    LIBERACAO: "hubLiberacao",
    INSPECAO: "hubInspecao",
    MONTAGEM_POSTES: "hubMontagemPostes",
    RELATORIO: "hubRelatorio",
    HISTORICO: "hubHistorico",
    ACOMPANHAMENTO: "hubAcompanhamento",
    ACMP_CONCRETAGEM: "hubAcmpConcretagem",
    USUARIOS: "navUsuarios"
  };

  Object.entries(navByMode).forEach(([mode, id]) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.toggle("hidden", !isModeAllowed(mode));
  });

  document.querySelectorAll("[data-hub-mode]").forEach((btn) => {
    const mode = btn.dataset.hubMode || "";
    btn.classList.toggle("hidden", !isModeAllowed(mode));
  });

  if (el.authUserBadge) {
    if (state.authUser) {
      el.authUserBadge.textContent = `${state.authUser.name} · ${state.authUser.roleLabel}`;
      el.authUserBadge.classList.remove("hidden");
    } else {
      el.authUserBadge.classList.add("hidden");
    }
  }

  if (el.authLogoutBtn) {
    el.authLogoutBtn.classList.toggle("hidden", !state.authUser);
  }
}

function ensurePostLoginBootstrap() {
  if (state.hasBootstrapped) return;
  renderLiberacaoDual();
  renderInspecaoLiberados();
  renderMontagemPostesLiberados();
  renderHistorico();
  carregarDashboardConcretagem();
  checkApiStatus();
  state.hasBootstrapped = true;
}

async function loginWithRole(name, password) {
  const cleanName = String(name || "").trim();
  if (!cleanName) {
    setLoginFeedback("Informe seu usuário para entrar.");
    return false;
  }

  if (!password) {
    setLoginFeedback("Informe a senha para entrar.");
    return false;
  }

  const authResult = await authenticateUserInApi(cleanName, password);
  if (!authResult.ok || !authResult.user) {
    setLoginFeedback(authResult.error || "Usuário ou senha incorretos.");
    return false;
  }

  const user = authResult.user;
  const role = user.role;
  if (!ROLE_PERMISSIONS[role]) {
    setLoginFeedback("Perfil inválido.");
    return false;
  }

  state.authUser = {
    name: user.name,
    role,
    roleLabel: getRoleConfig(role).label
  };

  setAccessByRole(role);
  saveAuthSession(state.authUser);
  setLoginFeedback("");
  unlockAppAfterLogin();
  applyRoleVisibility();
  ensurePostLoginBootstrap();
  setMode("HUB");
  setSyncStatus("ok", `Acesso liberado para ${state.authUser.roleLabel}.`);
  return true;
}

function logoutUser() {
  state.authUser = null;
  state.allowedModes = new Set(["HUB"]);
  clearAuthSession();
  applyRoleVisibility();
  setMode("HUB");
  lockAppForLogin();
  if (el.loginNome) el.loginNome.focus();
}

function setMode(mode) {
  if (mode !== "HUB" && !isModeAllowed(mode)) {
    mode = "HUB";
    if (state.authUser) {
      setSyncStatus("warn", "Seu perfil não possui acesso a esta opção.");
    }
  }

  state.mode = mode;
  [el.hubView, el.viewDashboard, el.viewLiberacao, el.viewInspecao, el.viewMontagemPostes, el.viewMontagemPostesDetalhe, el.viewRelatorio, el.viewHistorico, el.viewAcompanhamento, el.viewAcmpConcretagem, el.viewUsuarios]
    .filter(Boolean).forEach((view) => view.classList.add("hidden"));
  if (mode === "HUB") el.hubView.classList.remove("hidden");
  if (mode === "DASHBOARD") {
    if (el.viewDashboard) el.viewDashboard.classList.remove("hidden");
    renderDashboardCharts();
  }
  if (mode === "LIBERACAO") el.viewLiberacao.classList.remove("hidden");
  if (mode === "INSPECAO") el.viewInspecao.classList.remove("hidden");
  if (mode === "MONTAGEM_POSTES") el.viewMontagemPostes.classList.remove("hidden");
  if (mode === "MONTAGEM_POSTES_DETALHE") el.viewMontagemPostesDetalhe.classList.remove("hidden");
  if (mode === "RELATORIO") el.viewRelatorio.classList.remove("hidden");
  if (mode === "HISTORICO") el.viewHistorico.classList.remove("hidden");
  if (mode === "ACOMPANHAMENTO") el.viewAcompanhamento.classList.remove("hidden");
  if (mode === "ACMP_CONCRETAGEM") el.viewAcmpConcretagem.classList.remove("hidden");
  if (mode === "USUARIOS") {
    if (el.viewUsuarios) el.viewUsuarios.classList.remove("hidden");
    renderUsuarios().catch(() => {
      setUgFeedback("Não foi possível carregar os usuários da planilha.", false);
    });
  }

  document.body.classList.remove("mode-hub", "mode-dashboard", "mode-liberacao", "mode-inspecao", "mode-montagem-postes", "mode-montagem-postes-detalhe", "mode-relatorio", "mode-historico", "mode-acompanhamento", "mode-acmp-concretagem", "mode-usuarios");
  if (mode === "HUB") document.body.classList.add("mode-hub");
  if (mode === "DASHBOARD") document.body.classList.add("mode-dashboard");
  if (mode === "LIBERACAO") document.body.classList.add("mode-liberacao");
  if (mode === "INSPECAO") {
    document.body.classList.add("mode-inspecao");
    if ((el.insModoCarga?.value || "data") === "data" && !el.insFiltroData.value) {
      el.insLiberadosBody.innerHTML = '<tr><td colspan="5" class="muted">Selecione a data de produção para carregar os itens liberados.</td></tr>';
      el.insQtdItens.textContent = "0";
    }
  }
  if (mode === "MONTAGEM_POSTES") {
    document.body.classList.add("mode-montagem-postes");
    if ((el.mpModoCarga?.value || "data") === "data" && !el.mpFiltroData?.value) {
      el.mpLiberadosBody.innerHTML = '<tr><td colspan="4" class="muted">Selecione a data de produção para carregar os itens liberados.</td></tr>';
      el.mpQtdItens.textContent = "0";
    }
  }
  if (mode === "MONTAGEM_POSTES_DETALHE") document.body.classList.add("mode-montagem-postes-detalhe");
  if (mode === "RELATORIO") document.body.classList.add("mode-relatorio");
  if (mode === "HISTORICO") document.body.classList.add("mode-historico");
  if (mode === "ACOMPANHAMENTO") document.body.classList.add("mode-acompanhamento");
  if (mode === "ACMP_CONCRETAGEM") document.body.classList.add("mode-acmp-concretagem");
  if (mode === "USUARIOS") document.body.classList.add("mode-usuarios");

  // Update sidebar nav + topbar title
  const navTitles = {
    HUB: ["navInicio", "Início"],
    DASHBOARD: ["navDashboard", "Dashboard"],
    LIBERACAO: ["hubLiberacao", "Produção / Liberação"],
    INSPECAO: ["hubInspecao", "Montagem / Inspeção"],
    MONTAGEM_POSTES: ["hubMontagemPostes", "Montagem Postes"],
    MONTAGEM_POSTES_DETALHE: ["hubMontagemPostes", "Inspecionar / Montar Poste"],
    RELATORIO: ["hubRelatorio", "Relatório"],
    HISTORICO: ["hubHistorico", "Histórico"],
    ACOMPANHAMENTO: ["hubAcompanhamento", "Acompanhamento"],
    ACMP_CONCRETAGEM: ["hubAcmpConcretagem", "Acmp. Concretagem"],
    USUARIOS: ["navUsuarios", "Gerenciar Usuários"]
  };
  const navInfo = navTitles[mode];
  document.querySelectorAll(".nav-item").forEach((btn) => btn.classList.remove("nav-active"));
  if (navInfo) {
    const activeBtn = document.getElementById(navInfo[0]);
    if (activeBtn) activeBtn.classList.add("nav-active");
    const titleEl = document.getElementById("topbarTitle");
    if (titleEl) titleEl.textContent = navInfo[1];
  }
}

function navigateBack() {
  if (state.mode === "MONTAGEM_POSTES_DETALHE") {
    setMode("MONTAGEM_POSTES");
    renderMontagemPostesLiberados();
    return;
  }

  if (state.mode !== "HUB") {
    setMode("HUB");
    return;
  }

  setSyncStatus("warn", "Voce ja esta na tela principal.");
}

function bindEvents() {
  if (el.loginEntrar) {
    el.loginEntrar.addEventListener("click", async () => {
      await loginWithRole(el.loginNome?.value || "", el.loginSenha?.value || "");
    });
  }

  if (el.loginSenha) {
    el.loginSenha.addEventListener("keydown", async (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        await loginWithRole(el.loginNome?.value || "", el.loginSenha?.value || "");
      }
    });
  }

  if (el.loginNome) {
    el.loginNome.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        el.loginSenha?.focus();
      }
    });
  }

  if (el.authLogoutBtn) {
    el.authLogoutBtn.addEventListener("click", logoutUser);
  }

  if (el.ugCriarBtn) {
    el.ugCriarBtn.addEventListener("click", async () => {
      const nome = (el.ugNome?.value || "").trim();
      const perfil = el.ugPerfil?.value || "MONTADOR";
      const senha = (el.ugSenha?.value || "").trim();

      if (!nome) { setUgFeedback("Informe o nome do usuário.", false); return; }
      if (!senha) { setUgFeedback("Informe a senha.", false); return; }

      const resultCreate = await createUserInApi(nome, perfil, senha);
      if (!resultCreate.ok) {
        setUgFeedback(resultCreate.error || "Não foi possível criar o usuário.", false);
        return;
      }

      if (el.ugNome) el.ugNome.value = "";
      if (el.ugSenha) el.ugSenha.value = "";
      await renderUsuarios();
      setUgFeedback(`Usuário "${nome}" criado com sucesso!`, true);
    });
  }

  if (el.navUsuarios) {
    el.navUsuarios.addEventListener("click", () => setMode("USUARIOS"));
  }

  el.hubLiberacao.addEventListener("click", () => {
    setMode("LIBERACAO");
    if (!el.libData.value) el.libData.value = todayYmd();
    renderLiberacaoDual();
  });
  el.hubInspecao.addEventListener("click", () => {
    setMode("INSPECAO");
    if (!el.insFiltroData.value) el.insFiltroData.value = todayYmd();
    renderInspecaoLiberados();
  });
  el.hubMontagemPostes?.addEventListener("click", () => {
    setMode("MONTAGEM_POSTES");
    if (!el.mpFiltroData.value) el.mpFiltroData.value = todayYmd();
    renderMontagemPostesLiberados();
  });
  el.hubRelatorio.addEventListener("click", () => {
    setMode("RELATORIO");
    if (!el.relData.value) el.relData.value = todayYmd();
  });
  el.hubHistorico.addEventListener("click", () => {
    setMode("HISTORICO");
    renderHistorico();
  });
  el.hubAcompanhamento.addEventListener("click", () => {
    setMode("ACOMPANHAMENTO");
    carregarDashboardConcretagem();
  });
  el.hubAcmpConcretagem.addEventListener("click", () => {
    setMode("ACMP_CONCRETAGEM");
    if (!el.acmpData.value) el.acmpData.value = todayYmd();
    renderAcmpConcretagem();
  });

  el.backButtons.forEach((btn) => btn.addEventListener("click", navigateBack));
  if (el.backMain) {
    el.backMain.addEventListener("click", () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "../index.html";
      }
    });
  }
  el.libData.addEventListener("change", renderLiberacaoDual);
  if (el.btnLimparFormas) {
    el.btnLimparFormas.addEventListener("click", () => {
      if (!confirm("Limpar todas as formas concretadas? (não apaga da planilha)")) return;
      localStorage.removeItem(CLICKED_FORMS_KEY);
      renderLiberacaoDual();
    });
  }

  el.insFiltroData.addEventListener("change", renderInspecaoLiberados);
  el.insModoCarga.addEventListener("change", renderInspecaoLiberados);
  el.insSetor.addEventListener("change", renderInspecaoLiberados);
  el.insCarregarLiberados.addEventListener("click", renderInspecaoLiberados);
  el.insFiltroData.addEventListener("change", () => clearSubmitLock("inspecao"));
  el.insColaborador.addEventListener("input", () => clearSubmitLock("inspecao"));
  el.insObs.addEventListener("input", () => clearSubmitLock("inspecao"));
  el.insCarregarLiberados.addEventListener("click", () => clearSubmitLock("inspecao"));
  el.insLiberadosBody.addEventListener("change", () => clearSubmitLock("inspecao"));
  el.insLiberadosBody.addEventListener("input", () => clearSubmitLock("inspecao"));

  el.salvarInspecao.addEventListener("click", saveInspecao);
  if (el.salvarInspecaoFloat) el.salvarInspecaoFloat.addEventListener("click", saveInspecao);
  if (el.insFormaFiltro) el.insFormaFiltro.addEventListener("input", filtrarFormasTabela);

  if (el.mpFiltroData) el.mpFiltroData.addEventListener("change", renderMontagemPostesLiberados);
  if (el.mpModoCarga) el.mpModoCarga.addEventListener("change", renderMontagemPostesLiberados);
  if (el.mpSetor) el.mpSetor.addEventListener("change", renderMontagemPostesLiberados);
  if (el.mpCarregarLiberados) el.mpCarregarLiberados.addEventListener("click", renderMontagemPostesLiberados);
  if (el.mpFormaFiltro) el.mpFormaFiltro.addEventListener("input", filtrarMontagemTabela);

  if (el.mpLiberadosBody) {
    el.mpLiberadosBody.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const btn = target.closest(".mp-open-btn");
      if (!btn) return;
      const tr = btn.closest("tr[data-forma-numero]");
      if (!tr) return;

      await openMontagemPosteDetalhe({
        recordId: tr.dataset.recordId || "",
        dataFabricacao: tr.dataset.dataFabricacao || "",
        setor: tr.dataset.setor || "",
        formaNumero: tr.dataset.formaNumero || "",
        modelo: tr.dataset.modelo || ""
      });
    });
  }

  if (el.mpChecklistSections) {
    el.mpChecklistSections.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const btn = target.closest("button[data-mp-section][data-mp-item][data-mp-value]");
      if (!btn) return;
      const sectionId = btn.dataset.mpSection || "";
      const itemId = btn.dataset.mpItem || "";
      const value = btn.dataset.mpValue || "";
      if (!sectionId || !itemId || !value) return;
      setMontagemChecklistAnswer(sectionId, itemId, value);
    });
  }

  if (el.mpStatusButtons) {
    el.mpStatusButtons.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const btn = target.closest("button[data-mp-status]");
      if (!btn || state.montagemPostesAtual?.finalizadoEm) return;
      const status = btn.dataset.mpStatus || "";
      if (!status) return;
      setMontagemStatus(status);
    });
  }

  if (el.mpMotivoSelect) {
    el.mpMotivoSelect.addEventListener("change", () => {
      if (state.montagemPostesAtual?.finalizadoEm) return;
      setMontagemMotivoRecusa(el.mpMotivoSelect.value || "");
    });
  }

  if (el.mpObservacoes) {
    el.mpObservacoes.addEventListener("input", () => {
      if (!state.montagemPostesAtual || state.montagemPostesAtual.finalizadoEm) return;
      const current = { ...state.montagemPostesAtual };
      current.observacoesMontagem = (el.mpObservacoes.value || "").trim();
      state.montagemPostesAtual = current;
      upsertMontagemPoste(current);
      syncMontagemPosteToApi(current, "CHECKLIST", { silent: true }).catch(() => {});
    });
  }

  if (el.mpFinalizarPoste) el.mpFinalizarPoste.addEventListener("click", () => {
    finalizarMontagemPosteAtual();
  });

  el.atualizarDashboard.addEventListener("click", carregarDashboardConcretagem);
  el.dashData.addEventListener("change", carregarDashboardConcretagem);
  el.filtrarHistorico.addEventListener("click", () => renderHistorico());
  el.histTipo?.addEventListener("change", () => renderHistorico());
  el.gerarRelatorioSetor.addEventListener("click", gerarRelatorioSetor);
  if (el.acmpCarregar) el.acmpCarregar.addEventListener("click", renderAcmpConcretagem);
  if (el.acmpData) el.acmpData.addEventListener("change", renderAcmpConcretagem);
  if (el.acmpModoCarga) el.acmpModoCarga.addEventListener("change", renderAcmpConcretagem);
  if (el.acmpSetor) el.acmpSetor.addEventListener("change", renderAcmpConcretagem);
  if (el.acmpSalvar) el.acmpSalvar.addEventListener("click", salvarAcmp);
  if (el.acmpImprimir) el.acmpImprimir.addEventListener("click", imprimirAcmp);

  el.insFotos.addEventListener("change", async (event) => {
    clearSubmitLock("inspecao");
    const photos = await filesToCompressedDataUrls(event.target.files);
    state.insPhotos = state.insPhotos.concat(photos);
    renderPhotoPreview(el.insFotosPreview, state.insPhotos);
  });

  // Sidebar toggle
  const appSidebar = document.getElementById("appSidebar");
  const appShell   = document.querySelector(".app-shell");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const sidebarToggle  = document.getElementById("sidebarToggle");

  // Restaura estado colapsado no desktop
  if (localStorage.getItem("sidebarCollapsed") === "1") {
    document.body.classList.add("sidebar-hidden");
  }

  function closeMobileSidebar() {
    appSidebar?.classList.remove("sidebar-open");
    sidebarOverlay?.classList.remove("visible");
  }

  if (sidebarToggle && appSidebar) {
    sidebarToggle.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        // Mobile: drawer com overlay
        appSidebar.classList.toggle("sidebar-open");
        sidebarOverlay?.classList.toggle("visible");
      } else {
        // Desktop/tablet: colapsa sem overlay
        const hidden = document.body.classList.toggle("sidebar-hidden");
        localStorage.setItem("sidebarCollapsed", hidden ? "1" : "0");
      }
    });
  }
  if (sidebarOverlay && appSidebar) {
    sidebarOverlay.addEventListener("click", closeMobileSidebar);
  }
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (window.innerWidth <= 768) closeMobileSidebar();
    });
  });
  const navInicio = document.getElementById("navInicio");
  if (navInicio) navInicio.addEventListener("click", () => setMode("HUB"));
  const navDashboard = document.getElementById("navDashboard");
  if (navDashboard) navDashboard.addEventListener("click", () => setMode("DASHBOARD"));

  // Dashboard charts filter
  const dbData = document.getElementById("dbData");
  if (dbData) dbData.addEventListener("change", renderDashboardCharts);
  const dbBtnHoje = document.getElementById("dbBtnHoje");
  if (dbBtnHoje) dbBtnHoje.addEventListener("click", () => {
    if (dbData) dbData.value = todayYmd();
    renderDashboardCharts();
  });
  const dbBtnAtualizar = document.getElementById("dbBtnAtualizar");
  if (dbBtnAtualizar) dbBtnAtualizar.addEventListener("click", renderDashboardCharts);

  // Hub icon-cards (data-hub-mode)
  document.querySelectorAll("[data-hub-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.hubMode;
      if (mode === "DASHBOARD") { setMode("DASHBOARD"); }
      else if (mode === "LIBERACAO") { setMode("LIBERACAO"); if (!el.libData.value) el.libData.value = todayYmd(); renderLiberacaoDual(); }
      else if (mode === "INSPECAO") { setMode("INSPECAO"); if (!el.insFiltroData.value) el.insFiltroData.value = todayYmd(); renderInspecaoLiberados(); }
      else if (mode === "MONTAGEM_POSTES") { setMode("MONTAGEM_POSTES"); if (!el.mpFiltroData.value) el.mpFiltroData.value = todayYmd(); renderMontagemPostesLiberados(); }
      else if (mode === "RELATORIO") { setMode("RELATORIO"); if (!el.relData.value) el.relData.value = todayYmd(); }
      else if (mode === "HISTORICO") { setMode("HISTORICO"); renderHistorico(); }
      else if (mode === "ACOMPANHAMENTO") { setMode("ACOMPANHAMENTO"); carregarDashboardConcretagem(); }
      else if (mode === "ACMP_CONCRETAGEM") { setMode("ACMP_CONCRETAGEM"); if (!el.acmpData.value) el.acmpData.value = todayYmd(); renderAcmpConcretagem(); }
    });
  });
}

function init() {
  setMode("HUB");
  setSyncStatus("pending", "Verificando conexão com a planilha...");
  renderInspecaoCodigosChecklist();
  bindEvents();

  const now = todayYmd();
  el.libData.value = now;
  el.insFiltroData.value = now;
  el.insModoCarga.value = "data";
  el.insSetor.value = "Setor 2";
  if (el.mpFiltroData) el.mpFiltroData.value = now;
  if (el.mpModoCarga) el.mpModoCarga.value = "data";
  if (el.mpSetor) el.mpSetor.value = "Setor 2";
  if (el.histTipo) el.histTipo.value = "";
  el.dashData.value = now;
  el.relData.value = now;
  el.relSetor.value = "Setor 2";
  if (el.acmpData) el.acmpData.value = now;
  if (el.acmpSetor) el.acmpSetor.value = "";
  const dbDataEl = document.getElementById("dbData");
  if (dbDataEl) dbDataEl.value = now;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }

  const session = readAuthSession();
  if (session) {
    state.authUser = session;
    setAccessByRole(session.role);
    unlockAppAfterLogin();
    applyRoleVisibility();
    ensurePostLoginBootstrap();
    setMode("HUB");
  } else {
    lockAppForLogin();
    applyRoleVisibility();
    if (el.loginNome) el.loginNome.focus();
  }
}

init();