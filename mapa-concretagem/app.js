const STORAGE_KEY = "pwa_liberacao_inspecao_v1";
const SUBMIT_LOCKS_KEY = "pwa_liberacao_submit_locks_v1";
const CLICKED_FORMS_KEY = "pwa_formas_clicadas_hoje";
const MONTAGEM_POSTES_KEY = "pwa_montagem_postes_v1";
const AUTH_SESSION_KEY = "pwa_mapa_auth_session_v1";

const ROLE_PERMISSIONS = {
  GERENCIA: {
    label: "Gerência",
    modes: ["DASHBOARD", "PROD_ANALISE", "LIBERACAO", "LIBERACAO_S1", "LIBERACAO_S2", "LIBERACAO_S3", "LIBERACAO_S4", "INSPECAO", "MONTAGEM_POSTES", "RELATORIO", "HISTORICO", "ACOMPANHAMENTO", "ACMP_CONCRETAGEM", "USUARIOS"]
  },
  GESTOR: {
    label: "Gestor",
    modes: ["DASHBOARD", "PROD_ANALISE", "MONTAGEM_POSTES"]
  },
  MONTADOR: {
    label: "Montador",
    modes: ["INSPECAO", "MONTAGEM_POSTES"]
  },
  APONTADOR: {
    label: "Apontador",
    modes: ["LIBERACAO_S1", "LIBERACAO_S2", "LIBERACAO_S3", "LIBERACAO_S4"]
  }
};

function getMontagemChecklistSections(modelo = "") {
  const isDuploT = /DT|Duplo T|Barreiras/i.test(modelo);

  return [
    {
      id: "checagem_inicial",
      titulo: "Inspeção Visual",
      itens: [
        { id: "homogeneidade_concreto", texto: "Homogeneidade do Concreto", critico: true, codigoFalha: "O" },
        { id: "falhas_preenchimento", texto: "Falhas de Preenchimento", critico: true, codigoFalha: "A" },
        { id: "concreto_segregado", texto: "Concreto Segregado", critico: true, codigoFalha: "O" },
        { id: "grandes_avarias", texto: "Grandes Avarias", critico: true, codigoFalha: "P" },
        { id: "facao_obstruido", texto: "Facão Obstruído", critico: true, codigoFalha: "E" },
        { id: "furacao_obstruida", texto: "Furação Obstruída (pinos)", critico: true, codigoFalha: "E" },
        { id: "armacao_aparente", texto: "Armação aparente", critico: true, codigoFalha: "A" },
        { id: "trincas", texto: "Trincas", critico: true, codigoFalha: "I" },
        { id: "tubulacao_entupida", texto: "Tubulação Entupida", critico: true, codigoFalha: "B" },
        { id: "bolhas_excesso", texto: "Bolhas em excesso", critico: false, codigoFalha: "C" },
        { id: "bolhas_fora_padrao", texto: "Bolhas fora do padrão", critico: false, codigoFalha: "C" },
        { id: "carimbo_identificacao", texto: "Carimbo de Identificação", critico: false, codigoFalha: "F" },
        { id: "fissuras", texto: "Fissuras", critico: false, codigoFalha: "G" },
        { id: "pequenas_avarias", texto: "Pequenas avarias", critico: false, codigoFalha: "J" },
        { id: "rebarbas", texto: "Rebarbas", critico: false, codigoFalha: "Q" },
        { id: "manchas_excessivas", texto: "Manchas excessivas", critico: false, codigoFalha: "K" },
        { id: "buchas_fixacao", texto: "Buchas de fixação", critico: false, codigoFalha: "L" },
        { id: "prisioneiros_lacre_aterramento", texto: "Prisioneiros (lacre / aterramento)", critico: false, codigoFalha: "M" },
        { id: "acabamento_face_exposta", texto: "Acabamento face exposta", critico: false, codigoFalha: "R" },
        { id: "acabamento_abas", texto: "Acabamento abas", critico: false, codigoFalha: "S" }
      ]
    },
    {
      id: "checagem_materiais",
      titulo: "Montagem de Postes",
      itens: [
        { id: "montagem_do_poste", texto: "Montagem do Poste", critico: false }
      ]
    },
    {
      id: "final",
      titulo: "Inspeção Final",
      itens: [
        { id: "rebarbas_final", texto: "Rebarbas", critico: false },
        { id: "liberacao_qualidade", texto: "Liberação Qualidade", critico: false },
        { id: "codificacao_poste", texto: "Codificação Poste", critico: false },
        { id: "limpeza_prisioneiros", texto: "Limpeza prisioneiros", critico: false },
        { id: "aterramento", texto: "Aterramento", critico: false },
        { id: "lacre", texto: "Lacre", critico: false }
      ]
    }
  ];
}

const CONCRETO_TIPOS = ["Concreto Padrão", "Concreto Seco - Vibrado", "Concreto Segregado", "Concreto Exsudado"];

function getConcreteTypeForForma(forma, setor) {
  const dataFabricacao = el.libData?.value || todayYmd();
  const db = readDb();
  const record = findRecordByKey(db, dataFabricacao, setor, normalizeUpper(forma));
  return record?.concretoTipo || null;
}

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
  const dataFabricacao = el.libData?.value || todayYmd();

  // Se a data selecionada for hoje, verifica primeiro os cliques rápidos locais
  const hoje = todayYmd();
  if (dataFabricacao === hoje) {
    const clicked = getClickedFormsToday();
    const key = setor + "||" + normalizeUpper(forma);
    if (clicked.formas[key] === true || clicked.formas[key] === "1") return true;
  }

  // Verificação definitiva a partir do banco de dados local (sincronizado dinamicamente do Supabase)
  const db = readDb();
  const record = findRecordByKey(db, dataFabricacao, setor, normalizeUpper(forma));
  return record?.liberacao?.status === "1";
}

function isFormaLiberada(forma, setor) {
  const dataFabricacao = el.libData?.value || todayYmd();

  const hoje = todayYmd();
  if (dataFabricacao === hoje) {
    const clicked = getClickedFormsToday();
    const key = setor + "||" + normalizeUpper(forma);
    if (clicked.formas[key] === "L") return true;
  }

  const db = readDb();
  const record = findRecordByKey(db, dataFabricacao, setor, normalizeUpper(forma));
  return record?.liberacao?.status === "L";
}
const SUPABASE_CONFIG = {
  URL: "https://fbvvdyirhtgvycullsqy.supabase.co",
  KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZidnZkeWlyaHRndnljdWxsc3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3Njc5MTksImV4cCI6MjA5NDM0MzkxOX0.vzudcEhAwdAutU0g-Mra818fd8_DciepjqvU8Z-C4wc"
};
const PCP_PROGRAMACAO_URL = "https://pcp.concretrack.com.br/api/programacao";
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY) : null;

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
  { codigo: "M", descricao: "Parafuso Lacre da caixa do Medidor" },
  { codigo: "O", descricao: "Falha no Concreto" },
  { codigo: "P", descricao: "Grandes Avarias" },
  { codigo: "Q", descricao: "Rebarbas" },
  { codigo: "R", descricao: "Rugosidade" },
  { codigo: "S", descricao: "Acabamento quinas" }
];

const POSTES_DUPLO_T_CATALOGO = [
  { codigo: "C", descricao: "Padrao Completo 2 cx VR", setor: "Setor 2", codigoProduto: "943", chaves: ["C"] },
  { codigo: "D", descricao: "Padrao Completo 2 cx VL", setor: "Setor 1", codigoProduto: "941", chaves: ["D"] },
  { codigo: "B", descricao: "Padrao Completo 1 cx VL", setor: "Setor 2", codigoProduto: "935", chaves: ["B"] },
  { codigo: "A", descricao: "Padrao Completo 1 cx VR", setor: "Setor 2", codigoProduto: "938", chaves: ["A"] },
  { codigo: "BD", descricao: "Padrao Completo 1 cx VL (EDP)", setor: "Setor 1", codigoProduto: "957", chaves: ["BD"] },
  { codigo: "CE", descricao: "Padrao Completo 2 cx VR Elektro", setor: "Setor 1", codigoProduto: "4032", chaves: ["CE"] },
  { codigo: "DE", descricao: "Padrao Completo 2 cx VL Elektro", setor: "Setor 1", codigoProduto: "4765", chaves: ["DE"] },
  { codigo: "AE", descricao: "Padrao Completo 1 cx VR Elektro", setor: "Setor 1", codigoProduto: "4031", chaves: ["AE"] },
  { codigo: "BE", descricao: "Padrao Completo 1 cx VL Elektro", setor: "Setor 1", codigoProduto: "4764", chaves: ["BE"] },
  { codigo: "IE", descricao: "Padrao Completo 3cxs VL Elektro", setor: "Setor 1", codigoProduto: "4929", chaves: ["IE"] },
  { codigo: "L", descricao: "Padrao Completo 4 cx VR", setor: "Setor 1", codigoProduto: "948", chaves: ["L"] },
  { codigo: "J", descricao: "Padrao Completo 4 cx VL", setor: "Setor 1", codigoProduto: "947", chaves: ["J"] },
  { codigo: "H", descricao: "Padrao Completo 3 cx VR", setor: "Setor 1", codigoProduto: "946", chaves: ["H"] },
  { codigo: "I", descricao: "Padrao Completo 3 cx VL", setor: "Setor 1", codigoProduto: "945", chaves: ["I"] },
  { codigo: "300-VR", descricao: "Poste 2 cx VR (7,5 x 300)", setor: "Setor 1", codigoProduto: "944", chaves: ["300-VR"] },
  { codigo: "300-VL", descricao: "Poste 2 cx VL (7,5 x 300)", setor: "Setor 1", codigoProduto: "942", chaves: ["300-VL"] },
  { codigo: "CM", descricao: "Padrao Cemig 1 cx VL - 7,0 x150", setor: "Setor 1", codigoProduto: "953", chaves: ["CM"] },
  { codigo: "N", descricao: "Poste 7,5 X 600 VL", setor: "Setor 1", codigoProduto: "936", chaves: ["N"] },
  { codigo: "M", descricao: "Poste 7,5 X 600 VR", setor: "Setor 1", codigoProduto: "939", chaves: ["M"] },
  { codigo: "TCL", descricao: "Poste 7,5 X 600 VL c/", setor: "Setor 2", codigoProduto: "937", chaves: ["TCL"] },
  { codigo: "TCR", descricao: "Poste 7,5 X 600 VR c/", setor: "Setor 2", codigoProduto: "940", chaves: ["TCR"] },
  { codigo: "100", descricao: "Poste Subterraneo 100 A", setor: "Setor 1", codigoProduto: "949", chaves: ["100"] },
  { codigo: "SB-E1", descricao: "Poste Subterraneo 100 A - Elektro", setor: "Setor 1", codigoProduto: "4848", chaves: ["SB-E1"] },
  { codigo: "200", descricao: "Poste Subterraneo 200 A - TC", setor: "Setor 1", codigoProduto: "5017", chaves: ["200"] },
  { codigo: "TOTEM", descricao: "Totem de medicao indireta Elektro", setor: "Setor 2", codigoProduto: "13570", chaves: ["TOTEM", "A-TOTEM"] },
  { codigo: "PL", descricao: "Poste Visor Aereo 1 cx VL (7,5x300)", setor: "Setor 2", codigoProduto: "934", chaves: ["PL"] },
  { codigo: "CEMIG-5X150", descricao: "Padrao Cemig 1CX - 5,0 x 150", setor: "Setor 4", codigoProduto: "952", chaves: ["C-F1"] },
  { codigo: "CEMIG-1VL", descricao: "Padrao Cemig 1 cx VL - 7,0 x150", setor: "Setor 4", codigoProduto: "953", chaves: ["R-G"] },
  { codigo: "CEMIG-2VL", descricao: "Padrao Cemig 2 cx VL - 7,0 x150", setor: "Setor 4", codigoProduto: "954", chaves: [] },
  { codigo: "E", descricao: "Poste Economico 1CX VR", setor: "Setor 1", codigoProduto: "931", chaves: ["E"] },
  { codigo: "F", descricao: "Poste Economico 1CX VL", setor: "Setor 1", codigoProduto: "930", chaves: ["F"] },
  { codigo: "G", descricao: "Poste Economico 2CX VR", setor: "Setor 1", codigoProduto: "932", chaves: ["G"] },
  { codigo: "P", descricao: "Poste Economico 3 CXS VR", setor: "Setor 1", codigoProduto: "933", chaves: ["P"] },
  { codigo: "DTB", descricao: "Poste Duplo T Barreiras", setor: "Setor 4", codigoProduto: "13580", chaves: ["DTB"] },
  { codigo: "DTBM", descricao: "Poste Duplo T Barreiras Médio", setor: "Setor 4", codigoProduto: "13581", chaves: ["DTBM"] },
  { codigo: "DTD", descricao: "Poste Duplo T Especial D", setor: "Setor 4", codigoProduto: "13582", chaves: ["DTD"] }
];

const POSTES_DUPLO_T_BY_CHAVE = new Map();
POSTES_DUPLO_T_CATALOGO.forEach((item) => {
  (item.chaves || []).forEach((chave) => POSTES_DUPLO_T_BY_CHAVE.set(normalizeUpper(chave), item));
});

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
  { forma: "100-3", modelo: "SUB. 100-AMP" },
  { forma: "F-01", modelo: "Ec. 1 cx VL" }
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
  { forma: "I-02", modelo: "3 CXS VL" },
  { forma: "BE-04", modelo: "1 CX VL" },
  { forma: "BE-03", modelo: "1 CX VL" },
  { forma: "BE-02", modelo: "1 CX VL" },
  { forma: "BE-01", modelo: "1 CX VL" },
  { forma: "G-01", modelo: "Ec. 2CXS VR" },
  { forma: "G-02", modelo: "Ec. 2CXS VR" },
  { forma: "G-03", modelo: "Ec. 2CXS VR" },
  { forma: "G-04", modelo: "Ec. 2CXS VR" },
  { forma: "G-05", modelo: "Ec. 2CXS VR" },
  { forma: "CM - 01", modelo: "1 CX VL 7,0 x 150" },
  { forma: "300-VL", modelo: "2 CXS VL" },
  { forma: "300-VR", modelo: "2 CXS VR" },
  { forma: "E-01", modelo: "Ec. 1CX VR" },
  { forma: "E-02", modelo: "Ec. 1CX VR" },
  { forma: "E-03", modelo: "Ec. 1CX VR" },
  { forma: "E-04", modelo: "Ec. 1CX VR" },
  { forma: "E-05", modelo: "Ec. 1CX VR" },
  { forma: "E-06", modelo: "Ec. 1CX VR" },
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
  { forma: "100 - 4", modelo: "SUB. 100 AMP." },
  { forma: "100 - 5", modelo: "SUB. 100 AMP." },
  { forma: "100 - 6", modelo: "SUB. 100 AMP." },
  { forma: "SBE-1", modelo: "SUB. 100-AMP-E" },
  { forma: "200 -1", modelo: "SUB. 200-AMP C/ TC" },
  { forma: "200 -2", modelo: "SUB. 200-AMP C/ TC" },
  { forma: "DE-03", modelo: "2 CXS VL" },
  { forma: "DE-02", modelo: "2 CXS VL" },
  { forma: "DE-01", modelo: "2 CXS VL" }
];

const SETOR_2_LEFT_FORMS = [
  { forma: "TCR-1", modelo: "600-VR" },
  { forma: "PL - 1", modelo: "7,5x300 c/ Lente" },
  { forma: "PL - 2", modelo: "7,5x300 c/ Lente" },
  { forma: "PL - 3", modelo: "7,5x300 c/ Lente" },
  { forma: "PL - 4", modelo: "7,5x300 c/ Lente" },
  { forma: "A-10", modelo: "1 CX VR" },
  { forma: "A-36", modelo: "1 CX VR" },
  { forma: "A-82", modelo: "1 CX VR" },
  { forma: "A-22", modelo: "1 CX VR" },
  { forma: "A-11", modelo: "1 CX VR" },
  { forma: "A-28", modelo: "1 CX VR" },
  { forma: "A-85", modelo: "1 CX VR" },
  { forma: "A-23", modelo: "1 CX VR" },
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
  { forma: "TCR-3", modelo: "600-VR" },
  { forma: "TCR-2", modelo: "600-VR" },
  { forma: "PL - 5", modelo: "7,5x300 c/ Lente" },
  { forma: "PL - 6", modelo: "7,5x300 c/ Lente" },
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
  { forma: "C-03", modelo: "2 CXS VR" },
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
  { forma: "DTB 01",   label: "DTB 01",  modelo: "DTB 01" },
  { forma: "DTB 02",   label: "DTB 02",  modelo: "DTB 02" },
  { forma: "DTB 03",   label: "DTB 03",  modelo: "DTB 03" },
  { forma: "DTB 04",   label: "DTB 04",  modelo: "DTB 04" },
  { forma: "DTB 05",   label: "DTB 05",  modelo: "DTB 05" },
  { forma: "DTB 06",   label: "DTB 06",  modelo: "DTB 06" },
  { forma: "DTB 07",   label: "DTB 07",  modelo: "DTB 07" },
  { forma: "DTB 08",   label: "DTB 08",  modelo: "DTB 08" },
  { forma: "DTB 09",   label: "DTB 09",  modelo: "DTB 09" },
  { forma: "DTB 10",   label: "DTB 10",  modelo: "DTB 10" },
  { forma: "DTBM 01",  label: "DTBM 01", modelo: "DTBM 01" },
  { forma: "DTBM 02",  label: "DTBM 02", modelo: "DTBM 02" },
  { forma: "DTD 01",   label: "DTD 01",  modelo: "DTD 01" },
  { forma: "DTD 02",   label: "DTD 02",  modelo: "DTD 02" },
  { forma: "DTD 03",   label: "DTD 03",  modelo: "DTD 03" }
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
  { forma: "C-F3-16",  label: "16", modelo: "7,5 x 90" }
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
  const forms = SECTOR_FORMS[setor] || SECTOR_FORMS["Setor 2"];
  if (forms.left || forms.right) {
    return {
      left: (forms.left || []).map((item) => withPosteData(item, setor)),
      right: (forms.right || []).map((item) => withPosteData(item, setor))
    };
  }
  return {
    col1: (forms.col1 || []).map((item) => withPosteData(item, setor)),
    col2: (forms.col2 || []).map((item) => withPosteData(item, setor)),
    col3: (forms.col3 || []).map((item) => withPosteData(item, setor))
  };
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
  submitLocks: readSubmitLocks(),
  programmingMode: false,
  liberationMode: false,
  programmedFormas: new Set(),
  dbDataCache: {},
  dbDataStatusCache: {},
  activeInsSector: ""
};

let pendingFormaSelection = null;

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
  hubLiberacaoS1: document.getElementById("hubLiberacaoS1"),
  hubLiberacaoS2: document.getElementById("hubLiberacaoS2"),
  hubLiberacaoS3: document.getElementById("hubLiberacaoS3"),
  hubLiberacaoS4: document.getElementById("hubLiberacaoS4"),
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
  ugNomeCompleto: document.getElementById("ugNomeCompleto"),
  ugLogin: document.getElementById("ugLogin"),
  ugPerfil: document.getElementById("ugPerfil"),
  ugSenha: document.getElementById("ugSenha"),
  ugSetor: document.getElementById("ugSetor"),
  ugCriarBtn: document.getElementById("ugCriarBtn"),
  ugFeedback: document.getElementById("ugFeedback"),
  ugListaBody: document.getElementById("ugListaBody"),
  primeiroAcessoModal: document.getElementById("primeiroAcessoModal"),
  paNovaSenha: document.getElementById("paNovaSenha"),
  paConfirmarSenha: document.getElementById("paConfirmarSenha"),
  paSalvarBtn: document.getElementById("paSalvarBtn"),
  paFeedback: document.getElementById("paFeedback"),
  syncStatus: document.getElementById("syncStatus"),
  concretoTipoModal: document.getElementById("concretoTipoModal"),
  concretoTipoSubtitle: document.getElementById("concretoTipoSubtitle"),
  concretoTipoOptions: document.getElementById("concretoTipoOptions"),
  concretoTipoCancelBtn: document.getElementById("concretoTipoCancelBtn"),

  libData: document.getElementById("libData"),
  libColaborador: document.getElementById("libColaborador"),
  libFeedback: document.getElementById("libFeedback"),
  sheetSetorLabel: document.getElementById("sheetSetorLabel"),
  sheetLeftBody: document.getElementById("sheetLeftBody"),
  sheetRightBody: document.getElementById("sheetRightBody"),
  btnLimparFormas: document.getElementById("btnLimparFormas"),

  libKioskHeader: document.getElementById("libKioskHeader"),
  kioskSectorSubtitle: document.getElementById("kioskSectorSubtitle"),
  kioskSectorTitle: document.getElementById("kioskSectorTitle"),
  kioskProgToggleField: document.getElementById("kioskProgToggleField"),
  kioskProgCheckbox: document.getElementById("kioskProgCheckbox"),
  kioskLibToggleField: document.getElementById("kioskLibToggleField"),
  kioskLibCheckbox: document.getElementById("kioskLibCheckbox"),
  btnKioskFullscreen: document.getElementById("btnKioskFullscreen"),
  btnKioskSync: document.getElementById("btnKioskSync"),
  btnKioskBack: document.getElementById("btnKioskBack"),
  kioskLibData: document.getElementById("kioskLibData"),
  kioskLibColaborador: document.getElementById("kioskLibColaborador"),
  kioskProgressoContador: document.getElementById("kioskProgressoContador"),

  insFiltroData: document.getElementById("insFiltroData"),
  insModoCarga: document.getElementById("insModoCarga"),
  insSetorGroup: document.getElementById("insSetorGroup"),
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
  dashSetor3Count: document.getElementById("dashSetor3Count"),
  dashSetor4Count: document.getElementById("dashSetor4Count"),
  dashTotalCount: document.getElementById("dashTotalCount"),
  dashSetor1Meta: document.getElementById("dashSetor1Meta"),
  dashSetor2Meta: document.getElementById("dashSetor2Meta"),
  dashSetor3Meta: document.getElementById("dashSetor3Meta"),
  dashSetor4Meta: document.getElementById("dashSetor4Meta"),
  dashBarSetor1: document.getElementById("dashBarSetor1"),
  dashBarSetor2: document.getElementById("dashBarSetor2"),
  dashBarSetor3: document.getElementById("dashBarSetor3"),
  dashBarSetor4: document.getElementById("dashBarSetor4"),
  dashBarSetor1Label: document.getElementById("dashBarSetor1Label"),
  dashBarSetor2Label: document.getElementById("dashBarSetor2Label"),
  dashBarSetor3Label: document.getElementById("dashBarSetor3Label"),
  dashBarSetor4Label: document.getElementById("dashBarSetor4Label"),
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
  relatorioSetorOutput: document.getElementById("relatorioSetorOutput"),
  viewProdAnalise: document.getElementById("viewProdAnalise")
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

function getFormaCatalogKey(forma) {
  const normalized = normalizeUpper(forma).replace(/\s+/g, "");
  if (!normalized) return "";
  if (normalized.startsWith("300-VR")) return "300-VR";
  if (normalized.startsWith("300-VL")) return "300-VL";
  if (normalized.startsWith("SB-E1")) return "SB-E1";
  if (normalized.startsWith("SBE-")) return "SB-E1";
  if (normalized.startsWith("100-")) return "100";
  if (normalized.startsWith("200-")) return "200";
  if (normalized.startsWith("A-TOTEM")) return "A-TOTEM";
  if (normalized.startsWith("C-F1")) return "C-F1";
  if (normalized.startsWith("R-G")) return "R-G";
  if (normalized.startsWith("DTBM")) return "DTBM";
  if (normalized.startsWith("DTB")) return "DTB";
  if (normalized.startsWith("DTD")) return "DTD";
  return normalized.split("-")[0];
}

function getPosteCatalogForForma(forma) {
  const key = getFormaCatalogKey(forma);
  return POSTES_DUPLO_T_BY_CHAVE.get(key) || null;
}

function withPosteData(item, setor) {
  const base = item || {};
  const catalog = getPosteCatalogForForma(base.forma);
  if (!catalog) {
    return {
      ...base,
      codigoPoste: "",
      descricaoPoste: "",
      codigoProduto: ""
    };
  }
  return {
    ...base,
    codigoPoste: catalog.codigo || "",
    descricaoPoste: catalog.descricao || "",
    codigoProduto: catalog.codigoProduto || "",
    setorProduto: catalog.setor || setor || ""
  };
}

function getPosteFieldsForForma(forma, setor) {
  const data = withPosteData({ forma }, setor);
  return {
    codigoPoste: data.codigoPoste || "",
    descricaoPoste: data.descricaoPoste || "",
    codigoProduto: data.codigoProduto || ""
  };
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
  return supabaseClient !== null;
}

function hasMontagemApiConfigured() {
  return supabaseClient !== null;
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

function isSupabaseMissingColumnError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return (
    (message.includes("column") && message.includes("does not exist"))
    || (message.includes("could not find") && message.includes("column"))
    || (message.includes("schema cache") && message.includes("codigo_"))
  );
}

async function insertWithLegacyFallback(tableName, rows, legacyMapper) {
  const { error } = await supabaseClient.from(tableName).insert(rows);
  if (!error) return;
  if (!isSupabaseMissingColumnError(error)) throw error;
  const legacyRows = rows.map(legacyMapper);
  const legacyResult = await supabaseClient.from(tableName).insert(legacyRows);
  if (legacyResult.error) throw legacyResult.error;
}

async function upsertWithLegacyFallback(tableName, row, legacyMapper) {
  const { error } = await supabaseClient.from(tableName).upsert(row);
  if (!error) return;
  if (!isSupabaseMissingColumnError(error)) throw error;
  const legacyResult = await supabaseClient.from(tableName).upsert(legacyMapper(row));
  if (legacyResult.error) throw legacyResult.error;
}

async function checkApiStatus() {
  if (!hasApiConfigured()) {
    setSyncStatus("warn", "Supabase não configurado: salvando apenas localmente.");
    return;
  }

  try {
    const { error } = await supabaseClient.from('usuarios').select('id').limit(1);
    if (!error) {
      setSyncStatus("ok", "Conectado ao Supabase: sincronização online ativa.");
    } else {
      setSyncStatus("error", "Falha ao verificar banco Supabase.");
    }
  } catch {
    setSyncStatus("error", "Sem conexão com Supabase no momento.");
  }
}

async function postToApi(action, payload) {
  if (!hasApiConfigured()) {
    return { ok: false, skipped: true, error: "API não configurada" };
  }

  try {
    if (action === "salvar_forma_click") {
      let dtStr = new Date().toISOString();
      if (payload.dia && payload.hora) {
         try {
           const [dd, mm, yyyy] = payload.dia.split('/');
           const [hh, min, ss] = payload.hora.split(':');
           // Força o horário local do apontamento para o fuso de Brasília (-03:00)
           const localStr = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss || '00'}-03:00`;
           dtStr = new Date(localStr).toISOString();
         } catch(e) {}
      }

      await insertWithLegacyFallback('producao', [{
        data_hora: dtStr,
        setor: payload.setor,
        forma: payload.forma,
        modelo: payload.modelo,
        codigo_poste: payload.codigo_poste || null,
        descricao_poste: payload.descricao_poste || null,
        codigo_produto: payload.codigo_produto || null,
        tipo_concreto: payload.tipo_concreto || 'Padrão',
        colaborador: payload.colaborador,
        data_fabricacao: payload.dataFabricacao,
        status: payload.status || 'LIBERADO'
      }], ({ codigo_poste, descricao_poste, codigo_produto, ...legacy }) => legacy);
      return { ok: true, message: "Forma liberada salva com sucesso" };
    }

    if (action === "salvar_inspecao_lote") {
      const inserts = (payload.entries || []).map(entry => ({
        setor: entry.setor,
        forma: entry.forma || entry.formaNumero,
        modelo: entry.modelo,
        codigo_poste: entry.codigoPoste || entry.codigo_poste || null,
        descricao_poste: entry.descricaoPoste || entry.descricao_poste || null,
        codigo_produto: entry.codigoProduto || entry.codigo_produto || null,
        colaborador: entry.colaborador,
        data_fabricacao: entry.dataProducao,
        tipo_concreto: 'INSPECIONADO',
        status: 'INSPECIONADO'
      }));
      await insertWithLegacyFallback('producao', inserts, ({ codigo_poste, descricao_poste, codigo_produto, ...legacy }) => legacy);
      return { ok: true, message: "Inspeções salvas", results: inserts.map(i => ({forma: i.forma, status: 'ok'})) };
    }

    if (action === "listar_inspecao_pendentes") {
      let query = supabaseClient.from('producao').select('*').eq('status', 'LIBERADO');
      if (payload.data) query = query.eq('data_fabricacao', payload.data);
      if (payload.setor) query = query.eq('setor', payload.setor);
      const { data, error } = await query;
      if (error) throw error;

      const pendentes = data.map(row => ({
        forma: row.forma,
        setor: row.setor,
        modelo: row.modelo,
        codigoPoste: row.codigo_poste || "",
        descricaoPoste: row.descricao_poste || "",
        codigoProduto: row.codigo_produto || "",
        dataProducao: row.data_fabricacao,
        tipoConcreto: row.tipo_concreto
      }));
      return { ok: true, pendentes };
    }

    if (action === "relatorio_setor") {
      let query = supabaseClient.from('producao').select('*');
      if (payload.data) query = query.eq('data_fabricacao', payload.data);
      if (payload.setor) query = query.eq('setor', payload.setor);
      const { data, error } = await query;
      if (error) throw error;

      const relatorio = { liberados: 0, inspecionados: 0, porSetor: {}, porTipo: {} };
      data.forEach(row => {
        if (row.status === "LIBERADO") relatorio.liberados++;
        if (row.status === "INSPECIONADO") relatorio.inspecionados++;

        if (!relatorio.porSetor[row.setor]) relatorio.porSetor[row.setor] = { liberados: 0, inspecionados: 0 };
        if (row.status === "LIBERADO") relatorio.porSetor[row.setor].liberados++;
        if (row.status === "INSPECIONADO") relatorio.porSetor[row.setor].inspecionados++;

        if (!relatorio.porTipo[row.tipo_concreto]) relatorio.porTipo[row.tipo_concreto] = 0;
        relatorio.porTipo[row.tipo_concreto]++;
      });
      return { ok: true, relatorio };
    }

    if (action === "listar_usuarios") {
      const { data, error } = await supabaseClient.from('usuarios').select('*').eq('ativo', true);
      if (error) throw error;
      const users = data.map(u => ({ id: u.id, name: u.nome, role: u.perfil, setor: u.setor || "Todos", active: u.ativo }));
      return { ok: true, users };
    }

    if (action === "autenticar_usuario") {
      // Permite autenticação pelo Nome ou pelo Login (id)
      const { data, error } = await supabaseClient.from('usuarios')
        .select('*')
        .eq('ativo', true)
        .or(`id.ilike.${payload.name},nome.ilike.${payload.name}`)
        .eq('senha', payload.password)
        .limit(1);
      if (error) throw error;
      if (data.length === 0) return { ok: false, error: "Usuário ou senha incorretos." };
      const u = data[0];
      return {
        ok: true,
        user: {
          id: u.id,
          name: u.nome,
          role: u.perfil,
          active: u.ativo,
          setor: u.setor || "Todos",
          primeiro_acesso: u.primeiro_acesso !== false
        }
      };
    }

    if (action === "criar_usuario") {
      const userId = String(payload.login || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const { data, error } = await supabaseClient.from('usuarios').upsert([{
        id: userId,
        nome: payload.name,
        perfil: payload.role,
        senha: payload.password,
        setor: payload.setor || "Todos",
        primeiro_acesso: true, // Sempre ativo no primeiro cadastro
        ativo: true,
        updated_at: nowIso()
      }]).select();
      if (error) throw error;
      return { ok: true, user: { id: userId, name: payload.name, role: payload.role, active: true } };
    }

    if (action === "alterar_senha_primeiro_acesso") {
      const { data, error } = await supabaseClient.from('usuarios').update({
        senha: payload.senha,
        primeiro_acesso: false,
        updated_at: nowIso()
      }).eq('id', payload.id).select();
      if (error) throw error;
      return { ok: true };
    }

    if (action === "excluir_usuario") {
      const { error } = await supabaseClient.from('usuarios').update({ ativo: false }).eq('id', payload.id);
      if (error) throw error;
      return { ok: true, deletedId: payload.id };
    }

    return { ok: false, error: "Ação POST inválida" };
  } catch (error) {
    return { ok: false, error: error.message || String(error) };
  }
}

async function postToMontagemApi(action, payload) {
  if (!hasMontagemApiConfigured()) {
    return { ok: false, skipped: true, error: "API de montagem não configurada" };
  }

  try {
    if (action === "salvar_montagem_poste") {
      let key = payload.key;
      if (!key) key = [payload.recordId, payload.dataFabricacao, payload.setor, payload.formaNumero].join("||");

      await upsertWithLegacyFallback('montagem_poste', {
        id: key,
        record_id: payload.recordId,
        data_fabricacao: payload.dataFabricacao,
        setor: payload.setor,
        forma_numero: payload.formaNumero,
        modelo: payload.modelo,
        codigo_poste: payload.codigoPoste || payload.codigo_poste || null,
        descricao_poste: payload.descricaoPoste || payload.descricao_poste || null,
        codigo_produto: payload.codigoProduto || payload.codigo_produto || null,
        status_montagem: payload.statusMontagem,
        motivo_recusa: payload.motivoRecusa,
        etapa: payload.etapa,
        inicio_inspecao_montagem: payload.inicioInspecaoMontagem || null,
        finalizado_em: payload.finalizadoEm || null,
        checklists: payload.checklists || {},
        banco: payload.banco || 'montagem_poste',
        observacoes_montagem: payload.observacoesMontagem,
        montador_nome: payload.montadorNome
      }, ({ codigo_poste, descricao_poste, codigo_produto, ...legacy }) => legacy);
      return { ok: true, upsert: "update", key };
    }

    return { ok: false, error: "Ação POST inválida na montagem" };
  } catch (error) {
    return { ok: false, error: error.message || String(error) };
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
  item = withPosteData(item, setor);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "lib-btn";
  const setBtnLabel = (done = false, tipo = null) => {
    const check = done ? " ✓" : "";
    const tipoText = tipo ? ` (${tipo})` : "";
    btn.innerHTML = `<span class="lib-btn-model">${item.modelo || "-"}</span> <span class="lib-btn-forma">${item.forma}${tipoText}${check}</span>`;
  };
  setBtnLabel(false);
  btn.dataset.formaNumero = normalizeUpper(item.forma);
  btn.dataset.modelo = item.modelo;
  btn.dataset.codigoPoste = item.codigoPoste || "";
  btn.dataset.descricaoPoste = item.descricaoPoste || "";
  btn.dataset.codigoProduto = item.codigoProduto || "";
  if (item.descricaoPoste || item.codigoProduto) {
    btn.title = [item.descricaoPoste, item.codigoProduto ? `Produto ${item.codigoProduto}` : ""].filter(Boolean).join(" - ");
  }

  if (setor && isFormaClicked(item.forma, setor)) {
    const tipo = getConcreteTypeForForma(item.forma, setor);
    btn.classList.add("active", "btn-liberado");
    setBtnLabel(true, tipo);
    btn.disabled = true;
  } else {
    btn.addEventListener("click", () => {
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
      showConcreteTypePopup(item.forma, setor, btn, item.modelo || "");
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

function setCardState(card, cardState) {
  card.classList.remove("is-idle", "is-saving", "is-saved", "is-error", "is-liberada");
  card.classList.add("is-" + cardState);

  // Se for uma célula do mapa do Setor 4, atualizar a linha inteira
  if (card.classList.contains("s4-forma-cell")) {
    if (typeof card.refreshRow === "function") {
      card.refreshRow();
    } else if (cardState === "saved") {
      const tr = card.closest("tr");
      if (tr) {
        const tdLib = tr.querySelector(".td-lib");
        if (tdLib) tdLib.textContent = "1";
      }
    }
  }

  const statusEl = card.querySelector(".fc-status");
  if (!statusEl) return;
  if (cardState === "saving") {
    statusEl.textContent = "⋯";
    card.disabled = true;
  } else if (cardState === "saved") {
    statusEl.textContent = "✓";
    card.disabled = !state.programmingMode && !state.liberationMode;
  } else if (cardState === "error") {
    statusEl.textContent = "✗";
    card.disabled = false;
  } else {
    statusEl.textContent = "";
    card.disabled = false;
  }
}

function markFormaLiberada(forma, setor) {
  const clicked = getClickedFormsToday();
  const key = setor + "||" + normalizeUpper(forma);
  clicked.formas[key] = "L";
  localStorage.setItem(CLICKED_FORMS_KEY, JSON.stringify(clicked));
}

function createFormaCard(item, setor) {
  item = withPosteData(item, setor);
  const card = document.createElement("button");
  card.type = "button";
  card.className = "forma-card is-idle";
  card.dataset.formaNumero = normalizeUpper(item.forma);
  card.dataset.modelo = item.modelo || "";
  card.dataset.codigoPoste = item.codigoPoste || "";
  card.dataset.descricaoPoste = item.descricaoPoste || "";
  card.dataset.codigoProduto = item.codigoProduto || "";
  if (item.descricaoPoste || item.codigoProduto) {
    card.title = [item.descricaoPoste, item.codigoProduto ? `Produto ${item.codigoProduto}` : ""].filter(Boolean).join(" - ");
  }

  const numEl = document.createElement("span");
  numEl.className = "fc-number";
  numEl.textContent = setor === "Setor 4" ? (item.modelo || item.label || item.forma) : (item.label || item.forma);

  const tipoEl = document.createElement("span");
  tipoEl.className = "fc-tipo";

  const statusEl = document.createElement("span");
  statusEl.className = "fc-status";

  card.appendChild(numEl);
  card.appendChild(tipoEl);
  card.appendChild(statusEl);

  // Destacar se estiver programada
  if (state.programmedFormas && state.programmedFormas.has(normalizeUpper(item.forma))) {
    card.classList.add("is-programmed");
  }

  if (isFormaClicked(item.forma, setor)) {
    const tipo = getConcreteTypeForForma(item.forma, setor);
    if (tipo) {
      tipoEl.textContent = tipo;
      tipoEl.style.display = "block";
    }
    setCardState(card, "saved");

    // Permitir alternar programação mesmo se concretado no Modo Programação
    card.addEventListener("click", () => {
      if (state.programmingMode) {
        toggleFormaProgramada(item.forma, setor, card);
      }
    });
  } else if (isFormaLiberada(item.forma, setor)) {
    card.classList.add("is-liberada");
    card.addEventListener("click", () => {
      if (state.programmingMode) {
        toggleFormaProgramada(item.forma, setor, card);
        return;
      }
      if (state.liberationMode) {
        // Já está liberada. Pode reverter ou fazer nada (ignorar por enquanto)
        return;
      }
      // Modo Normal: Concretar
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
      showConcreteTypePopup(item.forma, setor, card, item.modelo || "");
    });
  } else {
    card.addEventListener("click", () => {
      if (state.programmingMode) {
        toggleFormaProgramada(item.forma, setor, card);
        return;
      }
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
      if (state.liberationMode) {
        liberarFormaClicada(item.forma, setor, card, item.modelo || "");
      } else {
        showConcreteTypePopup(item.forma, setor, card, item.modelo || "");
      }
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

function createS4TableRow(item, setor) {
  item = withPosteData(item, setor);
  const tr = document.createElement("tr");

  const tdForma = document.createElement("td");
  tdForma.className = "s4-forma-cell";
  tdForma.textContent = item.label || item.forma;
  tdForma.dataset.formaNumero = normalizeUpper(item.forma);
  tdForma.dataset.modelo = item.modelo || "";
  tdForma.dataset.codigoPoste = item.codigoPoste || "";
  tdForma.dataset.descricaoPoste = item.descricaoPoste || "";
  tdForma.dataset.codigoProduto = item.codigoProduto || "";
  if (item.descricaoPoste || item.codigoProduto) {
    tdForma.title = [item.descricaoPoste, item.codigoProduto ? `Produto ${item.codigoProduto}` : ""].filter(Boolean).join(" - ");
  }

  const tdModelo = document.createElement("td");
  tdModelo.textContent = item.modelo || "";

  const tdLib = document.createElement("td");
  tdLib.className = "td-lib";

  const tdInsStatus = document.createElement("td");
  tdInsStatus.className = "td-ins-status";

  const tdInsCod = document.createElement("td");
  tdInsCod.className = "td-ins-cod";

  const refreshRow = () => {
    if (isFormaClicked(item.forma, setor)) {
      tdForma.classList.add("is-saved");
      tdLib.textContent = "1";
      const db = readDb();
      const rec = findRecordByKey(db, el.libData?.value || todayYmd(), setor, normalizeUpper(item.forma));
      const ins = getInspecaoResumo(rec);
      tdInsStatus.textContent = ins.status || "";
      tdInsCod.textContent = ins.cod || "";
    } else {
      tdForma.classList.remove("is-saved");
      tdLib.textContent = "";
      tdInsStatus.textContent = "";
      tdInsCod.textContent = "";
    }
  };
  tdForma.refreshRow = refreshRow;

  tdForma.addEventListener("click", () => {
    const data = el.libData?.value;
    const colaborador = (el.libColaborador?.value || "").trim();
    if (!data) { showLibFeedback("Data!", "error"); return; }
    if (!colaborador) { showLibFeedback("Colaborador!", "error"); return; }
    showConcreteTypePopup(item.forma, setor, tdForma, item.modelo || "");
  });

  tr.appendChild(tdForma);
  tr.appendChild(tdModelo);

  refreshRow();
  return tr;
}

function renderSetor4Mapa(container) {
  if (!container) return;
  container.innerHTML = "";
  container.className = "s4-layout-wrapper";

  const setor = "Setor 4";

  // Um único container de grid de 3 colunas
  const grid = document.createElement("div");
  grid.className = "s4-mapa-container";
  grid.style.gridTemplateColumns = "repeat(3, 1fr)";

  // Coluna 1: Copos (Print 1)
  const colCopos = document.createElement("div");
  colCopos.className = "s4-col";

  const wrapCopos = document.createElement("div");
  wrapCopos.className = "s4-table-wrapper";
  const tableCopos = document.createElement("table");
  tableCopos.className = "s4-table";
  tableCopos.innerHTML = `<thead><tr><th>N Forma</th><th>Modelo</th></tr></thead><tbody></tbody>`;
  const bodyCopos = tableCopos.querySelector("tbody");
  SETOR_4_COL2_FORMS.forEach(item => bodyCopos.appendChild(createS4TableRow(item, setor)));
  wrapCopos.appendChild(tableCopos);
  colCopos.appendChild(wrapCopos);
  grid.appendChild(colCopos);

  // Coluna 2: Canaletas (Print 2 e 3)
  const colCanaletas = document.createElement("div");
  colCanaletas.className = "s4-col";

  const wrapCanaletas = document.createElement("div");
  wrapCanaletas.className = "s4-table-wrapper";
  const tableCanaletas = document.createElement("table");
  tableCanaletas.className = "s4-table";
  tableCanaletas.innerHTML = `<thead><tr><th>N Forma</th><th>Modelo</th></tr></thead><tbody></tbody>`;
  const bodyCanaletas = tableCanaletas.querySelector("tbody");
  SETOR_4_COL3_FORMS.forEach(item => bodyCanaletas.appendChild(createS4TableRow(item, setor)));
  wrapCanaletas.appendChild(tableCanaletas);
  colCanaletas.appendChild(wrapCanaletas);
  grid.appendChild(colCanaletas);

  // Coluna 3: Barreiras (DTB, DTBM, DTD)
  const colBarreiras = document.createElement("div");
  colBarreiras.className = "s4-col";

  const wrapBarreiras = document.createElement("div");
  wrapBarreiras.className = "s4-table-wrapper";
  const tableBarreiras = document.createElement("table");
  tableBarreiras.className = "s4-table";
  tableBarreiras.innerHTML = `<thead><tr><th>N Forma</th><th>Modelo</th></tr></thead><tbody></tbody>`;
  const bodyBarreiras = tableBarreiras.querySelector("tbody");
  SETOR_4_COL1_FORMS.forEach(item => bodyBarreiras.appendChild(createS4TableRow(item, setor)));
  wrapBarreiras.appendChild(tableBarreiras);
  colBarreiras.appendChild(wrapBarreiras);
  grid.appendChild(colBarreiras);

  container.appendChild(grid);
}

function updateKioskHeader() {
  if (!el.kioskSectorTitle || !el.kioskSectorSubtitle || !el.kioskLibData || !el.kioskLibColaborador) return;

  let sectorLabel = "";
  if (state.activeLiberacaoSector === "LIBERACAO_S1") sectorLabel = "Setor 1";
  else if (state.activeLiberacaoSector === "LIBERACAO_S2") sectorLabel = "Setor 2";
  else if (state.activeLiberacaoSector === "LIBERACAO_S3") sectorLabel = "Setor 3";
  else if (state.activeLiberacaoSector === "LIBERACAO_S4") sectorLabel = "Setor 4";

  el.kioskSectorTitle.textContent = "Produção " + sectorLabel;
  el.kioskSectorSubtitle.textContent = "ÁREA OPERACIONAL QUIOSQUE";

  el.kioskLibData.value = el.libData?.value || todayYmd();
  el.kioskLibColaborador.value = el.libColaborador?.value || "";

  if (el.kioskProgCheckbox) {
    el.kioskProgCheckbox.checked = state.programmingMode || false;
    const toggleField = document.getElementById("kioskProgToggleField");
    if (toggleField) {
      toggleField.classList.toggle("active", state.programmingMode || false);
    }
  }

  updateKioskProgress();
}

function updateKioskProgress() {
  if (!el.kioskProgressoContador) return;

  let sectorLabel = "";
  let listAll = [];
  if (state.activeLiberacaoSector === "LIBERACAO_S1") {
    sectorLabel = "Setor 1";
    listAll = SETOR_1_LEFT_FORMS.concat(SETOR_1_RIGHT_FORMS);
  } else if (state.activeLiberacaoSector === "LIBERACAO_S2") {
    sectorLabel = "Setor 2";
    listAll = SETOR_2_LEFT_FORMS.concat(SETOR_2_RIGHT_FORMS);
  } else if (state.activeLiberacaoSector === "LIBERACAO_S3") {
    sectorLabel = "Setor 3";
    listAll = SETOR_3_LEFT_FORMS.concat(SETOR_3_RIGHT_FORMS);
  } else if (state.activeLiberacaoSector === "LIBERACAO_S4") {
    sectorLabel = "Setor 4";
    listAll = SETOR_4_COL1_FORMS.concat(SETOR_4_COL2_FORMS).concat(SETOR_4_COL3_FORMS);
  } else {
    return;
  }

  const clicked = getClickedFormsToday();
  const formas = clicked.formas || {};

  let concretados = 0;
  listAll.forEach((item) => {
    if (formas[sectorLabel + "||" + normalizeUpper(item.forma)]) {
      concretados++;
    }
  });

  el.kioskProgressoContador.textContent = `${concretados} / ${listAll.length}`;
}

function readLocalProgramacao() {
  const raw = localStorage.getItem("mapa_concretagem_programacao");
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeLocalProgramacao(list) {
  localStorage.setItem("mapa_concretagem_programacao", JSON.stringify(list));
}

async function programFormaInApiOrLocal(data, setor, forma) {
  let synced = false;
  if (hasApiConfigured()) {
    try {
      const { error } = await supabaseClient.from('programacao').insert([{
        data_fabricacao: data,
        setor: setor,
        forma: forma
      }]);
      if (!error) synced = true;
    } catch (err) {
      console.warn("Falha ao salvar programação no Supabase, usando local:", err);
    }
  }

  const list = readLocalProgramacao();
  const exists = list.some(item => item.data_fabricacao === data && item.setor === setor && item.forma === forma);
  if (!exists) {
    list.push({ data_fabricacao: data, setor, forma });
    writeLocalProgramacao(list);
  }

  if (synced) {
    setSyncStatus("ok", `Programação da forma ${forma} sincronizada.`);
  } else {
    setSyncStatus("warn", "Programação salva localmente.");
  }
}

async function unprogramFormaInApiOrLocal(data, setor, forma) {
  let synced = false;
  if (hasApiConfigured()) {
    try {
      const { error } = await supabaseClient.from('programacao').delete()
        .eq('data_fabricacao', data)
        .eq('setor', setor)
        .eq('forma', forma);
      if (!error) synced = true;
    } catch (err) {
      console.warn("Falha ao excluir programação no Supabase, usando local:", err);
    }
  }

  const list = readLocalProgramacao();
  const filtered = list.filter(item => !(item.data_fabricacao === data && item.setor === setor && item.forma === forma));
  writeLocalProgramacao(filtered);

  if (synced) {
    setSyncStatus("ok", `Programação da forma ${forma} excluída online.`);
  } else {
    setSyncStatus("warn", "Programação excluída localmente.");
  }
}

async function toggleFormaProgramada(forma, setor, card) {
  const data = el.libData?.value || todayYmd();
  if (!data) {
    showLibFeedback("Preencha a data antes de programar.", "error");
    return;
  }

  const normalized = normalizeUpper(forma);
  const isCurrentlyProgrammed = state.programmedFormas.has(normalized);

  if (isCurrentlyProgrammed) {
    state.programmedFormas.delete(normalized);
    card.classList.remove("is-programmed");
    await unprogramFormaInApiOrLocal(data, setor, normalized);
    showLibFeedback(`Forma ${forma} desprogramada.`, "ok");
  } else {
    state.programmedFormas.add(normalized);
    card.classList.add("is-programmed");
    await programFormaInApiOrLocal(data, setor, normalized);
    showLibFeedback(`Forma ${forma} programada!`, "ok");
  }

  updateKioskProgress();
}

async function loadClickedFormsFromSupabase() {
  const data = el.libData?.value || todayYmd();
  if (!hasApiConfigured()) return;

  try {
    // Busca todas as concretagens feitas na data selecionada a partir do Supabase (independente de estar LIBERADO ou INSPECIONADO)
    const { data: rows, error } = await supabaseClient.from('producao')
      .select('forma, setor, tipo_concreto, status')
      .eq('data_fabricacao', data);

    if (!error && Array.isArray(rows)) {
      const clicked = getClickedFormsToday();
      // Limpa os registros locais de clique para re-popular com os dados atualizados em nuvem
      clicked.formas = {};
      clicked.dia = new Date().toLocaleDateString("pt-BR");

      const db = readDb();
      let dbUpdated = false;

      rows.forEach(row => {
        if (row.forma && row.setor) {
          const isAguardando = row.status === 'AGUARDANDO_CONCRETAGEM';
          const statusVal = isAguardando ? 'L' : '1';
          const key = row.setor + "||" + normalizeUpper(row.forma);
          clicked.formas[key] = statusVal;

          // Sincroniza no banco local para que a exibição do tipo de concreto e status seja fiel
          let record = findRecordByKey(db, data, row.setor, normalizeUpper(row.forma));
          if (!record) {
            record = {
              id: uuid(),
              dataFabricacao: data,
              setor: row.setor,
              formaNumero: normalizeUpper(row.forma),
              concretoTipo: row.tipo_concreto || 'Padrão',
              createdAt: nowIso(),
              updatedAt: nowIso(),
              liberacao: { status: statusVal, timestamp: nowIso() },
              inspecoes: []
            };
            upsertRecord(db, record);
            dbUpdated = true;
          } else if (!record.liberacao || record.liberacao.status !== statusVal || record.concretoTipo !== row.tipo_concreto) {
            record.concretoTipo = row.tipo_concreto || 'Padrão';
            record.liberacao = record.liberacao || { status: statusVal, timestamp: nowIso() };
            record.liberacao.status = statusVal;
            record.updatedAt = nowIso();
            upsertRecord(db, record);
            dbUpdated = true;
          }
        }
      });

      if (dbUpdated) {
        writeDb(db);
      }
      localStorage.setItem(CLICKED_FORMS_KEY, JSON.stringify(clicked));
    }
  } catch (err) {
    console.warn("Erro ao buscar concretagens do Supabase:", err);
  }
}

function getOperationalFormsForSector(setor) {
  const groups = SECTOR_FORMS[setor] || {};
  return ["left", "right", "col1", "col2", "col3"]
    .flatMap((key) => Array.isArray(groups[key]) ? groups[key] : []);
}

function resolveOfficialProgrammedFormas(rows, setor) {
  const operationalForms = getOperationalFormsForSector(setor);
  const operationalFormsWithProducts = operationalForms.map((item) => withPosteData(item, setor));
  const visibleForms = new Set(operationalForms.map((item) => normalizeUpper(item.forma)));
  const visibleProductCodes = new Set(operationalFormsWithProducts.map((item) => normalizeUpper(item.codigoProduto)).filter(Boolean));
  const programmed = new Set();
  const remainingByProduct = new Map();

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const quantidade = Math.max(0, Number.parseInt(row.quantidade_programada, 10) || 0);
    if (!quantidade) return;

    const forma = normalizeUpper(row.codigo_forma || row.forma);
    if (forma) {
      if (visibleForms.has(forma)) programmed.add(forma);
      return;
    }

    const produtoCodigo = normalizeUpper(row.produto?.codigo || row.produto_codigo || row.codigo);
    if (!produtoCodigo || !visibleProductCodes.has(produtoCodigo)) return;
    remainingByProduct.set(produtoCodigo, (remainingByProduct.get(produtoCodigo) || 0) + quantidade);
  });

  operationalFormsWithProducts.forEach((item) => {
    const produtoCodigo = normalizeUpper(item.codigoProduto);
    const restante = remainingByProduct.get(produtoCodigo) || 0;
    if (!produtoCodigo || restante <= 0) return;
    programmed.add(normalizeUpper(item.forma));
    remainingByProduct.set(produtoCodigo, restante - 1);
  });

  remainingByProduct.forEach((restante, produtoCodigo) => {
    if (restante > 0) {
      console.warn(`[programacao PCP] Produto ${produtoCodigo}: ${restante} unidade(s) sem forma operacional disponível no ${setor}.`);
    }
  });

  return programmed;
}

async function loadOfficialProgrammedFormas(data, setor) {
  if (!data || !setor || setor === "Setor 4") return new Set();

  try {
    const params = new URLSearchParams({ data_inicio: data, data_fim: data });
    const response = await fetch(`${PCP_PROGRAMACAO_URL}?${params.toString()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return resolveOfficialProgrammedFormas(await response.json(), setor);
  } catch (err) {
    console.warn("Erro ao buscar programação oficial do PCP:", err);
    return new Set();
  }
}

async function loadProgrammedFormas() {
  const data = el.libData?.value || todayYmd();
  let sectorLabel = "";
  if (state.activeLiberacaoSector === "LIBERACAO_S1") sectorLabel = "Setor 1";
  else if (state.activeLiberacaoSector === "LIBERACAO_S2") sectorLabel = "Setor 2";
  else if (state.activeLiberacaoSector === "LIBERACAO_S3") sectorLabel = "Setor 3";
  else if (state.activeLiberacaoSector === "LIBERACAO_S4") sectorLabel = "Setor 4";

  // Sincroniza as fôrmas concretadas do Supabase antes de renderizar
  await loadClickedFormsFromSupabase();

  if (!sectorLabel || sectorLabel === "Setor 4") return; // Setor 4 não possui programação

  state.programmedFormas = await loadOfficialProgrammedFormas(data, sectorLabel);

  let loadedFromDb = false;
  if (hasApiConfigured()) {
    try {
      const { data: rows, error } = await supabaseClient.from('programacao')
        .select('forma')
        .eq('data_fabricacao', data)
        .eq('setor', sectorLabel);
      if (!error && Array.isArray(rows)) {
        rows.forEach(row => {
          if (row.forma) state.programmedFormas.add(normalizeUpper(row.forma));
        });
        loadedFromDb = true;
      }
    } catch (err) {
      console.warn("Erro ao buscar programação do Supabase, usando local:", err);
    }
  }

  if (!loadedFromDb) {
    const list = readLocalProgramacao();
    list.filter(item => item.data_fabricacao === data && item.setor === sectorLabel)
      .forEach(item => {
        state.programmedFormas.add(normalizeUpper(item.forma));
      });
  }
}

function renderLiberacaoDual() {
  const isAll = state.activeLiberacaoSector === "LIBERACAO";
  const isS1 = isAll || state.activeLiberacaoSector === "LIBERACAO_S1";
  const isS2 = isAll || state.activeLiberacaoSector === "LIBERACAO_S2";
  const isS3 = isAll || state.activeLiberacaoSector === "LIBERACAO_S3";
  const isS4 = isAll || state.activeLiberacaoSector === "LIBERACAO_S4";

  const sec1 = document.querySelector(".lib-sector-1");
  if(sec1) sec1.style.display = isS1 ? "block" : "none";
  const sec2 = document.querySelector(".lib-sector-2");
  if(sec2) sec2.style.display = isS2 ? "block" : "none";
  const sec3 = document.querySelector(".lib-sector-3");
  if(sec3) sec3.style.display = isS3 ? "block" : "none";
  const sec4 = document.querySelector(".lib-setor4-panel");
  if(sec4) sec4.style.display = isS4 ? "block" : "none";

  if (isS1) {
    renderSectorCols(
      document.getElementById("libSetor1Cols"),
      SETOR_1_LEFT_FORMS,
      SETOR_1_RIGHT_FORMS,
      "Setor 1"
    );
  }
  if (isS2) {
    renderSectorCols(
      document.getElementById("libSetor2Cols"),
      SETOR_2_LEFT_FORMS,
      SETOR_2_RIGHT_FORMS,
      "Setor 2"
    );
  }
  if (isS3) {
    renderSectorCols(
      document.getElementById("libSetor3Cols"),
      SETOR_3_LEFT_FORMS,
      SETOR_3_RIGHT_FORMS,
      "Setor 3"
    );
  }
  if (isS4) {
    renderSetor4Mapa(
      document.getElementById("libSetor4Cols")
    );
  }
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

  // Atualizar progresso do quiosque também
  updateKioskProgress();
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

function closeConcreteTypePopup() {
  if (!el.concretoTipoModal) return;
  el.concretoTipoModal.classList.remove("modal-visible");
  pendingFormaSelection = null;
}

function showConcreteTypePopup(forma, setor, card, modelo) {
  if (!el.concretoTipoModal || !el.concretoTipoOptions || !el.concretoTipoSubtitle) return;

  pendingFormaSelection = { forma, setor, card, modelo };
  el.concretoTipoSubtitle.textContent = `Forma ${forma} . ${setor}`;

  const optionsHtml = [
    {
      tipo: "Concreto Padrão",
      title: "Concreto padrao",
      desc: "Tudo certo",
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="16 8 10 14 8 12"></polyline></svg>`,
      className: "concreto-opt-padrao"
    },
    {
      tipo: "Concreto Seco - Vibrado",
      title: "Concreto seco - vibrado",
      desc: "Faltou agua / endureceu",
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.92 2.92l18.16 18.16"></path><path d="M8.21 13.79c-.14-.59-.21-1.19-.21-1.79 0-2 1-3.9 3-5.5s3.5-4 4-6.5c.34 1.71 1.25 3.32 2.12 4.67"></path><path d="M18.8 14.8C18.93 15.2 19 15.6 19 16a7 7 0 0 1-12.28 4.6"></path></svg>`,
      className: "concreto-opt-seco"
    },
    {
      tipo: "Concreto Segregado",
      title: "Concreto segregado",
      desc: "Pedra separou e desceu",
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="1.5"></circle><circle cx="12" cy="8" r="1.5"></circle><circle cx="8" cy="12" r="1.5"></circle><circle cx="12" cy="12" r="1.5"></circle><circle cx="8" cy="16" r="1.5"></circle><path d="M16 10v10"></path><polyline points="13 17 16 20 19 17"></polyline></svg>`,
      className: "concreto-opt-segregado"
    },
    {
      tipo: "Concreto Exsudado",
      title: "Concreto exsudado",
      desc: "Agua subiu na superficie",
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C2 11.1 1 13 1 15a7 7 0 0 0 7 7z"></path><path d="M18 16v-6"></path><polyline points="15 13 18 10 21 13"></polyline></svg>`,
      className: "concreto-opt-exsudado"
    }
  ];

  el.concretoTipoOptions.innerHTML = optionsHtml.map(opt => `
    <button type="button" class="btn-concreto-rich ${opt.className}" data-tipo="${escapeHtml(opt.tipo)}">
      <div class="btn-concreto-icon">${opt.icon}</div>
      <div class="btn-concreto-text">
        <span class="btn-concreto-title">${opt.title}</span>
        <span class="btn-concreto-desc">${opt.desc}</span>
      </div>
    </button>
  `).join("");

  el.concretoTipoOptions.querySelectorAll(".btn-concreto-rich").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tipo = String(btn.dataset.tipo || "").trim();
      if (tipo) {
        closeConcreteTypePopup();
        salvarFormaClicada(forma, setor, card, modelo, tipo);
      }
    });
  });

  el.concretoTipoModal.classList.add("modal-visible");
}

async function liberarFormaClicada(forma, setor, card, modelo) {
  setCardState(card, "saving");

  const agora = new Date();
  const dia = agora.toLocaleDateString("pt-BR");
  const hora = agora.toLocaleTimeString("pt-BR");
  const dataFabricacao = el.libData?.value || todayYmd();
  const colaborador = (el.libColaborador?.value || "").trim();
  const modeloFinal = modelo || card.dataset.modelo || "";
  const posteFields = {
    codigoPoste: card.dataset.codigoPoste || "",
    descricaoPoste: card.dataset.descricaoPoste || "",
    codigoProduto: card.dataset.codigoProduto || ""
  };
  const resolvedPosteFields = posteFields.codigoProduto || posteFields.descricaoPoste
    ? posteFields
    : getPosteFieldsForForma(forma, setor);

  const payload = {
    dia,
    hora,
    setor,
    forma,
    dataFabricacao,
    colaborador,
    modelo: modeloFinal,
    tipo_concreto: "Padrão", // Temporário, até ser concretado de fato
    codigo_poste: resolvedPosteFields.codigoPoste,
    descricao_poste: resolvedPosteFields.descricaoPoste,
    codigo_produto: resolvedPosteFields.codigoProduto,
    status: "AGUARDANDO_CONCRETAGEM"
  };

  const apiResult = await postToApi("salvar_forma_click", payload);

  const isNetworkFailure = !apiResult.ok && !apiResult.skipped;
  if (apiResult.ok || apiResult.skipped || isNetworkFailure) {
    const db = readDb();
    let record = findRecordByKey(db, dataFabricacao, setor, normalizeUpper(forma));
    if (!record) {
      record = {
        id: uuid(),
        dataFabricacao,
        setor,
        formaNumero: normalizeUpper(forma),
        modelo: modeloFinal,
        codigoPoste: resolvedPosteFields.codigoPoste,
        descricaoPoste: resolvedPosteFields.descricaoPoste,
        codigoProduto: resolvedPosteFields.codigoProduto,
        concretoTipo: "Padrão",
        createdAt: nowIso(),
        updatedAt: nowIso(),
        liberacao: null,
        inspecoes: []
      };
    }
    record.codigoPoste = resolvedPosteFields.codigoPoste;
    record.descricaoPoste = resolvedPosteFields.descricaoPoste;
    record.codigoProduto = resolvedPosteFields.codigoProduto;
    if (!record.liberacao || record.liberacao.status !== "1") {
      record.liberacao = { status: "L", colaborador, observacoes: "", fotos: [], timestamp: nowIso() };
      record.updatedAt = nowIso();
    }
    upsertRecord(db, record);
    addEvent(db, {
      id: uuid(),
      recordId: record.id,
      etapa: "LIBERACAO",
      status: "L",
      dataFabricacao: record.dataFabricacao,
      setor: record.setor,
      formaNumero: record.formaNumero,
      codigoPoste: record.codigoPoste || "",
      descricaoPoste: record.descricaoPoste || "",
      codigoProduto: record.codigoProduto || "",
      tipoConcreto: "Padrão",
      colaborador,
      timestamp: record.liberacao?.timestamp || nowIso(),
      fotosCount: 0,
      codigos: [],
      observacoes: "",
      pendingSync: isNetworkFailure
    });
    writeDb(db);
  }

  if (apiResult.ok) {
    markFormaLiberada(forma, setor);
    card.classList.remove("is-saving", "is-idle");
    card.classList.add("is-liberada");
    card.disabled = false;
    const statusEl = card.querySelector(".fc-status");
    if (statusEl) statusEl.textContent = "";
    setSyncStatus("ok", `Forma ${forma} liberada com sucesso.`);
    showLibFeedback(`${forma} — liberada!`, "ok");
  } else if (apiResult.skipped) {
    markFormaLiberada(forma, setor);
    card.classList.remove("is-saving", "is-idle");
    card.classList.add("is-liberada");
    card.disabled = false;
    setSyncStatus("warn", "API não configurada. Forma liberada localmente.");
    showLibFeedback(`${forma} — liberada (local).`, "ok");
  } else {
    markFormaLiberada(forma, setor);
    card.classList.remove("is-saving", "is-idle");
    card.classList.add("is-liberada");
    card.disabled = false;
    setSyncStatus("warn", `Forma ${forma} liberada localmente (sem sinal de rede).`);
    showLibFeedback(`${forma} — liberada (offline)`, "warn");
  }
}

async function salvarFormaClicada(forma, setor, card, modelo, concretoTipo = "Concreto Padrão") {
  setCardState(card, "saving");

  const agora = new Date();
  const dia = agora.toLocaleDateString("pt-BR");
  const hora = agora.toLocaleTimeString("pt-BR");
  const dataFabricacao = el.libData?.value || todayYmd();
  const colaborador = (el.libColaborador?.value || "").trim();
  const modeloFinal = modelo || card.dataset.modelo || "";
  const posteFields = {
    codigoPoste: card.dataset.codigoPoste || "",
    descricaoPoste: card.dataset.descricaoPoste || "",
    codigoProduto: card.dataset.codigoProduto || ""
  };
  const resolvedPosteFields = posteFields.codigoProduto || posteFields.descricaoPoste
    ? posteFields
    : getPosteFieldsForForma(forma, setor);

  const payload = {
    dia,
    hora,
    setor,
    forma,
    dataFabricacao,
    colaborador,
    modelo: modeloFinal,
    tipo_concreto: concretoTipo,
    codigo_poste: resolvedPosteFields.codigoPoste,
    descricao_poste: resolvedPosteFields.descricaoPoste,
    codigo_produto: resolvedPosteFields.codigoProduto
  };

  const apiResult = await postToApi("salvar_forma_click", payload);

  const isNetworkFailure = !apiResult.ok && !apiResult.skipped;
  if (apiResult.ok || apiResult.skipped || isNetworkFailure) {
    const db = readDb();
    let record = findRecordByKey(db, dataFabricacao, setor, normalizeUpper(forma));
    if (!record) {
      record = {
        id: uuid(),
        dataFabricacao,
        setor,
        formaNumero: normalizeUpper(forma),
        modelo: modeloFinal,
        codigoPoste: resolvedPosteFields.codigoPoste,
        descricaoPoste: resolvedPosteFields.descricaoPoste,
        codigoProduto: resolvedPosteFields.codigoProduto,
        concretoTipo,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        liberacao: null,
        inspecoes: []
      };
    }
    record.concretoTipo = concretoTipo;
    record.codigoPoste = resolvedPosteFields.codigoPoste;
    record.descricaoPoste = resolvedPosteFields.descricaoPoste;
    record.codigoProduto = resolvedPosteFields.codigoProduto;
    if (!record.liberacao || record.liberacao.status !== "1") {
      record.liberacao = { status: "1", colaborador, observacoes: "", fotos: [], timestamp: nowIso() };
      record.updatedAt = nowIso();
    }
    upsertRecord(db, record);
    addEvent(db, {
      id: uuid(),
      recordId: record.id,
      etapa: "LIBERACAO",
      status: "1",
      dataFabricacao: record.dataFabricacao,
      setor: record.setor,
      formaNumero: record.formaNumero,
      codigoPoste: record.codigoPoste || "",
      descricaoPoste: record.descricaoPoste || "",
      codigoProduto: record.codigoProduto || "",
      tipoConcreto: concretoTipo,
      colaborador,
      timestamp: record.liberacao?.timestamp || nowIso(),
      fotosCount: 0,
      codigos: [],
      observacoes: "",
      pendingSync: isNetworkFailure
    });
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
    // Falha de rede: salva localmente mas marca como pendente de sync
    markFormaClicked(forma, setor);
    setCardState(card, "saved");
    updateSectorCounters();
    setSyncStatus("warn", `Forma ${forma} salva localmente (sem sinal de rede).`);
    showLibFeedback(`${forma} — salvo localmente (offline)`, "warn");
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

function normalizeForma(s) {
  if (!s) return "";
  s = String(s).trim().toUpperCase();
  s = s.replace(/[\s\-]+/g, '');

  const match = s.match(/^([A-Z]+)0*([0-9]+)$/);
  if (match) {
    const num = match[2];
    const numStr = num.replace(/^0+/, '');
    return match[1] + (numStr || '0');
  }

  const matchNum = s.match(/^0*([0-9]+)$/);
  if (matchNum) {
    const numStr = matchNum[1].replace(/^0+/, '');
    return numStr || '0';
  }

  return s;
}

async function fetchSetor3Models(filtroData) {
  // 1. Tentar primeiro a API oficial do PCP Concrefer
  try {
    const host = "https://pcp.concretrack.com.br";
    const response = await fetch(`${host}/api/programacao?setor_id=3&data_inicio=${filtroData}&data_fim=${filtroData}`);
    if (response.ok) {
      const data = await response.json();
      const formToModelMap = {};

      // A API original retorna algo do tipo: [{ "codigo_forma": "SC01", "poste": "12X600" }, ...]
      const items = Array.isArray(data) ? data : (data.programacoes || data.data || []);

      items.forEach((item) => {
        const forma = item.codigo_forma || item.forma;
        const modelo = item.poste || item.modelo || item.produto_nome || item.nome || item.produto?.nome;

        if (forma && modelo) {
          formToModelMap[normalizeForma(forma)] = modelo;
        }
      });
      console.log("✓ Modelos resolvidos via API PCP Concrefer (normalizados):", formToModelMap);
      return formToModelMap;
    } else {
      console.warn("API PCP Concrefer retornou erro HTTP:", response.status);
      throw new Error(`Erro HTTP ${response.status} na API pcp`);
    }
  } catch (err) {
    console.warn("[fetchSetor3Models] Tentando fallback para usina.concretrack.com.br/api/programacao devido a erro:", err);
    try {
      const fallbackHost = "https://usina.concretrack.com.br";
      const fallbackResponse = await fetch(`${fallbackHost}/api/programacao?setor_id=3&data_inicio=${filtroData}&data_fim=${filtroData}`);
      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        const formToModelMap = {};
        const items = Array.isArray(data) ? data : (data.programacoes || data.data || []);
        items.forEach((item) => {
          const forma = item.codigo_forma || item.forma;
          const modelo = item.poste || item.modelo || item.produto_nome || item.nome || item.produto?.nome;
          if (forma && modelo) formToModelMap[normalizeForma(forma)] = modelo;
        });
        console.log("✓ Modelos resolvidos via Fallback API Usina:", formToModelMap);
        return formToModelMap;
      }
    } catch (fallbackErr) {
      console.warn("Fallback Usina também falhou:", fallbackErr);
    }

    alert("Aviso: Falha de conexão com a API do PCP Concrefer (" + err.message + "). O navegador pode estar bloqueando (CORS) ou a API está fora. Mostrando modelos como SC.");
  }

  // 2. Fallback antigo: tentar carregar do Supabase (caso a tabela programacoes exista no Supabase no futuro)
  if (!supabaseClient) return {};
  try {
    const { data: progRows, error: err1 } = await supabaseClient
      .from('programacoes')
      .select('codigo_forma, produto_id')
      .eq('data', filtroData)
      .in('setor_id', [3, 4]);

    if (err1) {
      console.warn("[fetchSetor3Models] Erro PGRST programacoes:", err1);
      return {};
    }
    if (!progRows || progRows.length === 0) return {};

    const { data: prodRows, error: err2 } = await supabaseClient
      .from('produtos')
      .select('*');

    if (err2) {
      console.warn("[fetchSetor3Models] Erro PGRST produtos:", err2);
      return {};
    }
    if (!prodRows || prodRows.length === 0) return {};

    const sample = prodRows[0];
    const modelKey = ['modelo', 'nome', 'descricao', 'codigo'].find(key => key in sample) || 'modelo';

    const productsMap = {};
    prodRows.forEach((p) => {
      productsMap[p.id] = String(p[modelKey] || "").trim();
    });

    const formToModelMap = {};
    progRows.forEach((row) => {
      const forma = String(row.codigo_forma || "").trim().toUpperCase();
      const prodId = row.produto_id;
      if (forma && prodId && productsMap[prodId]) {
        formToModelMap[normalizeForma(forma)] = productsMap[prodId];
      }
    });

    return formToModelMap;
  } catch (e) {
    console.warn("[fetchSetor3Models] Fallback silencioso do Supabase executado:", e);
    return {};
  }
}

async function fetchPolesForDate(filtroData, setor = "") {
  if (!hasApiConfigured()) return [];

  try {
    let formToModelMap = {};
    if (!setor || setor === "Setor 3" || setor === "Setor 4") {
      formToModelMap = await fetchSetor3Models(filtroData);
    }

    // 1. Fetch from producao table in Supabase
    let queryProd = supabaseClient
      .from('producao')
      .select('*')
      .eq('data_fabricacao', filtroData);
    if (setor) {
      queryProd = queryProd.eq('setor', setor);
    }
    const { data: producaoRows, error: err1 } = await queryProd;
    if (err1) throw err1;

    // 2. Fetch from montagem_poste table in Supabase
    let queryMont = supabaseClient
      .from('montagem_poste')
      .select('*')
      .eq('data_fabricacao', filtroData);
    if (setor) {
      queryMont = queryMont.eq('setor', setor);
    }
    const { data: montagemRows, error: err2 } = await queryMont;
    if (err2) throw err2;

    // 3. Deduplicate producaoRows by form name, keeping the latest row
    const formsMap = {};
    (producaoRows || []).forEach(row => {
      const forma = row.forma;
      if (!forma) return;
      if (!formsMap[forma]) {
        formsMap[forma] = [];
      }
      formsMap[forma].push(row);
    });

    const combinedList = [];
    Object.entries(formsMap).forEach(([forma, rows]) => {
      rows.sort((a, b) => new Date(b.data_hora || 0) - new Date(a.data_hora || 0));
      const latestRow = rows[0];

      // Find if there is an inspected status for this form
      const insRecord = (montagemRows || []).find(m => m.forma_numero === forma && m.setor === latestRow.setor && m.etapa === 'INSPECAO');
      const montRecord = (montagemRows || []).find(m => m.forma_numero === forma && m.setor === latestRow.setor && m.etapa === 'MONTAGEM');

      let modeloFinal = latestRow.modelo || "";
      const normForma = normalizeForma(forma);
      if ((latestRow.setor === "Setor 3" || latestRow.setor === "Setor 4") && formToModelMap[normForma]) {
        modeloFinal = formToModelMap[normForma];
      }

      combinedList.push({
        recordId: latestRow.id,
        dataFabricacao: latestRow.data_fabricacao,
        setor: latestRow.setor,
        formaNumero: forma,
        modelo: modeloFinal,
        codigoPoste: latestRow.codigo_poste || "",
        descricaoPoste: latestRow.descricao_poste || "",
        codigoProduto: latestRow.codigo_produto || "",
        colaboradorProducao: latestRow.colaborador || "",
        statusProducao: latestRow.status,
        tipoConcreto: latestRow.tipo_concreto || "",
        inspecao: insRecord ? {
          status: insRecord.status_montagem,
          codigo: insRecord.motivo_recusa || "",
          observacoes: insRecord.observacoes_montagem || "",
          colaborador: insRecord.montador_nome || "",
          timestamp: insRecord.finalizado_em || insRecord.updated_at
        } : null,
        montagem: montRecord || null
      });
    });

    combinedList.sort((a, b) => a.formaNumero.localeCompare(b.formaNumero, undefined, { numeric: true, sensitivity: 'base' }));
    return combinedList;
  } catch (err) {
    console.error("[fetchPolesForDate] Erro:", err);
    return [];
  }
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
  state.insInicioLocal = nowIso();
  const filtroData = el.insFiltroData.value || todayYmd();
  const modoCarga = el.insModoCarga?.value || "data";
  const setor = state.activeInsSector || "";

  el.insLiberadosBody.innerHTML = "";
  if (!filtroData) {
    el.insQtdItens.textContent = "0";
    el.insLiberadosBody.innerHTML = '<tr><td colspan="5" class="muted">Selecione a data de produção para carregar os itens liberados.</td></tr>';
    return;
  }

  // Busca dados em tempo real diretamente do Supabase sem cache local
  let poles = await fetchPolesForDate(filtroData, setor);

  // Se o setor não for informado ("Todos"), filtramos estritamente para mostrar apenas Setor 3 e Setor 4
  if (!setor) {
    poles = poles.filter((pole) => pole.setor === "Setor 3" || pole.setor === "Setor 4");
  }

  // Filtra de acordo com modoCarga
  const rows = poles.filter((pole) => {
    if (modoCarga === "pendentes") {
      return !pole.inspecao;
    }
    return true;
  });

  rows.sort((a, b) => {
    const valA = String(a.formaNumero || "");
    const valB = String(b.formaNumero || "");
    return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
  });

  el.insQtdItens.textContent = String(rows.length);

  if (!rows.length) {
    el.insLiberadosBody.innerHTML = '<tr><td colspan="5" class="muted">Nenhum poste apontado ou pendente de inspeção para os filtros informados.</td></tr>';
    return;
  }

  rows.forEach((record) => {
    const tr = document.createElement("tr");
    tr.dataset.recordId = String(record.recordId || "");
    tr.dataset.dataFabricacao = String(record.dataFabricacao || "");
    tr.dataset.setor = String(record.setor || "");
    tr.dataset.formaNumero = String(record.formaNumero || "");
    tr.dataset.modelo = String(record.modelo || "");
    tr.dataset.codigoPoste = String(record.codigoPoste || "");
    tr.dataset.descricaoPoste = String(record.descricaoPoste || "");
    tr.dataset.codigoProduto = String(record.codigoProduto || "");

    const selectedStatus = record.inspecao?.status || "";
    const selectedCode = record.inspecao?.codigo || "";

    tr.innerHTML = `
      <td data-label="N Forma">${record.formaNumero || ""}</td>
      <td data-label="Modelo">${record.modelo || ""}</td>
      <td data-label="Status">
        <select data-ins-status>
          <option value="">Selecione</option>
          <option value="A" ${selectedStatus === "A" ? "selected" : ""}>A - Aprovado</option>
          <option value="R" ${selectedStatus === "R" ? "selected" : ""}>R - Reprovado</option>
          <option value="RR" ${selectedStatus === "RR" ? "selected" : ""}>RR - Reprovado e retrabalhado</option>
        </select>
      </td>
      <td data-label="Código Recusa">
        <select data-ins-code>${getInspecaoCodeOptions(selectedCode)}</select>
      </td>
      <td data-label="Data Prod">${fmtDate(record.dataFabricacao || "")}</td>
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
    codigoPoste: entry.codigoPoste || "",
    descricaoPoste: entry.descricaoPoste || "",
    codigoProduto: entry.codigoProduto || "",
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
    // Marcar como sincronizado no local storage
    const db = readMontagemPostesDb();
    if (db.postes[entry.key]) {
      db.postes[entry.key].pendingSync = false;
      writeMontagemPostesDb(db);
    }
    return { ok: true, synced: true };
  }

  if (apiResult.skipped) {
    if (!options.silent) setSyncStatus("warn", "API não configurada. Montagem de poste salva localmente.");
    return { ok: true, synced: false, skipped: true };
  }

  // Falha na rede: marca como pendente de sincronização
  const db = readMontagemPostesDb();
  if (db.postes[entry.key]) {
    db.postes[entry.key].pendingSync = true;
    writeMontagemPostesDb(db);
  }
  if (!options.silent) setSyncStatus("warn", "Montagem salva localmente, mas sem sincronização no momento.");
  return { ok: false, synced: false, error: apiResult.error || "falha de sincronização" };
}

function isChecklistSectionComplete(sectionId, respostas = {}) {
  const modelo = state.montagemPostesAtual?.modelo || "";
  const sections = getMontagemChecklistSections(modelo);
  const section = sections.find((s) => s.id === sectionId);
  if (!section) return false;
  return section.itens.every((item) => respostas[sectionId]?.[item.id] === "sim" || respostas[sectionId]?.[item.id] === "nao");
}

function renderMontagemChecklistSections() {
  if (!el.mpChecklistSections || !state.montagemPostesAtual) return;
  const current = state.montagemPostesAtual;
  el.mpChecklistSections.innerHTML = "";

  const sections = getMontagemChecklistSections(current.modelo || "");
  let sectionEnabled = true;

  sections.forEach((section) => {
    const article = document.createElement("article");
    article.className = "mp-checklist-section";
    if (!sectionEnabled) {
      article.style.opacity = "0.5";
      article.style.pointerEvents = "none";
    }

    const isComplete = isChecklistSectionComplete(section.id, current.checklists || {});

    const sectionHeader = document.createElement("div");
    sectionHeader.className = "mp-checklist-header";
    sectionHeader.innerHTML = `
      <strong>${section.titulo}</strong>
      <span class="mp-checklist-flag ${isComplete ? "ok" : "pendente"}">${isComplete ? "OK" : "Pendente"}</span>
    `;
    article.appendChild(sectionHeader);

    section.itens.forEach((item) => {
      const selected = current.checklists?.[section.id]?.[item.id] || "";
      const photoBase64 = current.checklists?.[section.id]?.[item.id + "_photo"] || "";
      const isFinalizado = !!current.finalizadoEm;

      const disableItem = isFinalizado || !sectionEnabled;

      const itemWrapper = document.createElement("div");
      itemWrapper.className = "mp-checklist-item-wrapper";

      let itemHtml = `
        <div class="mp-checklist-item">
          <span class="mp-checklist-item-text">
            ${item.critico ? '<span class="critico-dot" style="color: #ef4444;">🔴</span>' : ''}
            ${item.texto}
          </span>
          <div class="mp-yn-group">
            <button type="button" class="mp-yn-btn btn-aprovado ${selected === "sim" ? "active" : ""}"
                    data-mp-section="${section.id}" data-mp-item="${item.id}" data-mp-value="sim"
                    ${disableItem ? "disabled" : ""}>Aprovado</button>
            <button type="button" class="mp-yn-btn btn-reprovado ${selected === "nao" ? "active" : ""}"
                    data-mp-section="${section.id}" data-mp-item="${item.id}" data-mp-value="nao"
                    ${disableItem ? "disabled" : ""}>Reprovado</button>
          </div>
        </div>
      `;

      if (selected === "nao") {
        let actionsHtml = `<div class="mp-reprovado-actions">`;
        if (item.critico) {
          actionsHtml += `<div class="mp-segregar-badge">🚨 Segregar poste</div>`;
        }
        if (!isFinalizado) {
          actionsHtml += `
            <label class="mp-photo-upload-label">
              📸 Tirar Foto da Falha
              <input type="file" accept="image/*" capture="environment" class="mp-item-photo-input"
                     data-mp-section="${section.id}" data-mp-item="${item.id}" ${disableItem ? "disabled" : ""} />
            </label>
          `;
        }
        if (photoBase64) {
          actionsHtml += `
            <div class="mp-item-photo-preview">
              <img src="${photoBase64}" class="mp-item-photo-thumbnail" alt="Foto da falha" />
            </div>
          `;
        }
        actionsHtml += `</div>`;
        itemHtml += actionsHtml;
      }

      itemWrapper.innerHTML = itemHtml;
      article.appendChild(itemWrapper);
    });

    el.mpChecklistSections.appendChild(article);
    const hasCriticalReproved = section.itens.some((i) => i.critico && current.checklists?.[section.id]?.[i.id] === "nao");
    sectionEnabled = sectionEnabled && isComplete && !hasCriticalReproved;
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

function setMontagemChecklistPhoto(sectionId, itemId, photoBase64) {
  if (!state.montagemPostesAtual) return;
  const current = { ...state.montagemPostesAtual };
  if (!current.checklists) current.checklists = {};
  if (!current.checklists[sectionId]) current.checklists[sectionId] = {};

  current.checklists[sectionId][itemId + "_photo"] = photoBase64;
  state.montagemPostesAtual = current;
  upsertMontagemPoste(current);
  syncMontagemPosteToApi(current, "CHECKLIST", { silent: true }).catch(() => {});
  renderMontagemChecklistSections();
}

function setMontagemChecklistAnswer(sectionId, itemId, value) {
  if (!state.montagemPostesAtual) return;
  const current = { ...state.montagemPostesAtual };
  if (!current.checklists) current.checklists = {};
  if (!current.checklists[sectionId]) current.checklists[sectionId] = {};

  const wasComplete = isChecklistSectionComplete(sectionId, current.checklists);

  current.checklists[sectionId][itemId] = value;

  if (value === "sim") {
    delete current.checklists[sectionId][itemId + "_photo"];
  }

  const sections = getMontagemChecklistSections(current.modelo || "");
  const section = sections.find((s) => s.id === sectionId);
  const item = section?.itens.find((i) => i.id === itemId);

  if (value === "nao") {
    if (item?.critico) {
      showMsgBox("segregar poste", "error");
    }
    if (item?.codigoFalha) {
      current.statusMontagem = "R";
      current.motivoRecusa = item.codigoFalha;
    }
  }

  const isNowComplete = isChecklistSectionComplete(sectionId, current.checklists);

  state.montagemPostesAtual = current;
  upsertMontagemPoste(current);
  syncMontagemPosteToApi(current, "CHECKLIST", { silent: true }).catch(() => {});

  const hasCriticalReproved = section?.itens.some((i) => i.critico && current.checklists[sectionId][i.id] === "nao");

  if (!wasComplete && isNowComplete) {
    if (hasCriticalReproved) {
      showMsgBox(`A inspeção de ${section?.titulo || sectionId} contém falhas críticas. Próximas seções bloqueadas.`, "error");
    } else {
      showMsgBox(`Inspeção de ${section?.titulo || sectionId} concluída!`, "success");
    }
  }

  renderMontagemChecklistSections();
  renderMontagemStatusUI();
}

function renderMontagemStatusUI() {
  const poste = state.montagemPostesAtual;
  if (!poste || !el.mpStatusButtons) return;

  const status = poste.statusMontagem || "";
  const isFinalizado = !!poste.finalizadoEm;

  el.mpStatusButtons.querySelectorAll("[data-mp-status]").forEach((btn) => {
    if (!(btn instanceof HTMLElement)) return;
    btn.classList.toggle("active", btn.dataset.mpStatus === status);
    btn.disabled = isFinalizado;
  });

  if (el.mpMotivoWrap && el.mpMotivoSelect) {
    const precisaMotivo = status === "R" || status === "RR";
    el.mpMotivoWrap.classList.toggle("hidden", !precisaMotivo);
    el.mpMotivoSelect.value = poste.motivoRecusa || "";
    el.mpMotivoSelect.disabled = !precisaMotivo || isFinalizado;
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

function showMontagemResumoModal(poste, options = {}) {
  if (!el.mpResumoModal || !el.mpResumoBody || !el.mpResumoOkBtn) return;
  const onClose = typeof options.onClose === "function" ? options.onClose : null;
  const statusLabel = montagemStatusLabel(poste.statusMontagem || "");
  const motivo = poste.statusMontagem === "A" ? "-" : getMotivoRecusaLabel(poste.motivoRecusa || "");
  const dtMontagem = formatDateTime(poste.finalizadoEm || "");

  // Calcular o tempo decorrido de inspeção e montagem
  let tempoGasto = "-";
  if (poste.inicioInspecaoMontagem && poste.finalizadoEm) {
    const tInicio = new Date(poste.inicioInspecaoMontagem);
    const tFim = new Date(poste.finalizadoEm);
    const diffMs = tFim - tInicio;
    if (diffMs > 0) {
      const diffSecs = Math.floor(diffMs / 1000);
      const mins = Math.floor(diffSecs / 60);
      const secs = diffSecs % 60;
      tempoGasto = `${mins}m ${secs}s`;
    }
  }

  el.mpResumoBody.innerHTML = `
    <div><strong>Montador:</strong> ${escapeHtml(state.authUser?.name || "-")}</div>
    <div><strong>Setor:</strong> ${escapeHtml(poste.setor || "-")}</div>
    <div><strong>Poste Modelo:</strong> ${escapeHtml(poste.modelo || "-")}</div>
    <div><strong>Produto:</strong> ${escapeHtml(poste.codigoProduto || "-")} ${poste.descricaoPoste ? "- " + escapeHtml(poste.descricaoPoste) : ""}</div>
    <div><strong>Forma:</strong> ${escapeHtml(poste.formaNumero || "-")}</div>
    <div><strong>Dt. Produção:</strong> ${fmtDate(poste.dataFabricacao || "") || "-"}</div>
    <div><strong>Dt. Montagem:</strong> ${dtMontagem}</div>
    <div><strong>Tempo de Inspeção:</strong> <span style="color:#e8762a; font-weight:700;">${tempoGasto}</span></div>
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
    if (onClose) onClose();
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

  let tempoGasto = "-";
  if (poste.inicioInspecaoMontagem && poste.finalizadoEm) {
    const tInicio = new Date(poste.inicioInspecaoMontagem);
    const tFim = new Date(poste.finalizadoEm);
    const diffMs = tFim - tInicio;
    if (diffMs > 0) {
      const diffSecs = Math.floor(diffMs / 1000);
      const mins = Math.floor(diffSecs / 60);
      const secs = diffSecs % 60;
      tempoGasto = `${mins}m ${secs}s`;
    }
  }

  el.mpDetalheHeader.innerHTML = `
    <div style="margin-bottom: 15px; display: flex;">
      <button class="btn btn-back" type="button" onclick="navigateBack()" style="flex: 1;">← Voltar para a lista</button>
    </div>
    <div><strong>Forma:</strong> ${poste.formaNumero || "-"}</div>
    <div><strong>Modelo:</strong> ${poste.modelo || "-"}</div>
    <div><strong>Produto:</strong> ${escapeHtml(poste.codigoProduto || "-")} ${poste.descricaoPoste ? "- " + escapeHtml(poste.descricaoPoste) : ""}</div>
    <div><strong>Setor:</strong> ${poste.setor || "-"}</div>
    <div><strong>Data Produção:</strong> ${fmtDate(poste.dataFabricacao || "") || "-"}</div>
    <div><strong>Início inspeção/montagem:</strong> ${formatDateTime(poste.inicioInspecaoMontagem || "")}</div>
    <div><strong>Finalizado em:</strong> ${poste.finalizadoEm ? formatDateTime(poste.finalizadoEm) : "-"}</div>
    <div><strong>Tempo de Inspeção:</strong> <span style="color:#e8762a; font-weight:700;">${tempoGasto}</span></div>
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
  const recordId = posteBase.recordId;
  const dataFabricacao = posteBase.dataFabricacao;
  const setor = posteBase.setor;
  const formaNumero = posteBase.formaNumero;
  const key = [recordId, dataFabricacao, setor, formaNumero].join("||");
  const now = nowIso();

  let atual = null;
  if (hasMontagemApiConfigured()) {
    try {
      const { data, error } = await supabaseClient.from('montagem_poste').select('*').eq('id', key).maybeSingle();
      if (!error && data) {
        atual = {
          key: data.id,
          recordId: data.record_id || "",
          dataFabricacao: data.data_fabricacao || "",
          setor: data.setor || "",
          formaNumero: data.forma_numero || "",
          modelo: data.modelo || "",
          codigoPoste: data.codigo_poste || "",
          descricaoPoste: data.descricao_poste || "",
          codigoProduto: data.codigo_produto || "",
          statusMontagem: data.status_montagem || "",
          motivoRecusa: data.motivo_recusa || "",
          etapa: data.etapa || "",
          inicioInspecaoMontagem: data.inicio_inspecao_montagem || "",
          finalizadoEm: data.finalizado_em || "",
          checklists: data.checklists || {},
          observacoesMontagem: data.observacoes_montagem || "",
          montadorNome: data.montador_nome || ""
        };
      }
    } catch (err) {
      console.warn("Erro ao buscar montagem_poste específico do Supabase:", err);
    }
  }

  const merged = {
    key,
    recordId: posteBase.recordId || "",
    dataFabricacao: posteBase.dataFabricacao || "",
    setor: posteBase.setor || "",
    formaNumero: posteBase.formaNumero || "",
    modelo: posteBase.modelo || "",
    codigoPoste: posteBase.codigoPoste || atual?.codigoPoste || getPosteFieldsForForma(posteBase.formaNumero, posteBase.setor).codigoPoste,
    descricaoPoste: posteBase.descricaoPoste || atual?.descricaoPoste || getPosteFieldsForForma(posteBase.formaNumero, posteBase.setor).descricaoPoste,
    codigoProduto: posteBase.codigoProduto || atual?.codigoProduto || getPosteFieldsForForma(posteBase.formaNumero, posteBase.setor).codigoProduto,
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

  const sections = getMontagemChecklistSections(poste.modelo || "");
  const allSectionsOk = sections.every((section) =>
    isChecklistSectionComplete(section.id, poste.checklists || {})
  );

  if (!allSectionsOk) {
    showMsgBox("Responda todos os itens (Aprovado/Reprovado) de todas as seções antes de finalizar.", "error");
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
  const syncResult = await syncMontagemPosteToApi(updated, "FINALIZACAO", { silent: false });
  const finalEntry = {
    ...updated,
    pendingSync: !syncResult.synced
  };
  upsertMontagemPoste(finalEntry);
  state.montagemPostesAtual = finalEntry;

  renderMontagemPosteDetalhe();
  showMontagemResumoModal({
    ...finalEntry,
    resumoSync: syncResult.synced ? "Sincronizado" : "Salvo localmente"
  }, {
    onClose: async () => {
      setMode("MONTAGEM_POSTES");
      await renderMontagemPostesLiberados();
      if (el.mpFormaFiltro) {
        el.mpFormaFiltro.value = "";
      }
      filtrarMontagemTabela();
    }
  });
}

function filtrarMontagemTabela() {
  const texto = (el.mpFormaFiltro?.value || "").trim().toUpperCase();
  Array.from(el.mpLiberadosBody?.querySelectorAll("tr[data-forma-numero]") || []).forEach((tr) => {
    const forma = (tr.dataset.formaNumero || "").toUpperCase();
    tr.style.display = !texto || forma.includes(texto) ? "" : "none";
  });
}

async function syncMontagemPostesFromApi(filtroData, modoCarga, setor) {
  if (!hasMontagemApiConfigured()) return;
  try {
    let query = supabaseClient.from('montagem_poste').select('*');
    if (setor) query = query.eq('setor', setor);
    if (modoCarga === "data" && filtroData) query = query.eq('data_fabricacao', filtroData);

    const { data, error } = await query;
    if (error) throw error;

    if (Array.isArray(data) && data.length > 0) {
      const db = readMontagemPostesDb();
      data.forEach(row => {
        const key = row.id;
        db.postes[key] = {
          key: row.id,
          recordId: row.record_id || "",
          dataFabricacao: row.data_fabricacao || "",
          setor: row.setor || "",
          formaNumero: row.forma_numero || "",
          modelo: row.modelo || "",
          codigoPoste: row.codigo_poste || "",
          descricaoPoste: row.descricao_poste || "",
          codigoProduto: row.codigo_produto || "",
          statusMontagem: row.status_montagem || "",
          motivoRecusa: row.motivo_recusa || "",
          etapa: row.etapa || "",
          inicioInspecaoMontagem: row.inicio_inspecao_montagem || "",
          finalizadoEm: row.finalizado_em || "",
          checklists: row.checklists || {},
          observacoesMontagem: row.observacoes_montagem || "",
          montadorNome: row.montador_nome || ""
        };
      });
      writeMontagemPostesDb(db);
    }
  } catch (err) {
    console.warn("Erro ao carregar montagem_poste do Supabase:", err);
  }
}

async function renderMontagemPostesLiberados() {
  if (!el.mpLiberadosBody || !el.mpQtdItens) return;

  const filtroData = el.mpFiltroData?.value || todayYmd();
  const modoCarga = el.mpModoCarga?.value || "data";
  const setor = el.mpSetor?.value || "";

  el.mpLiberadosBody.innerHTML = "";
  if (!filtroData) {
    el.mpQtdItens.textContent = "0";
    el.mpLiberadosBody.innerHTML = '<tr><td colspan="4" class="muted">Selecione a data de produção para carregar os itens liberados.</td></tr>';
    return;
  }

  // Busca dados em tempo real diretamente do Supabase sem cache local
  let poles = await fetchPolesForDate(filtroData, setor);

  // Se o setor não for informado ("Todos (1 e 2)"), filtramos estritamente para mostrar apenas Setor 1 e Setor 2
  if (!setor) {
    poles = poles.filter((pole) => pole.setor === "Setor 1" || pole.setor === "Setor 2");
  }

  // Filtra de acordo com modoCarga
  const rows = poles.filter((record) => {
    if (modoCarga === "pendentes") {
      return !record.montagem || !record.montagem.finalizado_em;
    }
    return true;
  });

  el.mpQtdItens.textContent = String(rows.length);

  if (!rows.length) {
    el.mpLiberadosBody.innerHTML = '<tr><td colspan="4" class="muted">Nenhum poste concretado ou pendente de montagem para os filtros informados.</td></tr>';
    return;
  }

  rows.forEach((record) => {
    const isFinalizado = !!record.montagem?.finalizado_em;
    const status = record.montagem?.status_montagem || "";
    const rowClass = isFinalizado ? "row-montado" : "";

    const tr = document.createElement("tr");
    if (rowClass) {
      tr.className = rowClass;
    }
    tr.dataset.recordId = record.recordId;
    tr.dataset.dataFabricacao = record.dataFabricacao;
    tr.dataset.setor = record.setor;
    tr.dataset.formaNumero = record.formaNumero;
    tr.dataset.modelo = record.modelo;
    tr.dataset.codigoPoste = record.codigoPoste || "";
    tr.dataset.descricaoPoste = record.descricaoPoste || "";
    tr.dataset.codigoProduto = record.codigoProduto || "";

    // Armazena o registro de montagem completo serializado em JSON para uso posterior ao clicar
    tr.dataset.montagemRaw = record.montagem ? JSON.stringify(record.montagem) : "";

    let acaoContent = "";
    if (isFinalizado) {
      if (status === "A") {
        acaoContent = `<span class="status-badge status-badge-aprovado">Aprovado</span>`;
      } else if (status === "RR") {
        acaoContent = `<span class="status-badge status-badge-reprovado">Reprovado e Retrabalhado</span>`;
      } else {
        acaoContent = `<span class="status-badge status-badge-reprovado">Reprovado</span>`;
      }
    } else {
      const extraClass = record.status === 'INSPECIONADO' ? 'mp-open-btn--inspecionado' : '';
      acaoContent = `<button type="button" class="btn mp-open-btn ${extraClass}">Inspecionar / Montar Poste</button>`;
    }

    tr.innerHTML = `
      <td data-label="N Forma">${record.formaNumero || ""}</td>
      <td data-label="Modelo">${record.modelo || ""}</td>
      <td data-label="Data Prod.">${fmtDate(record.dataFabricacao || "")}</td>
      <td data-label="Ação">${acaoContent}</td>
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

  const selectedRows = Array.from(document.querySelectorAll("#insLiberadosBody tr[data-record-id]")).filter((linha) => {
    const status = linha.querySelector("select[data-ins-status]")?.value || "";
    return Boolean(status);
  });

  if (!selectedRows.length) {
    showMsgBox("Preencha o Status em ao menos uma forma para salvar a inspeção.", "error");
    return;
  }

  const lockPayloadRows = selectedRows
    .map((tr) => ({
      recordId: tr?.dataset.recordId || "",
      status: tr?.querySelector("select[data-ins-status]")?.value || "",
      codigo: tr?.querySelector("select[data-ins-code]")?.value || "",
      observacoes: ""
    }))
    .sort((a, b) => a.recordId.localeCompare(b.recordId));

  const lockToken = payloadToken({
    action: "salvar_inspecao_lote",
    colaborador,
    observacaoGlobal,
    fotos: state.insPhotos.map((photo) => photo.id || photo.name || ""),
    rows: lockPayloadRows
  });

  if (state.submitLocks.inspecao && state.submitLocks.inspecao === lockToken) {
    setSyncStatus("warn", "Envio de inspeção já realizado para este mesmo conteúdo.");
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
      const recordId = tr?.dataset.recordId;
      const dataFabricacao = tr?.dataset.dataFabricacao || el.insFiltroData.value || todayYmd();
      const setor = tr?.dataset.setor || state.activeInsSector || "";
      const formaNumero = normalizeUpper(tr?.dataset.formaNumero || "");
      const modelo = tr?.dataset.modelo || "";
      const status = tr?.querySelector("select[data-ins-status]")?.value || "";
      const codigo = tr?.querySelector("select[data-ins-code]")?.value || "";
      const codigoFinal = status === "A" ? "" : codigo;

      if (!recordId || !status) {
        showMsgBox("Cada forma selecionada deve ter Status preenchido.", "error");
        return;
      }

      if (status !== "A" && !codigoFinal) {
        showMsgBox("Para status R ou RR, preencha o Código (A-M).", "error");
        return;
      }

      // 1. Persistência direta no Supabase (montagem_poste)
      const key = [recordId, dataFabricacao, setor, formaNumero, 'INSPECAO'].join("||");
      const montagemPayload = {
        key: key,
        recordId: recordId,
        dataFabricacao: dataFabricacao,
        setor: setor,
        formaNumero: formaNumero,
        modelo: modelo,
        codigoPoste: tr?.dataset.codigoPoste || "",
        descricaoPoste: tr?.dataset.descricaoPoste || "",
        codigoProduto: tr?.dataset.codigoProduto || "",
        statusMontagem: status,
        motivoRecusa: codigoFinal,
        etapa: "INSPECAO",
        inicioInspecaoMontagem: state.insInicioLocal || nowIso(),
        finalizadoEm: nowIso(),
        checklists: { global_photos: state.insPhotos.map(p => p.data || p.url || "") },
        observacoesMontagem: observacaoGlobal,
        montadorNome: colaborador
      };

      const apiResult = await postToMontagemApi("salvar_montagem_poste", montagemPayload);
      const isSynced = apiResult && apiResult.ok;

      // 2. Eventos e logs locais para compatibilidade de visualização
      let record = db.records.find((item) => item.id === recordId);
      if (!record) {
        record = {
          id: recordId,
          dataFabricacao,
          setor,
          formaNumero,
          modelo,
          codigoPoste: tr?.dataset.codigoPoste || "",
          descricaoPoste: tr?.dataset.descricaoPoste || "",
          codigoProduto: tr?.dataset.codigoProduto || "",
          createdAt: nowIso(),
          updatedAt: nowIso(),
          liberacao: { status: "1", statusFlags: statusFlagsFromCode("1"), colaborador: "", observacoes: "", fotos: [], timestamp: nowIso() },
          inspecoes: []
        };
      }
      const inspecao = {
        id: uuid(),
        tipo: "INSPECAO",
        colaborador,
        status,
        codigos: [codigoFinal],
        observacoes: observacaoGlobal,
        fotos: [...state.insPhotos],
        timestamp: nowIso(),
        pendingSync: !isSynced
      };
      record.inspecoes.push(inspecao);
      record.updatedAt = nowIso();
      upsertRecord(db, record);

      addEvent(db, {
        id: uuid(),
        recordId: record.id,
        etapa: "INSPECAO",
        status,
        colaborador,
        setor: record.setor,
        formaNumero: record.formaNumero,
        codigoPoste: record.codigoPoste,
        descricaoPoste: record.descricaoPoste,
        codigoProduto: record.codigoProduto,
        dataFabricacao: record.dataFabricacao,
        codigos: [codigoFinal],
        observacoes: observacaoGlobal,
        fotosCount: state.insPhotos.length,
        timestamp: nowIso(),
        pendingSync: !isSynced
      });

      inspecaoEntries.push({
        recordId: record.id,
        dataFabricacao: record.dataFabricacao,
        setor: record.setor,
        formaNumero: record.formaNumero,
        modelo: record.modelo,
        codigoPoste: record.codigoPoste,
        descricaoPoste: record.descricaoPoste,
        codigoProduto: record.codigoProduto,
        tipo: "INSPECAO",
        status,
        codigo: codigoFinal,
        colaborador,
        observacoes: observacaoGlobal,
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

    await renderInspecaoLiberados();
    renderLiberacaoDual();
    renderHistorico();

    const counts = { A: 0, R: 0, RR: 0 };
    inspecaoEntries.forEach((e) => { if (e.status in counts) counts[e.status]++; });

    // Salva na tabela producao para legado (gráficos e histórico do dashboard)
    const apiResult = await postToApi("salvar_inspecao_lote", { entries: inspecaoEntries });
    if (apiResult.ok) {
      setSyncStatus("ok", `Inspeção sincronizada com sucesso (${apiResult.updated || saved} atualizações).`);
      showInspecaoModal(counts, "ok");
    } else {
      setSyncStatus("ok", `Inspeção salva online.`);
      showInspecaoModal(counts, "ok");
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

  // Considerar APENAS eventos vindos do Supabase API
  const apiEventsOnly = db.events.filter(ev => ev.isFromApi === true);

  // Aggregate events by date
  const prodByDate = {};
  const insByDate = {};
  const insStatusTotal = { A: 0, R: 0, RR: 0 };
  const prodS1ByDate = {};
  const prodS2ByDate = {};
  const prodS3ByDate = {};
  const prodS4ByDate = {};
  const insS1 = { A: 0, R: 0, RR: 0 };
  const insS2 = { A: 0, R: 0, RR: 0 };
  const ncCount = {};

  apiEventsOnly.forEach((ev) => {
    const etapa = (ev.etapa || "").toUpperCase();
    const d = ev.dataFabricacao || "";
    const setor = (ev.setor || "").toLowerCase();
    const isS1 = setor.includes("1");
    const isS2 = setor.includes("2");
    const isS3 = setor.includes("3");
    const isS4 = setor.includes("4");

    if (etapa === "LIBERACAO") {
      prodByDate[d] = (prodByDate[d] || 0) + 1;
      if (isS1) prodS1ByDate[d] = (prodS1ByDate[d] || 0) + 1;
      else if (isS2) prodS2ByDate[d] = (prodS2ByDate[d] || 0) + 1;
      else if (isS3) prodS3ByDate[d] = (prodS3ByDate[d] || 0) + 1;
      else if (isS4) prodS4ByDate[d] = (prodS4ByDate[d] || 0) + 1;
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

  // Cadência de Produção (Tempo Médio por Setor)
  const targetDateForCadence = selectedDate || todayYmd();
  const cadenceEvents = apiEventsOnly.filter(ev =>
    (ev.etapa || "").toUpperCase() === "LIBERACAO" &&
    ev.dataFabricacao === targetDateForCadence &&
    ev.timestamp
  );

  const cadenceBySector = { "S1": [], "S2": [], "S3": [], "S4": [] };
  cadenceEvents.forEach(ev => {
    const s = (ev.setor || "").toLowerCase();
    if (s.includes("1")) cadenceBySector["S1"].push(ev.timestamp);
    if (s.includes("2")) cadenceBySector["S2"].push(ev.timestamp);
    if (s.includes("3")) cadenceBySector["S3"].push(ev.timestamp);
    if (s.includes("4")) cadenceBySector["S4"].push(ev.timestamp);
  });

  Object.keys(cadenceBySector).forEach(s => {
    const parsedTimes = cadenceBySector[s]
      .map(ts => new Date(ts).getTime())
      .filter(t => !isNaN(t))
      .sort((a, b) => a - b);

    let txt = "N/A";
    if (parsedTimes.length >= 2) {
      const validDiffs = [];
      for (let i = 1; i < parsedTimes.length; i++) {
        const diffMs = parsedTimes[i] - parsedTimes[i - 1];
        // Desconsidera intervalos maiores que 1 hora (3600000 ms), por exemplo almoço ou intervalos de turno
        // E também ignora diffs de 0 ms que ocorrem em cadastros simultâneos/duplicados
        if (diffMs > 0 && diffMs <= 3600000) {
          validDiffs.push(diffMs);
        }
      }

      if (validDiffs.length > 0) {
        const sumMs = validDiffs.reduce((sum, d) => sum + d, 0);
        const avgMs = sumMs / validDiffs.length;
        const avgMin = Math.round(avgMs / 60000);
        txt = avgMin > 0 ? avgMin + " min" : "< 1 min";
      } else {
        txt = "N/A (>1h int)";
      }
    } else if (parsedTimes.length === 1) {
      txt = "N/A (1 item)";
    }
    setTxt("dbCad" + s, txt);
  });

  // Last 7 working days (excluding weekends), ordered from newest to oldest
  const allDates = [];
  const baseDate = selectedDate ? new Date(selectedDate + "T12:00:00") : new Date();
  let d = new Date(baseDate);
  let count = 0;
  while (count < 7) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Dom, 6 = Sáb
      allDates.push(d.toISOString().split("T")[0]);
      count++;
    }
    d.setDate(d.getDate() - 1);
  }

  const labels = allDates.map((d) => d.split("-").reverse().join("/"));

  // Destroy old charts to prevent memory leaks and clean references
  destroyChart("chartProd");
  destroyChart("chartIns");
  destroyChart("chartProdSetor");
  destroyChart("chartInsSetor");
  destroyChart("chartNc");

  // Re-create chartProdTotalDia (Total Production of the Day)
  destroyChart("chartProdTotalDia");
  const ctxProdTotal = document.getElementById("chartProdTotalDia");
  if (ctxProdTotal && typeof Chart !== "undefined") {
    chartInstances["chartProdTotalDia"] = new Chart(ctxProdTotal, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Total Produzido",
            data: allDates.map((d) => prodByDate[d] || 0),
            backgroundColor: "rgba(30, 64, 175, 0.85)",
            borderColor: "#1e40af",
            borderWidth: 2,
            borderRadius: 6,
            barPercentage: 0.65
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top", labels: { usePointStyle: true, boxWidth: 8, font: { weight: 'bold' } } },
          tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 12 }
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1, precision: 0 } }
        }
      }
    });
  }

  // Re-create chartProdSetores (Production separated by each sector)
  destroyChart("chartProdSetores");
  const ctxProdSetores = document.getElementById("chartProdSetores");
  if (ctxProdSetores && typeof Chart !== "undefined") {
    chartInstances["chartProdSetores"] = new Chart(ctxProdSetores, {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: "Setor 1", data: allDates.map((d) => prodS1ByDate[d] || 0), backgroundColor: "rgba(59, 130, 246, 0.85)", borderRadius: 4 },
          { label: "Setor 2", data: allDates.map((d) => prodS2ByDate[d] || 0), backgroundColor: "rgba(16, 185, 129, 0.85)", borderRadius: 4 },
          { label: "Setor 3", data: allDates.map((d) => prodS3ByDate[d] || 0), backgroundColor: "rgba(139, 92, 246, 0.85)", borderRadius: 4 },
          { label: "Setor 4", data: allDates.map((d) => prodS4ByDate[d] || 0), backgroundColor: "rgba(249, 115, 22, 0.85)", borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top", labels: { usePointStyle: true, boxWidth: 8, font: { weight: 'bold' } } },
          tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 12 }
        },
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1, precision: 0 } }
        }
      }
    });
  }

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
  <span style="color:#059669;font-weight:600;font-size:.78rem;min-width:50px">✔ ${ins}</span>
  <span style="color:#dc2626;font-weight:600;font-size:.78rem;min-width:46px">✘ ${rj}</span>
</div>`;
  }).join("");
}

async function carregarDadosGlobaisDashboard() {
  if (!hasApiConfigured()) return;

  const dbDataEl = document.getElementById("dbData");
  const selectedDate = dbDataEl ? dbDataEl.value : todayYmd();

  setSyncStatus("pending", "Atualizando dados globais do dashboard...");

  // Calcula o intervalo de 7 dias correspondente ao que é exibido no Dashboard
  const baseDate = selectedDate ? new Date(selectedDate + "T12:00:00") : new Date();
  const startDate = new Date(baseDate);
  startDate.setDate(baseDate.getDate() - 6);
  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = baseDate.toISOString().split("T")[0];

  try {
    let allRows = [];
    let page = 0;
    const pageSize = 1000;
    let keepFetching = true;

    while (keepFetching) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data: rows, error } = await supabaseClient
        .from('producao')
        .select('*')
        .gte('data_fabricacao', startDateStr)
        .lte('data_fabricacao', endDateStr)
        .order('data_fabricacao', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (rows && rows.length > 0) {
        allRows = allRows.concat(rows);
      }

      if (!rows || rows.length < pageSize || page >= 10) {
        keepFetching = false;
      } else {
        page++;
      }
    }

    const db = readDb();

    const apiEvents = allRows.map(r => ({
      etapa: r.status === 'LIBERADO' ? 'LIBERACAO' : 'INSPECAO',
      status: r.status,
      dataFabricacao: r.data_fabricacao,
      setor: r.setor,
      formaNumero: r.forma,
      colaborador: r.colaborador,
      timestamp: r.data_hora || r.updated_at,
      codigos: r.ins_codigo ? [r.ins_codigo] : [],
      observacoes: r.ins_observacoes || "",
      isFromApi: true
    }));

    db.events = db.events.filter(ev => !ev.isFromApi && ev.pendingSync === true).concat(apiEvents);
    writeDb(db);

    renderDashboardCharts();
    setSyncStatus("ok", "Dashboard global atualizado com dados da nuvem.");
  } catch (err) {
    console.error("Erro ao carregar dados globais:", err);
    setSyncStatus("error", "Erro ao carregar dados globais do dashboard.");
  }
}

function renderDashboardStats() {
  const db = readDb();
  const dataInput = document.getElementById("insDashData");
  const selectedDate = dataInput ? dataInput.value : "";

  // Considerar APENAS eventos vindos do Supabase API
  const apiEventsOnly = db.events.filter(ev => ev.isFromApi === true);

  // Aggregate inspection events from local DB
  // Group by dataFabricacao, count statuses
  const byDate = {};
  apiEventsOnly.forEach((ev) => {
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
    .filter((event) => !forma || event.formaNumero === forma);

  if (hasApiConfigured() && data) {
    try {
      const [setor1, setor2] = await Promise.all([
        getRowsForDashboard(data, "Setor 1"),
        getRowsForDashboard(data, "Setor 2")
      ]);
      const apiRows = [...(setor1.rows || []), ...(setor2.rows || [])];
      const apiEvents = [];
      apiRows.forEach((row) => {
        const formaNumero = String(row.forma_numero || "");
        const setor = String(row.setor || "");
        const baseTs = row.data_hora || row.updated_at || nowIso();

        // Evitamos duplicar eventos que já existem localmente (mesma forma, setor e etapa)
        const existsLocally = (etapa) => rows.some(e => e.etapa === etapa && e.formaNumero === formaNumero && e.setor === setor);

        if (row.status === "LIBERADO" && !existsLocally("LIBERACAO")) {
          apiEvents.push({
            etapa: "LIBERACAO",
            status: "LIBERADO",
            dataFabricacao: String(row.data_fabricacao || data),
            setor,
            formaNumero,
            colaborador: String(row.colaborador || ""),
            timestamp: baseTs,
            fotosCount: 0,
            codigos: [],
            observacoes: "",
            tipoConcreto: row.tipo_concreto || "",
            isFromApi: true
          });
        }
        if (row.status === "INSPECIONADO" && !existsLocally("INSPECAO")) {
          apiEvents.push({
            etapa: "INSPECAO",
            status: "INSPECIONADO",
            dataFabricacao: String(row.data_fabricacao || data),
            setor,
            formaNumero,
            colaborador: String(row.colaborador || ""),
            timestamp: row.updated_at || baseTs,
            fotosCount: 0,
            codigos: row.ins_codigo ? [String(row.ins_codigo)] : [],
            observacoes: String(row.ins_observacoes || ""),
            tipoConcreto: row.tipo_concreto || "",
            isFromApi: true
          });
        }
      });
      rows = [...rows, ...apiEvents];
    } catch (e) {
      console.warn("Falha ao buscar histórico da API:", e);
    }
  }

  rows.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

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
        <div class="item-meta">${evt.dataFabricacao} • ${evt.setor} • ${evt.formaNumero} ${evt.tipoConcreto ? ` • <span class="tag-concreto">${evt.tipoConcreto}</span>` : ""}</div>
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
        let query = supabaseClient.from('producao').select('*').eq('setor', setor);
        if (data) query = query.eq('data_fabricacao', data);

        const { data: qData, error } = await query;
        if (!error && Array.isArray(qData)) {
          let rows = qData;
          if (modoCarga === "pendentes") rows = rows.filter((r) => r.status !== 'INSPECIONADO');
          rows.forEach((r) => allRows.push({ ...r, _setor: setor, forma_numero: r.forma, lib_timestamp: r.data_hora }));
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
          _setor: setor,
          tipo_concreto: r.concretoTipo || ""
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
      const tipoConcreto = r.tipo_concreto || "";
      const obsValue = saved.obs || tipoConcreto;
      return `<tr data-acmp-forma="${forma}" data-acmp-setor="${setor}">
        <td>${forma}</td>
        <td>${r.modelo || ""}</td>
        <td>${formatTime(r.lib_timestamp)}</td>
        <td><input type="text" class="acmp-input" data-acmp-traco placeholder="" value="${saved.traco || ""}"></td>
        <td><input type="text" class="acmp-input" data-acmp-obs placeholder="" value="${obsValue}"></td>
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
    let query = supabaseClient.from('producao').select('*').eq('setor', setor).eq('data_fabricacao', data);
    const { data: rows, error } = await query;
    if (!error && Array.isArray(rows)) {
      return {
        rows: rows.map(r => ({
          ...r,
          forma_numero: r.forma,
          liberacao_status: r.status === 'LIBERADO' ? '1' : '0'
        })),
        source: "api"
      };
    }
  } catch {
    // Fallback local em caso de falha temporária da API.
  }

  return { rows: getRowsFromLocalForDashboard(data, setor), source: "local" };
}

function renderDashboardConcretagem({ setor1, setor2, setor3, setor4, source, data }) {
  const r1 = Array.isArray(setor1) ? setor1 : [];
  const r2 = Array.isArray(setor2) ? setor2 : [];
  const r3 = Array.isArray(setor3) ? setor3 : [];
  const r4 = Array.isArray(setor4) ? setor4 : [];

  const concretadasSetor1 = buildReportDataFromRows(r1).liberado;
  const concretadasSetor2 = buildReportDataFromRows(r2).liberado;
  const concretadasSetor3 = buildReportDataFromRows(r3).liberado;
  const concretadasSetor4 = buildReportDataFromRows(r4).liberado;
  const totalConcretadas = concretadasSetor1 + concretadasSetor2 + concretadasSetor3 + concretadasSetor4;

  const max = Math.max(concretadasSetor1, concretadasSetor2, concretadasSetor3, concretadasSetor4, 1);
  const width1 = Math.round((concretadasSetor1 / max) * 100);
  const width2 = Math.round((concretadasSetor2 / max) * 100);
  const width3 = Math.round((concretadasSetor3 / max) * 100);
  const width4 = Math.round((concretadasSetor4 / max) * 100);

  if (el.dashSetor1Count) el.dashSetor1Count.textContent = String(concretadasSetor1);
  if (el.dashSetor2Count) el.dashSetor2Count.textContent = String(concretadasSetor2);
  if (el.dashSetor3Count) el.dashSetor3Count.textContent = String(concretadasSetor3);
  if (el.dashSetor4Count) el.dashSetor4Count.textContent = String(concretadasSetor4);
  if (el.dashTotalCount) el.dashTotalCount.textContent = String(totalConcretadas);

  if (el.dashSetor1Meta) el.dashSetor1Meta.textContent = `${concretadasSetor1} de ${r1.length} leituras concretadas`;
  if (el.dashSetor2Meta) el.dashSetor2Meta.textContent = `${concretadasSetor2} de ${r2.length} leituras concretadas`;
  if (el.dashSetor3Meta) el.dashSetor3Meta.textContent = `${concretadasSetor3} de ${r3.length} leituras concretadas`;
  if (el.dashSetor4Meta) el.dashSetor4Meta.textContent = `${concretadasSetor4} de ${r4.length} leituras concretadas`;

  if (el.dashBarSetor1) el.dashBarSetor1.style.width = `${width1}%`;
  if (el.dashBarSetor2) el.dashBarSetor2.style.width = `${width2}%`;
  if (el.dashBarSetor3) el.dashBarSetor3.style.width = `${width3}%`;
  if (el.dashBarSetor4) el.dashBarSetor4.style.width = `${width4}%`;
  if (el.dashBarSetor1Label) el.dashBarSetor1Label.textContent = String(concretadasSetor1);
  if (el.dashBarSetor2Label) el.dashBarSetor2Label.textContent = String(concretadasSetor2);
  if (el.dashBarSetor3Label) el.dashBarSetor3Label.textContent = String(concretadasSetor3);
  if (el.dashBarSetor4Label) el.dashBarSetor4Label.textContent = String(concretadasSetor4);

  // Canvas chart for Acompanhamento
  destroyChart("chartAcmp");
  const ctxAcmp = document.getElementById("chartAcmp");
  if (ctxAcmp && typeof Chart !== "undefined") {
    chartInstances["chartAcmp"] = new Chart(ctxAcmp, {
      type: "bar",
      data: {
        labels: ["Setor 1", "Setor 2", "Setor 3", "Setor 4"],
        datasets: [{
          label: "Produzidos",
          data: [concretadasSetor1, concretadasSetor2, concretadasSetor3, concretadasSetor4],
          backgroundColor: ["#1e40af", "#059669", "#7c3aed", "#ea580c"],
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

  if (el.dashStatus) {
    el.dashStatus.textContent = `Painel atualizado para ${data} (${source === "api" ? "dados da planilha" : "cache local"}).`;
  }
}

async function carregarDashboardConcretagem() {
  if (!el.dashData?.value) {
    el.dashStatus.textContent = "Selecione uma data para atualizar o painel.";
    return;
  }

  const data = el.dashData.value;
  el.dashStatus.textContent = "Atualizando painel de concretagem...";

  const [setor1Result, setor2Result, setor3Result, setor4Result] = await Promise.all([
    getRowsForDashboard(data, "Setor 1"),
    getRowsForDashboard(data, "Setor 2"),
    getRowsForDashboard(data, "Setor 3"),
    getRowsForDashboard(data, "Setor 4")
  ]);

  const source = setor1Result.source === "api"
    && setor2Result.source === "api"
    && setor3Result.source === "api"
    && setor4Result.source === "api"
    ? "api"
    : "local";
  renderDashboardConcretagem({
    setor1: setor1Result.rows,
    setor2: setor2Result.rows,
    setor3: setor3Result.rows,
    setor4: setor4Result.rows,
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
      let query = supabaseClient.from('producao').select('*').eq('setor', setor).eq('data_fabricacao', data);
      const { data: rows, error } = await query;

      if (!error && Array.isArray(rows)) {
        const mappedRows = rows.map(r => ({
          forma_numero: r.forma,
          modelo: r.modelo,
          liberacao_status: "1"
        }));
        renderRelatorioSetor({ data, setor, encarregado, rows: mappedRows });
        setSyncStatus("ok", `Relatório do ${setor} em ${data} gerado pela nuvem.`);
        return;
      }
    } catch {
      setSyncStatus("warn", "Falha ao buscar relatório. Gerando pelo cache local.");
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

  // Liberar explicitamente "USUARIOS" para o usuário Ricardo
  const userName = String(state.authUser?.name || "").trim().toLowerCase();
  if (userName === "ricardo") {
    next.add("USUARIOS");
  }

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
      roleLabel: getRoleConfig(parsed.role).label,
      setor: parsed.setor || "Todos"
    };
  } catch {
    return null;
  }
}

function saveAuthSession(auth) {
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ name: auth.name, role: auth.role, setor: auth.setor || "Todos" }));
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
  const result = await postToApi("listar_usuarios", {});
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
  return postToApi("autenticar_usuario", { name, password });
}

async function createUserInApi(name, login, role, password, setor) {
  return postToApi("criar_usuario", { name, login, role, password, setor });
}

async function deleteUserInApi(id) {
  return postToApi("excluir_usuario", { id });
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
  el.ugListaBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#64748b;">Carregando usuários...</td></tr>';
  const result = await listUsersFromApi({ silent: true });
  if (!result.ok) {
    el.ugListaBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#991b1b;">Falha ao carregar usuários da planilha.</td></tr>';
    return;
  }

  const users = result.users;
  if (users.length === 0) {
    el.ugListaBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#64748b;">Nenhum usuário cadastrado.</td></tr>';
    return;
  }
  el.ugListaBody.innerHTML = users.map((u) => `
    <tr>
      <td style="text-align:center">${escapeHtml(u.name)}</td>
      <td style="text-align:center">${escapeHtml(u.id)}</td>
      <td style="text-align:center">${escapeHtml(u.setor || "Todos")}</td>
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

function setPaFeedback(message) {
  if (!el.paFeedback) return;
  if (!message) {
    el.paFeedback.classList.add("hidden");
    el.paFeedback.textContent = "";
    return;
  }
  el.paFeedback.textContent = message;
  el.paFeedback.classList.remove("hidden");
}

async function salvarNovaSenhaPrimeiroAcesso() {
  const novaSenha = (el.paNovaSenha?.value || "").trim();
  const confirmarSenha = (el.paConfirmarSenha?.value || "").trim();

  if (!state.paTempUser) {
    setPaFeedback("Erro: Nenhum usuário em sessão temporária.");
    return;
  }

  if (novaSenha.length < 4) {
    setPaFeedback("A nova senha deve ter pelo menos 4 caracteres.");
    return;
  }

  if (novaSenha !== confirmarSenha) {
    setPaFeedback("As senhas não coincidem.");
    return;
  }

  try {
    setPaFeedback("Salvando nova senha...");
    const res = await postToApi("alterar_senha_primeiro_acesso", {
      id: state.paTempUser.id,
      senha: novaSenha
    });

    if (!res.ok) {
      setPaFeedback(res.error || "Erro ao salvar a nova senha.");
      return;
    }

    // Ocultar modal de primeiro acesso
    if (el.primeiroAcessoModal) {
      el.primeiroAcessoModal.classList.remove("modal-visible");
    }

    const user = state.paTempUser;
    state.paTempUser = null;

    // Login definitivo
    state.authUser = {
      name: user.name,
      role: user.role,
      roleLabel: getRoleConfig(user.role).label,
      setor: user.setor || "Todos"
    };

    setAccessByRole(user.role);
    saveAuthSession(state.authUser);
    setLoginFeedback("");
    unlockAppAfterLogin();
    applyRoleVisibility();
    ensurePostLoginBootstrap();
    setMode("HUB");
    setSyncStatus("ok", `Acesso liberado para ${state.authUser.roleLabel}.`);

  } catch (err) {
    console.error(err);
    setPaFeedback("Erro inesperado: " + err.message);
  }
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
    PROD_ANALISE: "navProdAnalise",
    LIBERACAO: "hubLiberacao",
      LIBERACAO_S1: "hubLiberacaoS1",
      LIBERACAO_S2: "hubLiberacaoS2",
      LIBERACAO_S3: "hubLiberacaoS3",
      LIBERACAO_S4: "hubLiberacaoS4",
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

  // Also hide hub icons in the initial menu grid
  document.querySelectorAll(".hub-icon-btn").forEach((btn) => {
    const mode = btn.dataset.hubMode;
    if (mode) {
      btn.classList.toggle("hidden", !isModeAllowed(mode));
    }
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

  // Intercepta e requer troca de senha de primeiro acesso!
  if (user.primeiro_acesso) {
    state.paTempUser = user;
    if (el.primeiroAcessoModal) {
      el.paNovaSenha.value = "";
      el.paConfirmarSenha.value = "";
      setPaFeedback("");
      el.primeiroAcessoModal.classList.add("modal-visible");
    }
    return false;
  }

  state.authUser = {
    name: user.name,
    role,
    roleLabel: getRoleConfig(role).label,
    setor: user.setor || "Todos"
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
  [el.hubView, el.viewDashboard, el.viewLiberacao, el.viewInspecao, el.viewMontagemPostes, el.viewMontagemPostesDetalhe, el.viewRelatorio, el.viewHistorico, el.viewAcompanhamento, el.viewAcmpConcretagem, el.viewUsuarios, el.viewProdAnalise]
    .filter(Boolean).forEach((view) => view.classList.add("hidden"));
  if (mode === "HUB") el.hubView.classList.remove("hidden");
  if (mode === "DASHBOARD") {
    if (el.viewDashboard) el.viewDashboard.classList.remove("hidden");
    const dbDataEl = document.getElementById("dbData");
    if (dbDataEl && !dbDataEl.value) {
      dbDataEl.value = todayYmd();
    }
    renderDashboardCharts();
    carregarDadosGlobaisDashboard();
  }
  if (mode === "PROD_ANALISE") {
    if (el.viewProdAnalise) el.viewProdAnalise.classList.remove("hidden");
    const paDataInicio = document.getElementById("paDataInicio");
    const paDataFim = document.getElementById("paDataFim");
    if (paDataInicio && !paDataInicio.value) paDataInicio.value = todayYmd();
    if (paDataFim && !paDataFim.value) paDataFim.value = todayYmd();
    carregarProdutividadeConcretagem();
  }
  if (mode === "LIBERACAO" || mode.startsWith("LIBERACAO_")) {
    el.viewLiberacao.classList.remove("hidden");
    state.activeLiberacaoSector = mode;

    const isKioskSector = mode === "LIBERACAO_S1" || mode === "LIBERACAO_S2" || mode === "LIBERACAO_S3" || mode === "LIBERACAO_S4";
    if (isKioskSector) {
      document.body.classList.add("kiosk-active");
      updateKioskHeader();
    } else {
      document.body.classList.remove("kiosk-active");
    }
  }
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
  if (mode === "LIBERACAO" || mode.startsWith("LIBERACAO_")) document.body.classList.add("mode-liberacao");
  if (mode === "INSPECAO") {
    document.body.classList.add("mode-inspecao");
    if (state.authUser?.name && el.insColaborador) {
      el.insColaborador.value = state.authUser.name;
    }
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
    PROD_ANALISE: ["navProdAnalise", "Produtividade"],
    LIBERACAO: ["hubLiberacao", "Produção / Liberação"],
      LIBERACAO_S1: ["hubLiberacaoS1", "Produção Setor 1"],
      LIBERACAO_S2: ["hubLiberacaoS2", "Produção Setor 2"],
      LIBERACAO_S3: ["hubLiberacaoS3", "Produção Setor 3"],
      LIBERACAO_S4: ["hubLiberacaoS4", "Produção Setor 4"],
    INSPECAO: ["hubInspecao", "Inspeção Setor 3 e 4"],
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

  if (el.concretoTipoCancelBtn) {
    el.concretoTipoCancelBtn.addEventListener("click", closeConcreteTypePopup);
  }

  if (el.concretoTipoModal) {
    el.concretoTipoModal.addEventListener("click", (event) => {
      if (event.target === el.concretoTipoModal) {
        closeConcreteTypePopup();
      }
    });
  }

  if (el.ugCriarBtn) {
    el.ugCriarBtn.addEventListener("click", async () => {
      const nome = (el.ugNomeCompleto?.value || "").trim();
      const login = (el.ugLogin?.value || "").trim();
      const perfil = el.ugPerfil?.value || "MONTADOR";
      const senha = (el.ugSenha?.value || "").trim();
      const setor = el.ugSetor?.value || "Todos";

      if (!nome) { setUgFeedback("Informe o nome completo do usuário.", false); return; }
      if (!login) { setUgFeedback("Informe o login / usuário.", false); return; }
      if (!senha) { setUgFeedback("Informe a senha.", false); return; }

      const resultCreate = await createUserInApi(nome, login, perfil, senha, setor);
      if (!resultCreate.ok) {
        setUgFeedback(resultCreate.error || "Não foi possível criar o usuário.", false);
        return;
      }

      if (el.ugNomeCompleto) el.ugNomeCompleto.value = "";
      if (el.ugLogin) el.ugLogin.value = "";
      if (el.ugSenha) el.ugSenha.value = "";
      if (el.ugSetor) el.ugSetor.value = "Todos";
      if (el.ugPerfil) el.ugPerfil.value = "MONTADOR";
      await renderUsuarios();
      setUgFeedback(`Usuário "${nome}" criado com sucesso!`, true);
    });
  }

  if (el.navUsuarios) {
    el.navUsuarios.addEventListener("click", () => setMode("USUARIOS"));
  }


    if (el.hubLiberacao) {
      el.hubLiberacao.addEventListener("click", () => {
        setMode("LIBERACAO");
        if (!el.libData.value) el.libData.value = todayYmd();
        loadProgrammedFormas().then(() => renderLiberacaoDual());
      });
    }
    if (el.hubLiberacaoS1) {
      el.hubLiberacaoS1.addEventListener("click", () => {
        setMode("LIBERACAO_S1");
        if (!el.libData.value) el.libData.value = todayYmd();
        loadProgrammedFormas().then(() => renderLiberacaoDual());
      });
    }
    if (el.hubLiberacaoS2) {
      el.hubLiberacaoS2.addEventListener("click", () => {
        setMode("LIBERACAO_S2");
        if (!el.libData.value) el.libData.value = todayYmd();
        loadProgrammedFormas().then(() => renderLiberacaoDual());
      });
    }
    if (el.hubLiberacaoS3) {
      el.hubLiberacaoS3.addEventListener("click", () => {
        setMode("LIBERACAO_S3");
        if (!el.libData.value) el.libData.value = todayYmd();
        loadProgrammedFormas().then(() => renderLiberacaoDual());
      });
    }
    if (el.hubLiberacaoS4) {
      el.hubLiberacaoS4.addEventListener("click", () => {
        setMode("LIBERACAO_S4");
        if (!el.libData.value) el.libData.value = todayYmd();
        loadProgrammedFormas().then(() => renderLiberacaoDual());
      });
    }

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

  if (el.paSalvarBtn) {
    el.paSalvarBtn.addEventListener("click", salvarNovaSenhaPrimeiroAcesso);
  }

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
  el.libData.addEventListener("change", () => {
    loadProgrammedFormas().then(() => renderLiberacaoDual());
  });

  // Sincronização dos campos do Quiosque em tempo real
  if (el.libData && el.kioskLibData) {
    el.libData.addEventListener("input", () => {
      el.kioskLibData.value = el.libData.value;
      loadProgrammedFormas().then(() => renderLiberacaoDual());
    });
    el.kioskLibData.addEventListener("input", () => {
      el.libData.value = el.kioskLibData.value;
      loadProgrammedFormas().then(() => renderLiberacaoDual());
    });
  }
  if (el.libColaborador && el.kioskLibColaborador) {
    el.libColaborador.addEventListener("input", () => {
      el.kioskLibColaborador.value = el.libColaborador.value;
    });
    el.kioskLibColaborador.addEventListener("input", () => {
      el.libColaborador.value = el.kioskLibColaborador.value;
    });
  }

  // Ouvintes de evento de Programação do Quiosque
  if (el.kioskProgCheckbox) {
    el.kioskProgCheckbox.addEventListener("change", () => {
      state.programmingMode = el.kioskProgCheckbox.checked;
      if (state.programmingMode && el.kioskLibCheckbox && el.kioskLibCheckbox.checked) {
        el.kioskLibCheckbox.checked = false;
        el.kioskLibCheckbox.dispatchEvent(new Event("change"));
      }
      const toggleField = document.getElementById("kioskProgToggleField");
      if (toggleField) {
        toggleField.classList.toggle("active", state.programmingMode);
      }
      renderLiberacaoDual();
    });
  }
  if (el.kioskProgToggleField && el.kioskProgCheckbox) {
    el.kioskProgToggleField.addEventListener("click", (e) => {
      if (e.target !== el.kioskProgCheckbox && !el.kioskProgCheckbox.contains(e.target)) {
        el.kioskProgCheckbox.checked = !el.kioskProgCheckbox.checked;
        el.kioskProgCheckbox.dispatchEvent(new Event("change"));
      }
    });
  }

  if (el.kioskLibCheckbox) {
    el.kioskLibCheckbox.addEventListener("change", () => {
      state.liberationMode = el.kioskLibCheckbox.checked;
      if (state.liberationMode && el.kioskProgCheckbox && el.kioskProgCheckbox.checked) {
        el.kioskProgCheckbox.checked = false;
        el.kioskProgCheckbox.dispatchEvent(new Event("change"));
      }
      const toggleField = document.getElementById("kioskLibToggleField");
      if (toggleField) {
        toggleField.classList.toggle("active", state.liberationMode);
      }
      // Re-render forms to handle interaction changes
      renderLiberacaoDual();
    });
  }

  if (el.kioskLibToggleField && el.kioskLibCheckbox) {
    el.kioskLibToggleField.addEventListener("click", (e) => {
      if (e.target !== el.kioskLibCheckbox && !el.kioskLibCheckbox.contains(e.target)) {
        el.kioskLibCheckbox.checked = !el.kioskLibCheckbox.checked;
        el.kioskLibCheckbox.dispatchEvent(new Event("change"));
      }
    });
  }


  // Controle de Tela Cheia no Quiosque
  if (el.btnKioskFullscreen) {
    el.btnKioskFullscreen.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error(`Erro ao ativar Tela Cheia: ${err.message}`);
        });
        el.btnKioskFullscreen.textContent = "📺 Sair Tela Cheia";
      } else {
        document.exitFullscreen().catch(() => {});
        el.btnKioskFullscreen.textContent = "🖥️ Tela Cheia";
      }
    });
  }
  document.addEventListener("fullscreenchange", () => {
    if (el.btnKioskFullscreen) {
      if (document.fullscreenElement) {
        el.btnKioskFullscreen.textContent = "📺 Sair Tela Cheia";
      } else {
        el.btnKioskFullscreen.textContent = "🖥️ Tela Cheia";
      }
    }
  });

  // Botão Sair Quiosque
  if (el.btnKioskBack) {
    el.btnKioskBack.addEventListener("click", () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      document.body.classList.remove("kiosk-active");
      setMode("HUB");
    });
  }

  if (el.btnKioskSync) {
    el.btnKioskSync.addEventListener("click", async () => {
      const btn = el.btnKioskSync;
      const oldText = btn.textContent;
      btn.textContent = "Sincronizando...";
      btn.disabled = true;
      try {
        await loadProgrammedFormas();
        await loadClickedFormsFromSupabase();
        renderLiberacaoDual();
        showLibFeedback("Sincronização concluída com sucesso!", "ok");
      } catch (err) {
        showLibFeedback("Erro ao sincronizar.", "error");
      } finally {
        btn.textContent = oldText;
        btn.disabled = false;
      }
    });
  }
  if (el.btnLimparFormas) {
    el.btnLimparFormas.addEventListener("click", () => {
      if (!confirm("Limpar todas as formas concretadas? (não apaga da planilha)")) return;
      localStorage.removeItem(CLICKED_FORMS_KEY);
      renderLiberacaoDual();
    });
  }

  el.insFiltroData.addEventListener("change", renderInspecaoLiberados);
  el.insModoCarga.addEventListener("change", renderInspecaoLiberados);
  if (el.insSetorGroup) {
    el.insSetorGroup.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const btn = target.closest(".sector-filter-btn");
      if (!btn) return;
      el.insSetorGroup.querySelectorAll(".sector-filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.activeInsSector = btn.dataset.sectorVal || "";
      clearSubmitLock("inspecao");
      renderInspecaoLiberados();
    });
  }
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
        modelo: tr.dataset.modelo || "",
        codigoPoste: tr.dataset.codigoPoste || "",
        descricaoPoste: tr.dataset.descricaoPoste || "",
        codigoProduto: tr.dataset.codigoProduto || ""
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
      setMontagemChecklistAnswer(sectionId, itemId, value);
    });

    el.mpChecklistSections.addEventListener("change", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (!target.classList.contains("mp-item-photo-input")) return;

      const file = target.files?.[0];
      if (!file) return;

      const sectionId = target.dataset.mpSection || "";
      const itemId = target.dataset.mpItem || "";

      try {
        const base64 = await fileToBase64(file);
        setMontagemChecklistPhoto(sectionId, itemId, base64);
      } catch (err) {
        console.error("Erro ao converter imagem para base64:", err);
        showMsgBox("Erro ao carregar a foto. Tente novamente.", "error");
      }
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
      if (window.innerWidth <= 1024) {
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
  const navProdAnalise = document.getElementById("navProdAnalise");
  if (navProdAnalise) navProdAnalise.addEventListener("click", () => setMode("PROD_ANALISE"));

  // Productivity filters & actions
  const paBtnFiltrar = document.getElementById("paBtnFiltrar");
  if (paBtnFiltrar) paBtnFiltrar.addEventListener("click", carregarProdutividadeConcretagem);
  const paBtnExportarCSV = document.getElementById("paBtnExportarCSV");
  if (paBtnExportarCSV) paBtnExportarCSV.addEventListener("click", exportarPaCSV);
  const paBtnExportarExcel = document.getElementById("paBtnExportarExcel");
  if (paBtnExportarExcel) paBtnExportarExcel.addEventListener("click", exportarPaExcel);
  const paBtnExportarPDF = document.getElementById("paBtnExportarPDF");
  if (paBtnExportarPDF) paBtnExportarPDF.addEventListener("click", exportarPaPDF);

  // Dashboard charts filter
  const dbData = document.getElementById("dbData");
  if (dbData) dbData.addEventListener("change", carregarDadosGlobaisDashboard);
  const dbBtnHoje = document.getElementById("dbBtnHoje");
  if (dbBtnHoje) dbBtnHoje.addEventListener("click", () => {
    if (dbData) dbData.value = todayYmd();
    carregarDadosGlobaisDashboard();
  });
  const dbBtnAtualizar = document.getElementById("dbBtnAtualizar");
  if (dbBtnAtualizar) dbBtnAtualizar.addEventListener("click", carregarDadosGlobaisDashboard);

  // Hub icon-cards (data-hub-mode)
  document.querySelectorAll("[data-hub-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.hubMode;
      if (mode === "DASHBOARD") { setMode("DASHBOARD"); }
      else if (mode === "LIBERACAO" || mode.startsWith("LIBERACAO_")) { setMode(mode); if (!el.libData.value) el.libData.value = todayYmd(); renderLiberacaoDual(); }
      else if (mode === "INSPECAO") { setMode("INSPECAO"); if (!el.insFiltroData.value) el.insFiltroData.value = todayYmd(); renderInspecaoLiberados(); }
      else if (mode === "MONTAGEM_POSTES") { setMode("MONTAGEM_POSTES"); if (!el.mpFiltroData.value) el.mpFiltroData.value = todayYmd(); renderMontagemPostesLiberados(); }
      else if (mode === "RELATORIO") { setMode("RELATORIO"); if (!el.relData.value) el.relData.value = todayYmd(); }
      else if (mode === "HISTORICO") { setMode("HISTORICO"); renderHistorico(); }
      else if (mode === "ACOMPANHAMENTO") { setMode("ACOMPANHAMENTO"); carregarDashboardConcretagem(); }
      else if (mode === "ACMP_CONCRETAGEM") { setMode("ACMP_CONCRETAGEM"); if (!el.acmpData.value) el.acmpData.value = todayYmd(); renderAcmpConcretagem(); }
    });
  });
}

async function syncOfflineData() {
  if (!supabaseClient) return;

  let syncedCount = 0;

  // 1. Sincronizar montagem_poste (Etapa MONTAGEM / INSPECAO)
  try {
    const mpDb = readMontagemPostesDb();
    const pendingKeys = Object.keys(mpDb.postes || {}).filter(key => mpDb.postes[key].pendingSync === true);
    for (const key of pendingKeys) {
      const entry = mpDb.postes[key];
      // Tenta re-enviar para o Supabase
      const payload = buildMontagemPostePayload(entry, entry.etapa || "FINALIZACAO");
      const apiResult = await postToMontagemApi("salvar_montagem_poste", payload);
      if (apiResult.ok) {
        mpDb.postes[key].pendingSync = false;
        syncedCount++;
      }
    }
    if (pendingKeys.length > 0) {
      writeMontagemPostesDb(mpDb);
    }
  } catch (err) {
    console.error("[syncOfflineData] Erro ao sincronizar montagem:", err);
  }

  // 2. Sincronizar apontamentos de concretagem e inspeções locais (LIBERACAO / INSPECAO)
  try {
    const db = readDb();
    let dbChanged = false;

    // Sincronizar eventos pendentes
    for (let ev of db.events || []) {
      if (ev.pendingSync === true) {
        if (ev.etapa === "LIBERACAO") {
          const payload = {
            dia: new Date(ev.timestamp).toLocaleDateString("pt-BR"),
            hora: new Date(ev.timestamp).toLocaleTimeString("pt-BR"),
            setor: ev.setor,
            forma: ev.formaNumero,
            dataFabricacao: ev.dataFabricacao,
            colaborador: ev.colaborador,
            modelo: ev.modelo || "",
            tipo_concreto: ev.tipoConcreto || "Padrão",
            codigo_poste: ev.codigoPoste || null,
            descricao_poste: ev.descricaoPoste || null,
            codigo_produto: ev.codigoProduto || null
          };
          const apiResult = await postToApi("salvar_forma_click", payload);
          if (apiResult.ok) {
            ev.pendingSync = false;
            dbChanged = true;
            syncedCount++;
          }
        } else if (ev.etapa === "INSPECAO") {
          const record = db.records.find(r => r.id === ev.recordId);
          const inspecaoLoc = record?.inspecoes?.find(ins => ins.pendingSync === true);

          if (record && inspecaoLoc) {
            // Sincronizar registro montagem_poste individual
            const composedKey = [record.id, record.dataFabricacao, record.setor, record.formaNumero, 'INSPECAO'].join("||");
            const payload = {
              key: composedKey,
              recordId: record.id,
              dataFabricacao: record.dataFabricacao,
              setor: record.setor,
              formaNumero: record.formaNumero,
              modelo: record.modelo || "",
              codigoPoste: record.codigoPoste || "",
              descricaoPoste: record.descricaoPoste || "",
              codigoProduto: record.codigoProduto || "",
              statusMontagem: inspecaoLoc.status,
              motivoRecusa: inspecaoLoc.codigos?.[0] || "",
              etapa: "INSPECAO",
              inicioInspecaoMontagem: ev.timestamp,
              finalizadoEm: ev.timestamp,
              checklists: {},
              observacoesMontagem: inspecaoLoc.observacoes || "",
              montadorNome: inspecaoLoc.colaborador
            };
            const apiResult = await postToMontagemApi("salvar_montagem_poste", payload);
            if (apiResult.ok) {
              ev.pendingSync = false;
              inspecaoLoc.pendingSync = false;
              dbChanged = true;
              syncedCount++;
            }
          }
        }
      }
    }

    if (dbChanged) {
      writeDb(db);
    }
  } catch (err) {
    console.error("[syncOfflineData] Erro ao sincronizar apontamentos:", err);
  }

  if (syncedCount > 0) {
    setSyncStatus("ok", `Sincronização offline automática concluída! ${syncedCount} item(ns) enviado(s).`);
  }
}

// Sincronização offline automática ao restabelecer sinal de rede
window.addEventListener("online", () => {
  setSyncStatus("pending", "Conexão restabelecida. Sincronizando dados offline...");
  syncOfflineData();
});

// Sweeper de sincronização rodando periodicamente a cada 30 segundos
setInterval(() => {
  if (navigator.onLine) {
    syncOfflineData();
  }
}, 30000);

function subscribeToRealtimeUpdates() {
  if (!supabaseClient) return;
  const channel = supabaseClient.channel('custom-producao-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'producao' },
      async (payload) => {
        console.log("Realtime event on producao:", payload);
        const dataAtual = el.libData?.value || todayYmd();
        // If the change is for the currently viewed date
        if (payload.new && payload.new.data_fabricacao === dataAtual) {
          // Re-fetch everything silently and re-render
          await loadClickedFormsFromSupabase();
          // Atualiza as interfaces que estão abertas
          if (["LIBERACAO", "LIBERACAO_S1", "LIBERACAO_S2", "LIBERACAO_S3", "LIBERACAO_S4"].includes(state.activeLiberacaoSector)) {
            renderLiberacaoDual();
          }
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Realtime subscribed to producao changes');
      }
    });
}

const VOLUME_PRODUTO_M3 = {
  "935": 0.18,
  "938": 0.18,
  "941": 0.22,
  "943": 0.22,
  "936": 0.30,
  "939": 0.30,
  "13580": 0.25,
  "DEFAULT": 0.20,
  "SETOR_4": 0.08
};

function getFormVolume(codigo, modelo, setor = "") {
  const code = String(codigo || "").trim();
  if (VOLUME_PRODUTO_M3[code]) return VOLUME_PRODUTO_M3[code];
  if (setor === "Setor 4") return VOLUME_PRODUTO_M3.SETOR_4;

  const m = String(modelo || "").toUpperCase();
  if (m.includes("1 CX")) return 0.18;
  if (m.includes("2 CX") || m.includes("2CX")) return 0.22;
  if (m.includes("3 CX") || m.includes("3CX")) return 0.26;
  if (m.includes("4 CX") || m.includes("4CX")) return 0.30;
  if (m.includes("600")) return 0.30;
  if (m.includes("300")) return 0.22;
  if (m.includes("SUB.") || m.includes("SUBTERRANEO")) return 0.20;
  if (m.includes("DTB") || m.includes("DTD")) return 0.25;
  if (m.includes("CEMIG")) return 0.18;
  if (m.includes("6,0 X 90") || m.includes("7,5 X 90")) return 0.08;
  if (m.includes("7,0 X 150") || m.includes("7,5 X 200")) return 0.12;

  return VOLUME_PRODUTO_M3.DEFAULT;
}

function getLocalRowsForPeriod(dStart, dEnd) {
  const db = readDb();
  return db.events
    .filter(ev => ev.isFromApi === true && ev.etapa === "LIBERACAO" && ev.dataFabricacao >= dStart && ev.dataFabricacao <= dEnd)
    .map(ev => ({
      id: ev.id || uuid(),
      data_fabricacao: ev.dataFabricacao,
      data_hora: ev.timestamp,
      setor: ev.setor,
      forma: ev.formaNumero,
      modelo: ev.modelo,
      codigo_produto: ev.codigoProduto || null,
      colaborador: ev.colaborador,
      status: "LIBERADO"
    }))
    .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
}

function popularFiltroProdutos(rows) {
  const select = document.getElementById("paFiltroProduto");
  if (!select) return;
  const valAnterior = select.value;
  select.innerHTML = '<option value="">Todos</option>';

  const produtosSet = new Set();
  rows.forEach(r => {
    if (r.modelo) produtosSet.add(r.modelo);
    if (r.codigo_produto) produtosSet.add(String(r.codigo_produto));
  });

  Array.from(produtosSet).sort().forEach(p => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    select.appendChild(opt);
  });

  if (Array.from(produtosSet).has(valAnterior)) {
    select.value = valAnterior;
  }
}



function calcularMetricasProdutividade(filteredRows, allRows, dStart, dEnd, meta) {
  const totalFormas = filteredRows.length;
  let totalVolume = 0;
  filteredRows.forEach(r => {
    totalVolume += getFormVolume(r.codigo_produto, r.modelo, r.setor);
  });

  const groups = {};
  filteredRows.forEach(r => {
    const key = `${r.data_fabricacao}||${r.setor}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });

  const validCycles = [];
  const allIntervals = [];
  const paradasList = [];
  let tempoPerdidoTotal = 0;

  Object.keys(groups).forEach(key => {
    const [dia, setor] = key.split("||");
    const list = groups[key].sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());

    for (let i = 1; i < list.length; i++) {
      const tPrev = new Date(list[i - 1].data_hora).getTime();
      const tCurr = new Date(list[i].data_hora).getTime();
      const diffMin = (tCurr - tPrev) / 60000;

      if (diffMin <= 0) continue;

      allIntervals.push(diffMin);

      if (diffMin > 20) {
        let classif = "VERDE";
        if (diffMin > 20 && diffMin <= 30) classif = "AMARELO";
        if (diffMin > 30) classif = "VERMELHO";

        paradasList.push({
          inicio: new Date(tPrev).toLocaleTimeString("pt-BR", {hour: '2-digit', minute:'2-digit'}),
          fim: new Date(tCurr).toLocaleTimeString("pt-BR", {hour: '2-digit', minute:'2-digit'}),
          duracao: Math.round(diffMin),
          setor: list[i].setor,
          produto: list[i].modelo || "N/A",
          classificacao: classif,
          data: dia
        });
      }

      if (diffMin <= 60) {
        validCycles.push(diffMin);
        if (diffMin > meta) {
          tempoPerdidoTotal += (diffMin - meta);
        }
      }
    }
  });

  let cicloMedio = 0;
  let cicloMediana = 0;
  let cicloMin = 0;
  let cicloMax = 0;
  let cicloDesvioPadrao = 0;

  if (validCycles.length > 0) {
    validCycles.sort((a, b) => a - b);
    const sum = validCycles.reduce((s, v) => s + v, 0);
    cicloMedio = sum / validCycles.length;

    const mid = Math.floor(validCycles.length / 2);
    cicloMediana = validCycles.length % 2 !== 0 ? validCycles[mid] : (validCycles[mid - 1] + validCycles[mid]) / 2;

    cicloMin = validCycles[0];
    cicloMax = validCycles[validCycles.length - 1];

    const avg = cicloMedio;
    const sqDiffs = validCycles.map(v => Math.pow(v - avg, 2));
    const avgSqDiff = sqDiffs.reduce((s, v) => s + v, 0) / validCycles.length;
    cicloDesvioPadrao = Math.sqrt(avgSqDiff);
  }

  const numeroParadas = paradasList.filter(p => p.classificacao === "AMARELO" || p.classificacao === "VERMELHO").length;
  paradasList.sort((a, b) => b.duracao - a.duracao);

  let tempoDisponivelMin = validCycles.reduce((s, v) => s + v, 0);
  if (tempoDisponivelMin === 0) tempoDisponivelMin = 480;

  const producaoTeorica = tempoDisponivelMin / meta;
  const eficienciaOperacional = producaoTeorica > 0 ? (totalFormas / producaoTeorica) * 100 : 0;

  const jornadaDiaria = [];
  const diasUnicos = Array.from(new Set(filteredRows.map(r => r.data_fabricacao))).sort();
  diasUnicos.forEach(dia => {
    const listDia = filteredRows.filter(r => r.data_fabricacao === dia).sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
    if (listDia.length > 0) {
      const tIni = new Date(listDia[0].data_hora);
      const tFim = new Date(listDia[listDia.length - 1].data_hora);
      jornadaDiaria.push({
        data: dia.split("-").reverse().join("/"),
        inicio: tIni.toLocaleTimeString("pt-BR", {hour:'2-digit', minute:'2-digit'}),
        fim: tFim.toLocaleTimeString("pt-BR", {hour:'2-digit', minute:'2-digit'}),
        formas: listDia.length,
        metaDiaria: Math.round(480 / meta)
      });
    }
  });

  const heatmapFaixas = {};
  for (let h = 6; h <= 17; h++) {
    for (let m = 0; m < 60; m += 15) {
      const key = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      heatmapFaixas[key] = 0;
    }
  }

  filteredRows.forEach(r => {
    const dt = new Date(r.data_hora);
    const hour = dt.getHours();
    const min = dt.getMinutes();
    if (hour >= 6 && hour <= 17) {
      const minFaixa = Math.floor(min / 15) * 15;
      const key = `${String(hour).padStart(2, '0')}:${String(minFaixa).padStart(2, '0')}`;
      if (heatmapFaixas[key] !== undefined) heatmapFaixas[key]++;
    }
  });

  let melhorCicloHistorico = 15;
  const historicalGroups = {};
  allRows.forEach(r => {
    const key = `${r.data_fabricacao}||${r.setor}`;
    if (!historicalGroups[key]) historicalGroups[key] = [];
    historicalGroups[key].push(r);
  });
  const histCycles = [];
  Object.keys(historicalGroups).forEach(k => {
    const list = historicalGroups[k].sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
    for (let i = 1; i < list.length; i++) {
      const diff = (new Date(list[i].data_hora).getTime() - new Date(list[i-1].data_hora).getTime()) / 60000;
      if (diff >= 1 && diff <= 60) histCycles.push(diff);
    }
  });
  if (histCycles.length > 0) {
    histCycles.sort((a, b) => a - b);
    melhorCicloHistorico = histCycles[0];
  }

  const capMaxFormsDia = Math.round(480 / melhorCicloHistorico);
  const capMaxM3Dia = capMaxFormsDia * (totalVolume / Math.max(totalFormas, 1));

  const capMedFormsDia = cicloMedio > 0 ? Math.round(480 / cicloMedio) : 0;
  const capMedM3Dia = capMedFormsDia * (totalVolume / Math.max(totalFormas, 1));

  const numDias = Math.max(diasUnicos.length, 1);
  const capAtuFormsDia = Math.round(totalFormas / numDias);
  const capAtuM3Dia = totalVolume / numDias;

  return {
    totalFormas,
    totalVolume,
    cicloMedio,
    cicloMediana,
    cicloMin,
    cicloMax,
    cicloDesvioPadrao,
    numeroParadas,
    tempoPerdidoTotal,
    eficienciaOperacional,
    formasPorHora: cicloMedio > 0 ? 60 / cicloMedio : 0,
    m3PorHora: tempoDisponivelMin > 0 ? totalVolume / (tempoDisponivelMin / 60) : 0,
    paradasAmarelas: paradasList.filter(p => p.classificacao === "AMARELO").length,
    paradasVermelhas: paradasList.filter(p => p.classificacao === "VERMELHO").length,
    paradasList,
    jornadaDiaria,
    heatmapFaixas,
    capMaxFormsDia,
    capMaxM3Dia,
    capMedFormsDia,
    capMedM3Dia,
    capAtuFormsDia,
    capAtuM3Dia,
    filteredRows
  };
}

function renderizarAlertasOperacionais(metricas, meta) {
  const panel = document.getElementById("paAlertsPanel");
  if (!panel) return;
  panel.innerHTML = "";

  const alerts = [];
  if (metricas.cicloMedio > meta) {
    alerts.push({
      type: "warning",
      text: `⚠️ Ciclo Médio (${Math.round(metricas.cicloMedio)} min) está acima do ciclo meta configurado (${meta} min).`
    });
  }
  if (metricas.eficienciaOperacional > 0 && metricas.eficienciaOperacional < 80) {
    alerts.push({
      type: "danger",
      text: `⚠️ Eficiência Operacional (${Math.round(metricas.eficienciaOperacional)}%) está abaixo da meta aceitável de 80%.`
    });
  }
  const vermelhasHoje = metricas.paradasList.filter(p => p.classificacao === "VERMELHO" && p.data === todayYmd()).length;
  if (vermelhasHoje >= 3) {
    alerts.push({
      type: "danger",
      text: `🚨 Alerta crítico: Mais de 3 paradas vermelhas (>30 min) identificadas na data de hoje.`
    });
  }
  if (metricas.tempoPerdidoTotal > 60) {
    alerts.push({
      type: "warning",
      text: `⚠️ Tempo Perdido Acumulado (${Math.round(metricas.tempoPerdidoTotal)} min) excede o limite aceitável de 60 minutos.`
    });
  }

  if (alerts.length > 0) {
    alerts.forEach(a => {
      const div = document.createElement("div");
      div.className = `pa-alert pa-alert-${a.type}`;
      div.textContent = a.text;
      panel.appendChild(div);
    });
    panel.classList.remove("hidden");
  } else {
    panel.classList.add("hidden");
  }
}

function renderizarTabelaParadas(list) {
  const tbody = document.getElementById("paTbodyParadas");
  if (!tbody) return;
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#64748b;">Nenhuma parada registrada.</td></tr>';
    return;
  }
  tbody.innerHTML = list.slice(0, 10).map(p => {
    let badge = "badge-verde";
    if (p.classificacao === "AMARELO") badge = "badge-amarelo";
    if (p.classificacao === "VERMELHO") badge = "badge-vermelho";
    return `<tr>
      <td>${p.data.split("-").reverse().join("/")} ${p.inicio}</td>
      <td>${p.data.split("-").reverse().join("/")} ${p.fim}</td>
      <td style="font-weight: bold;">${p.duracao} min</td>
      <td>${p.setor}</td>
      <td>${p.produto}</td>
      <td><span class="badge-parada ${badge}">${p.classificacao}</span></td>
    </tr>`;
  }).join("");
}

function renderizarTabelaJornada(list) {
  const tbody = document.getElementById("paTbodyJornada");
  if (!tbody) return;
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b;">Sem dados para o período.</td></tr>';
    return;
  }
  tbody.innerHTML = list.slice(0, 10).map(j => `
    <tr>
      <td>${j.data}</td>
      <td>${j.inicio}</td>
      <td>${j.fim}</td>
      <td style="font-weight: bold;">${j.formas}</td>
      <td>${j.metaDiaria}</td>
    </tr>
  `).join("");
}

function renderizarGraficosProdutividade(metricas, dStart, dEnd) {
  const diasUnicos = Array.from(new Set(metricas.filteredRows.map(r => r.data_fabricacao))).sort();

  // 1. Ciclo Médio por Dia
  destroyChart("chartPaCicloDia");
  const ctxCicloDia = document.getElementById("chartPaCicloDia");
  if (ctxCicloDia && typeof Chart !== "undefined") {
    const mapCicloDia = {};
    diasUnicos.forEach(d => { mapCicloDia[d] = []; });

    // Agrupar por dia
    const groups = {};
    metricas.filteredRows.forEach(r => {
      const key = `${r.data_fabricacao}||${r.setor}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });

    Object.keys(groups).forEach(key => {
      const [dia, setor] = key.split("||");
      const list = groups[key].sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
      for (let i = 1; i < list.length; i++) {
        const diff = (new Date(list[i].data_hora).getTime() - new Date(list[i-1].data_hora).getTime()) / 60000;
        if (diff > 0 && diff <= 60) {
          if (mapCicloDia[dia]) mapCicloDia[dia].push(diff);
        }
      }
    });

    const dataCicloDia = diasUnicos.map(d => {
      const list = mapCicloDia[d] || [];
      if (list.length === 0) return 0;
      return list.reduce((s, v) => s + v, 0) / list.length;
    });

    chartInstances["chartPaCicloDia"] = new Chart(ctxCicloDia, {
      type: 'line',
      data: {
        labels: diasUnicos.map(d => d.split("-").reverse().join("/")),
        datasets: [{
          label: 'Ciclo Médio (min)',
          data: dataCicloDia,
          borderColor: '#1e40af',
          backgroundColor: 'rgba(30, 64, 175, 0.1)',
          fill: true,
          tension: 0.3
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // 2. Histograma de Tempos de Ciclo
  destroyChart("chartPaHistograma");
  const ctxHist = document.getElementById("chartPaHistograma");
  if (ctxHist && typeof Chart !== "undefined") {
    const buckets = { "<5 min": 0, "5-10 min": 0, "10-15 min": 0, "15-20 min": 0, "20-30 min": 0, ">30 min": 0 };

    const groups = {};
    metricas.filteredRows.forEach(r => {
      const key = `${r.data_fabricacao}||${r.setor}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });

    Object.keys(groups).forEach(key => {
      const list = groups[key].sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
      for (let i = 1; i < list.length; i++) {
        const diff = (new Date(list[i].data_hora).getTime() - new Date(list[i-1].data_hora).getTime()) / 60000;
        if (diff <= 0) continue;
        if (diff < 5) buckets["<5 min"]++;
        else if (diff >= 5 && diff < 10) buckets["5-10 min"]++;
        else if (diff >= 10 && diff < 15) buckets["10-15 min"]++;
        else if (diff >= 15 && diff < 20) buckets["15-20 min"]++;
        else if (diff >= 20 && diff < 30) buckets["20-30 min"]++;
        else buckets[">30 min"]++;
      }
    });

    chartInstances["chartPaHistograma"] = new Chart(ctxHist, {
      type: 'bar',
      data: {
        labels: Object.keys(buckets),
        datasets: [{
          label: 'Frequência de Ciclos',
          data: Object.values(buckets),
          backgroundColor: '#8b5cf6',
          borderRadius: 6
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // 3. Curva Acumulada de Produção
  destroyChart("chartPaCurvaAcumulada");
  const ctxCurva = document.getElementById("chartPaCurvaAcumulada");
  if (ctxCurva && typeof Chart !== "undefined") {
    // Ordenar todos os apontamentos cronologicamente por hora (HH:MM)
    const sortedEvents = [...metricas.filteredRows].sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
    let accum = 0;
    const labelsCurva = [];
    const dataCurva = [];

    sortedEvents.forEach(e => {
      accum++;
      const timeStr = new Date(e.data_hora).toLocaleTimeString("pt-BR", {hour: '2-digit', minute:'2-digit'});
      labelsCurva.push(timeStr);
      dataCurva.push(accum);
    });

    chartInstances["chartPaCurvaAcumulada"] = new Chart(ctxCurva, {
      type: 'line',
      data: {
        labels: labelsCurva,
        datasets: [{
          label: 'Produção Acumulada',
          data: dataCurva,
          borderColor: '#10b981',
          borderWidth: 2.5,
          pointRadius: 1,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { ticks: { maxTicksLimit: 15 } } }
      }
    });
  }

  // 4. Pareto de Paradas
  destroyChart("chartPaPareto");
  const ctxPareto = document.getElementById("chartPaPareto");
  if (ctxPareto && typeof Chart !== "undefined") {
    // Agrupar durações de paradas por Produto/Modelo
    const paradasPorProduto = {};
    metricas.paradasList.forEach(p => {
      paradasPorProduto[p.produto] = (paradasPorProduto[p.produto] || 0) + p.duracao;
    });

    const sortedProds = Object.keys(paradasPorProduto).sort((a, b) => paradasPorProduto[b] - paradasPorProduto[a]);
    const durations = sortedProds.map(p => paradasPorProduto[p]);
    const totalDuration = durations.reduce((s, v) => s + v, 0);

    let runningSum = 0;
    const cumPercentages = durations.map(d => {
      runningSum += d;
      return totalDuration > 0 ? (runningSum / totalDuration) * 100 : 0;
    });

    chartInstances["chartPaPareto"] = new Chart(ctxPareto, {
      type: 'bar',
      data: {
        labels: sortedProds,
        datasets: [
          {
            type: 'bar',
            label: 'Duração Total (min)',
            data: durations,
            backgroundColor: '#ef4444',
            yAxisID: 'y'
          },
          {
            type: 'line',
            label: '% Acumulada',
            data: cumPercentages,
            borderColor: '#f59e0b',
            borderWidth: 2,
            yAxisID: 'yPercent',
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { type: 'linear', position: 'left' },
          yPercent: { type: 'linear', position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false } }
        }
      }
    });
  }

  // 5. Heatmap de Produção
  destroyChart("chartPaHeatmap");
  const ctxHeat = document.getElementById("chartPaHeatmap");
  if (ctxHeat && typeof Chart !== "undefined") {
    const labelsHeat = Object.keys(metricas.heatmapFaixas);
    const dataHeat = Object.values(metricas.heatmapFaixas);

    chartInstances["chartPaHeatmap"] = new Chart(ctxHeat, {
      type: 'bar',
      data: {
        labels: labelsHeat,
        datasets: [{
          label: 'Formas Concretadas',
          data: dataHeat,
          backgroundColor: 'rgba(14, 116, 144, 0.85)',
          borderRadius: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { ticks: { maxTicksLimit: 12 } } }
      }
    });
  }

  // 6. Eficiência por Setor
  destroyChart("chartPaEficienciaSetor");
  const ctxEficSetor = document.getElementById("chartPaEficienciaSetor");
  if (ctxEficSetor && typeof Chart !== "undefined") {
    const setores = ["Setor 1", "Setor 2", "Setor 3", "Setor 4"];
    const meta = parseFloat(document.getElementById("paMetaCiclo")?.value || "15");

    const dataEfic = setores.map(s => {
      const listSetor = metricas.filteredRows.filter(r => r.setor === s);
      const groupsSetor = {};
      listSetor.forEach(r => {
        if (!groupsSetor[r.data_fabricacao]) groupsSetor[r.data_fabricacao] = [];
        groupsSetor[r.data_fabricacao].push(r);
      });

      const sectorCycles = [];
      Object.keys(groupsSetor).forEach(d => {
        const list = groupsSetor[d].sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
        for (let i = 1; i < list.length; i++) {
          const diff = (new Date(list[i].data_hora).getTime() - new Date(list[i-1].data_hora).getTime()) / 60000;
          if (diff > 0 && diff <= 60) sectorCycles.push(diff);
        }
      });

      let tempoDisponivel = sectorCycles.reduce((sum, v) => sum + v, 0);
      if (tempoDisponivel === 0) tempoDisponivel = 480;
      const producaoTeoricaSetor = tempoDisponivel / meta;
      return producaoTeoricaSetor > 0 ? (listSetor.length / producaoTeoricaSetor) * 100 : 0;
    });

    chartInstances["chartPaEficienciaSetor"] = new Chart(ctxEficSetor, {
      type: 'bar',
      data: {
        labels: setores,
        datasets: [{
          label: 'Eficiência (%)',
          data: dataEfic,
          backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f97316'],
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { min: 0, max: 100 } }
      }
    });
  }

  // 7. m³ por Hora
  destroyChart("chartPaM3Hora");
  const ctxM3Hora = document.getElementById("chartPaM3Hora");
  if (ctxM3Hora && typeof Chart !== "undefined") {
    const faixasHoras = ["06h", "07h", "08h", "09h", "10h", "11h", "12h", "13h", "14h", "15h", "16h", "17h"];
    const volumesHoras = Array(12).fill(0);

    metricas.filteredRows.forEach(r => {
      const dt = new Date(r.data_hora);
      const h = dt.getHours();
      if (h >= 6 && h <= 17) {
        volumesHoras[h - 6] += getFormVolume(r.codigo_produto, r.modelo, r.setor);
      }
    });

    chartInstances["chartPaM3Hora"] = new Chart(ctxM3Hora, {
      type: 'bar',
      data: {
        labels: faixasHoras,
        datasets: [{
          label: 'Volume Concretado (m³)',
          data: volumesHoras,
          backgroundColor: 'rgba(232, 118, 42, 0.9)',
          borderRadius: 6
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
}

async function carregarProdutividadeConcretagem() {
  const dStart = document.getElementById("paDataInicio")?.value || todayYmd();
  const dEnd = document.getElementById("paDataFim")?.value || todayYmd();
  const meta = parseFloat(document.getElementById("paMetaCiclo")?.value || "15");

  setSyncStatus("pending", "Carregando dados de produtividade...");

  let allRows = [];
  if (hasApiConfigured()) {
    try {
      let page = 0;
      const pageSize = 1000;
      let keepFetching = true;
      while (keepFetching) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        const { data: rows, error } = await supabaseClient
          .from('producao')
          .select('*')
          .gte('data_fabricacao', dStart)
          .lte('data_fabricacao', dEnd)
          .eq('status', 'LIBERADO')
          .order('data_hora', { ascending: true })
          .range(from, to);

        if (error) throw error;
        if (rows && rows.length > 0) {
          allRows = allRows.concat(rows);
        }
        if (!rows || rows.length < pageSize || page >= 10) {
          keepFetching = false;
        } else {
          page++;
        }
      }
    } catch (err) {
      console.warn("Erro Supabase em produtividade, buscando local:", err);
      allRows = getLocalRowsForPeriod(dStart, dEnd);
    }
  } else {
    allRows = getLocalRowsForPeriod(dStart, dEnd);
  }

  popularFiltroProdutos(allRows);

  const filterSetor = document.getElementById("paFiltroSetor")?.value || "";
  const filterProduto = document.getElementById("paFiltroProduto")?.value || "";

  let filteredRows = allRows.filter(r => {
    if (filterSetor && r.setor !== filterSetor) return false;
    if (filterProduto && r.modelo !== filterProduto && r.codigo_produto !== filterProduto) return false;
    return true;
  });

  const metricas = calcularMetricasProdutividade(filteredRows, allRows, dStart, dEnd, meta);

  document.getElementById("paKpiFormas").textContent = metricas.totalFormas;
  document.getElementById("paKpiVolume").textContent = metricas.totalVolume.toFixed(2) + " m³";
  document.getElementById("paKpiCicloMedio").textContent = metricas.cicloMedio > 0 ? Math.round(metricas.cicloMedio) + " min" : "N/A";
  document.getElementById("paKpiCicloDetalhes").innerHTML = `
    Mediana: ${metricas.cicloMediana > 0 ? Math.round(metricas.cicloMediana) + "m" : "N/A"} |
    DP: ${metricas.cicloDesvioPadrao > 0 ? Math.round(metricas.cicloDesvioPadrao) + "m" : "N/A"}<br>
    Min: ${metricas.cicloMin > 0 ? Math.round(metricas.cicloMin) + "m" : "—"} |
    Max: ${metricas.cicloMax > 0 ? Math.round(metricas.cicloMax) + "m" : "—"}
  `;
  document.getElementById("paKpiEficiencia").textContent = metricas.eficienciaOperacional > 0 ? Math.round(metricas.eficienciaOperacional) + "%" : "N/A";
  document.getElementById("paKpiTempoPerdido").textContent = metricas.tempoPerdidoTotal > 0 ? Math.round(metricas.tempoPerdidoTotal) + " min" : "0 min";
  document.getElementById("paKpiParadas").textContent = metricas.numeroParadas;
  const setKpi = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  };
  setKpi("paKpiCicloMin", metricas.cicloMin > 0 ? Math.round(metricas.cicloMin) + " min" : "N/A");
  setKpi("paKpiCicloMax", metricas.cicloMax > 0 ? Math.round(metricas.cicloMax) + " min" : "N/A");
  setKpi("paKpiDesvioPadrao", metricas.cicloDesvioPadrao > 0 ? metricas.cicloDesvioPadrao.toFixed(1) + " min" : "N/A");
  setKpi("paKpiFormasHora", metricas.formasPorHora > 0 ? metricas.formasPorHora.toFixed(1) : "N/A");
  setKpi("paKpiM3Hora", metricas.m3PorHora > 0 ? metricas.m3PorHora.toFixed(2) + " m³/h" : "N/A");
  setKpi("paKpiParadasAV", `${metricas.paradasAmarelas} / ${metricas.paradasVermelhas}`);

  renderizarAlertasOperacionais(metricas, meta);
  renderizarGraficosProdutividade(metricas, dStart, dEnd);
  renderizarTabelaParadas(metricas.paradasList);
  renderizarTabelaJornada(metricas.jornadaDiaria);

  state.paLastMetricas = metricas;
  state.paLastRows = filteredRows;

  setSyncStatus("ok", "Análise de produtividade atualizada.");
}

function exportarPaCSV() {
  const metricas = state.paLastMetricas;
  if (!metricas || !metricas.paradasList) {
    showMsgBox("Gere um filtro antes de exportar.", "error");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Data;Horario Inicio;Horario Fim;Duracao (min);Setor;Produto;Classificacao\n";

  metricas.paradasList.forEach(p => {
    csvContent += `${p.data};${p.inicio};${p.fim};${p.duracao};${p.setor};${p.produto};${p.classificacao}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `paradas_concretagem_${todayYmd()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportarPaExcel() {
  const metricas = state.paLastMetricas;
  if (!metricas || !metricas.paradasList) {
    showMsgBox("Gere um filtro antes de exportar.", "error");
    return;
  }

  let tableHtml = "<table border='1'><tr><th>Data</th><th>Horario Inicio</th><th>Horario Fim</th><th>Duracao (min)</th><th>Setor</th><th>Produto</th><th>Classificacao</th></tr>";
  metricas.paradasList.forEach(p => {
    tableHtml += `<tr><td>${p.data}</td><td>${p.inicio}</td><td>${p.fim}</td><td>${p.duracao}</td><td>${p.setor}</td><td>${p.produto}</td><td>${p.classificacao}</td></tr>`;
  });
  tableHtml += "</table>";

  const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `produtividade_concretagem_${todayYmd()}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportarPaPDF() {
  window.print();
}

function init() {
  setMode("HUB");
  setSyncStatus("pending", "Verificando conexão com a planilha...");
  renderInspecaoCodigosChecklist();
  bindEvents();
  subscribeToRealtimeUpdates();

  const now = todayYmd();
  el.libData.value = now;
  el.insFiltroData.value = now;
  el.insModoCarga.value = "data";
  if (el.mpFiltroData) el.mpFiltroData.value = now;
  if (el.mpModoCarga) el.mpModoCarga.value = "data";
  if (el.mpSetor) el.mpSetor.value = "";
  if (el.histTipo) el.histTipo.value = "";
  el.dashData.value = now;
  el.relData.value = now;
  el.relSetor.value = "Setor 2";
  if (el.acmpData) el.acmpData.value = now;
  if (el.acmpSetor) el.acmpSetor.value = "";
  const dbDataEl = document.getElementById("dbData");
  if (dbDataEl) dbDataEl.value = now;
  const paDataInicio = document.getElementById("paDataInicio");
  const paDataFim = document.getElementById("paDataFim");
  if (paDataInicio) paDataInicio.value = now;
  if (paDataFim) paDataFim.value = now;

  if ("serviceWorker" in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    navigator.serviceWorker.register("./sw.js").then((reg) => {
      reg.update().catch(() => {});
    }).catch(() => {});
  }

  const session = readAuthSession();
  if (session) {
    state.authUser = session;
    if (el.insColaborador && session.name) {
      el.insColaborador.value = session.name;
    }
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
