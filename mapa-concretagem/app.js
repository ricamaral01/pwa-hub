const STORAGE_KEY = "pwa_liberacao_inspecao_v1";
const SUBMIT_LOCKS_KEY = "pwa_liberacao_submit_locks_v1";
const CLICKED_FORMS_KEY = "pwa_formas_clicadas_hoje";
const MONTAGEM_POSTES_KEY = "pwa_montagem_postes_v1";
const AUTH_SESSION_KEY = "pwa_mapa_auth_session_v1";

const ROLE_PERMISSIONS = {
  GERENCIA: {
    label: "Gerência",
    modes: ["DASHBOARD", "PROD_ANALISE", "LIBERACAO", "LIBERACAO_S1", "LIBERACAO_S2", "LIBERACAO_S3", "LIBERACAO_S4", "INSPECAO", "MONTAGEM_POSTES", "MONTAGEM_INDICADORES", "DASHBOARD_DEFEITOS", "RELATORIO", "HISTORICO", "ACMP_CONCRETAGEM", "USUARIOS", "SEQUENCIA_S3", "MANDRIL_CIRCULAR", "RELATORIO_MANUTENCAO", "TRATATIVA_DEFEITOS"]
  },
  GESTOR: {
    label: "Gestor",
    modes: ["DASHBOARD", "PROD_ANALISE", "LIBERACAO", "LIBERACAO_S1", "LIBERACAO_S2", "LIBERACAO_S3", "LIBERACAO_S4", "MONTAGEM_POSTES", "MONTAGEM_INDICADORES", "DASHBOARD_DEFEITOS", "RELATORIO", "HISTORICO", "ACMP_CONCRETAGEM", "SEQUENCIA_S3", "MANDRIL_CIRCULAR", "RELATORIO_MANUTENCAO", "TRATATIVA_DEFEITOS"]
  },
  MONTADOR: {
    label: "Montador",
    modes: ["INSPECAO", "MONTAGEM_POSTES", "SEQUENCIA_S3", "RELATORIO_MANUTENCAO", "TRATATIVA_DEFEITOS"]
  },
  APONTADOR: {
    label: "Apontador",
    modes: ["LIBERACAO_S1", "LIBERACAO_S2", "LIBERACAO_S3", "LIBERACAO_S4", "MANDRIL_CIRCULAR", "RELATORIO_MANUTENCAO", "TRATATIVA_DEFEITOS"]
  }
};

function getInspecaoChecklistSections(modelo = "") {
  return [
    {
      id: "inspecao_visual",
      titulo: "Inspeção Visual",
      itens: [
        { id: "homogeneidade_concreto", texto: "Homogeneidade do Concreto", critico: true, codigoFalha: "O" },
        { id: "falhas_preenchimento", texto: "Falhas de Preenchimento", critico: true, codigoFalha: "A" },
        { id: "concreto_segregado", texto: "Concreto Segregado", critico: true, codigoFalha: "O" },
        { id: "grandes_avarias", texto: "Grandes Avarias", critico: true, codigoFalha: "P" },
        { id: "furacao_obstruida", texto: "Furação Obstruída (pinos)", critico: true, codigoFalha: "E" },
        { id: "armacao_aparente", texto: "Armação aparente", critico: true, codigoFalha: "A" },
        { id: "trincas", texto: "Trincas", critico: true, codigoFalha: "I" },
        { id: "tubulacao_entupida", texto: "Tubulação Entupida", critico: true, codigoFalha: "B" },
        { id: "bolhas_excesso", texto: "Bolhas em excesso", critico: false, codigoFalha: "C" },
        { id: "bolhas_fora_padrao", texto: "Bolhas fora do padrão", critico: false, codigoFalha: "C" },
        { id: "carimbo_identificacao", texto: "Carimbo de Identificação", critico: false, codigoFalha: "F" },
        { id: "fissuras", texto: "Fissuras", critico: false, codigoFalha: "G" },
        { id: "rebarbas", texto: "Rebarbas", critico: false, codigoFalha: "Q" },
        { id: "manchas_excessivas", texto: "Manchas excessivas", critico: false, codigoFalha: "K" },
        { id: "buchas_fixacao", texto: "Buchas de fixação", critico: false, codigoFalha: "L" },
        { id: "acabamento_face_exposta", texto: "Acabamento face exposta", critico: false, codigoFalha: "R" },
        { id: "acabamento_abas", texto: "Acabamento abas", critico: false, codigoFalha: "S" }
      ]
    }
  ];
}

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
        { id: "aterramento", texto: "Limpeza Aterramento", critico: false },
        { id: "lacre", texto: "Limpeza Lacre", critico: false }
      ]
    }
  ];
}

const CONCRETO_TIPOS = ["Concreto Padrão", "Concreto Seco - Vibrado", "Concreto Segregado", "Concreto Exsudado", "Teste Lab."];

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

function isFormaProgrammed(forma, setor) {
  const dataFabricacao = el.libData?.value || todayYmd();
  const hoje = todayYmd();
  if (dataFabricacao === hoje) {
    const clicked = getClickedFormsToday();
    const key = setor + "||" + normalizeUpper(forma);
    if (clicked.formas[key] === "P") return true;
  }
  const db = readDb();
  const record = findRecordByKey(db, dataFabricacao, setor, normalizeUpper(forma));
  return record?.liberacao?.status === "P";
}
const SUPABASE_CONFIG = {
  URL: "https://fbvvdyirhtgvycullsqy.supabase.co",
  KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZidnZkeWlyaHRndnljdWxsc3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3Njc5MTksImV4cCI6MjA5NDM0MzkxOX0.vzudcEhAwdAutU0g-Mra818fd8_DciepjqvU8Z-C4wc"
};
const PCP_PROGRAMACAO_URL = "https://pcp.concretrack.com.br/api/programacao";
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY) : null;

function getBackendUrl() {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:5000/api";
  }
  
  // Se for IP da rede local (ex: 192.168.X.X ou 10.X.X.X)
  if (/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname)) {
    return `${protocol}//${hostname}:5000/api`;
  }
  
  // Produção (VPS)
  return "http://2.25.163.32:5000/api";
}

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

const INDIVIDUAL_RESPONSAVEIS = ["Alex", "José Carlos", "Osmar", "Philippe", "Ricardo"];

const MATRIZ_DEFEITOS_RESPONSAVEIS = {
  A: { codigo: "A", descricao: "Falha na Concretagem / Armação Aparente", classificacao: "CRÍTICO", status: "Reprova (R)", detalhamento: "Ferragem exposta sem cobrimento mínimo de concreto ou ninhos de abelha no fuste.", acao: "Refugo / Descarte Imediato (Compromete Durabilidade e Estrutura)", responsavel: "Osmar / José Carlos", responsaveisLista: ["Osmar", "José Carlos"] },
  B: { codigo: "B", descricao: "Cano Entupido", classificacao: "CRÍTICO", status: "Reprova (R)", detalhamento: "Eletroduto/tubulação interna de passagem de cabos totalmente obstruída por concreto.", acao: "Refugo / Descarte (Poste Inutilizado para Rede Elétrica)", responsavel: "Osmar / José Carlos", responsaveisLista: ["Osmar", "José Carlos"] },
  C: { codigo: "C", descricao: "Excesso de Bolhas", classificacao: "NÃO CRÍTICO", status: "Retrabalho (RR)", detalhamento: "Presença de bolhas de ar superficiais fora do padrão estético no fuste.", acao: "Encaminhar para Acabamento / Estucagem Superficial", responsavel: "Philippe / Ricardo", responsaveisLista: ["Philippe", "Ricardo"] },
  D: { codigo: "D", descricao: "Problema na Caixa do Relógio ou Disjuntor", classificacao: "NÃO CRÍTICO", status: "Retrabalho (RR)", detalhamento: "Desalinhamento, quebra parcial ou avaria nos nichos das caixas de medição.", acao: "Retrabalho de Ajuste e Reparo na Caixa", responsavel: "Alex", responsaveisLista: ["Alex"] },
  E: { codigo: "E", descricao: "Furos Obstruídos ou Faltando (Facão / Pinos)", classificacao: "CRÍTICO", status: "Reprova (R)", detalhamento: "Furação de fixação de isoladores ou facão do topo obstruídos por concreto.", acao: "Tentativa de Desobstrução / Se Inviável, Reprovação", responsavel: "Osmar / José Carlos", responsaveisLista: ["Osmar", "José Carlos"] },
  F: { codigo: "F", descricao: "Identificação do Poste (Carimbos)", classificacao: "NÃO CRÍTICO", status: "Retrabalho (RR)", detalhamento: "Carimbo de identificação ilegível ou marcação incorreta de esforço/comprimento.", acao: "Re-carimbagem e Correção de Identificação", responsavel: "Osmar / José Carlos", responsaveisLista: ["Osmar", "José Carlos"] },
  G: { codigo: "G", descricao: "Presença de Trincas Superficiais", classificacao: "NÃO CRÍTICO", status: "Retrabalho (RR)", detalhamento: "Fissuras superficiais capilares decorrentes de tensão na desforma.", acao: "Calafetagem Superficial e Monitoramento", responsavel: "Philippe / Ricardo", responsaveisLista: ["Philippe", "Ricardo"] },
  H: { codigo: "H", descricao: "Bolha nas Caixas", classificacao: "NÃO CRÍTICO", status: "Retrabalho (RR)", detalhamento: "Acúmulo de bolhas de ar nos contornos internos/externos dos nichos.", acao: "Estucagem e Acabamento Manuais", responsavel: "Philippe / Ricardo", responsaveisLista: ["Philippe", "Ricardo"] },
  I: { codigo: "I", descricao: "Trincas em Toda a Extensão do Poste", classificacao: "CRÍTICO", status: "Reprova (R)", detalhamento: "Trinca estrutural transversal ou longitudinal contínua ao longo do fuste.", acao: "Refugo Imediato (Perda de Capacidade Mecânica)", responsavel: "Philippe / Ricardo", responsaveisLista: ["Philippe", "Ricardo"] },
  J: { codigo: "J", descricao: "Pequenas Avarias", classificacao: "NÃO CRÍTICO", status: "Retrabalho (RR)", detalhamento: "Lascas superficiais de pequena dimensão ou rebarbas de desforma.", acao: "Acabamento e Reparo com Argamassa Estrutural", responsavel: "Ricardo / Alex", responsaveisLista: ["Ricardo", "Alex"] },
  K: { codigo: "K", descricao: "Manchas Brancas Superficiais", classificacao: "NÃO CRÍTICO", status: "Retrabalho (RR)", detalhamento: "Eflorescência salina ou manchas de nata de cimento na superfície.", acao: "Limpeza Química / Escovação da Superfície", responsavel: "Philippe / Ricardo", responsaveisLista: ["Philippe", "Ricardo"] },
  L: { codigo: "L", descricao: "Buchas das Caixas / Buchas EDP", classificacao: "NÃO CRÍTICO", status: "Retrabalho (RR)", detalhamento: "Buchas de fixação desalinhadas ou obstruídas com nata de concreto.", acao: "Limpeza das Roscas / Re-macho de Rosca", responsavel: "Osmar / José Carlos", responsaveisLista: ["Osmar", "José Carlos"] },
  M: { codigo: "M", descricao: "Parafuso Lacre da Caixa do Medidor", classificacao: "NÃO CRÍTICO", status: "Retrabalho (RR)", detalhamento: "Prisioneiros de lacre ou aterramento cobertos de nata.", acao: "Limpeza dos Prisioneiros e Roscas", responsavel: "Osmar / José Carlos", responsaveisLista: ["Osmar", "José Carlos"] },
  O: { codigo: "O", descricao: "Falha no Concreto (Concreto Segregado)", classificacao: "CRÍTICO", status: "Reprova (R)", detalhamento: "Segregação entre brita e argamassa ou falta de homogeneidade do concreto.", acao: "Refugo Imediato (Falta de Resistência Mecânica)", responsavel: "Ricardo / Alex", responsaveisLista: ["Ricardo", "Alex"] },
  P: { codigo: "P", descricao: "Grandes Avarias", classificacao: "CRÍTICO", status: "Reprova (R)", detalhamento: "Fraturas, quebras de quinas extensas ou avarias de transporte interno.", acao: "Refugo / Sucata (Dano Estrutural Irreversível)", responsavel: "Ricardo / Alex", responsaveisLista: ["Ricardo", "Alex"] }
};

function getDefeitoInfo(codigo) {
  const c = String(codigo || "").trim().toUpperCase();
  return MATRIZ_DEFEITOS_RESPONSAVEIS[c] || {
    codigo: c || "-",
    descricao: "Não especificado",
    classificacao: "NÃO CRÍTICO",
    status: "Retrabalho (RR)",
    detalhamento: "Não conformidade técnica registrada.",
    acao: "Análise técnica de qualidade",
    responsavel: "Equipe de Qualidade",
    responsaveisLista: ["Equipe de Qualidade"]
  };
}

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
  { codigo: "CM", descricao: "Padrao Cemig 1 cx VL - 7,0 x150", setor: "Setor 1", codigoProduto: "953", chaves: ["CM", "BC"] },
  { codigo: "N", descricao: "Poste 7,5 X 600 VL", setor: "Setor 1", codigoProduto: "936", chaves: ["N"] },
  { codigo: "M", descricao: "Poste 7,5 X 600 VR", setor: "Setor 1", codigoProduto: "939", chaves: ["M"] },
  { codigo: "TCL", descricao: "Poste 7,5 X 600 VL c/", setor: "Setor 2", codigoProduto: "937", chaves: ["TCL"] },
  { codigo: "TCR", descricao: "Poste 7,5 X 600 VR c/", setor: "Setor 2", codigoProduto: "940", chaves: ["TCR"] },
  { codigo: "100", descricao: "Poste Subterraneo 100 A", setor: "Setor 1", codigoProduto: "949", chaves: ["100"] },
  { codigo: "SB-E1", descricao: "Poste Subterraneo 100 A - Elektro", setor: "Setor 1", codigoProduto: "4848", chaves: ["SB-E1"] },
  { codigo: "200", descricao: "Poste Subterraneo 200 A - TC", setor: "Setor 1", codigoProduto: "5017", chaves: ["200"] },
  { codigo: "TOTEM", descricao: "Totem de medicao indireta Elektro", setor: "Setor 2", codigoProduto: "13570", chaves: ["TOTEM", "A-TOTEM", "TMIE"] },
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
  { forma: "BC - 01", modelo: "1 CX VL 7,0 x 150" },
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
  { forma: "SBE-1", modelo: "SUB. 100-AMP-E" },
  { forma: "SBE-2", modelo: "SUB. 100-AMP-E" },
  { forma: "200 -1", modelo: "SUB. 200-AMP C/ TC" },
  { forma: "200 -2", modelo: "SUB. 200-AMP C/ TC" },
  { forma: "DE-03", modelo: "2 CXS VL" },
  { forma: "DE-02", modelo: "2 CXS VL" },
  { forma: "DE-01", modelo: "2 CXS VL" },
  { forma: "N-01", modelo: "1 CX VL - 600" }
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
  { forma: "B-15", modelo: "1 CX VL" },
  { forma: "TMIE-1", label: "TMIE-1", modelo: "Totem Med. Ind. Elecktro" }
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

const MANUTENCAO_FORMAS_KEY = "mapa_formas_manutencao_v1";
const MANUTENCAO_FORMAS_TABLE = "formas_manutencao";

function isManutencaoAuthorizedUser() {
  if (!state.authUser || !state.authUser.name) return false;
  const name = String(state.authUser.name).trim().toLowerCase();
  const role = String(state.authUser.role || "").trim().toUpperCase();
  if (role === "GESTOR" || role === "GERENCIA" || role === "ADMIN") return true;
  return name.includes("ricardo") || name.includes("philippe") || name.includes("jose carlos") || name.includes("josé carlos");
}

function getFormasManutencao() {
  try {
    const raw = localStorage.getItem(MANUTENCAO_FORMAS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function salvarFormasManutencaoObj(obj) {
  try {
    localStorage.setItem(MANUTENCAO_FORMAS_KEY, JSON.stringify(obj));
  } catch(e) {
    console.error("Erro ao salvar formas manutencao:", e);
  }
}

function mergeFormasManutencao(localObj, remoteRows) {
  const merged = { ...(localObj || {}) };
  (remoteRows || []).forEach((row) => {
    const key = row.id || `${row.setor}_${row.forma_numero}`;
    const local = merged[key];
    const localTime = new Date(local?.updated_at || 0).getTime();
    const remoteTime = new Date(row.updated_at || 0).getTime();
    if (!local || remoteTime >= localTime) merged[key] = row;
  });
  return merged;
}

async function carregarFormasManutencaoSupabase() {
  if (!supabaseClient || !navigator.onLine) return getFormasManutencao();
  try {
    const { data, error } = await supabaseClient
      .from(MANUTENCAO_FORMAS_TABLE)
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    const merged = mergeFormasManutencao(getFormasManutencao(), data || []);
    salvarFormasManutencaoObj(merged);
    return merged;
  } catch (err) {
    console.warn("Manutencao: usando cache local; falha ao carregar Supabase:", err);
    return getFormasManutencao();
  }
}

async function sincronizarFormaManutencaoSupabase(record) {
  if (!supabaseClient || !navigator.onLine || !record) return;
  try {
    const { error } = await supabaseClient
      .from(MANUTENCAO_FORMAS_TABLE)
      .upsert(record, { onConflict: "id" });
    if (error) throw error;
  } catch (err) {
    console.warn("Manutencao: registro mantido offline; falha ao sincronizar:", err);
  }
}

async function sincronizarManutencaoLocalPendente() {
  if (!supabaseClient || !navigator.onLine) return;
  const all = getFormasManutencao();
  await Promise.all(Object.entries(all).map(([key, record]) => sincronizarFormaManutencaoSupabase({ id: key, ...record })));
  await carregarFormasManutencaoSupabase();
}

function getManutencaoKey(setor, formaNumero) {
  return `${String(setor || "").trim()}_${normalizeUpper(formaNumero)}`;
}

function isFormaEmManutencao(setor, formaNumero) {
  const all = getFormasManutencao();
  const key = getManutencaoKey(setor, formaNumero);
  const rec = all[key];
  if (rec && rec.status === "PARADA") {
    return rec;
  }
  return null;
}

function salvarFormaParadaManutencao(setor, formaNumero, motivo, acao) {
  const all = getFormasManutencao();
  const key = getManutencaoKey(setor, formaNumero);
  const nowStr = new Date().toLocaleString("pt-BR");
  const userStr = state.authUser?.name || "Usuário";
  
  all[key] = {
    id: key,
    setor: String(setor || "").trim(),
    forma_numero: normalizeUpper(formaNumero),
    status: "PARADA",
    motivo_parada: motivo,
    acao_necessaria: acao,
    parada_em: nowStr,
    parada_por: userStr,
    liberada_em: null,
    liberada_por: null,
    obs_liberacao: null,
    updated_at: new Date().toISOString()
  };
  salvarFormasManutencaoObj(all);
  sincronizarFormaManutencaoSupabase(all[key]);
  atualizarIndicadoresManutencaoHub();
}

function liberarFormaManutencao(setor, formaNumero, obs) {
  const all = getFormasManutencao();
  const key = getManutencaoKey(setor, formaNumero);
  const nowStr = new Date().toLocaleString("pt-BR");
  const userStr = state.authUser?.name || "Usuário";
  
  if (!all[key]) {
    all[key] = {
      id: key,
      setor: String(setor || "").trim(),
      forma_numero: normalizeUpper(formaNumero),
      motivo_parada: "Manutenção",
      acao_necessaria: "Manutenção",
      parada_em: nowStr,
      parada_por: userStr
    };
  }
  all[key].id = key;
  all[key].status = "LIBERADA";
  all[key].liberada_em = nowStr;
  all[key].liberada_por = userStr;
  all[key].obs_liberacao = obs;
  all[key].updated_at = new Date().toISOString();
  salvarFormasManutencaoObj(all);
  sincronizarFormaManutencaoSupabase(all[key]);
  atualizarIndicadoresManutencaoHub();
}

let pendingManutencaoSelection = null;

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
  odinMode: false,
  manutencaoMode: false,
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
  hubMandrilCircular: document.getElementById("hubMandrilCircular"),
  viewMandrilCircular: document.getElementById("viewMandrilCircular"),
  mcFiltroData: document.getElementById("mcFiltroData"),
  mcQtdItens: document.getElementById("mcQtdItens"),
  mcTabelaBody: document.getElementById("mcTabelaBody"),
  mcTabMapa: document.getElementById("mcTabMapa"),
  mcTabTabela: document.getElementById("mcTabTabela"),
  mcContainerMapa: document.getElementById("mcContainerMapa"),
  mcContainerTabela: document.getElementById("mcContainerTabela"),
  mcMapaEsquerdo: document.getElementById("mcMapaEsquerdo"),
  mcMapaDireito: document.getElementById("mcMapaDireito"),
  hubInspecao: document.getElementById("hubInspecao"),
  hubMontagemPostes: document.getElementById("hubMontagemPostes"),
  hubSequenciaS3: document.getElementById("hubSequenciaS3"),
  hubMontagemIndicadores: document.getElementById("hubMontagemIndicadores"),
  hubDashboardDefeitos: document.getElementById("hubDashboardDefeitos"),
  hubRelatorio: document.getElementById("hubRelatorio"),
  hubHistorico: document.getElementById("hubHistorico"),
  viewLiberacao: document.getElementById("viewLiberacao"),
  viewInspecao: document.getElementById("viewInspecao"),
  viewMontagemPostes: document.getElementById("viewMontagemPostes"),
  viewSequenciaS3: document.getElementById("viewSequenciaS3"),
  seqS3Data: document.getElementById("seqS3Data"),
  seqS3Search: document.getElementById("seqS3Search"),
  seqS3List: document.getElementById("seqS3List"),
  seqS3BtnSalvar: document.getElementById("seqS3BtnSalvar"),
  seqS3FloatBar: document.getElementById("seqS3FloatBar"),
  viewMontagemIndicadores: document.getElementById("viewMontagemIndicadores"),
  viewMontagemPostesDetalhe: document.getElementById("viewMontagemPostesDetalhe"),
  viewRelatorio: document.getElementById("viewRelatorio"),
  viewHistorico: document.getElementById("viewHistorico"),
  hubRelatorioManutencao: document.getElementById("hubRelatorioManutencao"),
  viewRelatorioManutencao: document.getElementById("viewRelatorioManutencao"),
  hubTratativaDefeitos: document.getElementById("hubTratativaDefeitos"),
  viewTratativaDefeitos: document.getElementById("viewTratativaDefeitos"),
  kioskManutencaoCheckbox: document.getElementById("kioskManutencaoCheckbox"),
  kioskManutencaoToggleField: document.getElementById("kioskManutencaoToggleField"),
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
  kioskOdinToggleField: document.getElementById("kioskOdinToggleField"),
  kioskOdinCheckbox: document.getElementById("kioskOdinCheckbox"),
  btnKioskFullscreen: document.getElementById("btnKioskFullscreen"),
  btnKioskSync: document.getElementById("btnKioskSync"),
  btnKioskBack: document.getElementById("btnKioskBack"),
  kioskLibData: document.getElementById("kioskLibData"),
  kioskLibColaborador: document.getElementById("kioskLibColaborador"),
  kioskProgressoContador: document.getElementById("kioskProgressoContador"),

  insFiltroData: document.getElementById("insFiltroData"),
  insModoCarga: document.getElementById("insModoCarga"),
  insStatusFiltro: document.getElementById("insStatusFiltro"),
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

  viewInspecaoDetalhe: document.getElementById("viewInspecaoDetalhe"),
  insDetalheHeader: document.getElementById("insDetalheHeader"),
  insChecklistSections: document.getElementById("insChecklistSections"),
  insObservacoes: document.getElementById("insObservacoes"),
  insStatusButtons: document.getElementById("insStatusButtons"),
  insStatusAprovado: document.getElementById("insStatusAprovado"),
  insStatusReprovado: document.getElementById("insStatusReprovado"),
  insStatusRR: document.getElementById("insStatusRR"),
  insFinalizarPoste: document.getElementById("insFinalizarPoste"),

  mpFiltroData: document.getElementById("mpFiltroData"),
  mpModoCarga: document.getElementById("mpModoCarga"),
  mpSetor: document.getElementById("mpSetor"),
  mpStatusFiltro: document.getElementById("mpStatusFiltro"),
  mpCarregarLiberados: document.getElementById("mpCarregarLiberados"),
  mpLiberadosBody: document.getElementById("mpLiberadosBody"),
  mpQtdItens: document.getElementById("mpQtdItens"),
  mpKpiAprovados: document.getElementById("mpKpiAprovados"),
  mpKpiRetrabalho: document.getElementById("mpKpiRetrabalho"),
  mpKpiReprovados: document.getElementById("mpKpiReprovados"),
  mpFormaFiltro: document.getElementById("mpFormaFiltro"),
  mpDetalheHeader: document.getElementById("mpDetalheHeader"),
  mpStatusButtons: document.getElementById("mpStatusButtons"),
  mpStatusAprovado: document.getElementById("mpStatusAprovado"),
  mpStatusReprovado: document.getElementById("mpStatusReprovado"),
  mpStatusRR: document.getElementById("mpStatusRR"),
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
  relBtnImprimir: document.getElementById("relBtnImprimir"),
  relBtnWhatsapp: document.getElementById("relBtnWhatsapp"),
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

function nowDeviceLocalIso() {
  const d = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  const offsetMinutes = -d.getTimezoneOffset();
  const offsetSign = offsetMinutes >= 0 ? "+" : "-";
  const absOffset = Math.abs(offsetMinutes);
  const offset = `${offsetSign}${pad(Math.floor(absOffset / 60))}:${pad(absOffset % 60)}`;
  return [
    d.getFullYear(),
    pad(d.getMonth() + 1),
    pad(d.getDate())
  ].join("-") + "T" + [
    pad(d.getHours()),
    pad(d.getMinutes()),
    pad(d.getSeconds())
  ].join(":") + offset;
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
  if (normalized.startsWith("TMIE")) return "TMIE";
  if (normalized.startsWith("BC")) return "BC";
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

const MAPA_REPORT_CACHE_PREFIX = "mapa_concretagem_report_cache_v1";
const MAPA_REPORT_DEFAULT_TIMEOUT_MS = 15000;

function readMapaReportCache(cacheKey) {
  try {
    const raw = localStorage.getItem(`${MAPA_REPORT_CACHE_PREFIX}:${cacheKey}`);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    if (!payload || !Array.isArray(payload.rows)) return null;
    return payload;
  } catch {
    return null;
  }
}

function writeMapaReportCache(cacheKey, rows) {
  try {
    localStorage.setItem(`${MAPA_REPORT_CACHE_PREFIX}:${cacheKey}`, JSON.stringify({
      ts: Date.now(),
      generated_at: new Date().toISOString(),
      rows: rows || []
    }));
  } catch {}
}

async function carregarLinhasSupabaseComCache(options) {
  const opts = options || {};
  const cacheKey = opts.cacheKey;
  const pageSize = opts.pageSize || 1000;
  const maxPages = opts.maxPages || 20;
  const timeoutMs = opts.timeoutMs || MAPA_REPORT_DEFAULT_TIMEOUT_MS;

  if (!supabaseClient) {
    const cached = cacheKey ? readMapaReportCache(cacheKey) : null;
    return { rows: cached?.rows || [], state: cached ? "OFFLINE_CACHE" : "ERROR" };
  }

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    let allRows = [];
    for (let page = 0; page < maxPages; page++) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      let query = supabaseClient
        .from(opts.table)
        .select(opts.select || "*")
        .range(from, to);

      if (typeof opts.applyFilters === "function") query = opts.applyFilters(query);
      if (opts.orderBy) query = query.order(opts.orderBy, opts.orderOptions || {});
      if (controller && typeof query.abortSignal === "function") query = query.abortSignal(controller.signal);

      const { data, error } = await query;
      if (error) throw error;
      if (Array.isArray(data) && data.length) allRows = allRows.concat(data);
      if (!data || data.length < pageSize) break;
    }

    if (cacheKey) writeMapaReportCache(cacheKey, allRows);
    return { rows: allRows, state: allRows.length ? "SUCCESS" : "EMPTY" };
  } catch (error) {
    const cached = cacheKey ? readMapaReportCache(cacheKey) : null;
    if (cached && cached.rows.length) {
      console.warn("Relatorio: usando cache local apos falha no Supabase:", error);
      return { rows: cached.rows, state: "OFFLINE_CACHE", error };
    }
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
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

async function saveProducaoByNaturalKey(row) {
  const { data: existingRows, error: selectError } = await supabaseClient
    .from('producao')
    .select('id')
    .eq('data_fabricacao', row.data_fabricacao)
    .eq('setor', row.setor)
    .eq('forma', row.forma)
    .order('data_hora', { ascending: false, nullsFirst: false });

  if (selectError) throw selectError;

  const [current, ...duplicates] = existingRows || [];
  if (current?.id) {
    const { error: updateError } = await supabaseClient
      .from('producao')
      .update(row)
      .eq('id', current.id);
    if (updateError) throw updateError;

    if (duplicates.length) {
      await supabaseClient
        .from('producao')
        .delete()
        .in('id', duplicates.map((item) => item.id));
    }
    return;
  }

  const { error: insertError } = await supabaseClient.from('producao').insert(row);
  if (insertError) throw insertError;
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

      if (payload.status === "P" || payload.status === "PROGRAMADA") {
        const { error } = await supabaseClient.from('programacao_pcp').upsert({
          data_fabricacao: payload.dataFabricacao,
          setor: payload.setor,
          forma: payload.forma,
          modelo: payload.modelo,
          codigo_poste: payload.codigo_poste || null,
          descricao_poste: payload.descricao_poste || null,
          codigo_produto: payload.codigo_produto || null,
          quantidade: 1,
          data_hora: dtStr
        }, { onConflict: 'data_fabricacao,setor,forma' });
        if (error) throw error;
      } else if (payload.status === "L" || (payload.status === "LIBERADO" && payload.tipo_concreto === "Padrão")) {
        const { error } = await supabaseClient.from('liberacao_formas').upsert({
          data_fabricacao: payload.dataFabricacao,
          setor: payload.setor,
          forma: payload.forma,
          colaborador: payload.colaborador,
          data_hora: dtStr
        }, { onConflict: 'data_fabricacao,setor,forma' });
        if (error) throw error;
      } else {
        await saveProducaoByNaturalKey({
          data_fabricacao: payload.dataFabricacao,
          setor: payload.setor,
          forma: payload.forma,
          modelo: payload.modelo,
          codigo_poste: payload.codigo_poste || null,
          descricao_poste: payload.descricao_poste || null,
          codigo_produto: payload.codigo_produto || null,
          tipo_concreto: payload.tipo_concreto || 'Padrão',
          colaborador: payload.colaborador,
          data_hora: dtStr,
          status: 'LIBERADO'
        });
      }

      return { ok: true, message: "Forma salva nos novos esquemas com sucesso" };
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

// Mapa de icones por codigo de defeito
const DEFEITO_ICONES = {
  A: "\uD83D\uDD73\uFE0F",   // 🕳️  — Falha de Preenchimento / Armação Aparente (vazio/buraco)
  B: "\uD83D\uDEB1",         // 🚱  — Tubulação Entupida (sem fluxo)
  C: "\uD83E\uDEB7",         // 🫧  — Bolhas em Excesso / Fora do Padrão
  D: "\uD83D\uDCE6",         // 📦  — Problema na Caixa do Relógio/Disjuntor
  E: "\uD83D\uDD29",         // 🔩  — Furação Obstruída (pinos)
  F: "\uD83C\uDFF7\uFE0F",   // 🏷️  — Carimbo de Identificação
  G: "\uD83E\uDEB6",         // 🪶  — Fissuras superficiais
  H: "\uD83E\uDEB7",         // 🫧  — Bolhas nas Caixas
  I: "\u26A1",               // ⚡  — Trincas em toda extensão
  J: "\uD83D\uDCA5",         // 💥  — Pequenas Avarias
  K: "\uD83C\uDFA8",         // 🎨  — Manchas Excessivas
  L: "\uD83D\uDD27",         // 🔧  — Buchas de Fixação
  M: "\uD83D\uDD10",         // 🔐  — Parafuso Lacre da Caixa do Medidor
  O: "\uD83E\uDEA8",         // 🪨  — Concreto Segregado / Homogeneidade
  P: "\uD83D\uDEA8",         // 🚨  — Grandes Avarias (emergência)
  Q: "\u2702\uFE0F",         // ✂️  — Rebarbas
  R: "\uD83E\uDDF1",         // 🧱  — Acabamento Face Exposta
  S: "\uD83D\uDCD0",         // 📐  — Acabamento Abas
};

function getMotivoRecusaLabel(value) {
  if (!value) return "-";
  const parts = String(value).split(/,\s*/);
  const labels = parts.map((part) => {
    const cod = part.trim().toUpperCase();
    const found = CHECKLIST_INSPECAO_CODIGOS.find((item) => item.codigo === cod);
    const icone = DEFEITO_ICONES[cod] || "\uD83D\uDD39";
    return found ? `${icone} ${found.codigo} \u2014 ${found.descricao}` : `${icone} ${part}`;
  });
  return labels.join("  |  ");
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
  if (!el.insChecklistCodigos) return;
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
      const colaborador = getProductionCollaborator();
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
    card.disabled = !state.programmingMode && !state.liberationMode && !state.odinMode && !state.manutencaoMode;
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

  // Verificar se a forma está em manutenção (Parada)
  const manutencaoRec = isFormaEmManutencao(setor, item.forma);
  if (manutencaoRec) {
    card.classList.add("is-manutencao");
    card.title = `🛠️ PARADA / MANUTENÇÃO\nMotivo: ${manutencaoRec.motivo_parada}\nArrumar: ${manutencaoRec.acao_necessaria}`;
  }

  // Destacar se estiver programada
  if (state.programmedFormas && state.programmedFormas.has(normalizeUpper(item.forma))) {
    card.classList.add("is-programmed");
  }

  const handleCardClickWithMaintenance = (normalAction) => {
    if (state.manutencaoMode) {
      if (manutencaoRec) {
        openModalLiberacao(setor, item.forma, manutencaoRec);
      } else {
        openModalParada(setor, item.forma);
      }
      return;
    }
    if (manutencaoRec) {
      if (typeof msgbox !== "undefined") {
        msgbox.alert(
          `🛠️ FORMA EM MANUTENÇÃO!\n\nA forma ${item.forma} (${setor}) está INATIVA para manutenção e não pode ser programada nem liberada.\n\n• Motivo: ${manutencaoRec.motivo_parada}\n• Serviço: ${manutencaoRec.acao_necessaria}\n• Parada em: ${manutencaoRec.parada_em} por ${manutencaoRec.parada_por}`
        );
      } else {
        alert(`🛠️ FORMA EM MANUTENÇÃO!\nForma ${item.forma} está inativa.\nMotivo: ${manutencaoRec.motivo_parada}`);
      }
      return;
    }
    normalAction();
  };

  if (isFormaClicked(item.forma, setor)) {
    const tipo = getConcreteTypeForForma(item.forma, setor);
    if (tipo) {
      tipoEl.textContent = tipo;
      tipoEl.style.display = "block";
    }
    setCardState(card, "saved");

    card.addEventListener("click", () => {
      handleCardClickWithMaintenance(() => {
        if (state.programmingMode) {
          toggleFormaProgramada(item.forma, setor, card);
          return;
        }
        if (state.odinMode) {
          cancelarOuDesprogramarOdin(item.forma, setor, card);
          return;
        }
      });
    });
  } else if (isFormaLiberada(item.forma, setor)) {
    card.classList.add("is-liberada");
    card.addEventListener("click", () => {
      handleCardClickWithMaintenance(() => {
        if (state.programmingMode) {
          toggleFormaProgramada(item.forma, setor, card);
          return;
        }
        if (state.odinMode) {
          cancelarOuDesprogramarOdin(item.forma, setor, card);
          return;
        }
        if (state.liberationMode) {
          return;
        }
        const data = el.libData?.value;
        const colaborador = getProductionCollaborator();
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
    });
  } else {
    card.addEventListener("click", () => {
      handleCardClickWithMaintenance(() => {
        if (state.programmingMode) {
          toggleFormaProgramada(item.forma, setor, card);
          return;
        }
        if (state.odinMode) {
          cancelarOuDesprogramarOdin(item.forma, setor, card);
          return;
        }
        const data = el.libData?.value;
        const colaborador = getProductionCollaborator();
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

  // Verificar se a forma está em manutenção (Parada)
  const manutencaoRec = isFormaEmManutencao(setor, item.forma);
  if (manutencaoRec) {
    tdForma.classList.add("is-manutencao");
    tdForma.title = `🛠️ PARADA / MANUTENÇÃO\nMotivo: ${manutencaoRec.motivo_parada}\nArrumar: ${manutencaoRec.acao_necessaria}`;
  }

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
    if (state.manutencaoMode) {
      if (manutencaoRec) {
        openModalLiberacao(setor, item.forma, manutencaoRec);
      } else {
        openModalParada(setor, item.forma);
      }
      return;
    }
    if (manutencaoRec) {
      if (typeof msgbox !== "undefined") {
        msgbox.alert(
          `🛠️ FORMA EM MANUTENÇÃO!\n\nA forma ${item.forma} (${setor}) está INATIVA para manutenção e não pode ser programada nem liberada.\n\n• Motivo: ${manutencaoRec.motivo_parada}\n• Serviço: ${manutencaoRec.acao_necessaria}\n• Parada em: ${manutencaoRec.parada_em} por ${manutencaoRec.parada_por}`
        );
      } else {
        alert(`🛠️ FORMA EM MANUTENÇÃO!\nForma ${item.forma} está inativa.\nMotivo: ${manutencaoRec.motivo_parada}`);
      }
      return;
    }
    if (state.programmingMode) {
      toggleFormaProgramada(item.forma, setor, tdForma);
      return;
    }
    if (state.odinMode) {
      cancelarOuDesprogramarOdin(item.forma, setor, tdForma);
      return;
    }
    const data = el.libData?.value;
    const colaborador = getProductionCollaborator();
    if (!data) { showLibFeedback("Preencha a data de fabricação antes de registrar.", "error"); return; }
    if (!colaborador) { showLibFeedback("Preencha o colaborador antes de registrar.", "error"); return; }
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

function openModalParada(setor, formaNumero) {
  pendingManutencaoSelection = { setor, formaNumero };
  const titleEl = document.getElementById("mParadaTitle");
  const subEl = document.getElementById("mParadaSub");
  if (titleEl) titleEl.textContent = `Inativar Forma ${formaNumero}`;
  if (subEl) subEl.textContent = `Setor: ${setor} — Registre o motivo da parada`;
  const mot = document.getElementById("mParadaMotivo");
  const aca = document.getElementById("mParadaAcao");
  if (mot) mot.value = "";
  if (aca) aca.value = "";
  document.getElementById("modalManutencaoParada")?.classList.add("modal-visible");
}

function openModalLiberacao(setor, formaNumero, manutencaoRec) {
  pendingManutencaoSelection = { setor, formaNumero };
  const titleEl = document.getElementById("mLiberacaoTitle");
  const subEl = document.getElementById("mLiberacaoSub");
  const infoEl = document.getElementById("mLiberacaoInfo");
  if (titleEl) titleEl.textContent = `Liberar Forma ${formaNumero}`;
  if (subEl) subEl.textContent = `Setor: ${setor} — Retornar para o estado ativo`;
  if (infoEl) {
    infoEl.innerHTML = `
      <div><strong>Parada em:</strong> ${escapeHtml(manutencaoRec.parada_em || "-")} por ${escapeHtml(manutencaoRec.parada_por || "-")}</div>
      <div style="margin-top:2px;"><strong>Motivo:</strong> ${escapeHtml(manutencaoRec.motivo_parada || "-")}</div>
      <div style="margin-top:2px;"><strong>Serviço Solicitado:</strong> ${escapeHtml(manutencaoRec.acao_necessaria || "-")}</div>
    `;
  }
  const obs = document.getElementById("mLiberacaoObs");
  if (obs) obs.value = "";
  document.getElementById("modalManutencaoLiberacao")?.classList.add("modal-visible");
}

function getRelatorioManutencaoFiltros() {
  return {
    status: document.getElementById("rmFiltroStatus")?.value || "TODOS",
    dataInicio: document.getElementById("rmFiltroDataInicio")?.value || "",
    dataFim: document.getElementById("rmFiltroDataFim")?.value || ""
  };
}

function manutencaoRecordMatchesFiltros(item, filtros) {
  if (filtros.status !== "TODOS" && item.status !== filtros.status) return false;
  const updatedAt = item.updated_at ? String(item.updated_at).slice(0, 10) : "";
  if (filtros.dataInicio && updatedAt && updatedAt < filtros.dataInicio) return false;
  if (filtros.dataFim && updatedAt && updatedAt > filtros.dataFim) return false;
  return true;
}

function atualizarIndicadoresManutencaoHub() {
  const counts = { "Setor 1": 0, "Setor 2": 0, "Setor 3": 0, "Setor 4": 0 };
  Object.values(getFormasManutencao()).forEach((item) => {
    if (item.status === "PARADA" && Object.prototype.hasOwnProperty.call(counts, item.setor)) {
      counts[item.setor] += 1;
    }
  });
  const map = {
    manKpiS1: counts["Setor 1"],
    manKpiS2: counts["Setor 2"],
    manKpiS3: counts["Setor 3"],
    manKpiS4: counts["Setor 4"]
  };
  Object.entries(map).forEach(([id, value]) => {
    const node = document.getElementById(id);
    if (node) node.textContent = String(value);
  });
}

function calcularDiasParada(paradaEmStr, liberadaEmStr, status) {
  if (!paradaEmStr) return { dias: 0, label: "-" };
  
  let dateInicio = null;
  if (paradaEmStr.includes("/")) {
    const parts = paradaEmStr.split(",");
    const dateParts = parts[0].trim().split("/");
    if (dateParts.length === 3) {
      dateInicio = new Date(`${dateParts[2]}-${dateParts[1].padStart(2, "0")}-${dateParts[0].padStart(2, "0")}`);
    }
  }
  if (!dateInicio || isNaN(dateInicio.getTime())) {
    dateInicio = new Date(paradaEmStr);
  }
  if (isNaN(dateInicio.getTime())) return { dias: 0, label: "-" };
  
  let dateFim = new Date();
  if (status === "LIBERADA" && liberadaEmStr) {
    let dateLib = null;
    if (liberadaEmStr.includes("/")) {
      const parts = liberadaEmStr.split(",");
      const dateParts = parts[0].trim().split("/");
      if (dateParts.length === 3) {
        dateLib = new Date(`${dateParts[2]}-${dateParts[1].padStart(2, "0")}-${dateParts[0].padStart(2, "0")}`);
      }
    }
    if (!dateLib || isNaN(dateLib.getTime())) {
      dateLib = new Date(liberadaEmStr);
    }
    if (dateLib && !isNaN(dateLib.getTime())) {
      dateFim = dateLib;
    }
  }
  
  const diffMs = Math.max(0, dateFim.getTime() - dateInicio.getTime());
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  let label = "";
  if (diffDays === 0) {
    label = "Hoje (< 1 dia)";
  } else if (diffDays === 1) {
    label = "1 dia";
  } else {
    label = `${diffDays} dias`;
  }
  return { dias: diffDays, label };
}

function renderizarRelatorioManutencao() {
  const tbody = document.getElementById("rmTabelaBody");
  const totalEl = document.getElementById("rmTabelaTotal");
  if (!tbody) return;
  
  const all = getFormasManutencao();
  const filtros = getRelatorioManutencaoFiltros();
  const list = Object.values(all)
    .filter((item) => manutencaoRecordMatchesFiltros(item, filtros))
    .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
  
  if (totalEl) totalEl.textContent = list.length;
  atualizarIndicadoresManutencaoHub();
  
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 20px; color:#64748b;">Nenhuma forma em manutenção registrada até o momento.</td></tr>`;
    return;
  }
  
  tbody.innerHTML = list.map(item => {
    const isParada = item.status === "PARADA";
    const statusBadge = isParada 
      ? `<span style="background:#fef3c7; color:#92400e; border:1px solid #f59e0b; padding:4px 10px; border-radius:6px; font-weight:800; font-size:0.75rem; white-space:nowrap; display:inline-flex; align-items:center; justify-content:center; gap:4px;">🛠️ PARADA</span>`
      : `<span style="background:#d1fae5; color:#065f46; border:1px solid #10b981; padding:4px 10px; border-radius:6px; font-weight:800; font-size:0.75rem; white-space:nowrap; display:inline-flex; align-items:center; justify-content:center; gap:4px;">✅ LIBERADA</span>`;
      
    const tempoInfo = calcularDiasParada(item.parada_em, item.liberada_em, item.status);
    const tempoBadge = isParada
      ? `<span style="background:#fee2e2; color:#991b1b; border:1px solid #f87171; padding:4px 10px; border-radius:12px; font-weight:800; font-size:0.75rem; white-space:nowrap; display:inline-flex; align-items:center; justify-content:center; gap:4px;">⏱️ ${tempoInfo.label}</span>`
      : `<span style="background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; padding:4px 10px; border-radius:12px; font-weight:700; font-size:0.75rem; white-space:nowrap; display:inline-flex; align-items:center; justify-content:center; gap:4px;">✔️ ${tempoInfo.label}</span>`;
      
    const acaoBtn = isParada
      ? `<button type="button" class="btn btn-sm btn-liberar-relatorio" data-setor="${escapeHtml(item.setor)}" data-forma="${escapeHtml(item.forma_numero)}" style="background:#10b981; color:#fff; border:none; padding:6px 12px; font-size:0.78rem; font-weight:800; border-radius:6px; cursor:pointer; box-shadow:0 2px 4px rgba(16,185,129,0.25); white-space:nowrap; display:inline-flex; align-items:center; gap:4px;">🔓 Liberar</button>`
      : `<button type="button" class="btn btn-sm btn-ver-relatorio" data-setor="${escapeHtml(item.setor)}" data-forma="${escapeHtml(item.forma_numero)}" style="background:#e2e8f0; color:#334155; border:none; padding:6px 12px; font-size:0.78rem; font-weight:700; border-radius:6px; cursor:pointer; white-space:nowrap; display:inline-flex; align-items:center; gap:4px;">🔍 Histórico</button>`;

    return `
      <tr class="rm-tabela-row ${isParada ? 'rm-row-parada' : 'rm-row-liberada'}" data-setor="${escapeHtml(item.setor)}" data-forma="${escapeHtml(item.forma_numero)}" style="cursor:pointer;" title="Clique para ${isParada ? 'liberar esta forma' : 'ver histórico'}">
        <td style="text-align:center; font-weight:700; color:#475569;">${escapeHtml(item.setor || "-")}</td>
        <td style="text-align:center; font-weight:900; color:#0f172a; font-size:0.92rem;">${escapeHtml(item.forma_numero || "-")}</td>
        <td style="text-align:center; vertical-align:middle;">${statusBadge}</td>
        <td style="text-align:center; vertical-align:middle;">${tempoBadge}</td>
        <td style="font-size:0.85rem; color:#1e293b;">${escapeHtml(item.motivo_parada || "-")}</td>
        <td style="font-size:0.85rem; color:#1e293b;">${escapeHtml(item.acao_necessaria || "-")}</td>
        <td style="font-size:0.8rem; color:#475569; line-height:1.3;">${escapeHtml(item.parada_em || "-")}<br><small style="color:#64748b; font-weight:600;">por ${escapeHtml(item.parada_por || "-")}</small></td>
        <td style="font-size:0.8rem; color:#475569; line-height:1.3;">${item.liberada_em ? `${escapeHtml(item.liberada_em)}<br><small style="color:#64748b; font-weight:600;">por ${escapeHtml(item.liberada_por || "-")}</small>` : "-"}</td>
        <td style="font-size:0.85rem; color:#1e293b;">${escapeHtml(item.obs_liberacao || "-")}</td>
        <td style="text-align:center; vertical-align:middle;">${acaoBtn}</td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll(".rm-tabela-row").forEach(row => {
    row.addEventListener("click", () => {
      const setor = row.getAttribute("data-setor");
      const formaNumero = row.getAttribute("data-forma");
      if (!setor || !formaNumero) return;
      
      const allFormas = getFormasManutencao();
      const manutencaoRec = allFormas[getManutencaoKey(setor, formaNumero)];
      if (manutencaoRec && manutencaoRec.status === "PARADA") {
        openModalLiberacao(setor, formaNumero, manutencaoRec);
      } else if (manutencaoRec) {
        alert(`Forma ${formaNumero} (${setor})\nStatus: LIBERADA em ${manutencaoRec.liberada_em || '-'}\nPor: ${manutencaoRec.liberada_por || '-'}\nObservação: ${manutencaoRec.obs_liberacao || '-'}`);
      }
    });
  });
}

/* =========================================================
   RELATÓRIO DE DEFEITOS & TRATATIVA DE QUALIDADE (A-P)
   ========================================================= */
const TRATATIVA_DEFEITOS_KEY = "mapa_tratativa_defeitos_v1";
let pendingTratativaSelection = null;

function getTratativaDefeitos() {
  try {
    const raw = localStorage.getItem(TRATATIVA_DEFEITOS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function salvarTratativaDefeitosObj(obj) {
  try {
    localStorage.setItem(TRATATIVA_DEFEITOS_KEY, JSON.stringify(obj));
  } catch (e) {
    console.error("Erro ao salvar tratativa de defeitos:", e);
  }
}

function salvarTratativaDefeitoRegistro(record) {
  const all = getTratativaDefeitos();
  const id = record.id || `INC_${record.data_fabricacao || todayYmd()}_${record.setor}_${record.forma_numero}_${record.codigo_defeito}`;
  record.id = id;
  record.updated_at = new Date().toISOString();
  all[id] = record;
  salvarTratativaDefeitosObj(all);
  return record;
}

function renderizarRelatorioTratativaDefeitos() {
  const tbody = document.getElementById("tdTabelaBody");
  const totalEl = document.getElementById("tdTabelaTotal");
  if (!tbody) return;

  const savedTratativas = getTratativaDefeitos();
  const dbDataRaw = readDb() || [];
  const dbRecords = Array.isArray(dbDataRaw) ? dbDataRaw : (dbDataRaw.records || []);
  const montagemDb = readMontagemPostesDb() || {};
  const montagemPostes = montagemDb.postes || {};

  const listaOcorrenciasMap = {};

  // 1. Mapear ocorrências dos registros de inspeção (readDb)
  dbRecords.forEach(record => {
    const dataProd = record.dataFabricacao || record.data_fabricacao || todayYmd();
    const setor = record.setor || "Geral";
    const forma = record.formaNumero || record.forma_numero || record.forma || "-";

    (record.inspecoes || []).forEach((ins, idx) => {
      const statusStr = String(ins.status || "").toUpperCase();
      const isDefeito = statusStr === "REPROVADO" || statusStr === "RETRABALHO" || statusStr === "R" || statusStr === "RR" || (Array.isArray(ins.codigos) && ins.codigos.length > 0);
      if (!isDefeito) return;

      const codigosArr = Array.isArray(ins.codigos) && ins.codigos.length > 0 
        ? ins.codigos 
        : [ins.motivo_recusa || ins.motivoRecusa || "A"];

      codigosArr.forEach(cCode => {
        const codigo = String(cCode || "A").trim().toUpperCase();
        const idKey = `INC_${dataProd}_${setor}_${forma}_${codigo}_${idx}`;
        const infoDefeito = getDefeitoInfo(codigo);
        const tratativaSalva = savedTratativas[idKey] || {};

        listaOcorrenciasMap[idKey] = {
          id: idKey,
          data_fabricacao: dataProd,
          setor: setor,
          forma_numero: forma,
          modelo: record.modelo || "-",
          codigo_defeito: codigo,
          descricao_defeito: infoDefeito.descricao,
          classificacao: infoDefeito.classificacao,
          responsavel_designado: infoDefeito.responsavel,
          responsaveis_lista: infoDefeito.responsaveisLista || [],
          acao_recomendada: infoDefeito.acao,
          status_tratativa: tratativaSalva.status_tratativa || "PENDENTE",
          executado_por: tratativaSalva.executado_por || "",
          acao_realizada: tratativaSalva.acao_realizada || "",
          tratado_em: tratativaSalva.tratado_em || "",
          observacoes_origem: ins.observacoes || record.observacoesMontagem || "",
          updated_at: tratativaSalva.updated_at || ins.timestamp || record.updated_at || new Date().toISOString()
        };
      });
    });
  });

  // 2. Mapear ocorrências do banco de Montagem de Postes (readMontagemPostesDb)
  Object.values(montagemPostes).forEach(p => {
    const statusStr = String(p.statusMontagem || p.status || "").toUpperCase();
    const isDefeito = statusStr === "REPROVADO" || statusStr === "RETRABALHO" || Boolean(p.motivoRecusa || p.motivo_recusa);
    if (!isDefeito) return;

    const codigo = String(p.motivoRecusa || p.motivo_recusa || "A").trim().toUpperCase();
    const dataProd = p.dataFabricacao || p.data_fabricacao || todayYmd();
    const setor = p.setor || "Setor 3";
    const forma = p.formaNumero || p.forma_numero || "-";
    const idKey = `INC_MNT_${dataProd}_${setor}_${forma}_${codigo}`;

    const infoDefeito = getDefeitoInfo(codigo);
    const tratativaSalva = savedTratativas[idKey] || {};

    listaOcorrenciasMap[idKey] = {
      id: idKey,
      data_fabricacao: dataProd,
      setor: setor,
      forma_numero: forma,
      modelo: p.modelo || "-",
      codigo_defeito: codigo,
      descricao_defeito: infoDefeito.descricao,
      classificacao: infoDefeito.classificacao,
      responsavel_designado: infoDefeito.responsavel,
      responsaveis_lista: infoDefeito.responsaveisLista || [],
      acao_recomendada: infoDefeito.acao,
      status_tratativa: tratativaSalva.status_tratativa || "PENDENTE",
      executado_por: tratativaSalva.executado_por || "",
      acao_realizada: tratativaSalva.acao_realizada || "",
      tratado_em: tratativaSalva.tratado_em || "",
      observacoes_origem: p.observacoesMontagem || p.observacoes || "",
      updated_at: tratativaSalva.updated_at || p.updated_at || new Date().toISOString()
    };
  });

  // 3. Mapear tratativas manuais salvas no localStorage
  Object.values(savedTratativas).forEach(item => {
    if (!listaOcorrenciasMap[item.id]) {
      const infoDefeito = getDefeitoInfo(item.codigo_defeito);
      listaOcorrenciasMap[item.id] = {
        ...item,
        descricao_defeito: item.descricao_defeito || infoDefeito.descricao,
        classificacao: item.classificacao || infoDefeito.classificacao,
        responsavel_designado: item.responsavel_designado || infoDefeito.responsavel,
        responsaveis_lista: item.responsaveis_lista || infoDefeito.responsaveisLista || [],
        acao_recomendada: item.acao_recomendada || infoDefeito.acao
      };
    }
  });

  // 4. Se a lista estiver vazia, popular demonstração com os códigos A a P
  if (Object.keys(listaOcorrenciasMap).length === 0) {
    const hoje = todayYmd();
    const setores = ["Setor 1", "Setor 2", "Setor 3", "Setor 4"];
    const codigos = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "O", "P"];

    codigos.forEach((cod, index) => {
      const info = getDefeitoInfo(cod);
      const setor = setores[index % setores.length];
      const forma = String((index + 1) * 2).padStart(2, '0');
      const idKey = `INC_DEMO_${hoje}_${setor}_${forma}_${cod}`;

      listaOcorrenciasMap[idKey] = {
        id: idKey,
        data_fabricacao: hoje,
        setor: setor,
        forma_numero: forma,
        modelo: "Poste Padrão Concretrack",
        codigo_defeito: cod,
        descricao_defeito: info.descricao,
        classificacao: info.classificacao,
        responsavel_designado: info.responsavel,
        responsaveis_lista: info.responsaveisLista || [],
        acao_recomendada: info.acao,
        status_tratativa: index % 3 === 0 ? "CONCLUIDO" : (index % 3 === 1 ? "EM_ANDAMENTO" : "PENDENTE"),
        executado_por: index % 3 === 0 ? info.responsaveisLista[0] : "",
        acao_realizada: index % 3 === 0 ? `Serviço de correção para ${info.descricao} executado com sucesso.` : "",
        tratado_em: index % 3 === 0 ? new Date().toLocaleString("pt-BR") : "",
        observacoes_origem: "Inspeção de qualidade.",
        updated_at: new Date(Date.now() - index * 3600000).toISOString()
      };
    });
  }

  let list = Object.values(listaOcorrenciasMap);

  // Aplicar filtros da interface
  const fStatus = document.getElementById("tdFiltroStatus")?.value || "TODOS";
  const fCodigo = document.getElementById("tdFiltroCodigo")?.value || "TODOS";
  const fResp = document.getElementById("tdFiltroResponsavel")?.value || "TODOS";
  const fInicio = document.getElementById("tdFiltroDataInicio")?.value || "";
  const fFim = document.getElementById("tdFiltroDataFim")?.value || "";

  list = list.filter(item => {
    if (fStatus !== "TODOS" && item.status_tratativa !== fStatus) return false;
    if (fCodigo !== "TODOS" && item.codigo_defeito !== fCodigo) return false;
    if (fResp !== "TODOS") {
      const respDesignado = String(item.responsavel_designado || "");
      const respExecutado = String(item.executado_por || "");
      const respMatch = respDesignado.includes(fResp) || respExecutado.includes(fResp);
      if (!respMatch) return false;
    }
    if (fInicio && item.data_fabricacao < fInicio) return false;
    if (fFim && item.data_fabricacao > fFim) return false;
    return true;
  });

  list.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

  // KPIs
  const total = list.length;
  const pendentes = list.filter(i => i.status_tratativa === "PENDENTE").length;
  const concluidos = list.filter(i => i.status_tratativa === "CONCLUIDO").length;
  const criticos = list.filter(i => i.classificacao === "CRÍTICO").length;

  if (totalEl) totalEl.textContent = total;
  const kTotal = document.getElementById("tdKpiTotal");
  const kPen = document.getElementById("tdKpiPendentes");
  const kConc = document.getElementById("tdKpiConcluidos");
  const kCrit = document.getElementById("tdKpiCriticos");
  if (kTotal) kTotal.textContent = total;
  if (kPen) kPen.textContent = pendentes;
  if (kConc) kConc.textContent = concluidos;
  if (kCrit) kCrit.textContent = criticos;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:24px; color:#64748b;">Nenhuma ocorrência de defeito encontrada para os filtros selecionados.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(item => {
    const isCritico = item.classificacao === "CRÍTICO";
    const gravBadge = isCritico
      ? `<span class="td-badge td-badge-critico" style="background:#fee2e2; color:#991b1b; border:1px solid #f87171; padding:4px 8px; border-radius:6px; font-weight:800; font-size:0.72rem; white-space:nowrap; display:inline-flex; align-items:center; justify-content:center; gap:3px; max-width:100%; box-sizing:border-box;">🔴 CRÍTICO</span>`
      : `<span class="td-badge td-badge-nao-critico" style="background:#fef3c7; color:#92400e; border:1px solid #f59e0b; padding:4px 8px; border-radius:6px; font-weight:700; font-size:0.72rem; white-space:nowrap; display:inline-flex; align-items:center; justify-content:center; gap:3px; max-width:100%; box-sizing:border-box;">🟡 NÃO CRÍTICO</span>`;

    let statusBadge = "";
    if (item.status_tratativa === "CONCLUIDO") {
      statusBadge = `<span class="td-badge td-badge-concluido" style="background:#d1fae5; color:#065f46; border:1px solid #10b981; padding:4px 8px; border-radius:6px; font-weight:800; font-size:0.72rem; white-space:nowrap; display:inline-flex; align-items:center; justify-content:center; gap:3px; max-width:100%; box-sizing:border-box;">✅ CONCLUÍDO</span>`;
    } else if (item.status_tratativa === "EM_ANDAMENTO") {
      statusBadge = `<span class="td-badge td-badge-andamento" style="background:#dbeafe; color:#1e40af; border:1px solid #3b82f6; padding:4px 8px; border-radius:6px; font-weight:800; font-size:0.72rem; white-space:nowrap; display:inline-flex; align-items:center; justify-content:center; gap:3px; max-width:100%; box-sizing:border-box;">🔄 EM ANDAMENTO</span>`;
    } else {
      statusBadge = `<span class="td-badge td-badge-pendente" style="background:#fee2e2; color:#991b1b; border:1px solid #f87171; padding:4px 8px; border-radius:6px; font-weight:800; font-size:0.72rem; white-space:nowrap; display:inline-flex; align-items:center; justify-content:center; gap:3px; max-width:100%; box-sizing:border-box;">⏳ PENDENTE</span>`;
    }

    return `
      <tr class="td-tabela-row" data-id="${escapeHtml(item.id)}" style="cursor:pointer;" title="Clique para registrar tratativa / direcionamento">
        <td style="text-align:center; font-weight:600; font-size:0.8rem; color:#475569;">${escapeHtml(item.data_fabricacao || "-")}</td>
        <td style="text-align:center; font-weight:700; color:#334155;">${escapeHtml(item.setor || "-")}</td>
        <td style="text-align:center; font-weight:900; color:#0f172a; font-size:0.92rem;">${escapeHtml(item.forma_numero || "-")}</td>
        <td style="text-align:center;"><span style="background:#f1f5f9; border:1px solid #cbd5e1; padding:2px 8px; border-radius:4px; font-weight:900; font-size:0.82rem; color:#0f172a;">${escapeHtml(item.codigo_defeito)}</span><br><small style="font-weight:600; color:#475569;">${escapeHtml(item.descricao_defeito)}</small></td>
        <td style="text-align:center; vertical-align:middle;">${gravBadge}</td>
        <td style="font-weight:800; color:#1e3a8a;">👤 ${escapeHtml(item.responsavel_designado || "-")}</td>
        <td style="font-size:0.82rem; color:#334155;">${escapeHtml(item.acao_recomendada || "-")}</td>
        <td style="font-size:0.84rem; color:#0f172a;">
          ${item.acao_realizada ? `<strong>${escapeHtml(item.acao_realizada)}</strong><br><small style="color:#64748b; font-weight:600;">por ${escapeHtml(item.executado_por || 'Técnico')} em ${escapeHtml(item.tratado_em || '')}</small>` : '<em style="color:#94a3b8;">Aguardando direcionamento...</em>'}
        </td>
        <td style="text-align:center; vertical-align:middle;">${statusBadge}</td>
        <td style="text-align:center; vertical-align:middle;">
          <button type="button" class="btn btn-sm btn-tratar-defeito" data-id="${escapeHtml(item.id)}" style="background:#2563eb; color:#fff; border:none; padding:6px 12px; font-size:0.78rem; font-weight:800; border-radius:6px; cursor:pointer; box-shadow:0 2px 4px rgba(37,99,235,0.25); white-space:nowrap;">⚙️ Tratar</button>
        </td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll(".td-tabela-row").forEach(row => {
    row.addEventListener("click", () => {
      const id = row.getAttribute("data-id");
      if (!id || !listaOcorrenciasMap[id]) return;
      openModalTratativaDefeito(listaOcorrenciasMap[id]);
    });
  });
}

function openModalTratativaDefeito(item) {
  pendingTratativaSelection = item;
  const titleEl = document.getElementById("mTratativaTitle");
  const subEl = document.getElementById("mTratativaSub");
  const infoEl = document.getElementById("mTratativaInfo");
  if (titleEl) titleEl.textContent = `Tratativa - Defeito ${item.codigo_defeito}`;
  if (subEl) subEl.textContent = `Forma: ${item.forma_numero} (${item.setor}) — Data: ${item.data_fabricacao}`;

  if (infoEl) {
    infoEl.innerHTML = `
      <div><strong>Defeito:</strong> Código ${escapeHtml(item.codigo_defeito)} - ${escapeHtml(item.descricao_defeito)}</div>
      <div style="margin-top:2px;"><strong>Gravidade:</strong> ${escapeHtml(item.classificacao)}</div>
      <div style="margin-top:2px;"><strong>Responsável Designado:</strong> <span style="color:#1e3a8a; font-weight:800;">👤 ${escapeHtml(item.responsavel_designado || "-")}</span></div>
      <div style="margin-top:2px;"><strong>Recomendação Técnica:</strong> ${escapeHtml(item.acao_recomendada || "-")}</div>
    `;
  }

  const statusSel = document.getElementById("mTratativaStatus");
  const execSel = document.getElementById("mTratativaExecutadoPorSelect");
  const execInput = document.getElementById("mTratativaExecutadoPor");
  const acaoText = document.getElementById("mTratativaAcaoRealizada");

  if (statusSel) statusSel.value = item.status_tratativa || "PENDENTE";

  const defaultResp = item.executado_por || (item.responsaveis_lista?.[0]) || "Alex";
  if (execSel) {
    if (Array.from(execSel.options).some(o => o.value === defaultResp)) {
      execSel.value = defaultResp;
      if (execInput) execInput.classList.add("hidden");
    } else {
      execSel.value = "OUTRO";
      if (execInput) {
        execInput.value = defaultResp;
        execInput.classList.remove("hidden");
      }
    }
  }

  if (acaoText) acaoText.value = item.acao_realizada || "";

  document.getElementById("modalTratativaDefeito")?.classList.add("modal-visible");
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

  const kioskManutencaoToggleField = document.getElementById("kioskManutencaoToggleField");
  if (kioskManutencaoToggleField) {
    const isAuth = isManutencaoAuthorizedUser();
    kioskManutencaoToggleField.classList.toggle("hidden", !isAuth);
  }
  if (el.kioskManutencaoCheckbox) {
    el.kioskManutencaoCheckbox.checked = state.manutencaoMode || false;
    if (kioskManutencaoToggleField) {
      kioskManutencaoToggleField.classList.toggle("active", state.manutencaoMode || false);
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
      const payload = {
        dia: new Date().toLocaleDateString("pt-BR"),
        hora: new Date().toLocaleTimeString("pt-BR"),
        setor,
        forma,
        dataFabricacao: data,
        colaborador: state.authUser?.name || "Programador",
        modelo: "",
        tipo_concreto: "Padrão",
        status: "PROGRAMADA"
      };
      const result = await postToApi("salvar_forma_click", payload);
      synced = !!result.ok;
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
      const { error } = await supabaseClient.from('programacao_pcp').delete()
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

async function fetchFormStatusRowsFromTables(data) {
  const [progRes, libRes, prodRes] = await Promise.all([
    supabaseClient.from('programacao_pcp').select('*').eq('data_fabricacao', data),
    supabaseClient.from('liberacao_formas').select('*').eq('data_fabricacao', data),
    supabaseClient.from('producao').select('*').eq('data_fabricacao', data)
  ]);

  const firstError = [progRes.error, libRes.error, prodRes.error].find(Boolean);
  if (firstError) throw firstError;

  const rowsByKey = new Map();
  const ensureRow = (setor, forma) => {
    const key = `${setor}||${normalizeUpper(forma)}`;
    if (!rowsByKey.has(key)) rowsByKey.set(key, { setor, forma: normalizeUpper(forma) });
    return rowsByKey.get(key);
  };

  (progRes.data || []).forEach((row) => {
    if (!row.setor || !row.forma) return;
    Object.assign(ensureRow(row.setor, row.forma), {
      prog_id: row.id || true,
      prog_data_hora: row.data_hora || row.created_at || null
    });
  });

  (libRes.data || []).forEach((row) => {
    if (!row.setor || !row.forma) return;
    Object.assign(ensureRow(row.setor, row.forma), {
      lib_id: row.id || true,
      lib_colaborador: row.colaborador || "",
      lib_data_hora: row.data_hora || row.created_at || null
    });
  });

  (prodRes.data || [])
    .filter((row) => row.status === "LIBERADO" || row.status === "CONCRETADO" || row.tipo_concreto)
    .forEach((row) => {
      if (!row.setor || !row.forma) return;
      Object.assign(ensureRow(row.setor, row.forma), {
        prod_id: row.id || true,
        prod_tipo_concreto: row.tipo_concreto || "Padrão",
        prod_colaborador: row.colaborador || "",
        prod_data_hora: row.data_hora || row.created_at || null
      });
    });

  return Array.from(rowsByKey.values());
}

async function loadClickedFormsFromSupabase(dateOverride) {
  const data = dateOverride || el.libData?.value || todayYmd();
  if (!hasApiConfigured()) return;

  try {
    // Busca todas as concretagens feitas na data selecionada a partir da View unificada
    const { data: statusRows, error } = await supabaseClient.from('vw_formas_status')
      .select('*')
      .eq('data_fabricacao', data);

    let rows = error ? await fetchFormStatusRowsFromTables(data) : statusRows;
    if (!Array.isArray(rows)) rows = [];
    if (!rows.length) rows = await fetchFormStatusRowsFromTables(data);
    if (Array.isArray(rows)) {
      const clicked = getClickedFormsToday();
      // Limpa os registros locais de clique para re-popular com os dados atualizados em nuvem
      clicked.formas = {};
      clicked.dia = new Date().toLocaleDateString("pt-BR");

      const db = readDb();
      let dbUpdated = false;

      rows.forEach(row => {
        if (row.forma && row.setor) {
          let statusVal = 'L';
          let tipoConcreto = 'Padrão';
          let colaborador = row.lib_colaborador || '';
          let dataHora = row.lib_data_hora || nowIso();

          if (row.prod_id && row.prod_tipo_concreto !== 'Padrão') {
            statusVal = '1';
            tipoConcreto = row.prod_tipo_concreto || 'Padrão';
            colaborador = row.prod_colaborador || '';
            dataHora = row.prod_data_hora || nowIso();
          } else if (row.lib_id || (row.prod_id && row.prod_tipo_concreto === 'Padrão')) {
            statusVal = 'L';
            tipoConcreto = 'Padrão';
            colaborador = row.lib_colaborador || row.prod_colaborador || '';
            dataHora = row.lib_data_hora || row.prod_data_hora || nowIso();
          } else if (row.prog_id) {
            statusVal = 'P';
            tipoConcreto = 'Padrão';
            colaborador = '';
            dataHora = row.prog_data_hora || nowIso();
          } else {
            return;
          }

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
              concretoTipo: tipoConcreto,
              createdAt: nowIso(),
              updatedAt: nowIso(),
              liberacao: { status: statusVal, timestamp: dataHora, colaborador: colaborador },
              inspecoes: []
            };
            upsertRecord(db, record);
            dbUpdated = true;
          } else if (!record.liberacao || record.liberacao.status !== statusVal || record.concretoTipo !== tipoConcreto) {
            record.concretoTipo = tipoConcreto;
            record.liberacao = record.liberacao || { status: statusVal, timestamp: nowIso() };
            record.liberacao.status = statusVal;
            record.liberacao.timestamp = dataHora;
            record.liberacao.colaborador = colaborador;
            record.updatedAt = nowIso();
            upsertRecord(db, record);
            dbUpdated = true;
          }
        }
      });

      if (dbUpdated) {
        writeDb(db);
      }
      
      // Re-aplica os cliques pendentes locais que ainda não foram sincronizados para a nuvem
      const pendingEvents = (db.events || []).filter(ev => ev.pendingSync === true && ev.etapa === "LIBERACAO" && ev.dataFabricacao === data);
      pendingEvents.forEach(ev => {
        const key = ev.setor + "||" + normalizeUpper(ev.formaNumero);
        clicked.formas[key] = (ev.status === "1" || ev.status === "CONCRETADO") ? "1" : ((ev.status === "PROGRAMADA" || ev.status === "P") ? "P" : "L");
      });

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

  if (!sectorLabel) return;

  state.programmedFormas = await loadOfficialProgrammedFormas(data, sectorLabel);

  let loadedFromDb = false;
  if (hasApiConfigured()) {
    try {
      const { data: rows, error } = await supabaseClient.from('programacao_pcp')
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

  // Load from local DB / cache records that are marked as status 'P'
  const db = readDb();
  if (Array.isArray(db.records)) {
    db.records.forEach(record => {
      if (record.dataFabricacao === data && record.setor === sectorLabel && record.liberacao?.status === 'P') {
        state.programmedFormas.add(normalizeUpper(record.formaNumero));
      }
    });
  }

  // Sync PCP programações to Supabase/Google Sheets in the background if they are not in DB
  if (hasApiConfigured() && state.programmedFormas.size > 0) {
    for (const forma of state.programmedFormas) {
      const isClick = isFormaClicked(forma, sectorLabel);
      const isLib = isFormaLiberada(forma, sectorLabel);
      const isProgLocal = isFormaProgrammed(forma, sectorLabel);
      if (!isClick && !isLib && !isProgLocal) {
        const payload = {
          dia: new Date().toLocaleDateString("pt-BR"),
          hora: new Date().toLocaleTimeString("pt-BR"),
          setor: sectorLabel,
          forma,
          dataFabricacao: data,
          colaborador: "PCP",
          modelo: "",
          tipo_concreto: "Padrão",
          status: "PROGRAMADA"
        };
        postToApi("salvar_forma_click", payload);
      }
    }
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

  // Setor 1
  let s1P = 0, s1L = 0, s1C = 0;
  s1All.forEach((item) => {
    const val = formas["Setor 1||" + normalizeUpper(item.forma)];
    if (val === "P") s1P++;
    else if (val === "L") s1L++;
    else if (val === true || val === "1") s1C++;
  });

  // Setor 2
  let s2P = 0, s2L = 0, s2C = 0;
  s2All.forEach((item) => {
    const val = formas["Setor 2||" + normalizeUpper(item.forma)];
    if (val === "P") s2P++;
    else if (val === "L") s2L++;
    else if (val === true || val === "1") s2C++;
  });

  // Setor 3
  let s3P = 0, s3L = 0, s3C = 0;
  s3All.forEach((item) => {
    const val = formas["Setor 3||" + normalizeUpper(item.forma)];
    if (val === "P") s3P++;
    else if (val === "L") s3L++;
    else if (val === true || val === "1") s3C++;
  });

  // Setor 4
  let s4P = 0, s4L = 0, s4C = 0;
  s4All.forEach((item) => {
    const val = formas["Setor 4||" + normalizeUpper(item.forma)];
    if (val === "P") s4P++;
    else if (val === "L") s4L++;
    else if (val === true || val === "1") s4C++;
  });

  const c1 = document.getElementById("libCounterSetor1");
  const c2 = document.getElementById("libCounterSetor2");
  const c3 = document.getElementById("libCounterSetor3");
  const c4 = document.getElementById("libCounterSetor4");

  if (c1) {
    c1.innerHTML = `<span style="color:#fef08a">P: ${s1P}</span> | <span style="color:#93c5fd">L: ${s1L}</span> | <span style="color:#86efac">C: ${s1C}</span> <span style="opacity:0.75">/ ${s1All.length}</span>`;
    c1.classList.toggle("counter-done", s1C === s1All.length && s1All.length > 0);
  }
  if (c2) {
    c2.innerHTML = `<span style="color:#fef08a">P: ${s2P}</span> | <span style="color:#93c5fd">L: ${s2L}</span> | <span style="color:#86efac">C: ${s2C}</span> <span style="opacity:0.75">/ ${s2All.length}</span>`;
    c2.classList.toggle("counter-done", s2C === s2All.length && s2All.length > 0);
  }
  if (c3) {
    c3.innerHTML = `<span style="color:#fef08a">P: ${s3P}</span> | <span style="color:#93c5fd">L: ${s3L}</span> | <span style="color:#86efac">C: ${s3C}</span> <span style="opacity:0.75">/ ${s3All.length}</span>`;
    c3.classList.toggle("counter-done", s3C === s3All.length && s3All.length > 0);
  }
  if (c4) {
    c4.innerHTML = `<span style="color:#fef08a">P: ${s4P}</span> | <span style="color:#93c5fd">L: ${s4L}</span> | <span style="color:#86efac">C: ${s4C}</span> <span style="opacity:0.75">/ ${s4All.length}</span>`;
    c4.classList.toggle("counter-done", s4C === s4All.length && s4All.length > 0);
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

  if (isAutoResponsibleUser()) {
    optionsHtml.push({
      tipo: "Teste Lab.",
      title: "Teste Lab.",
      desc: "Uso exclusivo laboratorio",
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31"></path><path d="M14 9.3V2"></path><path d="M8.5 2h7"></path><path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path><path d="M6.5 16h11"></path></svg>`,
      className: "concreto-opt-lab"
    });
  }

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
  const colaborador = getProductionCollaborator();
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
    status: "LIBERADO"
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
    if (!record.liberacao || record.liberacao.status !== "L") {
      record.liberacao = { status: "L", colaborador, observacoes: "", fotos: [], timestamp: agora.toISOString(), origem: "LIBERACAO_FORMA" };
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
  const colaborador = getProductionCollaborator();
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

    console.warn("Aviso: Falha de conexão com a API do PCP Concrefer (" + err.message + "). O navegador pode estar bloqueando (CORS) ou a API está fora. Mostrando modelos como SC.");
  }

  // 2. Fallback: tentar carregar da tabela programacao_pcp no Supabase
  if (!supabaseClient) return {};
  try {
    const { data: progRows, error: err1 } = await supabaseClient
      .from('programacao_pcp')
      .select('forma, modelo')
      .eq('data_fabricacao', filtroData)
      .eq('setor', 'Setor 3');

    if (err1) {
      console.warn("[fetchSetor3Models] Erro PGRST programacao_pcp:", err1);
      return {};
    }
    if (!progRows || progRows.length === 0) return {};

    const formToModelMap = {};
    progRows.forEach((row) => {
      const forma = String(row.forma || "").trim().toUpperCase();
      const modelo = String(row.modelo || "").trim();
      if (forma && modelo) {
        formToModelMap[normalizeForma(forma)] = modelo;
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
    // 1. Fetch from producao table in Supabase (restrito a Setor 3 e Setor 4)
    let queryProd = supabaseClient
      .from('producao')
      .select('*')
      .eq('data_fabricacao', filtroData)
      .eq('status', 'LIBERADO');
    if (setor) {
      queryProd = queryProd.eq('setor', setor);
    } else {
      queryProd = queryProd.in('setor', ['Setor 3', 'Setor 4']);
    }
    const { data: producaoRows, error: err1 } = await queryProd;
    if (err1) throw err1;

    // 2. Fetch from montagem_poste table in Supabase
    // 2. Fetch from montagem_poste table in Supabase (restrito a Setor 3 e Setor 4)
    let queryMont = supabaseClient
      .from('montagem_poste')
      .select('*')
      .eq('data_fabricacao', filtroData);
    if (setor) {
      queryMont = queryMont.eq('setor', setor);
    } else {
      queryMont = queryMont.in('setor', ['Setor 3', 'Setor 4']);
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
      const montRecord = (montagemRows || []).find(m => m.forma_numero === forma && m.setor === latestRow.setor && m.etapa !== 'INSPECAO');

      let modeloFinal = latestRow.modelo || "";
      const normForma = normalizeForma(forma);
      if ((latestRow.setor === "Setor 3" || latestRow.setor === "Setor 4") && formToModelMap[normForma]) {
        modeloFinal = formToModelMap[normForma];
      }
      if (/^A-?\d+$/i.test(forma)) {
        modeloFinal = "1 CX VR";
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
          timestamp: insRecord.finalizado_em || null,
          raw: insRecord
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
    el.insLiberadosBody.innerHTML = '<tr><td colspan="4" class="muted">Selecione a data de produção para carregar os itens liberados.</td></tr>';
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
      return !pole.inspecao || !pole.inspecao.timestamp;
    }
    return true;
  });

  rows.sort((a, b) => {
    const valA = String(a.formaNumero || "");
    const valB = String(b.formaNumero || "");
    return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
  });

  const statusFiltro = el.insStatusFiltro?.value || "";
  const displayRows = rows.filter((record) => {
    if (statusFiltro) {
      const isFinalizado = record.inspecao && !!record.inspecao.timestamp;
      const statusVal = record.inspecao?.status || "";
      if (statusFiltro === "PENDENTE") {
        if (isFinalizado) return false;
      } else {
        if (!isFinalizado || statusVal !== statusFiltro) return false;
      }
    }
    return true;
  });

  el.insQtdItens.textContent = String(displayRows.length);

  if (!displayRows.length) {
    el.insLiberadosBody.innerHTML = '<tr><td colspan="4" class="muted">Nenhum poste apontado ou pendente de inspeção para os filtros informados.</td></tr>';
    return;
  }

  displayRows.forEach((record) => {
    const isFinalizado = record.inspecao && !!record.inspecao.timestamp;
    const status = record.inspecao?.status || "";
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

    // Armazena o registro de inspecao completo serializado em JSON para uso posterior ao clicar
    tr.dataset.inspecaoRaw = record.inspecao && record.inspecao.raw ? JSON.stringify(record.inspecao.raw) : "";

    let acaoContent = "";
    if (isFinalizado) {
      if (status === "A") {
        acaoContent = `<button type="button" class="btn ins-ver-checklist-btn" style="background-color: #10b981; color: white; border: none; font-weight: bold; width: 100%; height: 38px; border-radius: 6px; cursor: pointer;">Aprovado (Ver Checklist)</button>`;
      } else if (status === "RR") {
        acaoContent = `<button type="button" class="btn ins-open-btn" style="background-color: #f59e0b; color: white; border: none; font-weight: bold; width: 100%; height: 38px; border-radius: 6px;">Retrabalhar</button>`;
      } else {
        acaoContent = `<button type="button" class="btn ins-ver-checklist-btn" style="background-color: #ef4444; color: white; border: none; font-weight: bold; width: 100%; height: 38px; border-radius: 6px; cursor: pointer;">Reprovado (Ver Checklist)</button>`;
      }
    } else {
      acaoContent = `<button type="button" class="btn ins-open-btn primary" style="width: 100%; height: 38px; border-radius: 6px;">Inspecionar</button>`;
    }

    // Monta o status/defeito com icone para exibir na lista
    let statusDefeitoHtml = "";
    if (isFinalizado) {
      const insCodigo = record.inspecao?.codigo || "";
      if (status === "A") {
        statusDefeitoHtml = `<span style="color:#16a34a;font-weight:700;font-size:.85rem">\u2705 Aprovado</span>`;
      } else if (status === "RR") {
        const iconeDefeito = DEFEITO_ICONES[insCodigo.toUpperCase()] || "\u26a0\ufe0f";
        const descDefeito = insCodigo ? getMotivoRecusaLabel(insCodigo) : "Retrabalho";
        statusDefeitoHtml = `<span style="color:#d97706;font-weight:700;font-size:.82rem">${iconeDefeito} RR</span> <span style="font-size:.78rem;color:#78350f">${descDefeito}</span>`;
      } else if (status === "R") {
        const iconeDefeito = DEFEITO_ICONES[insCodigo.toUpperCase()] || "\u274c";
        const descDefeito = insCodigo ? getMotivoRecusaLabel(insCodigo) : "Reprovado";
        statusDefeitoHtml = `<span style="color:#dc2626;font-weight:700;font-size:.82rem">${iconeDefeito} Reprovado</span><br><span style="font-size:.78rem;color:#7f1d1d">${descDefeito}</span>`;
      } else {
        statusDefeitoHtml = `<span style="color:#6b7280;font-size:.82rem">${status || "—"}</span>`;
      }
    } else {
      statusDefeitoHtml = `<span style="color:#94a3b8;font-size:.82rem">Pendente</span>`;
    }

    tr.innerHTML = `
      <td data-label="N Forma">${record.formaNumero || ""}</td>
      <td data-label="Modelo">${record.modelo || ""}</td>
      <td data-label="Data Prod.">${fmtDate(record.dataFabricacao || "")}</td>
      <td data-label="Status / Defeito" style="max-width:220px;line-height:1.4">${statusDefeitoHtml}</td>
      <td data-label="Ação">${acaoContent}</td>
    `;
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
  try {
    localStorage.setItem(MONTAGEM_POSTES_KEY, JSON.stringify(db));
  } catch (err) {
    if (err?.name !== "QuotaExceededError" && err?.code !== 22 && err?.code !== 1014) throw err;

    // Fotos em Base64 crescem cerca de 33% e podem esgotar rapidamente a cota
    // do localStorage. Elas continuam no estado atual e são sincronizadas no
    // Supabase; o cache local guarda apenas os dados operacionais da montagem.
    const cacheDb = JSON.parse(JSON.stringify(db));
    Object.values(cacheDb.postes || {}).forEach((poste) => {
      Object.values(poste?.checklists || {}).forEach((section) => {
        if (!section || typeof section !== "object" || Array.isArray(section)) return;
        Object.keys(section).forEach((key) => {
          if (key.endsWith("_photo")) delete section[key];
        });
      });
    });
    localStorage.setItem(MONTAGEM_POSTES_KEY, JSON.stringify(cacheDb));
  }
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

function isChecklistSectionComplete(sectionId, respostas = {}, mode = "MONTAGEM", modelo = "") {
  if (!modelo) {
    modelo = (mode === "INSPECAO" ? state.inspecaoPostesAtual?.modelo : state.montagemPostesAtual?.modelo) || "";
  }
  const sections = mode === "INSPECAO" ? getInspecaoChecklistSections(modelo) : getMontagemChecklistSections(modelo);
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
  const now = nowDeviceLocalIso();

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

  const isRework = (atual?.statusMontagem === "RR");

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
    statusMontagem: isRework ? "" : (atual?.statusMontagem || ""),
    motivoRecusa: isRework ? "" : (atual?.motivoRecusa || ""),
    inicioInspecaoMontagem: isRework ? now : (atual?.inicioInspecaoMontagem || now),
    finalizadoEm: isRework ? "" : (atual?.finalizadoEm || ""),
    observacoesMontagem: isRework ? "" : (atual?.observacoesMontagem || ""),
    checklists: isRework ? {} : (atual?.checklists || {})
  };

  upsertMontagemPoste(merged);
  await syncMontagemPosteToApi(merged, "INICIO", { silent: true });
  state.montagemPostesAtual = merged;
  setMode("MONTAGEM_POSTES_DETALHE");
  renderMontagemPosteDetalhe();
}

function getDeviceGeolocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ error: "Não suportado pelo navegador" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        let errorMsg = "Erro desconhecido";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Permissão negada";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Posição indisponível";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "Tempo limite atingido";
        }
        resolve({ error: errorMsg });
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
}

async function finalizarMontagemPosteAtual() {
  const poste = state.montagemPostesAtual;
  if (!poste) {
    showMsgBox("Nenhum poste selecionado.", "error");
    return;
  }

  const status = poste.statusMontagem || "";
  if (!status) {
    showMsgBox("Selecione o status da montagem: Aprovado, Reprovado ou Reprovado e Retrabalhado.", "error");
    return;
  }

  const sections = getMontagemChecklistSections(poste.modelo || "");
  const allSectionsOk = sections.every((section) =>
    isChecklistSectionComplete(section.id, poste.checklists || {})
  );

  const temReprovadoPrimeiraSecao = Object.values(poste.checklists?.["checagem_inicial"] || {}).includes("nao");

  if (!allSectionsOk && !(temReprovadoPrimeiraSecao && (status === "R" || status === "RR"))) {
    showMsgBox("Responda todos os itens (Aprovado/Reprovado) de todas as seções antes de finalizar.", "error");
    return;
  }

  const loadingModal = document.getElementById("loadingModal");
  const loadingMsg = loadingModal ? loadingModal.querySelector(".loading-msg") : null;
  if (loadingMsg) loadingMsg.textContent = "Obtendo geolocalização...";
  if (loadingModal) loadingModal.classList.add("modal-visible");

  try {
    const geoResult = await getDeviceGeolocation();
    if (loadingMsg) loadingMsg.textContent = "Salvando montagem...";

    const now = new Date();
    const diaInspecao = now.toLocaleDateString("pt-BR");
    const horarioDispositivo = now.toLocaleTimeString("pt-BR");

    const updated = {
      ...poste,
      checklists: {
        ...(poste.checklists || {}),
        dia_inspecao: diaInspecao,
        horario_dispositivo: horarioDispositivo,
        geolocation: geoResult
      },
      finalizadoEm: nowDeviceLocalIso()
    };

    const syncResult = await syncMontagemPosteToApi(updated, "FINALIZACAO", { silent: false });
    const finalEntry = {
      ...updated,
      pendingSync: !syncResult.synced
    };
    upsertMontagemPoste(finalEntry);
    state.montagemPostesAtual = finalEntry;

    renderMontagemPosteDetalhe();
    if (loadingModal) loadingModal.classList.remove("modal-visible");

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
  } catch (e) {
    console.error("Erro ao finalizar montagem:", e);
    showMsgBox("Erro ao finalizar montagem: " + (e.message || String(e)), "error");
  } finally {
    if (loadingModal) loadingModal.classList.remove("modal-visible");
  }
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
  const statusFiltro = el.mpStatusFiltro?.value || "";

  el.mpLiberadosBody.innerHTML = "";
  if (el.mpKpiAprovados) el.mpKpiAprovados.textContent = "0";
  if (el.mpKpiRetrabalho) el.mpKpiRetrabalho.textContent = "0";
  if (el.mpKpiReprovados) el.mpKpiReprovados.textContent = "0";

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

  // Filtra de acordo com modoCarga para fins de cálculo de KPIs
  const baseRows = poles.filter((record) => {
    if (modoCarga === "pendentes") {
      return !record.montagem || !record.montagem.finalizado_em;
    }
    return true;
  });

  let countAprovados = 0;
  let countRetrabalho = 0;
  let countReprovados = 0;

  baseRows.forEach((record) => {
    const isFinalizado = !!record.montagem?.finalizado_em;
    const status = record.montagem?.status_montagem || "";
    if (isFinalizado) {
      if (status === "A") countAprovados++;
      else if (status === "RR") countRetrabalho++;
      else if (status === "R") countReprovados++;
    }
  });

  if (el.mpKpiAprovados) el.mpKpiAprovados.textContent = String(countAprovados);
  if (el.mpKpiRetrabalho) el.mpKpiRetrabalho.textContent = String(countRetrabalho);
  if (el.mpKpiReprovados) el.mpKpiReprovados.textContent = String(countReprovados);

  // Filtra de acordo com statusFiltro para a exibição na tabela
  const rows = baseRows.filter((record) => {
    if (statusFiltro) {
      const isFinalizado = !!record.montagem?.finalizado_em;
      const statusVal = record.montagem?.status_montagem || "";
      if (statusFiltro === "PENDENTE") {
        if (isFinalizado) return false;
      } else {
        if (!isFinalizado || statusVal !== statusFiltro) return false;
      }
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
        acaoContent = `<button type="button" class="btn mp-ver-checklist-btn" style="background-color: #10b981; color: white; border: none; font-weight: bold; width: 100%; height: 38px; border-radius: 6px; cursor: pointer;">Aprovado (Ver Checklist)</button>`;
      } else if (status === "RR") {
        acaoContent = `<button type="button" class="btn mp-open-btn" style="background-color: #f59e0b; color: white; border: none; font-weight: bold; width: 100%; height: 38px; border-radius: 6px;">Retrabalhar</button>`;
      } else {
        acaoContent = `<button type="button" class="btn mp-ver-checklist-btn" style="background-color: #ef4444; color: white; border: none; font-weight: bold; width: 100%; height: 38px; border-radius: 6px; cursor: pointer;">Reprovado (Ver Checklist)</button>`;
      }
    } else {
      const extraClass = record.status === 'INSPECIONADO' ? 'mp-open-btn--inspecionado' : '';
      acaoContent = `<button type="button" class="btn mp-open-btn ${extraClass}">Inspecionar / Montar Poste</button>`;
    }

    tr.innerHTML = `
      <td data-label="N Forma" style="text-align:center; font-weight:900;">${record.formaNumero || ""}</td>
      <td data-label="Modelo">${record.modelo || ""}</td>
      <td data-label="Data Prod." style="text-align:center;">${fmtDate(record.dataFabricacao || "")}</td>
      <td data-label="Ação" style="text-align:center; vertical-align:middle;">
        <div style="display:inline-flex; gap:8px; align-items:center; justify-content:center; width:100%;">
          ${acaoContent}
        </div>
      </td>
    `;
    el.mpLiberadosBody.appendChild(tr);
  });

  filtrarMontagemTabela();
}

async function saveInspecao() {}

async function openInspecaoPosteDetalhe(posteBase) {
  const recordId = posteBase.recordId;
  const dataFabricacao = posteBase.dataFabricacao;
  const setor = posteBase.setor;
  const formaNumero = posteBase.formaNumero;
  const key = [recordId, dataFabricacao, setor, formaNumero, 'INSPECAO'].join("||");
  const now = nowDeviceLocalIso();

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

  const isRework = (atual?.statusMontagem === "RR");

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
    statusMontagem: isRework ? "" : (atual?.statusMontagem || ""),
    motivoRecusa: isRework ? "" : (atual?.motivoRecusa || ""),
    inicioInspecaoMontagem: isRework ? now : (atual?.inicioInspecaoMontagem || now),
    finalizadoEm: isRework ? "" : (atual?.finalizadoEm || ""),
    observacoesMontagem: isRework ? "" : (atual?.observacoesMontagem || ""),
    checklists: isRework ? {} : (atual?.checklists || {}),
    etapa: "INSPECAO"
  };

  upsertMontagemPoste(merged);
  await syncMontagemPosteToApi(merged, "INSPECAO", { silent: true });
  state.inspecaoPostesAtual = merged;
  setMode("INSPECAO_DETALHE");
  renderInspecaoPosteDetalhe();
}

function renderInspecaoPosteDetalhe() {
  if (!el.insDetalheHeader || !state.inspecaoPostesAtual) return;
  const poste = state.inspecaoPostesAtual;

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

  el.insDetalheHeader.innerHTML = `
    <div style="margin-bottom: 15px; display: flex;">
      <button class="btn btn-back" type="button" onclick="navigateBack()" style="flex: 1;">← Voltar para a lista</button>
    </div>
    <div><strong>Forma:</strong> ${poste.formaNumero || "-"}</div>
    <div><strong>Modelo:</strong> ${poste.modelo || "-"}</div>
    <div><strong>Produto:</strong> ${escapeHtml(poste.codigoProduto || "-")} ${poste.descricaoPoste ? "- " + escapeHtml(poste.descricaoPoste) : ""}</div>
    <div><strong>Setor:</strong> ${poste.setor || "-"}</div>
    <div><strong>Data Produção:</strong> ${fmtDate(poste.dataFabricacao || "") || "-"}</div>
    <div><strong>Início inspeção:</strong> ${formatDateTime(poste.inicioInspecaoMontagem || "")}</div>
    <div><strong>Finalizado em:</strong> ${poste.finalizadoEm ? formatDateTime(poste.finalizadoEm) : "-"}</div>
    <div><strong>Tempo de Inspeção:</strong> <span style="color:#e8762a; font-weight:700;">${tempoGasto}</span></div>
  `;

  renderInspecaoChecklistSections();
  if (el.insObservacoes) {
    el.insObservacoes.value = poste.observacoesMontagem || "";
    el.insObservacoes.disabled = !!poste.finalizadoEm;
  }
  renderInspecaoStatusUI();

  if (el.insFinalizarPoste) {
    el.insFinalizarPoste.disabled = !!poste.finalizadoEm;
    el.insFinalizarPoste.textContent = poste.finalizadoEm ? "Salvo" : "Salvar";
  }
}

function renderInspecaoChecklistSections() {
  if (!el.insChecklistSections || !state.inspecaoPostesAtual) return;
  const current = state.inspecaoPostesAtual;
  el.insChecklistSections.innerHTML = "";

  const sections = getInspecaoChecklistSections(current.modelo || "");
  let sectionEnabled = true;

  sections.forEach((section) => {
    const article = document.createElement("article");
    article.className = "mp-checklist-section";
    if (!sectionEnabled) {
      article.style.opacity = "0.5";
      article.style.pointerEvents = "none";
    }

    const isComplete = isChecklistSectionComplete(section.id, current.checklists || {}, "INSPECAO", current.modelo || "");

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

      const itemIcone = item.codigoFalha ? (DEFEITO_ICONES[item.codigoFalha] || "") : "";
      let itemHtml = `
        <div class="mp-checklist-item">
          <span class="mp-checklist-item-text">
            ${itemIcone ? `<span class="item-defeito-icon" title="Código ${item.codigoFalha}">${itemIcone}</span>` : ""}
            ${item.critico ? '<span class="critico-dot" title="Item crítico — pode segregar o poste">&#9888;</span>' : ""}
            ${item.texto}
          </span>
          <div class="mp-yn-group">
            <button type="button" class="mp-yn-btn btn-aprovado ${selected === "sim" ? "active" : ""}"
                    data-ins-section="${section.id}" data-ins-item="${item.id}" data-ins-value="sim"
                    ${disableItem ? "disabled" : ""}>Aprovado</button>
            <button type="button" class="mp-yn-btn btn-reprovado ${selected === "nao" ? "active" : ""}"
                    data-ins-section="${section.id}" data-ins-item="${item.id}" data-ins-value="nao"
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
              <input type="file" accept="image/*" capture="environment" class="ins-item-photo-input"
                     data-ins-section="${section.id}" data-ins-item="${item.id}" ${disableItem ? "disabled" : ""} />
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

    el.insChecklistSections.appendChild(article);
    const hasCriticalReproved = section.itens.some((i) => i.critico && current.checklists?.[section.id]?.[i.id] === "nao");
    sectionEnabled = sectionEnabled && isComplete && !hasCriticalReproved;
  });
}

function renderInspecaoStatusUI() {
  const poste = state.inspecaoPostesAtual;
  if (!poste || !el.insStatusButtons) return;

  const status = poste.statusMontagem || "";
  const isFinalizado = !!poste.finalizadoEm;

  el.insStatusButtons.querySelectorAll("[data-ins-status]").forEach((btn) => {
    if (!(btn instanceof HTMLElement)) return;
    btn.classList.toggle("active", btn.dataset.insStatus === status);
    btn.disabled = isFinalizado;
  });
}

function setInspecaoStatus(status) {
  if (!state.inspecaoPostesAtual) return;
  const current = { ...state.inspecaoPostesAtual };

  const sections = getInspecaoChecklistSections(current.modelo || "");
  const hasFailures = sections.some((sec) =>
    sec.itens.some((it) => current.checklists[sec.id]?.[it.id] === "nao")
  );

  if (status === "A" && hasFailures) {
    showMsgBox("Não é possível aprovar um poste que possui itens reprovados no checklist.", "error");
    return;
  }

  current.statusMontagem = status;
  if (status === "A") {
    current.motivoRecusa = "";
  }
  state.inspecaoPostesAtual = current;
  upsertMontagemPoste(current);
  syncMontagemPosteToApi(current, "INSPECAO", { silent: true }).catch(() => {});
  renderInspecaoStatusUI();
}

function setInspecaoChecklistAnswer(sectionId, itemId, value) {
  if (!state.inspecaoPostesAtual) return;
  const current = { ...state.inspecaoPostesAtual };
  if (!current.checklists) current.checklists = {};
  if (!current.checklists[sectionId]) current.checklists[sectionId] = {};

  const wasComplete = isChecklistSectionComplete(sectionId, current.checklists, "INSPECAO", current.modelo || "");

  current.checklists[sectionId][itemId] = value;

  if (value === "sim") {
    delete current.checklists[sectionId][itemId + "_photo"];
  }

  const sections = getInspecaoChecklistSections(current.modelo || "");
  const section = sections.find((s) => s.id === sectionId);

  const reprovedCodes = [];
  sections.forEach((sec) => {
    sec.itens.forEach((it) => {
      if (current.checklists[sec.id]?.[it.id] === "nao" && it.codigoFalha) {
        reprovedCodes.push(it.codigoFalha);
      }
    });
  });

  const uniqueCodes = [...new Set(reprovedCodes)];

  if (uniqueCodes.length > 0) {
    if (current.statusMontagem !== "R" && current.statusMontagem !== "RR") {
      current.statusMontagem = "R";
    }
    current.motivoRecusa = uniqueCodes.join(", ");
  } else {
    current.statusMontagem = "A";
    current.motivoRecusa = "";
  }

  const isNowComplete = isChecklistSectionComplete(sectionId, current.checklists, "INSPECAO", current.modelo || "");

  state.inspecaoPostesAtual = current;
  upsertMontagemPoste(current);
  syncMontagemPosteToApi(current, "INSPECAO", { silent: true }).catch(() => {});

  const hasCriticalReproved = section?.itens.some((i) => i.critico && current.checklists[sectionId][i.id] === "nao");

  if (!wasComplete && isNowComplete) {
    if (hasCriticalReproved) {
      showMsgBox(`A inspeção visual contém falhas críticas. Poste deve ser reprovado.`, "error");
    } else {
      showMsgBox(`Inspeção visual concluída com sucesso!`, "success");
    }
  }

  renderInspecaoChecklistSections();
  renderInspecaoStatusUI();
}

function setInspecaoChecklistPhoto(sectionId, itemId, photoBase64) {
  if (!state.inspecaoPostesAtual) return;
  const current = { ...state.inspecaoPostesAtual };
  if (!current.checklists) current.checklists = {};
  if (!current.checklists[sectionId]) current.checklists[sectionId] = {};

  current.checklists[sectionId][itemId + "_photo"] = photoBase64;
  state.inspecaoPostesAtual = current;
  upsertMontagemPoste(current);
  syncMontagemPosteToApi(current, "INSPECAO", { silent: true }).catch(() => {});
  renderInspecaoChecklistSections();
}

async function finalizarInspecaoPosteAtual() {
  const poste = state.inspecaoPostesAtual;
  if (!poste) {
    showMsgBox("Nenhum poste selecionado.", "error");
    return;
  }

  const status = poste.statusMontagem || "";
  if (!status) {
    showMsgBox("Selecione o status da inspeção: Aprovado, Reprovado ou Reprovado e Retrabalhado.", "error");
    return;
  }

  const sections = getInspecaoChecklistSections(poste.modelo || "");
  const allSectionsOk = sections.every((section) =>
    isChecklistSectionComplete(section.id, poste.checklists || {}, "INSPECAO", poste.modelo || "")
  );

  const temReprovadoPrimeiraSecao = Object.values(poste.checklists?.["inspecao_visual"] || {}).includes("nao");

  if (!allSectionsOk && !(temReprovadoPrimeiraSecao && (status === "R" || status === "RR"))) {
    showMsgBox("Responda todos os itens (Aprovado/Reprovado) antes de finalizar.", "error");
    return;
  }

  const loadingModal = document.getElementById("loadingModal");
  const loadingMsg = loadingModal ? loadingModal.querySelector(".loading-msg") : null;
  if (loadingMsg) loadingMsg.textContent = "Obtendo geolocalização...";
  if (loadingModal) loadingModal.classList.add("modal-visible");

  try {
    const geoResult = await getDeviceGeolocation();
    if (loadingMsg) loadingMsg.textContent = "Salvando inspeção...";

    const now = new Date();
    const diaInspecao = now.toLocaleDateString("pt-BR");
    const horarioDispositivo = now.toLocaleTimeString("pt-BR");

    const updated = {
      ...poste,
      checklists: {
        ...(poste.checklists || {}),
        dia_inspecao: diaInspecao,
        horario_dispositivo: horarioDispositivo,
        geolocation: geoResult
      },
      finalizadoEm: nowDeviceLocalIso()
    };

    const syncResult = await syncMontagemPosteToApi(updated, "INSPECAO", { silent: false });
    const finalEntry = {
      ...updated,
      pendingSync: !syncResult.synced
    };
    upsertMontagemPoste(finalEntry);
    state.inspecaoPostesAtual = finalEntry;

    renderInspecaoPosteDetalhe();
    if (loadingModal) loadingModal.classList.remove("modal-visible");

    const colaborador = el.insColaborador?.value?.trim() || state.authUser?.name || "Apontador";
    const observacaoGlobal = el.insObservacoes?.value?.trim() || "";

    const legacyEntry = {
      recordId: finalEntry.recordId,
      dataFabricacao: finalEntry.dataFabricacao,
      setor: finalEntry.setor,
      formaNumero: finalEntry.formaNumero,
      modelo: finalEntry.modelo,
      codigoPoste: finalEntry.codigoPoste,
      descricaoPoste: finalEntry.descricaoPoste,
      codigoProduto: finalEntry.codigoProduto,
      tipo: "INSPECAO",
      status: finalEntry.statusMontagem,
      codigo: finalEntry.motivoRecusa,
      colaborador: colaborador,
      observacoes: observacaoGlobal,
      fotosCount: 0,
      timestamp: finalEntry.finalizadoEm
    };

    const apiResult = await postToApi("salvar_inspecao_lote", { entries: [legacyEntry] });
    if (apiResult.ok) {
      setSyncStatus("ok", "Inspeção sincronizada com sucesso.");
    } else {
      setSyncStatus("ok", "Inspeção salva online.");
    }

    showMontagemResumoModal({
      ...finalEntry,
      observacoesMontagem: observacaoGlobal,
      montadorNome: colaborador,
      resumoSync: syncResult.synced ? "Sincronizado" : "Salvo localmente"
    }, {
      onClose: async () => {
        setMode("INSPECAO");
        await renderInspecaoLiberados();
        if (el.insFormaFiltro) {
          el.insFormaFiltro.value = "";
        }
        filtrarFormasTabela();
      }
    });
  } catch (e) {
    console.error("Erro ao finalizar inspeção:", e);
    showMsgBox("Erro ao finalizar inspeção: " + (e.message || String(e)), "error");
  } finally {
    if (loadingModal) loadingModal.classList.remove("modal-visible");
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

  const montagemCache = db.montagemDashboardCache || [];
  montagemCache.forEach((row) => {
    if (!row.status_montagem) return;
    const d = row.data_fabricacao || "";
    if (!d) return;
    const s = (row.status_montagem || "").toUpperCase();
    if (!insByDate[d]) {
      insByDate[d] = { A: 0, R: 0, RR: 0, total: 0 };
    }
    insByDate[d].total++;
    if (s in insStatusTotal) {
      insStatusTotal[s]++;
      insByDate[d][s]++;
    }
    const motivo = row.motivo_recusa;
    if (motivo) {
      const code = motivo.toUpperCase();
      ncCount[code] = (ncCount[code] || 0) + 1;
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

  // Qualidade por Setor
  const qcSetores = {
    S1: { A:0, R:0, RR:0, total:0 },
    S2: { A:0, R:0, RR:0, total:0 },
    S3: { A:0, R:0, RR:0, total:0 },
    S4: { A:0, R:0, RR:0, total:0 }
  };
  
  const targetDate = selectedDate || todayYmd();
  const montagemCacheFiltered = montagemCache.filter(ev => {
    const day = (ev.finalizado_em || ev.updated_at || "").split("T")[0];
    return day === targetDate;
  });

  montagemCacheFiltered.forEach(ev => {
    if (!ev.status_montagem && ev.etapa === "INICIO") return;

    const setor = (ev.setor || "").toLowerCase();
    const s = (ev.status_montagem || "").toUpperCase();
    
    let key = "";
    if (setor.includes("1")) key = "S1";
    else if (setor.includes("2")) key = "S2";
    else if (setor.includes("3")) key = "S3";
    else if (setor.includes("4")) key = "S4";

    if (key) {
      qcSetores[key].total++;
      if (s === "APROVADO" || s === "A") qcSetores[key].A++;
      else if (s === "REPROVADO" || s === "R" || s === "RR") qcSetores[key].R++;
    }
  });

  Object.keys(qcSetores).forEach(k => {
    setTxt("dbQcTot" + k, qcSetores[k].total);
    setTxt("dbQcOk" + k, qcSetores[k].A);
    setTxt("dbQcRej" + k, qcSetores[k].R + qcSetores[k].RR);
  });

  // Resumo de Postes Montados
  const resumoMontagem = {};
  montagemCacheFiltered.forEach(ev => {
    if (!ev.status_montagem && ev.etapa === "INICIO") return;

    const mod = ev.modelo || "Desconhecido";
    const dataFab = ev.data_fabricacao || "N/A";
    const key = `${mod}||${dataFab}`;

    if (!resumoMontagem[key]) {
      resumoMontagem[key] = { modelo: mod, data_fabricacao: dataFab, qtd: 0 };
    }
    resumoMontagem[key].qtd++;
  });

  const tbodyResumo = document.getElementById("dbTbodyMontagemResumo");
  if (tbodyResumo) {
    const listResumo = Object.values(resumoMontagem).sort((a, b) => b.qtd - a.qtd);
    if (listResumo.length === 0) {
      tbodyResumo.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#64748b;">Nenhum poste montado nesta data.</td></tr>`;
    } else {
      tbodyResumo.innerHTML = listResumo.map(item => {
        const dFmt = item.data_fabricacao !== "N/A" ? item.data_fabricacao.split("-").reverse().join("/") : "N/A";
        return `
          <tr>
            <td style="font-weight: 600;">${item.modelo}</td>
            <td style="text-align: center;">${dFmt}</td>
            <td style="text-align: center; color: #4f46e5; font-weight: 600;">${item.qtd}</td>
          </tr>
        `;
      }).join("");
    }
  }

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

  setTxt("dbProdS1", cadenceBySector["S1"].length);
  setTxt("dbProdS2", cadenceBySector["S2"].length);
  setTxt("dbProdS3", cadenceBySector["S3"].length);
  setTxt("dbProdS4", cadenceBySector["S4"].length);

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
          tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 12 },
          datalabels: {
            display: function(context) { return context.dataset.data[context.dataIndex] > 0; },
            color: '#0f172a',
            anchor: 'end',
            align: 'top',
            offset: 2,
            font: { weight: 'bold', size: 11 },
            formatter: Math.round
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1, precision: 0 }, suggestedMax: Math.max(...allDates.map((d) => prodByDate[d] || 0)) * 1.15 }
        }
      },
      plugins: [typeof ChartDataLabels !== 'undefined' ? ChartDataLabels : {}]
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
          tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 12 },
          datalabels: {
            display: function(context) { return context.dataset.data[context.dataIndex] > 0; },
            color: '#ffffff',
            anchor: 'center',
            align: 'center',
            font: { weight: 'bold', size: 10 },
            formatter: Math.round
          }
        },
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1, precision: 0 }, suggestedMax: Math.max(...allDates.map((d) => prodByDate[d] || 0)) * 1.15 }
        }
      },
      plugins: [typeof ChartDataLabels !== 'undefined' ? ChartDataLabels : {}]
    });
  }

  const histEl = document.getElementById("dbHistory");
  if (!histEl) return;
  const histDates = [...allDates];
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

async function carregarDadosGlobaisDashboard(selectedDateOverride = "") {
  if (!hasApiConfigured()) return;

  const dbDataEl = document.getElementById("dbData");
  const selectedDate = selectedDateOverride || (dbDataEl ? dbDataEl.value : todayYmd());

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

    let montagemRows = [];
    try {
      const startOfRangeISO = new Date(startDateStr + "T00:00:00-03:00").toISOString();
      
      const { data: mRows, error: mError } = await supabaseClient
        .from('montagem_poste')
        .select('*')
        .or(`data_fabricacao.gte.${startDateStr},updated_at.gte.${startOfRangeISO}`);
        
      if (!mError && mRows) montagemRows = mRows;
    } catch (e) {
      console.warn("Erro ao buscar montagem_poste no Dashboard global:", e);
    }

    const db = readDb();
    db.montagemDashboardCache = montagemRows;

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
      const [setor1, setor2, setor3, setor4] = await Promise.all([
        getRowsForDashboard(data, "Setor 1"),
        getRowsForDashboard(data, "Setor 2"),
        getRowsForDashboard(data, "Setor 3"),
        getRowsForDashboard(data, "Setor 4")
      ]);
      const apiRows = [
        ...(setor1.rows || []),
        ...(setor2.rows || []),
        ...(setor3.rows || []),
        ...(setor4.rows || [])
      ];
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

  const setores = setorFiltro ? [setorFiltro] : ["Setor 1", "Setor 2", "Setor 3", "Setor 4"];
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
          rows = rows.filter((r) => r.status === 'LIBERADO' || r.status === 'CONCRETADO');
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
          liberacao_status: (r.status === 'LIBERADO' || r.status === 'CONCRETADO') ? '1' : '0'
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
  if (!el.dashData || !el.dashStatus) return;
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

function getRelatorioTimestamp(row) {
  return row.timestamp || row.data_hora || row.dataHora || row.updated_at || row.updatedAt || row.created_at || row.createdAt || "";
}

function getRelatorioLiberacaoTimestamp(row) {
  return row.liberacao_timestamp || row.liberacaoTimestamp || row.liberacao?.timestamp || "";
}

function getRelatorioProgramacaoTimestamp(row) {
  return row.programacao_timestamp || row.programacaoTimestamp || row.programacao?.timestamp || "";
}

function getRelatorioConcretagemTimestamp(row) {
  return row.concretagem_timestamp || row.concretagemTimestamp || getRelatorioTimestamp(row);
}

function getRelatorioOperador(row) {
  return row.operador || row.colaborador || row.colaboradorProducao || row.usuario || row.liberacao_colaborador || "";
}

function getRelatorioTipoConcreto(row) {
  return row.tipo_concreto || row.tipoConcreto || row.concretoTipo || "Padrão";
}

function getRelatorioModelo(row) {
  const forma = String(row.forma_numero || row.formaNumero || row.forma || "").trim().toUpperCase();
  const catalogo = getPosteFieldsForForma(forma, row.setor || "");
  return catalogo.descricaoPoste || row.modelo || row.descricaoPoste || row.descricao_poste || "Sem modelo";
}

function getRelatorioCodigoProduto(row) {
  const forma = String(row.forma_numero || row.forma || "").trim().toUpperCase();
  const catalogo = getPosteFieldsForForma(forma, row.setor || "");
  return row.codigo_produto || row.codigoProduto || catalogo.codigoProduto || "-";
}

function getFormaStatusKey(dataFabricacao, setor, forma) {
  return `${dataFabricacao || ""}||${setor || ""}||${normalizeUpper(forma || "")}`;
}

function formatRelatorioDuracao(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "-";
  const totalMin = Math.round(ms / 60000);
  const horas = Math.floor(totalMin / 60);
  const minutos = totalMin % 60;
  if (horas <= 0) return `${minutos} min`;
  return `${horas}h ${String(minutos).padStart(2, "0")}min`;
}

function calcularTempoTotalSemAlmoco(timestamps) {
  if (timestamps.length < 2) return "-";
  const sorted = [...timestamps].sort((a, b) => a - b);
  let totalMs = sorted[sorted.length - 1] - sorted[0];

  // Desconsidera intervalos de almoço/pausas (ex: diffMs >= 40 min (2400000 ms) e <= 2.5 horas (9000000 ms))
  for (let i = 1; i < sorted.length; i++) {
    const diffMs = sorted[i] - sorted[i - 1];
    if (diffMs >= 2400000 && diffMs <= 9000000) {
      totalMs -= diffMs;
    }
  }
  return formatRelatorioDuracao(totalMs);
}

function renderRelatorioSetor({ data, setor, encarregado, rows }) {
  if (!el.relatorioSetorOutput) return;

  const printOrder = [
    "1 CX VR",
    "1 CX VL",
    "2 CX VR",
    "2 CX VL",
    "3 CX VR",
    "3 CX VL",
    "4 CX VR",
    "4 CX VL",
    "2 CX VR - 300 DAN",
    "2 CX VL - 300 DAN",
    "POSTE CAIXA LENTE 1 CX VL",
    "ECON 1 CX VR",
    "ECON 1 CX VL",
    "ECON 2 CX VR",
    "ECON 3 CX VR",
    "SUB 100",
    "SUB 200",
    "SUB 200 TC",
    "SUB 100 ELEKTRO",
    "ELEKTRO 1 CX VR",
    "ELEKTRO 1 CX VL",
    "ELEKTRO 2 CX VR",
    "ELEKTRO 2 CX VL",
    "ELEKTRO 3 CX VL",
    "EDP 1 CX VL",
    "7,5X600 TC VR",
    "7,5X600 TC VL",
    "7,5X600 BARR VR",
    "7,5X600 BARR VL",
    "TOTEM MEDIÇÃO INDIRETA ELEKTRO",
    "POSTE COLUNA",
    "CEMIG 7X150 1 CX VL",
    "CEMIG 7X150 2 CX VL"
  ];
  const printOrderNormalized = printOrder.map(m => m.trim().toUpperCase());

  function getModelOrderIndex(modelo) {
    const idx = printOrderNormalized.indexOf(modelo.trim().toUpperCase());
    return idx !== -1 ? idx : 999999;
  }

  function sortSummaryList(list) {
    return list.sort((a, b) => {
      if (a.setor === "Setor 3" && b.setor === "Setor 3") {
        return b.total - a.total || a.modelo.localeCompare(b.modelo);
      }
      const idxA = getModelOrderIndex(a.modelo);
      const idxB = getModelOrderIndex(b.modelo);
      if (idxA !== 999999 || idxB !== 999999) {
        if (idxA !== idxB) {
          return idxA - idxB;
        }
      }
      if (a.setor !== b.setor) {
        return a.setor.localeCompare(b.setor);
      }
      return b.total - a.total || a.modelo.localeCompare(b.modelo);
    });
  }

  const normalizedRows = Array.isArray(rows) ? rows.slice() : [];
  const rowsOrdenadas = normalizedRows.sort((a, b) => {
    const tsA = new Date(getRelatorioTimestamp(a)).getTime();
    const tsB = new Date(getRelatorioTimestamp(b)).getTime();
    if (Number.isFinite(tsA) && Number.isFinite(tsB) && tsA !== tsB) return tsA - tsB;
    return String(a.forma_numero || a.formaNumero || "").localeCompare(String(b.forma_numero || b.formaNumero || ""), undefined, { numeric: true, sensitivity: "base" });
  });

  const emitidoEm = formatDateTime(nowIso());

  if (setor === "Todos") {
    // Calculo geral
    const timestamps = rowsOrdenadas
      .map((row) => new Date(getRelatorioTimestamp(row)).getTime())
      .filter((value) => Number.isFinite(value));
    const tempoTotal = calcularTempoTotalSemAlmoco(timestamps);

    const resumoPorPoste = rowsOrdenadas.reduce((acc, row) => {
      const modelo = getRelatorioModelo(row);
      const cod = getRelatorioCodigoProduto(row);
      const s = row.setor || "Todos";
      const key = `${s}||${modelo}||${cod}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const summaryList = Object.entries(resumoPorPoste).map(([key, total]) => {
      const [s, modelo, cod] = key.split("||");
      return { setor: s, modelo, cod, total };
    });
    sortSummaryList(summaryList);
    const resumoPostesHtml = summaryList
      .map((item) => `<tr><td>${escapeHtml(item.setor)}</td><td>${escapeHtml(item.cod)}</td><td>${escapeHtml(item.modelo)}</td><td>${item.total}</td></tr>`)
      .join("");

    // Contagem por setor
    const setoresCounts = { "Setor 1": 0, "Setor 2": 0, "Setor 3": 0, "Setor 4": 0 };
    rowsOrdenadas.forEach(r => {
      const s = r.setor || "";
      if (setoresCounts[s] !== undefined) {
        setoresCounts[s]++;
      }
    });

    const setoresDisponiveis = ["Setor 1", "Setor 2", "Setor 3", "Setor 4"];

    el.relatorioSetorOutput.innerHTML = `
      <article id="relPrintDoc" class="rel-print-doc">
        <!-- PRIMEIRA PAGINA: RESUMO GERAL -->
        <div class="rel-print-page">
          <header class="rel-print-header">
            <div>
              <div class="rel-company">Concrefer</div>
              <h3>Relatório Enc. Produção - Resumo Geral</h3>
            </div>
            <div class="rel-meta">
              <span>Data: <strong>${escapeHtml(fmtDate(data) || data)}</strong></span>
              <span>Setor: <strong>Todos os Setores</strong></span>
              <span>Emitido: <strong>${escapeHtml(emitidoEm)}</strong></span>
            </div>
          </header>

          <section class="rel-kpi-grid">
            <div><span>Total de Formas Enchidas</span><strong>${rowsOrdenadas.length}</strong></div>
            <div><span>Tempo Total de Produção</span><strong>${tempoTotal}</strong></div>
            <div><span>Encarregado</span><strong>${escapeHtml(encarregado || "-")}</strong></div>
          </section>

          <!-- Indicadores Resumidos Coloridos por Setor -->
          <section class="rel-section">
            <h4>Indicadores por Setor</h4>
            <div class="rel-sector-kpis-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 16px;">
              <div style="border-left: 4px solid #2563eb; background: #eff6ff; padding: 10px; border-radius: 6px;">
                <span style="font-size: 0.75rem; color: #1e40af; font-weight: bold; display: block;">Setor 1</span>
                <strong style="font-size: 1.25rem; color: #1e3a8a; display: block; margin-top: 4px;">${setoresCounts["Setor 1"]} formas</strong>
              </div>
              <div style="border-left: 4px solid #10b981; background: #ecfdf5; padding: 10px; border-radius: 6px;">
                <span style="font-size: 0.75rem; color: #065f46; font-weight: bold; display: block;">Setor 2</span>
                <strong style="font-size: 1.25rem; color: #064e3b; display: block; margin-top: 4px;">${setoresCounts["Setor 2"]} formas</strong>
              </div>
              <div style="border-left: 4px solid #8b5cf6; background: #f5f3ff; padding: 10px; border-radius: 6px;">
                <span style="font-size: 0.75rem; color: #5b21b6; font-weight: bold; display: block;">Setor 3</span>
                <strong style="font-size: 1.25rem; color: #4c1d95; display: block; margin-top: 4px;">${setoresCounts["Setor 3"]} formas</strong>
              </div>
              <div style="border-left: 4px solid #f97316; background: #fff7ed; padding: 10px; border-radius: 6px;">
                <span style="font-size: 0.75rem; color: #9a3412; font-weight: bold; display: block;">Setor 4</span>
                <strong style="font-size: 1.25rem; color: #7c2d12; display: block; margin-top: 4px;">${setoresCounts["Setor 4"]} formas</strong>
              </div>
            </div>
          </section>

          <section class="rel-section rel-summary-section">
            <h4>Resumo por tipo de poste (Todos os Setores)</h4>
            <table class="sheet-table report-table rel-summary-table">
              <thead><tr><th>Setor</th><th>Cód. Prod.</th><th>Tipo de poste</th><th>Quantidade</th></tr></thead>
              <tbody>${resumoPostesHtml || '<tr><td colspan="4">Sem registros</td></tr>'}</tbody>
            </table>
          </section>

          <footer class="rel-print-footer">
            <div class="rel-sign-block">
              <span>Assinatura do encarregado de produção</span>
            </div>
          </footer>
        </div>

        <!-- QUEBRAS POR SETOR -->
        ${setoresDisponiveis.map(s => {
          const sRows = rowsOrdenadas.filter(r => r.setor === s);
          if (sRows.length === 0) return "";
          
          const sTimestamps = sRows
            .map((row) => new Date(getRelatorioTimestamp(row)).getTime())
            .filter((value) => Number.isFinite(value));
          const sTempoTotal = calcularTempoTotalSemAlmoco(sTimestamps);

          const sResumoPorPoste = sRows.reduce((acc, row) => {
            const modelo = getRelatorioModelo(row);
            const cod = getRelatorioCodigoProduto(row);
            const key = `${s}||${modelo}||${cod}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {});
          const sSummaryList = Object.entries(sResumoPorPoste).map(([key, total]) => {
            const [sec, modelo, cod] = key.split("||");
            return { setor: sec, modelo, cod, total };
          });
          sortSummaryList(sSummaryList);
          const sResumoPostesHtml = sSummaryList
            .map((item) => `<tr><td>${escapeHtml(item.setor)}</td><td>${escapeHtml(item.cod)}</td><td>${escapeHtml(item.modelo)}</td><td>${item.total}</td></tr>`)
            .join("");

          const sLinhas = sRows.map((r) => {
            const forma = r.forma_numero || r.formaNumero || "";
            const modelo = getRelatorioModelo(r);
            const operador = getRelatorioOperador(r) || "-";
            const horarioProgramacao = formatTime(getRelatorioProgramacaoTimestamp(r));
            const horarioLiberacao = formatTime(getRelatorioLiberacaoTimestamp(r));
            const horarioConcretagem = formatTime(getRelatorioConcretagemTimestamp(r));
            const tipoConcreto = getRelatorioTipoConcreto(r);
            return `
              <tr>
                <td>${escapeHtml(forma)}</td>
                <td>${escapeHtml(modelo)}</td>
                <td>${escapeHtml(operador)}</td>
                <td>${escapeHtml(horarioProgramacao || "-")}</td>
                <td>${escapeHtml(horarioLiberacao)}</td>
                <td>${escapeHtml(horarioConcretagem)}</td>
                <td>${escapeHtml(tipoConcreto)}</td>
              </tr>`;
          }).join("");

          return `
            <div class="page-break" style="page-break-before: always; break-before: page; height: 1px;"></div>
            <div class="rel-print-page" style="margin-top: 24px;">
              <header class="rel-print-header">
                <div>
                  <div class="rel-company">Concrefer</div>
                  <h3>Relatório Enc. Produção - ${escapeHtml(s)}</h3>
                </div>
                <div class="rel-meta">
                  <span>Data: <strong>${escapeHtml(fmtDate(data) || data)}</strong></span>
                  <span>Setor: <strong>${escapeHtml(s)}</strong></span>
                  <span>Emitido: <strong>${escapeHtml(emitidoEm)}</strong></span>
                </div>
              </header>

              <section class="rel-kpi-grid">
                <div><span>Formas enchidas</span><strong>${sRows.length}</strong></div>
                <div><span>Tempo total de produção</span><strong>${sTempoTotal}</strong></div>
                <div><span>Encarregado</span><strong>${escapeHtml(encarregado || "-")}</strong></div>
              </section>

              <section class="rel-section">
                <h4>Formas enchidas - ${escapeHtml(s)}</h4>
                <div class="rel-table-wrap">
                  <table class="sheet-table report-table rel-full-table">
                    <thead>
                      <tr>
                        <th>Forma</th>
                        <th>Tipo de poste</th>
                        <th>Operador</th>
                        <th>PCP</th>
                        <th>Lib.</th>
                        <th>Concre.</th>
                        <th>Tipo de concreto</th>
                      </tr>
                    </thead>
                    <tbody>${sLinhas || '<tr><td colspan="7">Sem registros</td></tr>'}</tbody>
                  </table>
                </div>
              </section>

              <section class="rel-section rel-summary-section">
                <h4>Resumo por tipo de poste - ${escapeHtml(s)}</h4>
                <table class="sheet-table report-table rel-summary-table">
                  <thead><tr><th>Setor</th><th>Cód. Prod.</th><th>Tipo de poste</th><th>Quantidade</th></tr></thead>
                  <tbody>${sResumoPostesHtml || '<tr><td colspan="4">Sem registros</td></tr>'}</tbody>
                </table>
              </section>

              <footer class="rel-print-footer">
                <div class="rel-sign-block">
                  <span>Assinatura do encarregado de produção</span>
                </div>
              </footer>
            </div>
          `;
        }).join("")}
      </article>
    `;
  } else {
    // Modo tradicional (Setor único)
    const timestamps = rowsOrdenadas
      .map((row) => new Date(getRelatorioTimestamp(row)).getTime())
      .filter((value) => Number.isFinite(value));
    const tempoTotal = calcularTempoTotalSemAlmoco(timestamps);
    const resumoPorPoste = rowsOrdenadas.reduce((acc, row) => {
      const modelo = getRelatorioModelo(row);
      const cod = getRelatorioCodigoProduto(row);
      const s = row.setor || setor;
      const key = `${s}||${modelo}||${cod}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const summaryList = Object.entries(resumoPorPoste).map(([key, total]) => {
      const [sec, modelo, cod] = key.split("||");
      return { setor: sec, modelo, cod, total };
    });
    sortSummaryList(summaryList);
    const resumoPostesHtml = summaryList
      .map((item) => `<tr><td>${escapeHtml(item.setor)}</td><td>${escapeHtml(item.cod)}</td><td>${escapeHtml(item.modelo)}</td><td>${item.total}</td></tr>`)
      .join("");
    const linhas = rowsOrdenadas.map((r) => {
      const forma = r.forma_numero || r.formaNumero || "";
      const modelo = getRelatorioModelo(r);
      const operador = getRelatorioOperador(r) || "-";
      const horarioProgramacao = formatTime(getRelatorioProgramacaoTimestamp(r));
      const horarioLiberacao = formatTime(getRelatorioLiberacaoTimestamp(r));
      const horarioConcretagem = formatTime(getRelatorioConcretagemTimestamp(r));
      const tipoConcreto = getRelatorioTipoConcreto(r);
      return `
        <tr>
          <td>${escapeHtml(forma)}</td>
          <td>${escapeHtml(modelo)}</td>
          <td>${escapeHtml(operador)}</td>
          <td>${escapeHtml(horarioProgramacao || "-")}</td>
          <td>${escapeHtml(horarioLiberacao)}</td>
          <td>${escapeHtml(horarioConcretagem)}</td>
          <td>${escapeHtml(tipoConcreto)}</td>
        </tr>`;
    }).join("");

    el.relatorioSetorOutput.innerHTML = `
      <article id="relPrintDoc" class="rel-print-doc">
        <header class="rel-print-header">
          <div>
            <div class="rel-company">Concrefer</div>
            <h3>Relatório Enc. Produção</h3>
          </div>
          <div class="rel-meta">
            <span>Data: <strong>${escapeHtml(fmtDate(data) || data)}</strong></span>
            <span>Setor: <strong>${escapeHtml(setor)}</strong></span>
            <span>Emitido: <strong>${escapeHtml(emitidoEm)}</strong></span>
          </div>
        </header>

        <section class="rel-kpi-grid">
          <div><span>Formas enchidas</span><strong>${rowsOrdenadas.length}</strong></div>
          <div><span>Tempo total de produção</span><strong>${tempoTotal}</strong></div>
          <div><span>Encarregado</span><strong>${escapeHtml(encarregado || "-")}</strong></div>
        </section>

        <section class="rel-section">
          <h4>Formas enchidas</h4>
          <div class="rel-table-wrap">
            <table class="sheet-table report-table rel-full-table">
              <thead>
                <tr>
                  <th>Forma</th>
                  <th>Tipo de poste</th>
                  <th>Operador</th>
                  <th>PCP</th>
                  <th>Lib.</th>
                  <th>Concre.</th>
                  <th>Tipo de concreto</th>
                </tr>
              </thead>
              <tbody>${linhas || '<tr><td colspan="7">Sem registros</td></tr>'}</tbody>
            </table>
          </div>
        </section>

        <section class="rel-section rel-summary-section">
          <h4>Resumo por tipo de poste</h4>
          <table class="sheet-table report-table rel-summary-table">
            <thead><tr><th>Setor</th><th>Cód. Prod.</th><th>Tipo de poste</th><th>Quantidade</th></tr></thead>
            <tbody>${resumoPostesHtml || '<tr><td colspan="4">Sem registros</td></tr>'}</tbody>
          </table>
        </section>

        <footer class="rel-print-footer">
          <div class="rel-sign-block">
            <span>Assinatura do encarregado de produção</span>
          </div>
        </footer>
      </article>
    `;
  }
}

function imprimirRelatorioSetor() {
  if (!document.getElementById("relPrintDoc")) {
    showMsgBox("Gere o relatório antes de imprimir ou salvar em PDF.", "error");
    return;
  }
  document.body.classList.add("print-relatorio");
  window.print();
  setTimeout(() => document.body.classList.remove("print-relatorio"), 500);
}

function loadHtml2Pdf() {
  return new Promise((resolve, reject) => {
    if (window.html2pdf) return resolve(window.html2pdf);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.onload = () => resolve(window.html2pdf);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function enviarRelatorioWhatsapp() {
  const element = document.getElementById("relPrintDoc");
  if (!element) {
    showMsgBox("Gere o relatório antes de enviar.", "error");
    return;
  }

  const data = el.relData.value;
  const setor = el.relSetor.value;
  const encarregado = el.relEncarregado.value.trim() || "Não informado";

  // Buscar kpis e totais do relatório
  const totalFormas = element.querySelector(".rel-kpi-grid div:nth-child(1) strong")?.textContent || "0";
  const tempoTotal = element.querySelector(".rel-kpi-grid div:nth-child(2) strong")?.textContent || "-";

  // Resumo por tipo
  let resumoTexto = "";
  const rowsResumo = element.querySelectorAll(".rel-summary-table tbody tr");
  rowsResumo.forEach(r => {
    const cols = r.querySelectorAll("td");
    if (cols.length >= 2) {
      resumoTexto += `• ${cols[0].textContent}: ${cols[1].textContent}\n`;
    }
  });

  const standardMsg = `Envio automático de relatório de Produção Setor ${setor}`;
  const textMsg = `${standardMsg}\n\n*RELATÓRIO ENCARREGADO DE PRODUÇÃO*\n\n*Setor:* ${setor}\n*Data:* ${fmtDate(data) || data}\n*Encarregado:* ${encarregado}\n*Formas Enchidas:* ${totalFormas}\n*Tempo Total:* ${tempoTotal}\n\n*Resumo por Tipo:*\n${resumoTexto}`;

  setSyncStatus("pending", "Gerando PDF do relatório...");
  try {
    const html2pdf = await loadHtml2Pdf();
    const opt = {
      margin: 10,
      filename: `Envio_automatico_de_relatorio_de_Producao_Setor_${setor.replace(/\s+/g, '_')}_${data}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
    const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });

    setSyncStatus("ok", "PDF gerado.");

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: standardMsg,
        text: textMsg
      });
    } else {
      // Baixar PDF localmente e redirecionar para whatsapp
      html2pdf().set(opt).from(element).save();
      const instructionMsg = `${textMsg}\n\n_O PDF foi baixado para o seu aparelho. Envie-o no chat do WhatsApp a seguir._`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(instructionMsg)}`, '_blank');
    }
  } catch (err) {
    console.error("Erro ao gerar/enviar PDF:", err);
    setSyncStatus("error", "Erro ao gerar PDF.");
    // Fallback: abrir whatsapp somente com o texto se falhar
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(textMsg)}`, '_blank');
  }
}

async function carregarMandrilCircular() {
  const selectedDate = el.mcFiltroData?.value;
  if (!selectedDate) {
    el.mcTabelaBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 30px; color: var(--muted); font-size: 1.05rem;">Selecione uma data para carregar os dados.</td></tr>`;
    el.mcQtdItens.textContent = "0";
    return;
  }

  el.mcTabelaBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color: var(--muted);">Carregando dados...</td></tr>`;
  el.mcQtdItens.textContent = "0";

  // Sync Supabase data to local database first
  try {
    await loadClickedFormsFromSupabase(selectedDate);
  } catch (err) {
    console.warn("Erro ao sincronizar fôrmas do Supabase para Mandril Circular:", err);
  }

  // 1. Fetch programmed models from PCP
  let formToModelMap = {};
  try {
    formToModelMap = await fetchSetor3Models(selectedDate);
  } catch (err) {
    console.warn("Erro ao buscar modelos do PCP para Mandril Circular:", err);
  }

  let rows = [];

  // 2. Fetch concreted shapes for Sector 3
  if (hasApiConfigured()) {
    try {
      const { data: dbRows, error } = await supabaseClient
        .from('producao')
        .select('*')
        .eq('data_fabricacao', selectedDate)
        .eq('setor', 'Setor 3')
        .eq('status', 'LIBERADO');

      if (error) throw error;
      
      if (Array.isArray(dbRows)) {
        rows = dbRows.map(r => ({
          forma: r.forma || r.forma_numero,
          modelo: r.modelo,
          data_hora: r.data_hora || r.updated_at || r.created_at,
          tipo_concreto: r.tipo_concreto || r.tipoConcreto || r.concretoTipo
        }));
      }
    } catch (err) {
      console.error("Erro ao buscar no Supabase, tentando local...", err);
    }
  }

  // 3. Fallback to offline if online returned empty or failed
  if (rows.length === 0) {
    const db = readDb();
    if (db && Array.isArray(db.records)) {
      const localRows = db.records
        .filter(r => r.dataFabricacao === selectedDate)
        .filter(r => r.setor === 'Setor 3')
        .filter(r => String(r.status || r.liberacao?.status) === 'LIBERADO' || String(r.liberacao?.status) === '1');
        
      rows = localRows.map(r => ({
        forma: r.formaNumero,
        modelo: r.modelo,
        data_hora: r.liberacao?.timestamp || r.updatedAt || r.createdAt,
        tipo_concreto: r.concretoTipo
      }));
    }
  }

  // 4. Deduplicate shapes by shape name
  const seenFormas = new Set();
  const uniqueRows = [];
  rows.forEach(r => {
    const fn = normalizeForma(r.forma || "");
    if (!seenFormas.has(fn)) {
      seenFormas.add(fn);
      uniqueRows.push(r);
    }
  });

  // Create lookup maps for quick checking
  const concretedLookup = {};
  uniqueRows.forEach(r => {
    concretedLookup[normalizeForma(r.forma || "")] = r;
  });

  // 5. Generate list of shapes (SC01 to SC52)
  const allS3Forms = [];
  for (let i = 1; i <= 52; i++) {
    allS3Forms.push(`SC${String(i).padStart(2, '0')}`);
  }

  // Get local draw times from LocalStorage
  let saqueData = {};
  const rawSaque = localStorage.getItem("pwa_saque_mandril_v1");
  if (rawSaque) {
    try {
      saqueData = JSON.parse(rawSaque);
    } catch (e) {}
  }

  let htmlTable = "";
  let totalConcretados = 0;

  allS3Forms.forEach(forma => {
    const fn = normalizeForma(forma);
    const concretedRow = concretedLookup[fn];
    const programmedModel = formToModelMap[fn] || "--";
    
    let tipoConcreto = "--";
    let horaConcretado = "--:--";
    let previsaoSaque = "--:--";
    let actionHtml = "";
    
    if (concretedRow) {
      totalConcretados++;
      tipoConcreto = concretedRow.tipo_concreto || "Concreto Padrão";
      if (concretedRow.data_hora) {
        try {
          const d = new Date(concretedRow.data_hora);
          if (!isNaN(d.getTime())) {
            horaConcretado = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            // Previsão de Saque = Concretado + 3 horas
            const dSaque = new Date(d.getTime());
            dSaque.setHours(dSaque.getHours() + 3);
            previsaoSaque = dSaque.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          }
        } catch (e) {}
      }

      // Check if mandrel has been drawn
      const savedIso = saqueData[`${selectedDate}||${fn}`];
      if (savedIso) {
        let timeRealizado = "--:--";
        try {
          const d = new Date(savedIso);
          if (!isNaN(d.getTime())) {
            timeRealizado = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          }
        } catch (e) {}
        
        actionHtml = `
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <span style="color: #16a34a; font-weight: bold; background: #dcfce7; padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; border: 1px solid #bbf7d0;">Saque: ${timeRealizado}</span>
            <button onclick="window.limparSaque('${forma}')" style="background: none; border: none; color: var(--danger); cursor: pointer; font-size: 1.1rem; padding: 0;" title="Limpar Saque">❌</button>
          </div>
        `;
      } else {
        actionHtml = `
          <button onclick="window.registrarSaque('${forma}')" style="padding: 6px 12px; font-size: 0.8rem; background: var(--accent); color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; transition: background 0.2s; box-shadow: 0 2px 6px rgba(232, 118, 42, 0.2);" onmouseover="this.style.background='var(--accent-dark)'" onmouseout="this.style.background='var(--accent)'">Sacar Mandril</button>
        `;
      }
    } else {
      actionHtml = `<span style="color: var(--muted); font-size: 0.85rem;">Aguardando Concretagem</span>`;
    }
    
    htmlTable += `
      <tr style="border-bottom: 1px solid var(--line); transition: background 0.2s;">
        <td style="padding: 12px 16px;"><strong>${forma}</strong></td>
        <td style="padding: 12px 16px;">${programmedModel}</td>
        <td style="padding: 12px 16px;">${tipoConcreto}</td>
        <td style="padding: 12px 16px;">${horaConcretado}</td>
        <td style="padding: 12px 16px; color: #b45309; font-weight: bold;">${previsaoSaque}</td>
        <td style="padding: 12px 16px; text-align: center;">${actionHtml}</td>
      </tr>
    `;
  });

  el.mcTabelaBody.innerHTML = htmlTable;
  el.mcQtdItens.textContent = totalConcretados;
}

window.registrarSaque = function(forma) {
  const selectedDate = el.mcFiltroData?.value;
  if (!selectedDate) return;
  
  let data = {};
  const raw = localStorage.getItem("pwa_saque_mandril_v1");
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch (e) {}
  }
  
  data[`${selectedDate}||${normalizeForma(forma)}`] = new Date().toISOString();
  localStorage.setItem("pwa_saque_mandril_v1", JSON.stringify(data));
  
  carregarMandrilCircular();
};

window.limparSaque = function(forma) {
  const selectedDate = el.mcFiltroData?.value;
  if (!selectedDate) return;
  
  let data = {};
  const raw = localStorage.getItem("pwa_saque_mandril_v1");
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch (e) {}
  }
  
  delete data[`${selectedDate}||${normalizeForma(forma)}`];
  localStorage.setItem("pwa_saque_mandril_v1", JSON.stringify(data));
  
  carregarMandrilCircular();
};

async function gerarRelatorioSetor() {
  const data = el.relData.value;
  const setor = el.relSetor.value;
  const encarregado = getReportManagerName();

  if (!data || !setor) {
    showMsgBox("Informe data e setor para gerar o relatório.", "error");
    return;
  }

  let formToModelMap = {};
  if (setor === "Todos" || setor === "Setor 3" || setor === "Setor 4") {
    try {
      formToModelMap = await fetchSetor3Models(data);
    } catch (err) {
      console.warn("Erro ao carregar modelos reais do pcp para o relatório:", err);
    }
  }

  if (hasApiConfigured()) {
    try {
      let query = supabaseClient.from('producao').select('*').eq('data_fabricacao', data);
      if (setor !== "Todos") {
        query = query.eq('setor', setor);
      }
      const { data: rows, error } = await query;

      if (!error && Array.isArray(rows)) {
        let programacaoMap = new Map();
        let liberacaoMap = new Map();
        try {
          let progQuery = supabaseClient.from('programacao_pcp').select('data_fabricacao,setor,forma,data_hora').eq('data_fabricacao', data);
          let libQuery = supabaseClient.from('liberacao_formas').select('data_fabricacao,setor,forma,data_hora,colaborador').eq('data_fabricacao', data);
          if (setor !== "Todos") {
            progQuery = progQuery.eq('setor', setor);
            libQuery = libQuery.eq('setor', setor);
          }
          const [progRes, libRes] = await Promise.all([progQuery, libQuery]);
          if (!progRes.error && Array.isArray(progRes.data)) {
            programacaoMap = new Map(progRes.data.map((row) => [getFormaStatusKey(row.data_fabricacao, row.setor, row.forma), row]));
          }
          if (!libRes.error && Array.isArray(libRes.data)) {
            liberacaoMap = new Map(libRes.data.map((row) => [getFormaStatusKey(row.data_fabricacao, row.setor, row.forma), row]));
          }
        } catch (lookupErr) {
          console.warn("Erro ao carregar horarios de programacao/liberacao para o relatorio:", lookupErr);
        }

        // O relatório de produção considera somente a concretagem confirmada pela liberação.
        const uniqueRows = deduplicarLinhasProducao(rows.filter((r) => r.status === "LIBERADO"));
        const mappedRows = uniqueRows.map(r => {
          const formaNorm = normalizeForma(r.forma || r.forma_numero || "");
          const statusKey = getFormaStatusKey(r.data_fabricacao || data, r.setor, r.forma || r.forma_numero);
          const programacaoRow = programacaoMap.get(statusKey);
          const liberacaoRow = liberacaoMap.get(statusKey);
          let modeloFinal = r.modelo;
          if ((r.setor === "Setor 3" || r.setor === "Setor 4") && (modeloFinal === "SC" || !modeloFinal) && formToModelMap[formaNorm]) {
            modeloFinal = formToModelMap[formaNorm];
          }
          return {
            forma_numero: r.forma || r.forma_numero,
            modelo: modeloFinal,
            descricao_poste: r.descricao_poste,
            codigo_produto: r.codigo_produto,
            liberacao_status: "1",
            colaborador: r.colaborador,
            timestamp: r.data_hora || r.updated_at || r.created_at,
            concretagem_timestamp: r.data_hora || r.updated_at || r.created_at,
            programacao_timestamp: programacaoRow?.data_hora || "",
            liberacao_timestamp: liberacaoRow?.data_hora || "",
            liberacao_colaborador: liberacaoRow?.colaborador || "",
            tipo_concreto: r.tipo_concreto || r.tipoConcreto || r.concretoTipo,
            setor: r.setor
          };
        });
        renderRelatorioSetor({ data, setor, encarregado, rows: mappedRows });
        setSyncStatus("ok", `Relatório do ${setor} em ${data} gerado pela nuvem.`);
        return;
      }
    } catch (e) {
      console.error(e);
      setSyncStatus("warn", "Falha ao buscar relatório. Gerando pelo cache local.");
    }
  }

  const db = readDb();
  let baseQuery = db.records
    .filter((r) => r.dataFabricacao === data)
    .filter((r) => String(r.liberacao?.status || "") === "1");

  if (setor !== "Todos") {
    baseQuery = baseQuery.filter((r) => r.setor === setor);
  }

  const rows = baseQuery.map((r) => {
    const formaNorm = normalizeForma(r.formaNumero || "");
    let modeloFinal = r.modelo;
    if ((r.setor === "Setor 3" || r.setor === "Setor 4") && (modeloFinal === "SC" || !modeloFinal) && formToModelMap[formaNorm]) {
      modeloFinal = formToModelMap[formaNorm];
    }
    return {
      forma_numero: r.formaNumero,
      modelo: modeloFinal,
      descricaoPoste: r.descricaoPoste,
      codigoProduto: r.codigoProduto,
      liberacao_status: r.liberacao?.status || "",
      colaborador: r.liberacao?.colaborador || "",
      timestamp: r.liberacao?.timestamp || r.updatedAt || r.createdAt,
      concretagem_timestamp: r.liberacao?.timestamp || r.updatedAt || r.createdAt,
      programacao_timestamp: "",
      liberacao_timestamp: r.liberacao?.timestamp || r.updatedAt || r.createdAt,
      tipoConcreto: r.concretoTipo,
      setor: r.setor,
      data_fabricacao: r.dataFabricacao,
      forma: r.formaNumero,
      status: r.liberacao?.status === "1" ? "LIBERADO" : r.liberacao?.status,
      tipo_concreto: r.concretoTipo
    };
  });

  const uniqueRows = deduplicarLinhasProducao(rows);
  renderRelatorioSetor({ data, setor, encarregado, rows: uniqueRows });
}

function getRoleConfig(role) {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.MONTADOR;
}

function setAccessByRole(role) {
  const cfg = getRoleConfig(role);
  const next = new Set(["HUB", ...cfg.modes]);
  if (next.has("MONTAGEM_POSTES")) next.add("MONTAGEM_POSTES_DETALHE");
  if (next.has("INSPECAO")) next.add("INSPECAO_DETALHE");

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
    applyAutoResponsibleFields();
    ensurePostLoginBootstrap();
    setMode("HUB");
    setSyncStatus("ok", `Acesso liberado para ${state.authUser.roleLabel}.`);

  } catch (err) {
    console.error(err);
    setPaFeedback("Erro inesperado: " + err.message);
  }
}

function isAutoResponsibleUser() {
  const name = String(state.authUser?.name || "").trim().toLowerCase();
  return name.includes("ricardo") || name.includes("philippe");
}

function getCurrentResponsibleName() {
  return isAutoResponsibleUser() ? String(state.authUser?.name || "").trim() : "";
}

function ensureSelectValue(selectEl, value) {
  if (!selectEl || !value) return;
  const exists = Array.from(selectEl.options || []).some((option) => option.value === value);
  if (!exists) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    selectEl.appendChild(option);
  }
  selectEl.value = value;
}

function applyAutoResponsibleFields() {
  const responsible = getCurrentResponsibleName();
  const enabled = !!responsible;

  if (enabled) {
    ensureSelectValue(el.libColaborador, responsible);
    if (el.kioskLibColaborador) el.kioskLibColaborador.value = responsible;
    if (el.relEncarregado) el.relEncarregado.value = responsible;
  }

  if (el.libColaborador) el.libColaborador.disabled = enabled;
  if (el.kioskLibColaborador) el.kioskLibColaborador.disabled = enabled;
  if (el.relEncarregado) el.relEncarregado.disabled = enabled;
}

function getProductionCollaborator() {
  return getCurrentResponsibleName() || (el.libColaborador?.value || "").trim();
}

function getReportManagerName() {
  return getCurrentResponsibleName() || (el.relEncarregado?.value || "").trim();
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
    SEQUENCIA_S3: "hubSequenciaS3",
    MONTAGEM_INDICADORES: "hubMontagemIndicadores",
    DASHBOARD_DEFEITOS: "hubDashboardDefeitos",
    RELATORIO: "hubRelatorio",
    HISTORICO: "hubHistorico",
    ACMP_CONCRETAGEM: "hubAcmpConcretagem",
    USUARIOS: "navUsuarios",
    MANDRIL_CIRCULAR: "hubMandrilCircular"
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

  const userNameVal = String(state.authUser?.name || "").trim().toLowerCase();
  const isOdinAllowed = userNameVal.includes("ricardo") || userNameVal.includes("philippe");
  const odinToggle = document.getElementById("kioskOdinToggleField");
  if (odinToggle) {
    odinToggle.classList.toggle("hidden", !isOdinAllowed);
  }

  if (el.authUserBadge) {
    if (state.authUser) {
      el.authUserBadge.textContent = `${state.authUser.name} · ${state.authUser.roleLabel}`;
      el.authUserBadge.classList.remove("hidden");
    } else {
      el.authUserBadge.classList.add("hidden");
    }
  }

  applyAutoResponsibleFields();

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
  applyAutoResponsibleFields();
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
  if (mode === "DASHBOARD") mode = "PROD_ANALISE";
  if (mode !== "HUB" && !isModeAllowed(mode)) {
    mode = "HUB";
    if (state.authUser) {
      setSyncStatus("warn", "Seu perfil não possui acesso a esta opção.");
    }
  }

  state.mode = mode;
  [el.hubView, el.viewDashboard, el.viewLiberacao, el.viewInspecao, el.viewInspecaoDetalhe, el.viewMontagemPostes, el.viewMontagemPostesDetalhe, el.viewRelatorio, el.viewHistorico, el.viewAcmpConcretagem, el.viewUsuarios, el.viewProdAnalise, el.viewMontagemIndicadores, el.viewSequenciaS3, el.viewMandrilCircular, el.viewRelatorioManutencao, el.viewTratativaDefeitos]
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
    applyAutoResponsibleFields();
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
  if (mode === "INSPECAO_DETALHE") {
    if (el.viewInspecaoDetalhe) el.viewInspecaoDetalhe.classList.remove("hidden");
  }
  if (mode === "MONTAGEM_POSTES") el.viewMontagemPostes.classList.remove("hidden");
  if (mode === "MONTAGEM_POSTES_DETALHE") el.viewMontagemPostesDetalhe.classList.remove("hidden");
  if (mode === "RELATORIO") {
    applyAutoResponsibleFields();
    el.viewRelatorio.classList.remove("hidden");
  }
  if (mode === "HISTORICO") el.viewHistorico.classList.remove("hidden");
  if (mode === "ACMP_CONCRETAGEM") el.viewAcmpConcretagem.classList.remove("hidden");
  if (mode === "USUARIOS") {
    if (el.viewUsuarios) el.viewUsuarios.classList.remove("hidden");
    renderUsuarios().catch(() => {
      setUgFeedback("Não foi possível carregar os usuários da planilha.", false);
    });
  }
  if (mode === "MONTAGEM_INDICADORES" || mode === "DASHBOARD_DEFEITOS") {
    if (el.viewMontagemIndicadores) el.viewMontagemIndicadores.classList.remove("hidden");
    const dashboardTitle = document.getElementById("miDashboardTitle");
    if (dashboardTitle) dashboardTitle.textContent = mode === "DASHBOARD_DEFEITOS" ? "Dashboard Defeitos" : "Dashboard Montagem";
    const miDataInicio = document.getElementById("miDataInicio");
    const miDataFim = document.getElementById("miDataFim");
    if (miDataInicio && !miDataInicio.value) miDataInicio.value = todayYmd();
    if (miDataFim && !miDataFim.value) miDataFim.value = todayYmd();
    ativarAbaMontagem(mode === "DASHBOARD_DEFEITOS" ? "defeitos" : "resumo");
    if (mode === "DASHBOARD_DEFEITOS") {
      aplicarLayoutDashboardDefeitos();
    } else {
      limparLayoutDashboardDefeitos();
    }
    carregarMontagemIndicadores();
  }
  if (mode === "SEQUENCIA_S3") {
    if (el.viewSequenciaS3) el.viewSequenciaS3.classList.remove("hidden");
    const seqS3Data = document.getElementById("seqS3Data");
    if (seqS3Data && !seqS3Data.value) seqS3Data.value = todayYmd();
    renderSequenciaS3();
  }
  if (mode === "MANDRIL_CIRCULAR") {
    if (el.viewMandrilCircular) el.viewMandrilCircular.classList.remove("hidden");
    if (el.mcFiltroData && !el.mcFiltroData.value) el.mcFiltroData.value = todayYmd();
    carregarMandrilCircular();
  }
  if (mode === "RELATORIO_MANUTENCAO") {
    if (el.viewRelatorioManutencao) el.viewRelatorioManutencao.classList.remove("hidden");
    renderizarRelatorioManutencao();
    carregarFormasManutencaoSupabase().then(() => {
      renderizarRelatorioManutencao();
      renderLiberacaoDual();
    });
  }
  if (mode === "TRATATIVA_DEFEITOS") {
    if (el.viewTratativaDefeitos) el.viewTratativaDefeitos.classList.remove("hidden");
    renderizarRelatorioTratativaDefeitos();
  }
  document.body.classList.remove("mode-hub", "mode-dashboard", "mode-liberacao", "mode-inspecao", "mode-inspecao-detalhe", "mode-montagem-postes", "mode-montagem-postes-detalhe", "mode-relatorio", "mode-historico", "mode-acmp-concretagem", "mode-usuarios", "mode-montagem-indicadores", "mode-dashboard-defeitos", "mode-sequencia-s3", "mode-mandril-circular", "mode-relatorio-manutencao", "mode-tratativa-defeitos");
  if (mode === "RELATORIO_MANUTENCAO") document.body.classList.add("mode-relatorio-manutencao");
  if (mode === "TRATATIVA_DEFEITOS") document.body.classList.add("mode-tratativa-defeitos");
  if (mode === "HUB") {
    document.body.classList.add("mode-hub");
    applyAutoResponsibleFields();
    atualizarIndicadoresManutencaoHub();
  }
  if (mode === "DASHBOARD") document.body.classList.add("mode-dashboard");
  if (mode === "LIBERACAO" || mode.startsWith("LIBERACAO_")) {
    document.body.classList.add("mode-liberacao");
    applyAutoResponsibleFields();
  }
  if (mode === "SEQUENCIA_S3") document.body.classList.add("mode-sequencia-s3");
  if (mode === "INSPECAO") {
    document.body.classList.add("mode-inspecao");
    if (state.authUser?.name && el.insColaborador) {
      el.insColaborador.value = state.authUser.name;
    }
    if ((el.insModoCarga?.value || "data") === "data" && !el.insFiltroData.value) {
      el.insLiberadosBody.innerHTML = '<tr><td colspan="4" class="muted">Selecione a data de produção para carregar os itens liberados.</td></tr>';
      el.insQtdItens.textContent = "0";
    }
  }
  if (mode === "INSPECAO_DETALHE") document.body.classList.add("mode-inspecao-detalhe");
  if (mode === "MONTAGEM_POSTES") {
    document.body.classList.add("mode-montagem-postes");
    if ((el.mpModoCarga?.value || "data") === "data" && !el.mpFiltroData?.value) {
      el.mpLiberadosBody.innerHTML = '<tr><td colspan="4" class="muted">Selecione a data de produção para carregar os itens liberados.</td></tr>';
      el.mpQtdItens.textContent = "0";
      if (el.mpKpiAprovados) el.mpKpiAprovados.textContent = "0";
      if (el.mpKpiRetrabalho) el.mpKpiRetrabalho.textContent = "0";
      if (el.mpKpiReprovados) el.mpKpiReprovados.textContent = "0";
    }
  }
  if (mode === "MONTAGEM_POSTES_DETALHE") document.body.classList.add("mode-montagem-postes-detalhe");
  if (mode === "RELATORIO") {
    document.body.classList.add("mode-relatorio");
    applyAutoResponsibleFields();
  }
  if (mode === "HISTORICO") document.body.classList.add("mode-historico");
  if (mode === "ACMP_CONCRETAGEM") document.body.classList.add("mode-acmp-concretagem");
  if (mode === "USUARIOS") document.body.classList.add("mode-usuarios");
  if (mode === "MONTAGEM_INDICADORES" || mode === "DASHBOARD_DEFEITOS") document.body.classList.add("mode-montagem-indicadores");
  if (mode === "DASHBOARD_DEFEITOS") document.body.classList.add("mode-dashboard-defeitos");

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
    MONTAGEM_INDICADORES: ["hubMontagemIndicadores", "Dashboard montagem"],
    DASHBOARD_DEFEITOS: ["hubDashboardDefeitos", "Dashboard Defeitos"],
    RELATORIO: ["hubRelatorio", "Relatório Enc. Produção"],
    HISTORICO: ["hubHistorico", "Histórico"],
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
  if (state.mode === "INSPECAO_DETALHE") {
    setMode("INSPECAO");
    renderInspecaoLiberados();
    return;
  }

  if (state.mode !== "HUB") {
    setMode("HUB");
    return;
  }

  setSyncStatus("warn", "Voce ja esta na tela principal.");
}

function handleHubModeNavigation(mode) {
  if (!mode) return;
  if (mode === "DASHBOARD") {
    setMode("DASHBOARD");
  } else if (mode === "MONTAGEM_INDICADORES" || mode === "DASHBOARD_DEFEITOS") {
    setMode(mode);
  } else if (mode === "PROD_ANALISE") {
    setMode("PROD_ANALISE");
  } else if (mode === "LIBERACAO" || mode.startsWith("LIBERACAO_")) {
    setMode(mode);
    if (el.libData && !el.libData.value) el.libData.value = todayYmd();
    renderLiberacaoDual();
  } else if (mode === "INSPECAO") {
    setMode("INSPECAO");
    if (el.insFiltroData && !el.insFiltroData.value) el.insFiltroData.value = todayYmd();
    renderInspecaoLiberados();
  } else if (mode === "MONTAGEM_POSTES") {
    setMode("MONTAGEM_POSTES");
    if (el.mpFiltroData && !el.mpFiltroData.value) el.mpFiltroData.value = todayYmd();
    renderMontagemPostesLiberados();
  } else if (mode === "RELATORIO") {
    setMode("RELATORIO");
    if (el.relData && !el.relData.value) el.relData.value = todayYmd();
  } else if (mode === "HISTORICO") {
    setMode("HISTORICO");
    renderHistorico();
  } else if (mode === "ACMP_CONCRETAGEM") {
    setMode("ACMP_CONCRETAGEM");
    if (el.acmpData && !el.acmpData.value) el.acmpData.value = todayYmd();
    renderAcmpConcretagem();
  } else if (mode === "USUARIOS") {
    setMode("USUARIOS");
  } else if (mode === "MANDRIL_CIRCULAR") {
    setMode("MANDRIL_CIRCULAR");
  }
}

function bindEssentialNavigation() {
  if (state.essentialNavigationBound) return;
  state.essentialNavigationBound = true;

  const appSidebar = document.getElementById("appSidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const sidebarToggle = document.getElementById("sidebarToggle");

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
        appSidebar.classList.toggle("sidebar-open");
        sidebarOverlay?.classList.toggle("visible");
      } else {
        const hidden = document.body.classList.toggle("sidebar-hidden");
        localStorage.setItem("sidebarCollapsed", hidden ? "1" : "0");
      }
    });
  }

  sidebarOverlay?.addEventListener("click", closeMobileSidebar);
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (window.innerWidth <= 768) closeMobileSidebar();
    });
  });

  document.querySelectorAll("[data-hub-mode]").forEach((btn) => {
    btn.dataset.hubNavBound = "1";
    btn.addEventListener("click", () => handleHubModeNavigation(btn.dataset.hubMode || ""));
  });
}

function bindEvents() {
  bindEssentialNavigation();

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

  applyAutoResponsibleFields();

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
  el.hubSequenciaS3?.addEventListener("click", () => {
    setMode("SEQUENCIA_S3");
    if (el.seqS3Data && !el.seqS3Data.value) el.seqS3Data.value = todayYmd();
    renderSequenciaS3();
  });
  el.hubMontagemIndicadores?.addEventListener("click", () => {
    setMode("MONTAGEM_INDICADORES");
  });
  el.hubDashboardDefeitos?.addEventListener("click", () => {
    setMode("DASHBOARD_DEFEITOS");
  });

  // Configuração dos Filtros e Abas do Dashboard Montagem
  document.getElementById("miBtnLimparFiltros")?.addEventListener("click", () => {
    const miDataInicio = document.getElementById("miDataInicio");
    const miDataFim = document.getElementById("miDataFim");
    if (miDataInicio) miDataInicio.value = todayYmd();
    if (miDataFim) miDataFim.value = todayYmd();
    
    const fSetor = document.getElementById("miFiltroSetor");
    if (fSetor) fSetor.value = "";
    const fStatus = document.getElementById("miFiltroStatus");
    if (fStatus) fStatus.value = "";
    const fPesquisa = document.getElementById("miFiltroPesquisa");
    if (fPesquisa) fPesquisa.value = "";

    miPaginaAtual = 1;
    aplicarFiltrosEExibirMontagem();
  });
  document.getElementById("miBtnAtualizar")?.addEventListener("click", () => {
    carregarMontagemIndicadores();
  });
  document.getElementById("miBtnExportarXlsx")?.addEventListener("click", () => {
    exportarMontagemIndicadoresXlsx();
  });
  document.getElementById("miBtnFiltrar")?.addEventListener("click", () => {
    carregarMontagemIndicadores();
  });
  document.getElementById("miDataInicio")?.addEventListener("change", () => {
    miPaginaAtual = 1;
    carregarMontagemIndicadores();
  });
  document.getElementById("miDataFim")?.addEventListener("change", () => {
    miPaginaAtual = 1;
    carregarMontagemIndicadores();
  });
  document.getElementById("miFiltroSetor")?.addEventListener("change", () => {
    miPaginaAtual = 1;
    aplicarFiltrosEExibirMontagem();
  });
  document.getElementById("miFiltroStatus")?.addEventListener("change", () => {
    miPaginaAtual = 1;
    aplicarFiltrosEExibirMontagem();
  });
  document.getElementById("miFiltroPesquisa")?.addEventListener("input", () => {
    miPaginaAtual = 1;
    aplicarFiltrosEExibirMontagem();
  });
  document.getElementById("miBtnCarregarMontagemDia")?.addEventListener("click", () => {
    carregarVisaoMontagemDia();
  });
  document.getElementById("miMontagemDiaData")?.addEventListener("change", () => {
    carregarVisaoMontagemDia();
  });
  document.getElementById("miBtnExportarMontagemDiaDetalhe")?.addEventListener("click", () => {
    exportarMontagemDiaDetalheXlsx();
  });

  // Troca de Abas do Dashboard
  document.querySelectorAll(".mi-tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const targetTab = e.currentTarget.dataset.tab;
      limparLayoutDashboardDefeitos();
      ativarAbaMontagem(targetTab || "resumo");
      if (targetTab === "montagemDia") carregarVisaoMontagemDia();
    });
  });

  // Close listeners for Visualizar Checklist Modal
  const vcClose = document.getElementById("vcBtnCloseModal");
  const vcOk = document.getElementById("vcBtnOk");
  const vcModal = document.getElementById("visualizarChecklistModal");
  if (vcClose) {
    vcClose.addEventListener("click", () => {
      vcModal.classList.remove("modal-visible");
    });
  }
  el.hubAcmpConcretagem?.addEventListener("click", () => {
    setMode("ACMP_CONCRETAGEM");
    if (!el.acmpData.value) el.acmpData.value = todayYmd();
    renderAcmpConcretagem();
  });
  el.hubRelatorioManutencao?.addEventListener("click", () => {
    setMode("RELATORIO_MANUTENCAO");
  });
  el.hubTratativaDefeitos?.addEventListener("click", () => {
    setMode("TRATATIVA_DEFEITOS");
  });

  document.getElementById("tdBtnImprimirPDF")?.addEventListener("click", () => {
    document.body.classList.add("print-relatorio-defeitos");
    window.print();
    document.body.classList.remove("print-relatorio-defeitos");
  });

  document.getElementById("tdBtnLimparFiltros")?.addEventListener("click", () => {
    const st = document.getElementById("tdFiltroStatus");
    const cod = document.getElementById("tdFiltroCodigo");
    const resp = document.getElementById("tdFiltroResponsavel");
    const ini = document.getElementById("tdFiltroDataInicio");
    const fim = document.getElementById("tdFiltroDataFim");
    if (st) st.value = "TODOS";
    if (cod) cod.value = "TODOS";
    if (resp) resp.value = "TODOS";
    if (ini) ini.value = "";
    if (fim) fim.value = "";
    renderizarRelatorioTratativaDefeitos();
  });

  ["tdFiltroStatus", "tdFiltroCodigo", "tdFiltroResponsavel", "tdFiltroDataInicio", "tdFiltroDataFim"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", renderizarRelatorioTratativaDefeitos);
    document.getElementById(id)?.addEventListener("input", renderizarRelatorioTratativaDefeitos);
  });

  document.getElementById("mTratativaCancelBtn")?.addEventListener("click", () => {
    document.getElementById("modalTratativaDefeito")?.classList.remove("modal-visible");
  });

  document.getElementById("mTratativaExecutadoPorSelect")?.addEventListener("change", (e) => {
    const input = document.getElementById("mTratativaExecutadoPor");
    if (e.target.value === "OUTRO") {
      input?.classList.remove("hidden");
      input?.focus();
    } else {
      input?.classList.add("hidden");
    }
  });

  document.getElementById("tdBtnNovaOcorrencia")?.addEventListener("click", () => {
    const dataInput = document.getElementById("mNovaData");
    if (dataInput && !dataInput.value) dataInput.value = todayYmd();
    document.getElementById("modalNovaOcorrenciaDefeito")?.classList.add("modal-visible");
  });

  document.getElementById("mNovaCancelBtn")?.addEventListener("click", () => {
    document.getElementById("modalNovaOcorrenciaDefeito")?.classList.remove("modal-visible");
  });

  document.getElementById("mNovaConfirmBtn")?.addEventListener("click", () => {
    const setor = document.getElementById("mNovaSetor")?.value || "Setor 1";
    const forma = document.getElementById("mNovaForma")?.value?.trim() || "";
    const data = document.getElementById("mNovaData")?.value || todayYmd();
    const modelo = document.getElementById("mNovaModelo")?.value?.trim() || "Poste Concretrack";
    const codigo = document.getElementById("mNovaCodigoDefeito")?.value || "A";
    const obs = document.getElementById("mNovaObservacoes")?.value?.trim() || "";

    if (!forma) {
      alert("Por favor, preencha o número da forma ou poste.");
      document.getElementById("mNovaForma")?.focus();
      return;
    }

    const info = getDefeitoInfo(codigo);
    const idKey = `INC_MAN_${data}_${setor}_${forma}_${codigo}_${Date.now()}`;

    const rec = {
      id: idKey,
      data_fabricacao: data,
      setor: setor,
      forma_numero: forma,
      modelo: modelo,
      codigo_defeito: codigo,
      descricao_defeito: info.descricao,
      classificacao: info.classificacao,
      responsavel_designado: info.responsavel,
      responsaveis_lista: info.responsaveisLista || [],
      acao_recomendada: info.acao,
      status_tratativa: "PENDENTE",
      executado_por: "",
      acao_realizada: "",
      tratado_em: "",
      observacoes_origem: obs
    };

    salvarTratativaDefeitoRegistro(rec);
    document.getElementById("modalNovaOcorrenciaDefeito")?.classList.remove("modal-visible");
    renderizarRelatorioTratativaDefeitos();
    setSyncStatus("ok", `Nova ocorrência do defeito ${codigo} registrada com sucesso.`);
  });

  document.getElementById("mTratativaConfirmBtn")?.addEventListener("click", () => {
    if (!pendingTratativaSelection) return;
    const status = document.getElementById("mTratativaStatus")?.value || "PENDENTE";
    const execSel = document.getElementById("mTratativaExecutadoPorSelect")?.value || "";
    const execCustom = document.getElementById("mTratativaExecutadoPor")?.value?.trim() || "";
    const executadoPor = execSel === "OUTRO" ? execCustom : execSel;
    const acaoRealizada = document.getElementById("mTratativaAcaoRealizada")?.value?.trim() || "";

    if (!acaoRealizada) {
      alert("Por favor, preencha o direcionamento / ação corretiva realizada.");
      document.getElementById("mTratativaAcaoRealizada")?.focus();
      return;
    }

    const rec = {
      ...pendingTratativaSelection,
      status_tratativa: status,
      executado_por: executadoPor || state.authUser?.name || "Técnico",
      acao_realizada: acaoRealizada,
      tratado_em: new Date().toLocaleString("pt-BR")
    };

    salvarTratativaDefeitoRegistro(rec);
    document.getElementById("modalTratativaDefeito")?.classList.remove("modal-visible");
    renderizarRelatorioTratativaDefeitos();
    setSyncStatus("ok", `Tratativa do defeito ${rec.codigo_defeito} atualizada com sucesso.`);
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
      if (state.programmingMode) {
        if (el.kioskLibCheckbox && el.kioskLibCheckbox.checked) {
          el.kioskLibCheckbox.checked = false;
          el.kioskLibCheckbox.dispatchEvent(new Event("change"));
        }
        if (el.kioskOdinCheckbox && el.kioskOdinCheckbox.checked) {
          el.kioskOdinCheckbox.checked = false;
          el.kioskOdinCheckbox.dispatchEvent(new Event("change"));
        }
        if (el.kioskManutencaoCheckbox && el.kioskManutencaoCheckbox.checked) {
          el.kioskManutencaoCheckbox.checked = false;
          el.kioskManutencaoCheckbox.dispatchEvent(new Event("change"));
        }
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
      document.body.classList.toggle("liberation-active", state.liberationMode);
      if (state.liberationMode) {
        if (el.kioskProgCheckbox && el.kioskProgCheckbox.checked) {
          el.kioskProgCheckbox.checked = false;
          el.kioskProgCheckbox.dispatchEvent(new Event("change"));
        }
        if (el.kioskOdinCheckbox && el.kioskOdinCheckbox.checked) {
          el.kioskOdinCheckbox.checked = false;
          el.kioskOdinCheckbox.dispatchEvent(new Event("change"));
        }
        if (el.kioskManutencaoCheckbox && el.kioskManutencaoCheckbox.checked) {
          el.kioskManutencaoCheckbox.checked = false;
          el.kioskManutencaoCheckbox.dispatchEvent(new Event("change"));
        }
      }
      const toggleField = document.getElementById("kioskLibToggleField");
      if (toggleField) {
        toggleField.classList.toggle("active", state.liberationMode);
      }
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

  if (el.kioskOdinCheckbox) {
    el.kioskOdinCheckbox.addEventListener("change", () => {
      state.odinMode = el.kioskOdinCheckbox.checked;
      document.body.classList.toggle("odin-active", state.odinMode);
      if (state.odinMode) {
        if (el.kioskProgCheckbox && el.kioskProgCheckbox.checked) {
          el.kioskProgCheckbox.checked = false;
          el.kioskProgCheckbox.dispatchEvent(new Event("change"));
        }
        if (el.kioskLibCheckbox && el.kioskLibCheckbox.checked) {
          el.kioskLibCheckbox.checked = false;
          el.kioskLibCheckbox.dispatchEvent(new Event("change"));
        }
        if (el.kioskManutencaoCheckbox && el.kioskManutencaoCheckbox.checked) {
          el.kioskManutencaoCheckbox.checked = false;
          el.kioskManutencaoCheckbox.dispatchEvent(new Event("change"));
        }
      }
      const toggleField = document.getElementById("kioskOdinToggleField");
      if (toggleField) {
        toggleField.classList.toggle("active", state.odinMode);
      }
      renderLiberacaoDual();
    });
  }

  if (el.kioskOdinToggleField && el.kioskOdinCheckbox) {
    el.kioskOdinToggleField.addEventListener("click", (e) => {
      if (e.target !== el.kioskOdinCheckbox && !el.kioskOdinCheckbox.contains(e.target)) {
        el.kioskOdinCheckbox.checked = !el.kioskOdinCheckbox.checked;
        el.kioskOdinCheckbox.dispatchEvent(new Event("change"));
      }
    });
  }

  if (el.kioskManutencaoCheckbox) {
    el.kioskManutencaoCheckbox.addEventListener("change", () => {
      state.manutencaoMode = el.kioskManutencaoCheckbox.checked;
      document.body.classList.toggle("manutencao-active", state.manutencaoMode);
      if (state.manutencaoMode) {
        if (el.kioskProgCheckbox && el.kioskProgCheckbox.checked) {
          el.kioskProgCheckbox.checked = false;
          el.kioskProgCheckbox.dispatchEvent(new Event("change"));
        }
        if (el.kioskLibCheckbox && el.kioskLibCheckbox.checked) {
          el.kioskLibCheckbox.checked = false;
          el.kioskLibCheckbox.dispatchEvent(new Event("change"));
        }
        if (el.kioskOdinCheckbox && el.kioskOdinCheckbox.checked) {
          el.kioskOdinCheckbox.checked = false;
          el.kioskOdinCheckbox.dispatchEvent(new Event("change"));
        }
      }
      const toggleField = document.getElementById("kioskManutencaoToggleField");
      if (toggleField) {
        toggleField.classList.toggle("active", state.manutencaoMode);
      }
      renderLiberacaoDual();
    });
  }

  const kioskManutencaoToggleField = document.getElementById("kioskManutencaoToggleField");
  if (kioskManutencaoToggleField && el.kioskManutencaoCheckbox) {
    kioskManutencaoToggleField.addEventListener("click", (e) => {
      if (e.target !== el.kioskManutencaoCheckbox && !el.kioskManutencaoCheckbox.contains(e.target)) {
        el.kioskManutencaoCheckbox.checked = !el.kioskManutencaoCheckbox.checked;
        el.kioskManutencaoCheckbox.dispatchEvent(new Event("change"));
      }
    });
  }

  // Eventos dos Modais de Manutenção
  const modalParada = document.getElementById("modalManutencaoParada");
  const modalLiberacao = document.getElementById("modalManutencaoLiberacao");

  document.getElementById("mParadaCancelBtn")?.addEventListener("click", () => {
    modalParada?.classList.remove("modal-visible");
  });
  modalParada?.addEventListener("click", (e) => {
    if (e.target === modalParada) {
      modalParada.classList.remove("modal-visible");
    }
  });

  document.getElementById("mParadaConfirmBtn")?.addEventListener("click", () => {
    if (!pendingManutencaoSelection) return;
    const motivo = document.getElementById("mParadaMotivo")?.value?.trim();
    const acao = document.getElementById("mParadaAcao")?.value?.trim();
    if (!motivo) {
      alert("Por favor, preencha o motivo da parada.");
      document.getElementById("mParadaMotivo")?.focus();
      return;
    }
    if (!acao) {
      alert("Por favor, preencha o que precisa ser feito para arrumar.");
      document.getElementById("mParadaAcao")?.focus();
      return;
    }
    salvarFormaParadaManutencao(pendingManutencaoSelection.setor, pendingManutencaoSelection.formaNumero, motivo, acao);
    modalParada?.classList.remove("modal-visible");
    renderLiberacaoDual();
    renderizarRelatorioManutencao();
    setSyncStatus("ok", `Forma ${pendingManutencaoSelection.formaNumero} inativada por manutenção.`);
  });

  document.getElementById("mLiberacaoCancelBtn")?.addEventListener("click", () => {
    modalLiberacao?.classList.remove("modal-visible");
  });
  modalLiberacao?.addEventListener("click", (e) => {
    if (e.target === modalLiberacao) {
      modalLiberacao.classList.remove("modal-visible");
    }
  });

  document.getElementById("mLiberacaoConfirmBtn")?.addEventListener("click", () => {
    if (!pendingManutencaoSelection) return;
    const obs = document.getElementById("mLiberacaoObs")?.value?.trim();
    if (!obs) {
      alert("Por favor, informe a observação/serviço realizado na liberação.");
      document.getElementById("mLiberacaoObs")?.focus();
      return;
    }
    liberarFormaManutencao(pendingManutencaoSelection.setor, pendingManutencaoSelection.formaNumero, obs);
    modalLiberacao?.classList.remove("modal-visible");
    renderLiberacaoDual();
    setSyncStatus("ok", `Forma ${pendingManutencaoSelection.formaNumero} liberada da manutenção.`);
  });

  ["rmFiltroStatus", "rmFiltroDataInicio", "rmFiltroDataFim"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", renderizarRelatorioManutencao);
  });
  document.getElementById("rmBtnLimparFiltros")?.addEventListener("click", () => {
    const status = document.getElementById("rmFiltroStatus");
    const dataInicio = document.getElementById("rmFiltroDataInicio");
    const dataFim = document.getElementById("rmFiltroDataFim");
    if (status) status.value = "TODOS";
    if (dataInicio) dataInicio.value = "";
    if (dataFim) dataFim.value = "";
    renderizarRelatorioManutencao();
  });

  document.getElementById("rmBtnImprimirPDF")?.addEventListener("click", () => {
    document.body.classList.add("print-relatorio-manutencao");
    window.print();
    document.body.classList.remove("print-relatorio-manutencao");
  });

  if (el.kioskOdinToggleField && el.kioskOdinCheckbox) {
    el.kioskOdinToggleField.addEventListener("click", (e) => {
      if (e.target !== el.kioskOdinCheckbox && !el.kioskOdinCheckbox.contains(e.target)) {
        el.kioskOdinCheckbox.checked = !el.kioskOdinCheckbox.checked;
        el.kioskOdinCheckbox.dispatchEvent(new Event("change"));
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
      if (el.kioskLibCheckbox && el.kioskLibCheckbox.checked) {
        el.kioskLibCheckbox.checked = false;
        el.kioskLibCheckbox.dispatchEvent(new Event("change"));
      }
      if (el.kioskOdinCheckbox && el.kioskOdinCheckbox.checked) {
        el.kioskOdinCheckbox.checked = false;
        el.kioskOdinCheckbox.dispatchEvent(new Event("change"));
      }
      if (el.kioskManutencaoCheckbox && el.kioskManutencaoCheckbox.checked) {
        el.kioskManutencaoCheckbox.checked = false;
        el.kioskManutencaoCheckbox.dispatchEvent(new Event("change"));
      }
      document.body.classList.remove("kiosk-active", "liberation-active", "odin-active", "manutencao-active");
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
  if (el.insStatusFiltro) {
    el.insStatusFiltro.addEventListener("change", renderInspecaoLiberados);
  }
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
  if (el.insCarregarLiberados) {
    el.insCarregarLiberados.addEventListener("click", renderInspecaoLiberados);
    el.insCarregarLiberados.addEventListener("click", () => clearSubmitLock("inspecao"));
  }
  if (el.insFiltroData) {
    el.insFiltroData.addEventListener("change", () => clearSubmitLock("inspecao"));
  }
  if (el.insColaborador) {
    el.insColaborador.addEventListener("input", () => clearSubmitLock("inspecao"));
  }
  if (el.insFormaFiltro) {
    el.insFormaFiltro.addEventListener("input", filtrarFormasTabela);
  }

  if (el.insLiberadosBody) {
    el.insLiberadosBody.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const tr = target.closest("tr[data-record-id]");
      if (!tr) return;

      const recordId = tr.dataset.recordId;
      const dataFabricacao = tr.dataset.dataFabricacao;
      const setor = tr.dataset.setor;
      const formaNumero = tr.dataset.formaNumero;
      const modelo = tr.dataset.modelo;
      const codigoPoste = tr.dataset.codigoPoste;
      const descricaoPoste = tr.dataset.descricaoPoste;
      const codigoProduto = tr.dataset.codigoProduto;

      const posteBase = {
        recordId,
        dataFabricacao,
        setor,
        formaNumero,
        modelo,
        codigoPoste,
        descricaoPoste,
        codigoProduto
      };

      if (target.classList.contains("ins-open-btn")) {
        await openInspecaoPosteDetalhe(posteBase);
      } else if (target.classList.contains("ins-ver-checklist-btn")) {
        const rawJson = tr.dataset.inspecaoRaw;
        if (rawJson) {
          try {
            const rawRow = JSON.parse(rawJson);
            window.abrirVisualizacaoChecklist(rawRow);
          } catch (e) {
            console.error("Erro ao analisar inspecaoRaw:", e);
          }
        }
      }
    });
  }

  if (el.insChecklistSections) {
    el.insChecklistSections.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const btn = target.closest("button[data-ins-section][data-ins-item][data-ins-value]");
      if (!btn) return;
      const sectionId = btn.dataset.insSection || "";
      const itemId = btn.dataset.insItem || "";
      const value = btn.dataset.insValue || "";
      setInspecaoChecklistAnswer(sectionId, itemId, value);
    });

    el.insChecklistSections.addEventListener("change", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (!target.classList.contains("ins-item-photo-input")) return;

      const file = target.files?.[0];
      if (!file) return;

      const sectionId = target.dataset.insSection || "";
      const itemId = target.dataset.insItem || "";

      try {
        const dataUrl = await fileToDataUrl(file);
        const base64 = await compressImage(dataUrl, 1024, 0.7);
        setInspecaoChecklistPhoto(sectionId, itemId, base64);
      } catch (err) {
        console.error("Erro ao converter e comprimir imagem:", err);
        showMsgBox("Erro ao carregar a foto. Tente novamente.", "error");
      }
    });
  }

  if (el.insStatusButtons) {
    el.insStatusButtons.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const btn = target.closest("button[data-ins-status]");
      if (!btn || state.inspecaoPostesAtual?.finalizadoEm) return;
      const status = btn.dataset.insStatus || "";
      if (!status) return;
      setInspecaoStatus(status);
    });
  }

  if (el.insObservacoes) {
    el.insObservacoes.addEventListener("input", () => {
      if (!state.inspecaoPostesAtual) return;
      state.inspecaoPostesAtual.observacoesMontagem = el.insObservacoes.value;
      upsertMontagemPoste(state.inspecaoPostesAtual);
    });
  }

  if (el.insFinalizarPoste) {
    el.insFinalizarPoste.addEventListener("click", finalizarInspecaoPosteAtual);
  }

  if (el.mpFiltroData) el.mpFiltroData.addEventListener("change", renderMontagemPostesLiberados);
  if (el.mpModoCarga) el.mpModoCarga.addEventListener("change", renderMontagemPostesLiberados);
  if (el.mpSetor) el.mpSetor.addEventListener("change", renderMontagemPostesLiberados);
  if (el.mpStatusFiltro) el.mpStatusFiltro.addEventListener("change", renderMontagemPostesLiberados);
  if (el.mpCarregarLiberados) el.mpCarregarLiberados.addEventListener("click", renderMontagemPostesLiberados);
  if (el.mpFormaFiltro) el.mpFormaFiltro.addEventListener("input", filtrarMontagemTabela);

  if (el.mpLiberadosBody) {
    el.mpLiberadosBody.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const verChecklistBtn = target.closest(".mp-ver-checklist-btn");
      if (verChecklistBtn) {
        const tr = verChecklistBtn.closest("tr[data-forma-numero]");
        if (tr && tr.dataset.montagemRaw) {
          try {
            const montRecord = JSON.parse(tr.dataset.montagemRaw);
            window.abrirVisualizacaoChecklist(montRecord);
          } catch (e) {
            console.error("Erro ao abrir visualização do checklist:", e);
          }
        }
        return;
      }

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
        const dataUrl = await fileToDataUrl(file);
        const base64 = await compressImage(dataUrl, 1024, 0.7);
        setMontagemChecklistPhoto(sectionId, itemId, base64);
      } catch (err) {
        console.error("Erro ao converter e comprimir imagem:", err);
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

  if (el.atualizarDashboard) el.atualizarDashboard.addEventListener("click", carregarDashboardConcretagem);
  if (el.dashData) el.dashData.addEventListener("change", carregarDashboardConcretagem);
  if (el.filtrarHistorico) el.filtrarHistorico.addEventListener("click", () => renderHistorico());
  el.histTipo?.addEventListener("change", () => renderHistorico());
  if (el.gerarRelatorioSetor) el.gerarRelatorioSetor.addEventListener("click", gerarRelatorioSetor);
  if (el.relBtnImprimir) el.relBtnImprimir.addEventListener("click", imprimirRelatorioSetor);
  if (el.relBtnWhatsapp) el.relBtnWhatsapp.addEventListener("click", enviarRelatorioWhatsapp);
  if (el.acmpCarregar) el.acmpCarregar.addEventListener("click", renderAcmpConcretagem);
  if (el.acmpData) el.acmpData.addEventListener("change", renderAcmpConcretagem);
  if (el.acmpModoCarga) el.acmpModoCarga.addEventListener("change", renderAcmpConcretagem);
  if (el.acmpSetor) el.acmpSetor.addEventListener("change", renderAcmpConcretagem);
  if (el.acmpSalvar) el.acmpSalvar.addEventListener("click", salvarAcmp);
  if (el.acmpImprimir) el.acmpImprimir.addEventListener("click", imprimirAcmp);

  if (el.insFotos) el.insFotos.addEventListener("change", async (event) => {
    clearSubmitLock("inspecao");
    const files = Array.from(event.target.files || []);
    state.insPhotosRawFiles = (state.insPhotosRawFiles || []).concat(files);
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

  if (!state.essentialNavigationBound && sidebarToggle && appSidebar) {
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
  if (!state.essentialNavigationBound && sidebarOverlay && appSidebar) {
    sidebarOverlay.addEventListener("click", closeMobileSidebar);
  }
  if (!state.essentialNavigationBound) {
    document.querySelectorAll(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (window.innerWidth <= 768) closeMobileSidebar();
      });
    });
  }
  const navInicio = document.getElementById("navInicio");
  if (navInicio) navInicio.addEventListener("click", () => setMode("HUB"));
  const navDashboard = document.getElementById("navDashboard");
  if (navDashboard) navDashboard.addEventListener("click", () => setMode("DASHBOARD"));
  const navProdAnalise = document.getElementById("navProdAnalise");
  if (navProdAnalise) navProdAnalise.addEventListener("click", () => setMode("PROD_ANALISE"));

  const hubMandrilCircular = document.getElementById("hubMandrilCircular");
  if (hubMandrilCircular) hubMandrilCircular.addEventListener("click", () => setMode("MANDRIL_CIRCULAR"));

  if (el.mcFiltroData) el.mcFiltroData.addEventListener("change", carregarMandrilCircular);

  // Productivity filters & actions
  document.getElementById("paBtnToggleFiltros")?.addEventListener("click", () => setProdutividadeDrawerOpen(true));
  document.getElementById("paBtnFecharFiltros")?.addEventListener("click", () => setProdutividadeDrawerOpen(false));
  document.getElementById("paFiltrosDrawer")?.addEventListener("click", (ev) => {
    if (ev.target?.id === "paFiltrosDrawer") setProdutividadeDrawerOpen(false);
  });
  document.getElementById("paBtnAtualizar")?.addEventListener("click", carregarProdutividadeConcretagem);
  const paBtnFiltrar = document.getElementById("paBtnFiltrar");
  if (paBtnFiltrar) paBtnFiltrar.addEventListener("click", () => {
    setProdutividadeDrawerOpen(false);
    carregarProdutividadeConcretagem();
  });
  const paBtnExportarCSV = document.getElementById("paBtnExportarCSV");
  if (paBtnExportarCSV) paBtnExportarCSV.addEventListener("click", exportarPaCSV);
  const paBtnExportarDadosCSV = document.getElementById("paBtnExportarDadosCSV");
  if (paBtnExportarDadosCSV) paBtnExportarDadosCSV.addEventListener("click", exportarPaDadosCSV);
  const paBtnExportarExcel = document.getElementById("paBtnExportarExcel");
  if (paBtnExportarExcel) paBtnExportarExcel.addEventListener("click", exportarPaExcel);
  const paBtnExportarPDF = document.getElementById("paBtnExportarPDF");
  if (paBtnExportarPDF) paBtnExportarPDF.addEventListener("click", exportarPaPDF);
  document.querySelectorAll("[data-pa-tab]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const targetTab = e.currentTarget.dataset.paTab;
      document.querySelectorAll("[data-pa-tab]").forEach(b => b.classList.remove("active"));
      e.currentTarget.classList.add("active");
      document.querySelectorAll(".pa-tab-section").forEach(section => section.classList.remove("active"));
      const sectionId = "paSecao" + targetTab.charAt(0).toUpperCase() + targetTab.slice(1);
      document.getElementById(sectionId)?.classList.add("active");
      Object.values(chartInstances).forEach(chart => chart?.resize?.());
    });
  });

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

  document.querySelectorAll("[data-hub-mode]").forEach((btn) => {
    if (btn.dataset.hubNavBound === "1") return;
    btn.addEventListener("click", () => {
      handleHubModeNavigation(btn.dataset.hubMode || "");
    });
  });

  // Sequencia Setor 3 bindings
  el.seqS3Data?.addEventListener("change", () => {
    renderSequenciaS3();
  });
  el.seqS3Search?.addEventListener("input", () => {
    filterSequenciaS3();
  });
  el.seqS3BtnSalvar?.addEventListener("click", () => {
    saveSequenciaS3();
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
            codigo_produto: ev.codigoProduto || null,
            status: ev.status || "LIBERADO"
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

  // 3. Sincronizar prog_s3_s4 (Sequencia Setor 3)
  try {
    const progDb = readProgS3S4Db();
    let progChanged = false;
    const pendingKeys = Object.keys(progDb.programacoes || {}).filter(key => progDb.programacoes[key].pendingSync === true);
    for (const key of pendingKeys) {
      const entry = progDb.programacoes[key];
      const { error } = await supabaseClient
        .from("prog_s3_s4")
        .upsert({
          data: entry.data,
          forma: entry.forma,
          setor: entry.setor,
          modelo: entry.modelo
        }, { onConflict: "data,forma,setor" });
      
      if (!error) {
        progDb.programacoes[key].pendingSync = false;
        progChanged = true;
        syncedCount++;
      }
    }
    if (progChanged) {
      writeProgS3S4Db(progDb);
    }
  } catch (err) {
    console.error("[syncOfflineData] Erro ao sincronizar prog_s3_s4:", err);
  }

  if (syncedCount > 0) {
    setSyncStatus("ok", `Sincronização offline automática concluída! ${syncedCount} item(ns) enviado(s).`);
    try {
      await loadClickedFormsFromSupabase();
      await sincronizarManutencaoLocalPendente();
      renderLiberacaoDual();
      renderizarRelatorioManutencao();
    } catch (e) {
      console.error("Erro ao recarregar dados pós sincronização:", e);
    }
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

// Sincronização automática de dados a cada 3 minutos (pull de novas programações e concretagens)
setInterval(async () => {
  if (navigator.onLine) {
    try {
      console.log("[Auto-Sync] Iniciando sincronização automática periódica (3 minutos)...");
      await loadProgrammedFormas();
      await loadClickedFormsFromSupabase();
      renderLiberacaoDual();
      console.log("[Auto-Sync] Sincronização automática periódica concluída com sucesso.");
    } catch (err) {
      console.error("[Auto-Sync] Erro na sincronização automática periódica:", err);
    }
  }
}, 180000);

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
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: MANUTENCAO_FORMAS_TABLE },
      async () => {
        await carregarFormasManutencaoSupabase();
        renderLiberacaoDual();
        renderizarRelatorioManutencao();
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

function isConcretePadrao(row) {
  const raw = row?.tipo_concreto || row?.tipoConcreto || row?.concretoTipo || "";
  if (!raw) return true;
  const normalized = String(raw).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  if (normalized === "INSPECIONADO") return true;
  const isDefect = normalized.includes("SECO") || normalized.includes("SEGREGAD") || normalized.includes("EXSUDAD");
  return !isDefect;
}

function buildProductiveHourBuckets(rows, valueGetter) {
  const buckets = {};
  rows.forEach(row => {
    const ts = row.data_hora || row.updated_at || row.timestamp;
    if (!ts) return;
    const date = new Date(ts);
    if (isNaN(date.getTime())) return;
    const label = String(date.getHours()).padStart(2, '0') + 'h';
    buckets[label] = (buckets[label] || 0) + valueGetter(row);
  });

  const labels = Object.keys(buckets).sort();
  return { labels, values: labels.map(label => buckets[label]) };
}

function deduplicarLinhasProducao(rows) {
  if (!rows || rows.length === 0) return [];
  const groups = {};
  rows.forEach(r => {
    const key = `${r.data_fabricacao}||${r.forma || r.forma_numero || ""}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });

  const uniqueRows = [];
  Object.keys(groups).forEach(key => {
    const list = groups[key];
    let selected = list.find(r => r.status === 'LIBERADO');
    if (!selected) {
      selected = list.find(r => r.tipo_concreto !== 'INSPECIONADO');
    }
    if (!selected) {
      selected = list[0];
    }
    uniqueRows.push(selected);
  });
  return uniqueRows;
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
  const cyclesBySector = {};
  const allIntervals = [];
  const paradasList = [];
  let tempoPerdidoTotal = 0;

  Object.keys(groups).forEach(key => {
    const [dia, setor] = key.split("||");
    const list = groups[key].sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());

    if (!cyclesBySector[setor]) {
      cyclesBySector[setor] = [];
    }

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
        cyclesBySector[setor].push(diffMin);
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
    const list = filteredRows.filter(r => r.data_fabricacao === dia).sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
    if (list.length > 0) {
      const tIni = new Date(list[0].data_hora);
      const tFim = new Date(list[list.length - 1].data_hora);
      jornadaDiaria.push({
        data: dia.split("-").reverse().join("/"),
        inicio: tIni.toLocaleTimeString("pt-BR", {hour:'2-digit', minute:'2-digit'}),
        fim: tFim.toLocaleTimeString("pt-BR", {hour:'2-digit', minute:'2-digit'}),
        formas: list.length,
        metaDiaria: Math.round(480 / meta)
      });
    }
  });
  jornadaDiaria.reverse();

  const productiveFormsBuckets = buildProductiveHourBuckets(filteredRows, () => 1);
  const productiveVolumeBuckets = buildProductiveHourBuckets(filteredRows, r => getFormVolume(r.codigo_produto, r.modelo, r.setor));
  const heatmapFaixas = {};
  productiveFormsBuckets.labels.forEach((label, index) => {
    heatmapFaixas[label] = productiveFormsBuckets.values[index];
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

  let totalFormasPorHora = 0;
  Object.keys(cyclesBySector).forEach(setor => {
    const sectorCycles = cyclesBySector[setor];
    if (sectorCycles.length > 0) {
      const sectorSum = sectorCycles.reduce((s, v) => s + v, 0);
      const sectorAvg = sectorSum / sectorCycles.length;
      if (sectorAvg > 0) {
        totalFormasPorHora += 60 / sectorAvg;
      }
    }
  });

  const avgVol = totalVolume / Math.max(totalFormas, 1);
  const m3PorHora = totalFormasPorHora * avgVol;

  return {
    filteredRows,
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
    formasPorHora: totalFormasPorHora,
    m3PorHora: m3PorHora,
    paradasAmarelas: paradasList.filter(p => p.classificacao === "AMARELO").length,
    paradasVermelhas: paradasList.filter(p => p.classificacao === "VERMELHO").length,
    paradasList,
    jornadaDiaria,
    heatmapFaixas,
    productiveVolumeBuckets,
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

function renderizarTabelaDadosConcretagem(filteredRows) {
  const tbody = document.getElementById("paDadosTbody");
  if (!tbody) return;
  if (!filteredRows || filteredRows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b;">Nenhum dado encontrado no período.</td></tr>';
    return;
  }
  
  // Ordenar por horário (mais recente primeiro)
  const rows = [...filteredRows].sort((a, b) => new Date(b.data_hora || b.updated_at) - new Date(a.data_hora || a.updated_at));

  tbody.innerHTML = rows.map(r => {
    let time = "N/A";
    const tsStr = r.data_hora || r.updated_at;
    if (tsStr) {
      const d = new Date(tsStr);
      if (!isNaN(d.getTime())) {
        time = d.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
      }
    }
    const tipo = r.tipo_concreto || r.tipoConcreto || r.concretoTipo || "Padrão";
    return `
      <tr>
        <td style="font-weight: 600;">${r.forma_numero || r.forma || ""}</td>
        <td>${r.setor || ""}</td>
        <td>${tipo}</td>
        <td style="text-align: center;">${time}</td>
        <td>${r.colaborador || ""}</td>
      </tr>
    `;
  }).join("");
}

function exportarPaDadosCSV() {
  const rows = state.paLastRows;
  if (!rows || rows.length === 0) {
    showMsgBox("Gere um filtro antes de exportar.", "error");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Forma;Setor;Tipo de Concreto;Data;Horario;Operador\n";

  const sortedRows = [...rows].sort((a, b) => new Date(a.data_hora || a.updated_at) - new Date(b.data_hora || b.updated_at));
  
  sortedRows.forEach(r => {
    let dateStr = "";
    let timeStr = "";
    const tsStr = r.data_hora || r.updated_at;
    if (tsStr) {
      const d = new Date(tsStr);
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleDateString("pt-BR");
        timeStr = d.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
      }
    }
    const tipo = r.tipo_concreto || r.tipoConcreto || r.concretoTipo || "Padrão";
    
    const fields = [
      r.forma_numero || r.forma || "",
      r.setor || "",
      tipo,
      dateStr,
      timeStr,
      r.colaborador || ""
    ];
    
    csvContent += fields.map(f => '"' + String(f).replace(/"/g, '""') + '"').join(";") + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `dados_concretagem_${new Date().getTime()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function renderizarTabelaJornada(list) {
  const container = document.getElementById("paJornadaCards");
  if (!container) return;
  if (!list || list.length === 0) {
    container.innerHTML = '<div class="muted" style="padding:12px;text-align:center;">Sem dados para o periodo.</div>';
    return;
  }
  container.innerHTML = list.slice(0, 10).map(j => `
    <article class="pa-journey-card">
      <div class="pa-journey-card-head">
        <strong>${j.data}</strong>
        <span>${j.formas} formas</span>
      </div>
      <div class="pa-journey-card-grid">
        <div><span>Inicio</span><strong>${j.inicio}</strong></div>
        <div><span>Termino</span><strong>${j.fim}</strong></div>
        <div><span>Meta diaria</span><strong>${j.metaDiaria}</strong></div>
      </div>
    </article>
  `).join("");
}


function renderizarVolumeTipoPorSetor(rows) {
  const container = document.getElementById("paVolumeTipoSetor");
  if (!container) return;
  const setores = ["Setor 1", "Setor 2", "Setor 3", "Setor 4"];
  const data = setores.map(setor => {
    const acc = { setor, padrao: 0, fora: 0 };
    rows.filter(r => r.setor === setor).forEach(r => {
      const vol = getFormVolume(r.codigo_produto, r.modelo, r.setor);
      if (isConcretePadrao(r)) acc.padrao += vol;
      else acc.fora += vol;
    });
    return acc;
  });
  const maxTotal = Math.max(...data.map(d => d.padrao + d.fora), 1);
  container.innerHTML = data.map(item => {
    const total = item.padrao + item.fora;
    const padraoPct = total > 0 ? (item.padrao / total) * 100 : 0;
    const foraPct = total > 0 ? (item.fora / total) * 100 : 0;
    const width = Math.max((total / maxTotal) * 100, total > 0 ? 8 : 0);
    return `
      <div class="pa-volume-sector-row">
        <div class="pa-volume-sector-head">
          <strong>${item.setor}</strong>
          <span>${total.toFixed(2)} m3</span>
        </div>
        <div class="pa-volume-sector-track" style="width:${width}%">
          <div class="pa-volume-padrao" style="width:${padraoPct}%"></div>
          <div class="pa-volume-fora" style="width:${foraPct}%"></div>
        </div>
        <div class="pa-volume-sector-legend">
          <span>Padrao: ${item.padrao.toFixed(2)} m3</span>
          <span>Fora: ${item.fora.toFixed(2)} m3</span>
        </div>
      </div>
    `;
  }).join("");
}

function renderizarGraficosSetorProdutividade(rows) {
  const setores = ["Setor 1", "Setor 2", "Setor 3", "Setor 4"];
  const formas = setores.map(setor => rows.filter(r => r.setor === setor).length);
  const volumes = setores.map(setor => rows
    .filter(r => r.setor === setor)
    .reduce((sum, r) => sum + getFormVolume(r.codigo_produto, r.modelo, r.setor), 0));

  destroyChart("chartPaFormasSetor");
  const ctxFormas = document.getElementById("chartPaFormasSetor");
  if (ctxFormas && typeof Chart !== "undefined") {
    chartInstances["chartPaFormasSetor"] = new Chart(ctxFormas, {
      type: "bar",
      data: {
        labels: setores,
        datasets: [{ label: "Formas", data: formas, backgroundColor: "#2563eb", borderRadius: 6 }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        plugins: { 
          legend: { display: false },
          datalabels: {
            display: true,
            color: '#ffffff',
            anchor: 'center',
            align: 'center',
            font: { weight: 'bold', size: 10 }
          }
        }, 
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } 
      },
      plugins: [typeof ChartDataLabels !== 'undefined' ? ChartDataLabels : {}]
    });
  }

  destroyChart("chartPaVolumeSetor");
  const ctxVolume = document.getElementById("chartPaVolumeSetor");
  if (ctxVolume && typeof Chart !== "undefined") {
    chartInstances["chartPaVolumeSetor"] = new Chart(ctxVolume, {
      type: "bar",
      data: {
        labels: setores,
        datasets: [{ label: "Volume (m3)", data: volumes, backgroundColor: "#e8762a", borderRadius: 6 }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        plugins: { 
          legend: { display: false },
          datalabels: {
            display: true,
            color: '#ffffff',
            anchor: 'center',
            align: 'center',
            font: { weight: 'bold', size: 10 },
            formatter: (v) => v.toFixed(1)
          }
        }, 
        scales: { y: { beginAtZero: true } } 
      },
      plugins: [typeof ChartDataLabels !== 'undefined' ? ChartDataLabels : {}]
    });
  }
}

function renderizarProducaoSetoresUltimos7(rows, selectedDate) {
  const baseDate = selectedDate ? new Date(selectedDate + "T12:00:00") : new Date();
  const dates = [];
  const d = new Date(baseDate);
  while (dates.length < 7) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) dates.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() - 1);
  }
  const labels = dates.map(date => date.split("-").reverse().join("/"));
  const bySetor = {
    "Setor 1": {},
    "Setor 2": {},
    "Setor 3": {},
    "Setor 4": {}
  };
  rows.forEach(r => {
    const setor = r.setor || "";
    const dia = r.data_fabricacao || "";
    if (bySetor[setor] && dates.includes(dia)) bySetor[setor][dia] = (bySetor[setor][dia] || 0) + 1;
  });

  destroyChart("chartProdSetores");
  const ctx = document.getElementById("chartProdSetores");
  if (ctx && typeof Chart !== "undefined") {
    chartInstances["chartProdSetores"] = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: "Setor 1", data: dates.map(date => bySetor["Setor 1"][date] || 0), backgroundColor: "rgba(59, 130, 246, 0.85)", borderRadius: 4 },
          { label: "Setor 2", data: dates.map(date => bySetor["Setor 2"][date] || 0), backgroundColor: "rgba(16, 185, 129, 0.85)", borderRadius: 4 },
          { label: "Setor 3", data: dates.map(date => bySetor["Setor 3"][date] || 0), backgroundColor: "rgba(139, 92, 246, 0.85)", borderRadius: 4 },
          { label: "Setor 4", data: dates.map(date => bySetor["Setor 4"][date] || 0), backgroundColor: "rgba(249, 115, 22, 0.85)", borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8 } },
          datalabels: {
            display: function(context) { return context.dataset.data[context.dataIndex] > 0; },
            color: '#ffffff',
            anchor: 'center',
            align: 'center',
            font: { weight: 'bold', size: 10 },
            formatter: Math.round
          }
        },
        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } } }
      },
      plugins: [typeof ChartDataLabels !== 'undefined' ? ChartDataLabels : {}]
    });
  }

  const histEl = document.getElementById("dbHistory");
  if (histEl) {
    const totalByDate = {};
    rows.forEach(r => {
      const dia = r.data_fabricacao || "";
      if (dates.includes(dia)) totalByDate[dia] = (totalByDate[dia] || 0) + 1;
    });
    const max = Math.max(...dates.map(date => totalByDate[date] || 0), 1);
    histEl.innerHTML = dates.map(date => {
      const total = totalByDate[date] || 0;
      const pct = Math.round((total / max) * 100);
      return `<div class="ins-dash-hist-row">
        <span class="ins-dash-hist-date">${date.split("-").reverse().join("/")}</span>
        <div class="ins-dash-hist-bar-track"><div class="ins-dash-hist-bar" style="width:${pct}%"></div></div>
        <span class="ins-dash-hist-count">${total}</span>
      </div>`;
    }).join("");
  }
}

function renderizarGraficosProdutividade(metricas, dStart, dEnd) {
  const diasUnicos = Array.from(new Set(metricas.filteredRows.map(r => r.data_fabricacao))).sort().reverse();

  // Novos Gráficos de Volume
  const dataVolDia = [];
  const dataVolForaPadraoDia = [];
  diasUnicos.forEach(d => {
    let vTotal = 0;
    let vFora = 0;
    const rowsDia = metricas.filteredRows.filter(r => r.data_fabricacao === d);
    rowsDia.forEach(r => {
      const vol = getFormVolume(r.codigo_produto, r.modelo, r.setor);
      vTotal += vol;
      const isPadrao = isConcretePadrao(r);
      if (!isPadrao) vFora += vol;
    });
    dataVolDia.push(vTotal);
    dataVolForaPadraoDia.push(vFora);
  });

  const chartLabels = diasUnicos.map(d => d.split("-").reverse().join("/"));

  // O dataVolDia contém o Total. Para o gráfico empilhado, precisamos separar em "Padrão" e "Fora do Padrão"
  const dataVolPadraoDia = [];
  const dataVolForaPadraoDiaArr = [];
  diasUnicos.forEach(d => {
    let vPadrao = 0;
    let vFora = 0;
    const rowsDia = metricas.filteredRows.filter(r => r.data_fabricacao === d);
    rowsDia.forEach(r => {
      const vol = getFormVolume(r.codigo_produto, r.modelo, r.setor);
      const isPadrao = isConcretePadrao(r);
      if (isPadrao) {
        vPadrao += vol;
      } else {
        vFora += vol;
      }
    });
    dataVolPadraoDia.push(vPadrao);
    dataVolForaPadraoDiaArr.push(vFora);
  });

  destroyChart("chartPaVolDiaStacked");
  const ctxVolDiaStacked = document.getElementById("chartPaVolDiaStacked");
  if (ctxVolDiaStacked && typeof Chart !== "undefined") {
    chartInstances["chartPaVolDiaStacked"] = new Chart(ctxVolDiaStacked, {
      type: "bar",
      data: {
        labels: chartLabels,
        datasets: [
          {
            label: 'Concreto Padrão (Bom) (m³)',
            data: dataVolPadraoDia,
            backgroundColor: "rgba(16, 185, 129, 0.85)", // Verde Esmeralda
            borderRadius: 4
          },
          {
            label: 'Fora do Padrão (m³)',
            data: dataVolForaPadraoDiaArr,
            backgroundColor: "rgba(239, 68, 68, 0.85)", // Vermelho
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top", labels: { usePointStyle: true, boxWidth: 8, font: { weight: 'bold' } } },
          tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 12 },
          datalabels: {
            display: function(context) { return context.dataset.data[context.dataIndex] > 0; },
            color: '#334155',
            anchor: 'end',
            align: 'top',
            offset: 2,
            font: { weight: 'bold', size: 9 },
            formatter: (v) => v.toFixed(1)
          }
        },
        scales: {
          x: { stacked: false, grid: { display: false } },
          y: { stacked: false, beginAtZero: true, grid: { color: '#f1f5f9' }, suggestedMax: Math.max(...dataVolDia) * 1.15 }
        }
      },
      plugins: [typeof ChartDataLabels !== 'undefined' ? ChartDataLabels : {}]
    });
  }

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

  destroyChart("chartPaCurvaAcumulada");
  destroyChart("chartPaPareto");

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

  destroyChart("chartPaEficienciaSetor");

  // 7. Volume por hora produtiva
  destroyChart("chartPaM3Hora");
  const ctxM3Hora = document.getElementById("chartPaM3Hora");
  if (ctxM3Hora && typeof Chart !== "undefined") {
    const faixasHoras = metricas.productiveVolumeBuckets?.labels || [];
    const volumesHoras = metricas.productiveVolumeBuckets?.values || [];

    chartInstances["chartPaM3Hora"] = new Chart(ctxM3Hora, {
      type: 'bar',
      data: {
        labels: faixasHoras,
        datasets: [{
          label: 'Volume concretado (m3)',
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
  atualizarResumoFiltrosProdutividade();

  setSyncStatus("pending", "Carregando dados de produtividade...");

  let allRows = [];
  if (hasApiConfigured()) {
    try {
      const result = await carregarLinhasSupabaseComCache({
        cacheKey: `produtividade:periodo:${dStart}:${dEnd}`,
        table: "producao",
        select: "*",
        orderBy: "data_hora",
        orderOptions: { ascending: true },
        applyFilters: query => query
          .gte('data_fabricacao', dStart)
          .lte('data_fabricacao', dEnd)
          .in('status', ['LIBERADO', 'INSPECIONADO'])
      });
      allRows = result.rows;
    } catch (err) {
      console.warn("Erro Supabase em produtividade, buscando local:", err);
      allRows = getLocalRowsForPeriod(dStart, dEnd);
    }
  } else {
    allRows = getLocalRowsForPeriod(dStart, dEnd);
  }

  allRows = deduplicarLinhasProducao(allRows);
  allRows.sort((a, b) => new Date(a.data_hora || a.updated_at || 0).getTime() - new Date(b.data_hora || b.updated_at || 0).getTime());

  const baseDate7 = new Date(dEnd + "T12:00:00");
  const dates7 = [];
  const d7 = new Date(baseDate7);
  while (dates7.length < 7) {
    const dow = d7.getDay();
    if (dow !== 0 && dow !== 6) dates7.push(d7.toISOString().split("T")[0]);
    d7.setDate(d7.getDate() - 1);
  }
  const start7 = dates7[dates7.length - 1];
  let rowsUltimos7 = [];
  if (hasApiConfigured()) {
    try {
      const result = await carregarLinhasSupabaseComCache({
        cacheKey: `produtividade:ultimos7:${start7}:${dEnd}`,
        table: "producao",
        select: "*",
        orderBy: "data_hora",
        orderOptions: { ascending: true },
        applyFilters: query => query
          .gte('data_fabricacao', start7)
          .lte('data_fabricacao', dEnd)
          .in('status', ['LIBERADO', 'INSPECIONADO'])
      });
      rowsUltimos7 = result.rows;
    } catch (err) {
      console.warn("Erro ao buscar últimos 7 dias de produção:", err);
      rowsUltimos7 = getLocalRowsForPeriod(start7, dEnd);
    }
  } else {
    rowsUltimos7 = getLocalRowsForPeriod(start7, dEnd);
  }

  rowsUltimos7 = deduplicarLinhasProducao(rowsUltimos7);
  rowsUltimos7.sort((a, b) => new Date(a.data_hora || a.updated_at || 0).getTime() - new Date(b.data_hora || b.updated_at || 0).getTime());

  const filterSetor = document.getElementById("paFiltroSetor")?.value || "";

  let filteredRows = allRows.filter(r => {
    if (filterSetor) {
      if (filterSetor === "Setores 1 e 2") {
        if (r.setor !== "Setor 1" && r.setor !== "Setor 2") return false;
      } else {
        if (r.setor !== filterSetor) return false;
      }
    }
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
  const paKpiParadas = document.getElementById("paKpiParadas");
  if (paKpiParadas) paKpiParadas.textContent = metricas.numeroParadas;
  
  // As linhas seguintes foram removidas porque os respectivos cards HTML foram deletados:
  // document.getElementById("paKpiTempoPerdido").textContent = ...
  // document.getElementById("paKpiParadas").textContent = ...


  // Novos KPIs de Volume de Concreto e Fora do Padrão
  const mesStart = dEnd.substring(0, 8) + '01';
  let allRowsMes = [];
  if (hasApiConfigured()) {
    try {
      const result = await carregarLinhasSupabaseComCache({
        cacheKey: `produtividade:mes:${mesStart}:${dEnd}`,
        table: "producao",
        select: "data_fabricacao, codigo_produto, modelo, setor, tipo_concreto, forma, status, data_hora",
        applyFilters: query => query
          .gte('data_fabricacao', mesStart)
          .lte('data_fabricacao', dEnd)
          .in('status', ['LIBERADO', 'INSPECIONADO'])
      });
      allRowsMes = result.rows;
    } catch (err) {
      console.warn("Erro ao buscar dados mensais", err);
      allRowsMes = getLocalRowsForPeriod(mesStart, dEnd);
    }
  } else {
    allRowsMes = getLocalRowsForPeriod(mesStart, dEnd);
  }

  allRowsMes = deduplicarLinhasProducao(allRowsMes);
  allRowsMes.sort((a, b) => new Date(a.data_hora || a.updated_at || 0).getTime() - new Date(b.data_hora || b.updated_at || 0).getTime());

  if (filterSetor) {
    allRowsMes = allRowsMes.filter(r => r.setor === filterSetor);
  }

  const rowsDia = filteredRows;

  let volConcretoDia = 0;
  let volForaPadraoDia = 0;
  rowsDia.forEach(r => {
    const vol = getFormVolume(r.codigo_produto, r.modelo, r.setor);
    volConcretoDia += vol;
    const isPadrao = isConcretePadrao(r);
    if (!isPadrao) volForaPadraoDia += vol;
  });

  let volConcretoMes = 0;
  let volForaPadraoMes = 0;
  allRowsMes.forEach(r => {
    const vol = getFormVolume(r.codigo_produto, r.modelo, r.setor);
    volConcretoMes += vol;
    const isPadrao = isConcretePadrao(r);
    if (!isPadrao) volForaPadraoMes += vol;
  });

  const volBomDia = volConcretoDia - volForaPadraoDia;
  const pctBomDia = volConcretoDia > 0 ? (volBomDia / volConcretoDia) * 100 : 0;
  const pctForaDia = volConcretoDia > 0 ? (volForaPadraoDia / volConcretoDia) * 100 : 0;

  const volBomMes = volConcretoMes - volForaPadraoMes;
  const pctBomMes = volConcretoMes > 0 ? (volBomMes / volConcretoMes) * 100 : 0;
  const pctForaMes = volConcretoMes > 0 ? (volForaPadraoMes / volConcretoMes) * 100 : 0;

  const paKpiVolumeMes = document.getElementById("paKpiVolumeMes");
  if (paKpiVolumeMes) paKpiVolumeMes.textContent = `Mês: ${volConcretoMes.toFixed(2)} m³`;

  const paKpiVolBomDia = document.getElementById("paKpiVolBomDia");
  if (paKpiVolBomDia) paKpiVolBomDia.textContent = `${volBomDia.toFixed(2)} m³ (${pctBomDia.toFixed(0)}%)`;

  const paKpiVolBomMes = document.getElementById("paKpiVolBomMes");
  if (paKpiVolBomMes) paKpiVolBomMes.textContent = `Mês: ${volBomMes.toFixed(2)} m³ (${pctBomMes.toFixed(0)}%)`;

  const paKpiVolForaDia = document.getElementById("paKpiVolForaDia");
  if (paKpiVolForaDia) paKpiVolForaDia.textContent = `${volForaPadraoDia.toFixed(2)} m³ (${pctForaDia.toFixed(0)}%)`;

  const paKpiVolForaMes = document.getElementById("paKpiVolForaMes");
  if (paKpiVolForaMes) paKpiVolForaMes.textContent = `Mês: ${volForaPadraoMes.toFixed(2)} m³ (${pctForaMes.toFixed(0)}%)`;

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

  const elPaKpiJornada = document.getElementById("paKpiJornada");
  if (elPaKpiJornada) {
    if (metricas.jornadaDiaria && metricas.jornadaDiaria.length > 0) {
      const list = metricas.jornadaDiaria;
      if (list.length === 1) {
        elPaKpiJornada.textContent = `${list[0].inicio} - ${list[0].fim}`;
      } else {
        elPaKpiJornada.textContent = `${list[list.length - 1].inicio} - ${list[0].fim}`;
      }
    } else {
      elPaKpiJornada.textContent = "Sem registro";
    }
  }

  renderizarAlertasOperacionais(metricas, meta);
  renderizarVolumeTipoPorSetor(filteredRows);
  renderizarGraficosSetorProdutividade(filteredRows);
  renderizarProducaoSetoresUltimos7(rowsUltimos7, dEnd);
  renderizarGraficosProdutividade(metricas, dStart, dEnd);
  renderizarTabelaParadas(metricas.paradasList);
  renderizarTabelaJornada(metricas.jornadaDiaria);
  renderizarTabelaDadosConcretagem(filteredRows);

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
  updateSwVersionBadge();
  setSyncStatus("pending", "Verificando conexão com a planilha...");
  renderInspecaoCodigosChecklist();
  bindEvents();
  subscribeToRealtimeUpdates();
  atualizarIndicadoresManutencaoHub();
  carregarFormasManutencaoSupabase().then(() => {
    atualizarIndicadoresManutencaoHub();
    renderLiberacaoDual();
  });

  const now = todayYmd();
  if (el.libData) el.libData.value = now;
  if (el.insFiltroData) el.insFiltroData.value = now;
  if (el.insModoCarga) el.insModoCarga.value = "data";
  if (el.mpFiltroData) el.mpFiltroData.value = now;
  if (el.mpModoCarga) el.mpModoCarga.value = "data";
  if (el.mpSetor) el.mpSetor.value = "";
  if (el.histTipo) el.histTipo.value = "";
  if (el.dashData) el.dashData.value = now;
  const miMontagemDiaData = document.getElementById("miMontagemDiaData");
  if (miMontagemDiaData && !miMontagemDiaData.value) miMontagemDiaData.value = now;
  if (el.relData) el.relData.value = now;
  if (el.relSetor) el.relSetor.value = "Setor 2";
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
    const activateWaitingWorker = (reg) => {
      if (reg?.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }
    };
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.replace(window.location.pathname + "?cache-reset=v5.8");
      }
    });

    navigator.serviceWorker.register("./sw.js?v=v5.8").then((reg) => {
      activateWaitingWorker(reg);
      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            activateWaitingWorker(reg);
          }
        });
      });
      reg.update().then(() => activateWaitingWorker(reg)).catch(() => {});
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
    applyAutoResponsibleFields();
    ensurePostLoginBootstrap();
    setMode("HUB");
  } else {
    lockAppForLogin();
    applyRoleVisibility();
    if (el.loginNome) el.loginNome.focus();
  }
}

init();

// ==========================================
// ABA: MONTAGEM INDICADORES
// ==========================================
let chartMiPorDiaInstance = null;
let chartMiPorSetorInstance = null;
let chartMiPorMontadorInstance = null;
let chartMiMontagemDiaProducaoInstance = null;

let miRawMontagemData = [];
let miRawProducaoData = [];
let miFilteredMontagemData = [];
let miPaginaAtual = 1;
const miLinhasPorPagina = 15;
let miOrdenacaoColuna = "finalizado_em";
let miOrdenacaoAsc = false;
let miAbaAtiva = "resumo";
let miUltimosGraficos = null;
let miCarregandoMontagemDia = false;
let miMontagemDiaRows = [];

function formatarDuracao(ms) {
  if (ms === null || ms === undefined || isNaN(ms) || ms < 0) return "-";
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function formatarDataHoraMontagemXlsx(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getMiDataReferencia(row) {
  const raw = row?.data_fabricacao || row?.dataFabricacao || row?.finalizado_em || row?.finalizadoEm || "";
  return String(raw).split("T")[0];
}

function getMiDataMontagem(row) {
  const raw = row?.finalizado_em || row?.finalizadoEm || row?.inicio_inspecao_montagem || row?.inicioInspecaoMontagem || "";
  return dateToYmd(raw);
}

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function atualizarResumoFiltrosMontagem() {
  const dStart = document.getElementById("miDataInicio")?.value || todayYmd();
  const dEnd = document.getElementById("miDataFim")?.value || todayYmd();
  const setor = document.getElementById("miFiltroSetor")?.value || "Todos os setores";
  const status = document.getElementById("miFiltroStatus")?.value || "Todos os status";
  const resumo = document.getElementById("miFiltroResumo");
  if (!resumo) return;
  const fmt = (d) => d ? d.split("-").reverse().join("/") : "-";
  const periodo = dStart === dEnd ? fmt(dStart) : `${fmt(dStart)} a ${fmt(dEnd)}`;
  resumo.textContent = `${periodo} - ${setor} - ${status}`;
}

function formatarDataPtBr(value) {
  const ymd = dateToYmd(value);
  if (!ymd) return "-";
  const parts = ymd.split("-");
  if (parts.length !== 3) return String(value || "-");
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function proximoDiaYmd(ymd) {
  const d = new Date(`${ymd}T12:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  d.setDate(d.getDate() + 1);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
}

function setMontagemDrawerOpen(open) {
  const drawer = document.getElementById("miFiltrosDrawer");
  if (!drawer) return;
  drawer.classList.toggle("hidden", !open);
  drawer.setAttribute("aria-hidden", open ? "false" : "true");
}

function getMiStatusMeta(status) {
  if (status === "A") return { label: "Aprovado", className: "mi-status-a" };
  if (status === "RR") return { label: "Retrabalhado", className: "mi-status-rr" };
  if (status === "R") return { label: "Reprovado", className: "mi-status-r" };
  return { label: "Em andamento", className: "mi-status-open" };
}

function miStatusButton(row) {
  const meta = getMiStatusMeta(row.status_montagem);
  const id = escapeHtml(row.id);
  return `<button type="button" class="mi-status-pill ${meta.className}" onclick="abrirVisualizacaoChecklist('${id}')">${meta.label}</button>`;
}

function obterChecklistSectionsLinha(row) {
  const isInspecao = row.setor === "Setor 3" || row.setor === "Setor 4";
  return isInspecao
    ? getInspecaoChecklistSections(row.modelo || "")
    : getMontagemChecklistSections(row.modelo || "");
}

function contarDefeitosPossiveisLinha(row) {
  return obterChecklistSectionsLinha(row).reduce((total, sec) => {
    return total + (Array.isArray(sec.itens) ? sec.itens.length : 0);
  }, 0);
}

function obterDefeitosPossiveisLinha(row) {
  const itens = [];
  obterChecklistSectionsLinha(row).forEach(sec => {
    if (!Array.isArray(sec.itens)) return;
    sec.itens.forEach(item => {
      const label = typeof item === "string"
        ? item
        : (item.label || item.texto || item.descricao || item.nome || item.codigoFalha || "");
      const clean = String(label || "").trim();
      if (clean) itens.push(clean);
    });
  });
  return itens;
}

function calcularIndicadoresDefeitosMontagem(rows, producaoRows = []) {
  const resumo = {
    postes: rows.length,
    producao: producaoRows.length,
    totalPossivel: 0,
    totalErros: 0,
    postesReprovados: 0,
    retrabalho: 0,
    listaDefeitos: {},
    porForma: {},
    porTipo: {},
    porSetor: {},
    matriz: {},
    fissuras: {
      total: 0,
      circulares: 0,
      outros: 0
    }
  };

  producaoRows.forEach(row => {
    const setor = row.setor || "Sem setor";
    if (!resumo.porSetor[setor]) resumo.porSetor[setor] = { setor, erros: 0, producao: 0 };
    resumo.porSetor[setor].producao++;
  });

  rows.forEach(row => {
    const forma = row.forma_numero || row.formaNumero || "Sem forma";
    const setor = row.setor || "Sem setor";
    const key = `${setor}||${forma}`;
    const defeitosPossiveis = obterDefeitosPossiveisLinha(row);
    const possiveis = defeitosPossiveis.length;
    const rejeitados = obterItensRejeitadosLinha(row);
    const isReprovado = rejeitados.length > 0 || row.status_montagem === "R" || row.status_montagem === "RR";
    const isRetrabalho = row.status_montagem === "RR";

    if (!resumo.porForma[key]) {
      resumo.porForma[key] = {
        forma,
        setor,
        modelo: row.modelo || "",
        postes: 0,
        postesReprovados: 0,
        listaDefeitos: {},
        possiveis: 0,
        potencial: 0,
        erros: 0,
        retrabalho: 0
      };
    }

    resumo.totalPossivel += possiveis;
    resumo.totalErros += rejeitados.length;
    resumo.porForma[key].postes++;
    resumo.porForma[key].potencial += possiveis;
    resumo.porForma[key].erros += rejeitados.length;
    if (isReprovado) {
      resumo.postesReprovados++;
      resumo.porForma[key].postesReprovados++;
    }
    if (isRetrabalho) {
      resumo.retrabalho++;
      resumo.porForma[key].retrabalho++;
    }

    defeitosPossiveis.forEach(item => {
      const norm = normalizarTexto(item);
      if (!norm) return;
      resumo.listaDefeitos[norm] = item;
      resumo.porForma[key].listaDefeitos[norm] = item;
    });

    if (!resumo.porSetor[setor]) resumo.porSetor[setor] = { setor, erros: 0, producao: 0 };
    resumo.porSetor[setor].erros += rejeitados.length;

    rejeitados.forEach(item => {
      resumo.porTipo[item] = (resumo.porTipo[item] || 0) + 1;
      if (!resumo.matriz[item]) resumo.matriz[item] = {};
      resumo.matriz[item][setor] = (resumo.matriz[item][setor] || 0) + 1;
      if (normalizarTexto(item).includes("fissura")) {
        resumo.fissuras.total++;
        const modelo = normalizarTexto(row.modelo || "");
        if (modelo.includes("circular") || modelo.includes("circ")) resumo.fissuras.circulares++;
        else resumo.fissuras.outros++;
      }
    });
  });

  Object.values(resumo.porForma).forEach(item => {
    item.possiveis = Object.keys(item.listaDefeitos).length;
  });

  return resumo;
}

function formatPct(value) {
  if (!isFinite(value)) return "0,0%";
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function renderIndicadoresDefeitosMontagem(indicadores) {
  const taxa = indicadores.totalPossivel > 0 ? (indicadores.totalErros / indicadores.totalPossivel) * 100 : 0;
  const taxaProducao = indicadores.producao > 0 ? (indicadores.postesReprovados / indicadores.producao) * 100 : 0;
  const taxaRetrabalho = indicadores.postes > 0 ? (indicadores.retrabalho / indicadores.postes) * 100 : 0;
  const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  };

  setText("miDefTotalErros", indicadores.totalErros);
  setText("miDefTotalPossivel", indicadores.totalPossivel);
  setText("miDefTaxa", formatPct(taxa));
  setText("miDefPostes", indicadores.postes);
  setText("miDefTaxaProducao", formatPct(taxaProducao));
  setText("miDefTaxaRetrabalho", formatPct(taxaRetrabalho));
  setText("miDefProducaoPeriodo", indicadores.producao);
  setText("miDefPostesReprovados", indicadores.postesReprovados);
  setText("miDefFissuras", indicadores.fissuras.total);
  setText("miDefFissurasCirculares", indicadores.fissuras.circulares);

  const porTipoEl = document.getElementById("miDefeitosPorTipo");
  const tiposOrdenados = Object.entries(indicadores.porTipo).sort((a, b) => b[1] - a[1]);
  if (porTipoEl) {
    if (tiposOrdenados.length === 0) {
      porTipoEl.innerHTML = '<div class="muted">Nenhum erro encontrado no periodo.</div>';
    } else {
      porTipoEl.innerHTML = tiposOrdenados.map(([tipo, total]) => `
        <div class="mi-defeito-tipo-row">
          <span>${escapeHtml(tipo)}</span>
          <strong>${total}</strong>
        </div>
      `).join("");
    }
  }

  const paretoEl = document.getElementById("miDefPareto");
  let acumulado = 0;
  const pareto = tiposOrdenados.map(([tipo, total]) => {
    const pct = indicadores.totalErros > 0 ? (total / indicadores.totalErros) * 100 : 0;
    acumulado += pct;
    return { tipo, total, pct, acumulado };
  });
  const vitais = pareto.filter(item => item.acumulado <= 80);
  const tiposVitais = vitais.length || (pareto.length ? 1 : 0);
  setText("miDefTiposVitais", tiposVitais);
  if (paretoEl) {
    if (pareto.length === 0) {
      paretoEl.innerHTML = '<div class="muted">Sem dados para Pareto no periodo.</div>';
    } else {
      paretoEl.innerHTML = pareto.slice(0, 10).map(item => `
        <div class="mi-def-pareto-row ${item.acumulado <= 80 ? "vital" : ""}">
          <div>
            <strong>${escapeHtml(item.tipo)}</strong>
            <span>${formatPct(item.pct)} do total | ${formatPct(item.acumulado)} acumulado</span>
          </div>
          <em>${item.total}</em>
        </div>
      `).join("");
    }
  }

  const setoresEl = document.getElementById("miDefSetores");
  if (setoresEl) {
    const setores = Object.values(indicadores.porSetor).sort((a, b) => b.erros - a.erros);
    if (setores.length === 0) {
      setoresEl.innerHTML = '<div class="muted">Sem setores no periodo.</div>';
    } else {
      setoresEl.innerHTML = setores.map(item => {
        const setorTaxa = item.producao > 0 ? (item.erros / item.producao) * 100 : 0;
        return `
          <div class="mi-defeitos-row">
            <div class="mi-defeitos-row-main">
              <strong>${escapeHtml(item.setor)}</strong>
              <span>${item.producao} produzido(s)</span>
            </div>
            <div class="mi-defeitos-row-metrics">
              <span><strong>${item.erros}</strong> erros</span>
              <span><strong>${formatPct(setorTaxa)}</strong> taxa/producao</span>
            </div>
          </div>
        `;
      }).join("");
    }
  }

  const matrizEl = document.getElementById("miDefMatriz");
  if (matrizEl) {
    const setores = Object.keys(indicadores.porSetor).sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
    if (tiposOrdenados.length === 0 || setores.length === 0) {
      matrizEl.innerHTML = '<div class="muted">Sem dados para matriz no periodo.</div>';
    } else {
      matrizEl.innerHTML = `
        <div class="mi-def-matrix-scroll">
          <table>
            <thead><tr><th>Defeito</th>${setores.map(s => `<th>${escapeHtml(s)}</th>`).join("")}<th>Total</th></tr></thead>
            <tbody>
              ${tiposOrdenados.slice(0, 12).map(([tipo, total]) => `
                <tr>
                  <td>${escapeHtml(tipo)}</td>
                  ${setores.map(s => `<td>${indicadores.matriz[tipo]?.[s] || 0}</td>`).join("")}
                  <td><strong>${total}</strong></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    }
  }

  const planoEl = document.getElementById("miDefPlanoAcao");
  if (planoEl) {
    if (pareto.length === 0) {
      planoEl.innerHTML = '<div class="muted">Sem defeitos para sugerir plano.</div>';
    } else {
      planoEl.innerHTML = pareto.slice(0, 2).map(item => {
        const prioridade = item.pct > 20 ? "Critica" : item.pct > 10 ? "Alta" : item.pct > 5 ? "Media" : "Baixa";
        const meta = Math.max(1, Math.floor(item.total * 0.5));
        return `
          <div class="mi-def-action">
            <strong>${escapeHtml(item.tipo)}</strong>
            <span>Prioridade ${prioridade} | ${item.total} ocorrencia(s) | meta 90 dias: ${meta}</span>
            <p>Estratificar por setor, forma e montador; revisar causa raiz no ponto de maior incidencia e acompanhar semanalmente.</p>
          </div>
        `;
      }).join("");
    }
  }
}

function atualizarResumoFiltrosProdutividade() {
  const dStart = document.getElementById("paDataInicio")?.value || todayYmd();
  const dEnd = document.getElementById("paDataFim")?.value || todayYmd();
  const setor = document.getElementById("paFiltroSetor")?.value || "Todos os setores";
  const meta = document.getElementById("paMetaCiclo")?.value || "15";
  const resumo = document.getElementById("paFiltroResumo");
  if (!resumo) return;
  const fmt = (d) => d ? d.split("-").reverse().join("/") : "-";
  const periodo = dStart === dEnd ? fmt(dStart) : `${fmt(dStart)} a ${fmt(dEnd)}`;
  resumo.textContent = `${periodo} - ${setor} - Meta ${meta} min`;
}

function setProdutividadeDrawerOpen(open) {
  const drawer = document.getElementById("paFiltrosDrawer");
  if (!drawer) return;
  drawer.classList.toggle("hidden", !open);
  drawer.setAttribute("aria-hidden", open ? "false" : "true");
}

function ativarAbaMontagem(tab) {
  miAbaAtiva = tab || "resumo";
  document.querySelectorAll(".mi-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === miAbaAtiva);
  });
  document.querySelectorAll(".mi-tab-section").forEach(section => {
    section.classList.remove("active");
  });
  const sectionId = "miSecao" + miAbaAtiva.charAt(0).toUpperCase() + miAbaAtiva.slice(1);
  document.getElementById(sectionId)?.classList.add("active");
  if (miUltimosGraficos) {
    renderGraficosMontagem(
      miUltimosGraficos.byDay,
      miUltimosGraficos.bySector,
      miUltimosGraficos.byMontador,
      miUltimosGraficos.prodByDay
    );
  }
}

function aplicarLayoutDashboardDefeitos() {
  document.querySelectorAll("#viewMontagemIndicadores .mi-tab-section").forEach(section => {
    section.style.display = section.id === "miSecaoDefeitos" ? "block" : "none";
  });
}

function limparLayoutDashboardDefeitos() {
  document.querySelectorAll("#viewMontagemIndicadores .mi-tab-section").forEach(section => {
    section.style.display = "";
  });
}

async function carregarMontagemIndicadores() {
  if (!supabaseClient) return;
  const dStart = document.getElementById("miDataInicio")?.value || todayYmd();
  const dEnd = document.getElementById("miDataFim")?.value || todayYmd();
  
  setSyncStatus("pending", "Carregando indicadores de montagem...");
  try {
    const [montagemRes, producaoRes] = await Promise.all([
      carregarLinhasSupabaseComCache({
        cacheKey: `montagem:montagem_poste:${dStart}:${dEnd}`,
        table: "montagem_poste",
        select: "*",
        orderBy: "data_fabricacao",
        orderOptions: { ascending: false },
        applyFilters: query => query
          .gte("data_fabricacao", dStart)
          .lte("data_fabricacao", dEnd)
      }),
      carregarLinhasSupabaseComCache({
        cacheKey: `montagem:producao:${dStart}:${dEnd}`,
        table: "producao",
        select: "*",
        applyFilters: query => query
          .gte("data_fabricacao", dStart)
          .lte("data_fabricacao", dEnd)
      })
    ]);
    
    miRawMontagemData = montagemRes.rows || [];
    miRawProducaoData = producaoRes.rows || [];
    
    miPaginaAtual = 1;
    aplicarFiltrosEExibirMontagem();
    const fromCache = montagemRes.state === "OFFLINE_CACHE" || producaoRes.state === "OFFLINE_CACHE";
    if (fromCache) setSyncStatus("warn", "Indicadores carregados do cache local.");
    
  } catch(err) {
    console.error("Erro carregarMontagemIndicadores:", err);
    setSyncStatus("error", "Erro ao carregar indicadores.");
  }
}

function aplicarFiltrosEExibirMontagem() {
  const dStart = document.getElementById("miDataInicio")?.value || todayYmd();
  const dEnd = document.getElementById("miDataFim")?.value || todayYmd();
  let fSetor = document.getElementById("miFiltroSetor")?.value || "";
  let fStatus = document.getElementById("miFiltroStatus")?.value || "";
  const fPesquisa = (document.getElementById("miFiltroPesquisa")?.value || "").trim().toLowerCase();
  if (normalizarTexto(fSetor).startsWith("todos")) fSetor = "";
  if (normalizarTexto(fStatus).startsWith("todos")) fStatus = "";
  atualizarResumoFiltrosMontagem();

  // 1. Filtrar dados de Montagem em memória
  miFilteredMontagemData = miRawMontagemData.filter(row => {
    // Considerar apenas montagens finalizadas
    if (!row.status_montagem) return false;

    // Filtro por Data
    const day = getMiDataReferencia(row);
    if (!day || day < dStart || day > dEnd) return false;

    // Filtro por Setor
    if (fSetor) {
      if (fSetor === "Setores 1 e 2") {
        if (row.setor !== "Setor 1" && row.setor !== "Setor 2") return false;
      } else {
        if (row.setor !== fSetor) return false;
      }
    }

    // Filtro por Status
    if (fStatus) {
      const rejeitadosCount = obterItensRejeitadosLinha(row).length;
      if (fStatus === "R") {
        if (rejeitadosCount === 0) return false;
      } else if (fStatus === "A") {
        if (rejeitadosCount > 0) return false;
      } else if (row.status_montagem !== fStatus) {
        return false;
      }
    }

    // Filtro por Pesquisa de Texto
    if (fPesquisa) {
      const forma = (row.forma_numero || "").toLowerCase();
      const modelo = (row.modelo || "").toLowerCase();
      const montador = (row.montador_nome || "").toLowerCase();
      if (!forma.includes(fPesquisa) && !modelo.includes(fPesquisa) && !montador.includes(fPesquisa)) {
        return false;
      }
    }

    return true;
  });

  // 2. Filtrar dados de Produção
  const filteredProducao = miRawProducaoData.filter(row => {
    const day = row.data_fabricacao;
    if (!day || day < dStart || day > dEnd) return false;
    if (fSetor) {
      if (fSetor === "Setores 1 e 2") {
        if (row.setor !== "Setor 1" && row.setor !== "Setor 2") return false;
      } else {
        if (row.setor !== fSetor) return false;
      }
    }
    return true;
  });

  // 3. Processar Indicadores para Gráficos e KPIs
  let totalInspecionado = miFilteredMontagemData.length;
  let totalAprovados = 0;
  let totalRecusados = 0;
  
  const byDay = {};
  const bySector = {};
  const byMontador = {};
  
  const temposPorModelo = {}; // { modelo: { totalMs: 0, count: 0 } }
  const temposPorMontador = {}; // { montador: { totalMs: 0, count: 0 } }

  miFilteredMontagemData.forEach(row => {
    const day = getMiDataReferencia(row);
    const rejeitadosCount = obterItensRejeitadosLinha(row).length;
    if (row.status_montagem === "A") totalAprovados++;
    if (rejeitadosCount > 0) totalRecusados++;
    
    if (!byDay[day]) byDay[day] = { total: 0, aprovados: 0, recusados: 0 };
    byDay[day].total++;
    if (rejeitadosCount > 0) byDay[day].recusados++;
    else byDay[day].aprovados++;
    
    const sec = row.setor || "Desconhecido";
    bySector[sec] = (bySector[sec] || 0) + 1;
    
    const mon = row.montador_nome || "Desconhecido";
    byMontador[mon] = (byMontador[mon] || 0) + 1;

    // Tempo de inspeção/montagem
    if (row.finalizado_em && row.inicio_inspecao_montagem) {
      const start = new Date(row.inicio_inspecao_montagem).getTime();
      const end = new Date(row.finalizado_em).getTime();
      const diff = end - start;
      if (diff >= 0) {
        // Por Modelo
        const mod = row.modelo || "Desconhecido";
        if (!temposPorModelo[mod]) temposPorModelo[mod] = { totalMs: 0, count: 0 };
        temposPorModelo[mod].totalMs += diff;
        temposPorModelo[mod].count++;

        // Por Montador
        if (!temposPorMontador[mon]) temposPorMontador[mon] = { totalMs: 0, count: 0 };
        temposPorMontador[mon].totalMs += diff;
        temposPorMontador[mon].count++;
      }
    }
  });

  renderIndicadoresDefeitosMontagem(calcularIndicadoresDefeitosMontagem(miFilteredMontagemData, filteredProducao));


  // Renderizar tempos médios
  const elTotalAprovados = document.getElementById("miTotalAprovados");
  if (elTotalAprovados) elTotalAprovados.textContent = totalAprovados;
  const elTotalRecusados = document.getElementById("miTotalRecusados");
  if (elTotalRecusados) elTotalRecusados.textContent = totalRecusados;

  const elTempoModelo = document.getElementById("miTempoMedioModelo");
  if (elTempoModelo) {
    const listModelos = Object.keys(temposPorModelo).map(key => {
      const avg = temposPorModelo[key].totalMs / temposPorModelo[key].count;
      return { key, avg, count: temposPorModelo[key].count };
    }).sort((a, b) => b.avg - a.avg);

    if (listModelos.length === 0) {
      elTempoModelo.innerHTML = '<div class="muted" style="padding: 10px; text-align: center;">Nenhum dado de tempo disponível</div>';
    } else {
      elTempoModelo.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${listModelos.map(item => `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 8px 12px; border-radius: 8px; border: 1px solid #f1f5f9; font-size: 0.85rem;">
              <span style="font-weight: 600; color: #1e293b;">${item.key}</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 0.75rem; color: #64748b;">(${item.count} itens)</span>
                <span style="font-weight: bold; color: #2563eb; background: #eff6ff; padding: 2px 8px; border-radius: 6px;">${formatarDuracao(item.avg)}</span>
              </div>
            </div>
          `).join("")}
        </div>
      `;
    }
  }

  const elTempoMontador = document.getElementById("miTempoMontador");
  if (elTempoMontador) {
    const listMontadores = Object.keys(temposPorMontador).map(key => {
      const avg = temposPorMontador[key].totalMs / temposPorMontador[key].count;
      return { key, avg, count: temposPorMontador[key].count };
    }).sort((a, b) => b.avg - a.avg);

    if (listMontadores.length === 0) {
      elTempoMontador.innerHTML = '<div class="muted" style="padding: 10px; text-align: center;">Nenhum dado de tempo disponível</div>';
    } else {
      elTempoMontador.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${listMontadores.map(item => `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 8px 12px; border-radius: 8px; border: 1px solid #f1f5f9; font-size: 0.85rem;">
              <span style="font-weight: 600; color: #1e293b;">${item.key}</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 0.75rem; color: #64748b;">(${item.count} itens)</span>
                <span style="font-weight: bold; color: #10b981; background: #ecfdf5; padding: 2px 8px; border-radius: 6px;">${formatarDuracao(item.avg)}</span>
              </div>
            </div>
          `).join("")}
        </div>
      `;
    }
  }

  // Processar Comparativos (Produzidos vs Montados)
  const prodBySector = { "Setor 1": 0, "Setor 2": 0, "Setor 3": 0, "Setor 4": 0 };
  let prodGeral = 0;
  const prodByDay = {};
  
  filteredProducao.forEach(row => {
    prodGeral++;
    const sec = row.setor || "Outros";
    if (sec in prodBySector) {
      prodBySector[sec]++;
    }
    const day = row.data_fabricacao;
    if (day) {
      prodByDay[day] = (prodByDay[day] || 0) + 1;
    }
  });

  document.getElementById("miProdGeral").textContent = prodGeral;
  const elTotalProduzido = document.getElementById("miTotalProduzido");
  if (elTotalProduzido) elTotalProduzido.textContent = prodGeral;

  document.getElementById("miMontGeral").textContent = totalInspecionado;
  const elTotalInspecionado = document.getElementById("miTotalInspecionado");
  if (elTotalInspecionado) elTotalInspecionado.textContent = totalInspecionado;

  const pctGeral = prodGeral > 0 ? Math.round((totalInspecionado / prodGeral) * 100) : 0;
  document.getElementById("miPctGeral").textContent = pctGeral + "%";
  const elAtingimentoPct = document.getElementById("miAtingimentoPct");
  if (elAtingimentoPct) elAtingimentoPct.textContent = pctGeral + "%";

  const barGeral = document.getElementById("miBarGeral");
  if (barGeral) barGeral.style.width = Math.min(pctGeral, 100) + "%";

  const elProducaoDia = document.getElementById("miProducaoDia");
  const todayStr = todayYmd();
  const prodDia = miRawProducaoData.filter(row => {
    if (row.data_fabricacao !== todayStr) return false;
    if (fSetor) {
      if (fSetor === "Setores 1 e 2") {
        if (row.setor !== "Setor 1" && row.setor !== "Setor 2") return false;
      } else {
        if (row.setor !== fSetor) return false;
      }
    }
    return true;
  }).length;
  if (elProducaoDia) elProducaoDia.textContent = prodDia;

  // Detalhamento por Setor
  const sectors = ["Setor 1", "Setor 2", "Setor 3", "Setor 4"];
  const sectorsContainer = document.getElementById("miSetoresContainer");
  if (sectorsContainer) {
    sectorsContainer.innerHTML = sectors.map(s => {
      if (fSetor) {
        if (fSetor === "Setores 1 e 2") {
          if (s !== "Setor 1" && s !== "Setor 2") return "";
        } else {
          if (s !== fSetor) return "";
        }
      }
      const prod = prodBySector[s] || 0;
      const mont = bySector[s] || 0;
      const pct = prod > 0 ? Math.round((mont / prod) * 100) : 0;
      return `
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
            <span style="font-weight: 600; color: #475569;">${s}</span>
            <span style="color: #64748b;">Produzidos: <strong>${prod}</strong> | Montados: <strong>${mont}</strong> <span style="font-weight: bold; color: #10b981; margin-left: 8px;">${pct}%</span></span>
          </div>
          <div style="background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden;">
            <div style="background: #10b981; width: ${Math.min(pct, 100)}%; height: 100%; transition: width 0.5s ease-in-out;"></div>
          </div>
        </div>
      `;
    }).join("");
  }

  renderGraficosMontagem(byDay, bySector, byMontador, prodByDay);
  renderizarTabelaMontagemPaginada();
  setSyncStatus("idle", "Indicadores atualizados.");
}

function exportarMontagemIndicadoresXlsx() {
  if (!Array.isArray(miFilteredMontagemData) || miFilteredMontagemData.length === 0) {
    showMsgBox("Nenhum dado encontrado para exportar.", "error");
    return;
  }

  if (!window.XLSX?.utils) {
    showMsgBox("Biblioteca XLSX indisponivel. Verifique a conexao e tente novamente.", "error");
    return;
  }

  const linhas = miFilteredMontagemData.map(row => {
    const inicio = row.inicio_inspecao_montagem || row.inicioInspecaoMontagem || "";
    const fim = row.finalizado_em || row.finalizadoEm || "";
    const durMs = inicio && fim ? (new Date(fim) - new Date(inicio)) : null;
    return {
      "Tempo de montagem": formatarDuracao(durMs),
      "Montador": row.montador_nome || row.montadorNome || "",
      "Modelo poste": row.modelo || "",
      "Data da produção": fmtDate(row.data_fabricacao || row.dataFabricacao || ""),
      "Data da montagem": formatarDataHoraMontagemXlsx(fim || inicio),
      "Status poste": getMiStatusMeta(row.status_montagem || row.statusMontagem || "").label
    };
  });

  const ws = XLSX.utils.json_to_sheet(linhas, {
    header: ["Tempo de montagem", "Montador", "Modelo poste", "Data da produção", "Data da montagem", "Status poste"]
  });
  ws["!cols"] = [{ wch: 20 }, { wch: 28 }, { wch: 24 }, { wch: 18 }, { wch: 22 }, { wch: 24 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dashboard Montagem");
  const dStart = document.getElementById("miDataInicio")?.value || todayYmd();
  const dEnd = document.getElementById("miDataFim")?.value || todayYmd();
  XLSX.writeFile(wb, `dashboard_montagem_${dStart}_a_${dEnd}.xlsx`);
}

async function carregarVisaoMontagemDia() {
  const dataInput = document.getElementById("miMontagemDiaData");
  const dataMontagem = dataInput?.value || todayYmd();
  if (dataInput && !dataInput.value) dataInput.value = dataMontagem;
  if (!supabaseClient || miCarregandoMontagemDia) return;

  miCarregandoMontagemDia = true;
  const totalEl = document.getElementById("miMontagemDiaTotal");
  const datasEl = document.getElementById("miMontagemDiaDatas");
  const resumoEl = document.getElementById("miMontagemDiaResumo");
  const agrupadoBody = document.getElementById("miMontagemDiaAgrupadoBody");
  const detalheBody = document.getElementById("miMontagemDiaDetalheBody");
  miMontagemDiaRows = [];
  if (totalEl) totalEl.textContent = "...";
  if (datasEl) datasEl.textContent = "...";
  if (resumoEl) resumoEl.innerHTML = `<div class="muted">Carregando montagens de ${formatarDataPtBr(dataMontagem)}...</div>`;
  if (agrupadoBody) agrupadoBody.innerHTML = '<tr><td colspan="3">Carregando...</td></tr>';
  if (detalheBody) detalheBody.innerHTML = '<tr><td colspan="7">Carregando...</td></tr>';
  renderizarGraficoMontagemDiaProducao([]);

  try {
    const dataFim = proximoDiaYmd(dataMontagem);
    const { data, error } = await supabaseClient
      .from("montagem_poste")
      .select("*")
      .gte("finalizado_em", `${dataMontagem}T00:00:00`)
      .lt("finalizado_em", `${dataFim}T00:00:00`)
      .not("status_montagem", "is", null)
      .order("finalizado_em", { ascending: true })
      .limit(5000);

    if (error) throw error;

    const rows = (data || []).filter(row => getMiDataMontagem(row) === dataMontagem);
    miMontagemDiaRows = rows;
    const porProducao = {};
    rows.forEach(row => {
      const dataProd = dateToYmd(row.data_fabricacao || row.dataFabricacao || "") || "sem-data";
      if (!porProducao[dataProd]) porProducao[dataProd] = [];
      porProducao[dataProd].push(row);
    });

    const grupos = Object.entries(porProducao)
      .map(([dataProd, itens]) => ({ dataProd, itens }))
      .sort((a, b) => a.dataProd.localeCompare(b.dataProd));

    if (totalEl) totalEl.textContent = rows.length;
    if (datasEl) datasEl.textContent = grupos.length;
    renderizarGraficoMontagemDiaProducao(grupos);

    if (!rows.length) {
      if (resumoEl) resumoEl.innerHTML = `<div class="muted">Nenhum poste montado em ${formatarDataPtBr(dataMontagem)}.</div>`;
      if (agrupadoBody) agrupadoBody.innerHTML = '<tr><td colspan="3">Nenhum poste montado nessa data.</td></tr>';
      if (detalheBody) detalheBody.innerHTML = '<tr><td colspan="7">Nenhum poste montado nessa data.</td></tr>';
      return;
    }

    if (resumoEl) {
      const maiorGrupo = grupos.reduce((max, item) => item.itens.length > max.itens.length ? item : max, grupos[0]);
      resumoEl.innerHTML = `
        <div class="mi-montagem-dia-summary">
          <strong>${rows.length}</strong> postes montados em <strong>${formatarDataPtBr(dataMontagem)}</strong>.
          A data de producao com maior volume foi <strong>${formatarDataPtBr(maiorGrupo.dataProd)}</strong>, com <strong>${maiorGrupo.itens.length}</strong> postes.
        </div>
      `;
    }

    if (agrupadoBody) {
      agrupadoBody.innerHTML = grupos.map(grupo => {
        const formas = grupo.itens.map(row => row.forma_numero || row.formaNumero || "").filter(Boolean).join(", ");
        return `<tr><td>${escapeHtml(formatarDataPtBr(grupo.dataProd))}</td><td><strong>${grupo.itens.length}</strong></td><td>${escapeHtml(formas || "-")}</td></tr>`;
      }).join("");
    }

    if (detalheBody) {
      detalheBody.innerHTML = rows.map(row => {
        const status = getMiStatusMeta(row.status_montagem || row.statusMontagem || "").label;
        return `
          <tr>
            <td>${escapeHtml(formatarDataHoraMontagemXlsx(row.finalizado_em || row.finalizadoEm || ""))}</td>
            <td>${escapeHtml(formatarDataPtBr(row.data_fabricacao || row.dataFabricacao || ""))}</td>
            <td>${escapeHtml(row.setor || "")}</td>
            <td><strong>${escapeHtml(row.forma_numero || row.formaNumero || "")}</strong></td>
            <td>${escapeHtml(row.modelo || "")}</td>
            <td>${escapeHtml(status)}</td>
            <td>${escapeHtml(row.montador_nome || row.montadorNome || "")}</td>
          </tr>
        `;
      }).join("");
    }
  } catch (err) {
    console.error("Erro carregarVisaoMontagemDia:", err);
    if (totalEl) totalEl.textContent = "-";
    if (datasEl) datasEl.textContent = "-";
    if (resumoEl) resumoEl.innerHTML = '<div class="muted">Erro ao carregar a visao por data de montagem.</div>';
    if (agrupadoBody) agrupadoBody.innerHTML = '<tr><td colspan="3">Erro ao carregar dados.</td></tr>';
    if (detalheBody) detalheBody.innerHTML = '<tr><td colspan="7">Erro ao carregar dados.</td></tr>';
    renderizarGraficoMontagemDiaProducao([]);
    showMsgBox("Erro ao carregar montagens por dia.", "error");
  } finally {
    miCarregandoMontagemDia = false;
  }
}

function renderizarGraficoMontagemDiaProducao(grupos) {
  const ctx = document.getElementById("chartMiMontagemDiaProducao")?.getContext("2d");
  if (!ctx || typeof Chart === "undefined") return;
  if (chartMiMontagemDiaProducaoInstance) {
    chartMiMontagemDiaProducaoInstance.destroy();
    chartMiMontagemDiaProducaoInstance = null;
  }
  const labels = grupos.map(grupo => formatarDataPtBr(grupo.dataProd));
  const valores = grupos.map(grupo => grupo.itens.length);
  chartMiMontagemDiaProducaoInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Postes montados", data: valores, backgroundColor: "#2563eb", borderColor: "#1d4ed8", borderWidth: 1, borderRadius: 6 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (context) => `${context.parsed.y || 0} postes montados` } }
      },
      scales: {
        x: { ticks: { font: { size: window.innerWidth < 768 ? 10 : 12 } } },
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
}

function exportarMontagemDiaDetalheXlsx() {
  if (!Array.isArray(miMontagemDiaRows) || miMontagemDiaRows.length === 0) {
    showMsgBox("Carregue uma data de montagem antes de exportar.", "error");
    return;
  }
  if (!window.XLSX?.utils) {
    showMsgBox("Biblioteca XLSX indisponivel. Verifique a conexao e tente novamente.", "error");
    return;
  }
  const linhas = miMontagemDiaRows.map(row => ({
    "Data montagem": formatarDataHoraMontagemXlsx(row.finalizado_em || row.finalizadoEm || ""),
    "Data producao": formatarDataPtBr(row.data_fabricacao || row.dataFabricacao || ""),
    "Setor": row.setor || "",
    "Forma": row.forma_numero || row.formaNumero || "",
    "Modelo": row.modelo || "",
    "Status": getMiStatusMeta(row.status_montagem || row.statusMontagem || "").label,
    "Montador": row.montador_nome || row.montadorNome || ""
  }));
  const ws = XLSX.utils.json_to_sheet(linhas, {
    header: ["Data montagem", "Data producao", "Setor", "Forma", "Modelo", "Status", "Montador"]
  });
  ws["!cols"] = [{ wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 24 }, { wch: 18 }, { wch: 28 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Detalhe montagem");
  const dataMontagem = document.getElementById("miMontagemDiaData")?.value || todayYmd();
  XLSX.writeFile(wb, `detalhe_montagem_${dataMontagem}.xlsx`);
}

function obterItensRejeitadosLinha(row) {
  const checklists = row.checklists || {};
  let parsed = checklists;
  if (typeof checklists === "string") {
    try {
      parsed = JSON.parse(checklists);
    } catch (e) {
      parsed = {};
    }
  }

  const sections = obterChecklistSectionsLinha(row);

  const rejeitados = [];
  sections.forEach(sec => {
    const secRes = parsed[sec.id];
    if (secRes && typeof secRes === "object") {
      sec.itens.forEach(item => {
        if (secRes[item.id] === "nao") {
          rejeitados.push(item.texto);
        }
      });
    }
  });
  return rejeitados;
}

function renderizarTabelaMontagemPaginada() {
  const tbody = document.getElementById("miTabelaBody");
  if (!tbody) return;

  const totalRegistros = miFilteredMontagemData.length;
  document.getElementById("miTabelaTotal").textContent = totalRegistros;
  document.getElementById("miPaginacaoTotal").textContent = totalRegistros;

  if (totalRegistros === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: #64748b; padding: 25px;">Nenhum registro encontrado para os filtros selecionados.</td></tr>';
    const cardsContainer = document.getElementById("miCardsContainer");
    if (cardsContainer) cardsContainer.innerHTML = '<div style="text-align: center; color: #64748b; padding: 25px;">Nenhum registro encontrado para os filtros selecionados.</div>';
    document.getElementById("miPaginacaoDe").textContent = "0";
    document.getElementById("miPaginacaoA").textContent = "0";
    document.getElementById("miPaginacaoBotoes").innerHTML = "";
    return;
  }

  // Ordenação
  const col = miOrdenacaoColuna;
  const asc = miOrdenacaoAsc;
  
  const sortedData = [...miFilteredMontagemData].sort((a, b) => {
    let valA = a[col] || "";
    let valB = b[col] || "";

    if (col === "finalizado_em" || col === "inicio_inspecao_montagem" || col === "data_fabricacao") {
      valA = valA ? new Date(valA).getTime() : 0;
      valB = valB ? new Date(valB).getTime() : 0;
    } else if (col === "tempo_inspecao") {
      valA = a.finalizado_em && a.inicio_inspecao_montagem ? (new Date(a.finalizado_em) - new Date(a.inicio_inspecao_montagem)) : 0;
      valB = b.finalizado_em && b.inicio_inspecao_montagem ? (new Date(b.finalizado_em) - new Date(b.inicio_inspecao_montagem)) : 0;
    } else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
    }

    if (valA < valB) return asc ? -1 : 1;
    if (valA > valB) return asc ? 1 : -1;
    return 0;
  });

  // Paginação
  const totalPaginas = Math.ceil(totalRegistros / miLinhasPorPagina);
  if (miPaginaAtual > totalPaginas) miPaginaAtual = totalPaginas || 1;
  if (miPaginaAtual < 1) miPaginaAtual = 1;

  const inicioIdx = (miPaginaAtual - 1) * miLinhasPorPagina;
  const fimIdx = Math.min(inicioIdx + miLinhasPorPagina, totalRegistros);
  const paginaDados = sortedData.slice(inicioIdx, fimIdx);

  document.getElementById("miPaginacaoDe").textContent = inicioIdx + 1;
  document.getElementById("miPaginacaoA").textContent = fimIdx;

  // Renderizar Linhas (Tabela - Desktop)
  tbody.innerHTML = paginaDados.map(row => {
    const dataFab = row.data_fabricacao ? row.data_fabricacao.split("T")[0].split("-").reverse().join("/") : "N/A";
    
    const formatTimeShort = (isoStr) => {
      if (!isoStr) return "N/A";
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    };

    const inicio = formatTimeShort(row.inicio_inspecao_montagem);
    const fim = formatTimeShort(row.finalizado_em);

    const durMs = row.finalizado_em && row.inicio_inspecao_montagem ? (new Date(row.finalizado_em) - new Date(row.inicio_inspecao_montagem)) : null;
    const tempoText = formatarDuracao(durMs);
    
    let statusHtml = '<span style="color: #64748b; font-weight: bold;">Em Andamento</span>';
    if (row.status_montagem === "A") {
      statusHtml = `<span onclick="abrirVisualizacaoChecklist('${row.id}')" style="color: #16a34a; font-weight: bold; background: #dcfce7; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; text-decoration: underline;">Aprovado</span>`;
    } else if (row.status_montagem === "RR") {
      statusHtml = `<span onclick="abrirVisualizacaoChecklist('${row.id}')" style="color: #d97706; font-weight: bold; background: #fef3c7; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; text-decoration: underline;">Retrabalhado</span>`;
    } else if (row.status_montagem === "R") {
      statusHtml = `<span onclick="abrirVisualizacaoChecklist('${row.id}')" style="color: #dc2626; font-weight: bold; background: #fee2e2; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; text-decoration: underline;">Reprovado</span>`;
    }

    const rejeitados = obterItensRejeitadosLinha(row);
    let rejeitadosHtml = "";
    if (rejeitados.length > 0) {
      rejeitadosHtml = `
        <div style="display: inline-flex; align-items: center; gap: 8px; justify-content: center; text-align: left;">
          <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #ff3b30; box-shadow: 0 0 8px #ff3b30, 0 0 15px #ff3b30; flex-shrink: 0;" title="Possui itens rejeitados"></span>
          <span style="font-size: 0.78rem; color: #dc2626; background: #fee2e2; padding: 2px 6px; border-radius: 4px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${rejeitados.join(', ')}">${rejeitados.join(', ')}</span>
        </div>
      `;
    } else {
      rejeitadosHtml = `
        <div style="display: inline-flex; align-items: center; gap: 8px; justify-content: center;">
          <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #4cd964; box-shadow: 0 0 8px #4cd964, 0 0 15px #4cd964; flex-shrink: 0;" title="Todos os itens aprovados"></span>
          <span style="font-size: 0.78rem; color: #64748b;">Tudo OK</span>
        </div>
      `;
    }

    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px; text-align: center; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${dataFab}</td>
        <td style="padding: 10px; text-align: center;">${row.setor || ""}</td>
        <td style="padding: 10px; text-align: center; max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"><strong>${row.forma_numero || ""}</strong></td>
        <td style="padding: 10px; text-align: center;">${row.modelo || ""}</td>
        <td style="padding: 10px; text-align: center; font-size: 0.8rem; color: #475569;">${inicio}</td>
        <td style="padding: 10px; text-align: center; font-size: 0.8rem; color: #475569;">${fim}</td>
        <td style="padding: 10px; text-align: center; font-size: 0.85rem; font-weight: 600;">${tempoText}</td>
        <td style="padding: 10px; text-align: center;">${statusHtml}</td>
        <td style="padding: 10px; text-align: center; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${rejeitadosHtml}</td>
        <td style="padding: 10px; text-align: center; font-size: 0.85rem;">${row.montador_nome || ""}</td>
      </tr>
    `;
  }).join("");

  // Renderizar Cards (Mobile)
  const cardsContainer = document.getElementById("miCardsContainer");
  if (cardsContainer) {
    cardsContainer.innerHTML = paginaDados.map(row => {
      const dataFab = row.data_fabricacao ? row.data_fabricacao.split("T")[0].split("-").reverse().join("/") : "N/A";
      
      const formatTimeShort = (isoStr) => {
        if (!isoStr) return "N/A";
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return isoStr;
        return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      };

      const inicio = formatTimeShort(row.inicio_inspecao_montagem);
      const fim = formatTimeShort(row.finalizado_em);

      const durMs = row.finalizado_em && row.inicio_inspecao_montagem ? (new Date(row.finalizado_em) - new Date(row.inicio_inspecao_montagem)) : null;
      const tempoText = formatarDuracao(durMs);
      
      let statusHtml = '<span style="color: #64748b; font-weight: bold;">Em Andamento</span>';
      if (row.status_montagem === "A") {
        statusHtml = `<span onclick="abrirVisualizacaoChecklist('${row.id}')" style="color: #16a34a; font-weight: bold; background: #dcfce7; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; text-decoration: underline;">Aprovado</span>`;
      } else if (row.status_montagem === "RR") {
        statusHtml = `<span onclick="abrirVisualizacaoChecklist('${row.id}')" style="color: #d97706; font-weight: bold; background: #fef3c7; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; text-decoration: underline;">Retrabalhado</span>`;
      } else if (row.status_montagem === "R") {
        statusHtml = `<span onclick="abrirVisualizacaoChecklist('${row.id}')" style="color: #dc2626; font-weight: bold; background: #fee2e2; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; text-decoration: underline;">Reprovado</span>`;
      }

      const rejeitados = obterItensRejeitadosLinha(row);
      let rejeitadosHtml = "";
      if (rejeitados.length > 0) {
        rejeitadosHtml = `
          <div style="display: inline-flex; align-items: center; gap: 8px; text-align: left; vertical-align: middle;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #ff3b30; box-shadow: 0 0 8px #ff3b30, 0 0 15px #ff3b30; flex-shrink: 0;" title="Possui itens rejeitados"></span>
            <span style="font-size: 0.78rem; color: #dc2626; background: #fee2e2; padding: 2px 6px; border-radius: 4px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${rejeitados.join(', ')}">${rejeitados.join(', ')}</span>
          </div>
        `;
      } else {
        rejeitadosHtml = `
          <div style="display: inline-flex; align-items: center; gap: 8px; vertical-align: middle;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #4cd964; box-shadow: 0 0 8px #4cd964, 0 0 15px #4cd964; flex-shrink: 0;" title="Todos os itens aprovados"></span>
            <span style="font-size: 0.78rem; color: #64748b;">Tudo OK</span>
          </div>
        `;
      }

      return `
        <div class="mi-mobile-card">
          <div class="mi-mobile-card-header">
            <div><strong>Forma ${row.forma_numero || ""}</strong> (${row.setor || ""}) - <span style="color:#64748b; font-weight:600;">${row.modelo || ""}</span></div>
            <div>${statusHtml}</div>
          </div>
          <div class="mi-mobile-card-body">
            <div><strong>Data Prod:</strong> ${dataFab}</div>
            <div><strong>Duração:</strong> ${tempoText}</div>
            <div><strong>Período:</strong> ${inicio} - ${fim}</div>
            <div><strong>Montador:</strong> ${row.montador_nome || ""}</div>
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #e2e8f0; display: flex; align-items: center; gap: 8px;">
              <strong>Itens Rejeitados:</strong> ${rejeitadosHtml}
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  // Atualizar Ícones de Ordenação
  const colunas = ["data_fabricacao", "setor", "forma_numero", "modelo", "inicio_inspecao_montagem", "finalizado_em", "tempo_inspecao", "status_montagem", "montador_nome"];
  colunas.forEach(c => {
    const elIcon = document.getElementById("sort_icon_" + c);
    if (elIcon) {
      if (miOrdenacaoColuna === c) {
        elIcon.textContent = miOrdenacaoAsc ? " ▲" : " ▼";
        elIcon.style.color = "#2563eb";
      } else {
        elIcon.textContent = "";
      }
    }
  });

  // Renderizar Botões de Paginação
  const pagContainer = document.getElementById("miPaginacaoBotoes");
  if (!pagContainer) return;
  
  let buttonsHtml = "";
  buttonsHtml += `
    <button class="btn" style="padding: 5px 10px; font-size: 0.8rem;" ${miPaginaAtual === 1 ? "disabled" : ""} onclick="mudarMiPagina(${miPaginaAtual - 1})">
      Anterior
    </button>
  `;

  const maxButtons = 5;
  let startPage = Math.max(1, miPaginaAtual - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPaginas, startPage + maxButtons - 1);
  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let p = startPage; p <= endPage; p++) {
    buttonsHtml += `
      <button class="btn ${miPaginaAtual === p ? "primary" : ""}" style="padding: 5px 10px; font-size: 0.8rem; min-width: 30px;" onclick="mudarMiPagina(${p})">
        ${p}
      </button>
    `;
  }

  buttonsHtml += `
    <button class="btn" style="padding: 5px 10px; font-size: 0.8rem;" ${miPaginaAtual === totalPaginas ? "disabled" : ""} onclick="mudarMiPagina(${miPaginaAtual + 1})">
      Próximo
    </button>
  `;

  pagContainer.innerHTML = buttonsHtml;
}

window.mudarMiPagina = function(p) {
  miPaginaAtual = p;
  renderizarTabelaMontagemPaginada();
};

window.ordenarMiTabela = function(coluna) {
  if (miOrdenacaoColuna === coluna) {
    miOrdenacaoAsc = !miOrdenacaoAsc;
  } else {
    miOrdenacaoColuna = coluna;
    miOrdenacaoAsc = true;
  }
  miPaginaAtual = 1;
  renderizarTabelaMontagemPaginada();
};

function renderGraficosMontagem(byDay, bySector, byMontador, prodByDay = {}) {
  miUltimosGraficos = { byDay, bySector, byMontador, prodByDay };
  const shouldRenderProducao = miAbaAtiva === "producao" || window.innerWidth >= 768;
  const shouldRenderQualidade = miAbaAtiva === "qualidade" || window.innerWidth >= 768;
  if (!shouldRenderProducao && chartMiPorDiaInstance) {
    chartMiPorDiaInstance.destroy();
    chartMiPorDiaInstance = null;
  }
  if (!shouldRenderQualidade && chartMiPorSetorInstance) {
    chartMiPorSetorInstance.destroy();
    chartMiPorSetorInstance = null;
  }
  if (!shouldRenderQualidade && chartMiPorMontadorInstance) {
    chartMiPorMontadorInstance.destroy();
    chartMiPorMontadorInstance = null;
  }

  const isMobile = window.innerWidth < 768;
  const labelFontSize = isMobile ? 9 : 12;
  const legendBoxWidth = isMobile ? 8 : 12;

  // Por Dia
  const unionSet = new Set([
    ...Object.keys(byDay),
    ...Object.keys(prodByDay)
  ]);
  unionSet.delete("Desconhecido");
  unionSet.delete("");
  const dias = Array.from(unionSet).sort();

  const dataDiaProduzidos = dias.map(d => prodByDay[d] || 0);
  const dataDiaAprovados = dias.map(d => byDay[d]?.aprovados || 0);
  const dataDiaRecusados = dias.map(d => byDay[d]?.recusados || 0);
  const diasFormatados = dias.map(d => d.split("-").reverse().join("/"));

  const ctxDia = document.getElementById("chartMiPorDia")?.getContext("2d");
  if (ctxDia && shouldRenderProducao) {
    if (chartMiPorDiaInstance) chartMiPorDiaInstance.destroy();
    chartMiPorDiaInstance = new Chart(ctxDia, {
      type: "bar",
      data: {
        labels: diasFormatados,
        datasets: [
          { label: "Produzidos", data: dataDiaProduzidos, backgroundColor: "#3b82f6", stack: "Stack 0" },
          { label: "Aprovados", data: dataDiaAprovados, backgroundColor: "#10b981", stack: "Stack 1" },
          { label: "Recusados", data: dataDiaRecusados, backgroundColor: "#ef4444", stack: "Stack 1" }
        ]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: { 
          legend: { 
            position: 'bottom',
            labels: {
              boxWidth: legendBoxWidth,
              font: { size: labelFontSize }
            }
          } 
        },
        scales: {
          x: { 
            stacked: true,
            ticks: {
              font: { size: labelFontSize },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: isMobile ? 4 : 10
            }
          },
          y: { 
            stacked: true, 
            beginAtZero: true,
            ticks: { font: { size: labelFontSize } }
          }
        }
      }
    });
  }

  // Por Setor
  const setores = Object.keys(bySector).sort();
  const dataSetor = setores.map(s => bySector[s]);
  const ctxSetor = document.getElementById("chartMiPorSetor")?.getContext("2d");
  if (ctxSetor && shouldRenderQualidade) {
    if (chartMiPorSetorInstance) chartMiPorSetorInstance.destroy();
    chartMiPorSetorInstance = new Chart(ctxSetor, {
      type: "doughnut",
      data: {
        labels: setores,
        datasets: [{ data: dataSetor, backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#64748b"] }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        plugins: { 
          legend: { 
            position: 'bottom',
            labels: {
              boxWidth: legendBoxWidth,
              font: { size: labelFontSize }
            }
          } 
        } 
      }
    });
  }

  // Por Montador
  const montadores = Object.keys(byMontador).sort((a,b) => byMontador[b] - byMontador[a]);
  const dataMontador = montadores.map(m => byMontador[m]);
  const ctxMontador = document.getElementById("chartMiPorMontador")?.getContext("2d");
  if (ctxMontador && shouldRenderQualidade) {
    if (chartMiPorMontadorInstance) chartMiPorMontadorInstance.destroy();
    chartMiPorMontadorInstance = new Chart(ctxMontador, {
      type: "bar",
      data: {
        labels: montadores,
        datasets: [{ label: "Postes Inspecionados", data: dataMontador, backgroundColor: "#6366f1" }]
      },
      options: { 
        indexAxis: 'y', 
        responsive: true, 
        maintainAspectRatio: false, 
        interaction: {
          intersect: false,
          mode: 'nearest'
        },
        plugins: { 
          legend: { display: false } 
        },
        scales: {
          x: { ticks: { font: { size: labelFontSize } } },
          y: { ticks: { font: { size: labelFontSize } } }
        }
      }
    });
  }
}

window.abrirFotoVisualizacao = function(src) {
  const w = window.open();
  if (w) {
    w.document.write(`<img src="${src}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
    w.document.close();
  }
};

window.abrirVisualizacaoChecklist = function(idOrRow) {
  let row;
  if (typeof idOrRow === "object" && idOrRow !== null) {
    row = idOrRow;
  } else {
    row = (typeof miRawMontagemData !== "undefined" && Array.isArray(miRawMontagemData))
      ? miRawMontagemData.find(r => String(r.id) === String(idOrRow))
      : null;
  }
  if (!row) return;

  // Normalizar propriedades para suportar tanto snake_case do Supabase quanto camelCase do frontend local
  const normRow = {
    id: row.id || row.key || "",
    forma_numero: row.forma_numero || row.formaNumero || "",
    modelo: row.modelo || "",
    montador_nome: row.montador_nome || row.montadorNome || "",
    data_fabricacao: row.data_fabricacao || row.dataFabricacao || "",
    inicio_inspecao_montagem: row.inicio_inspecao_montagem || row.inicioInspecaoMontagem || "",
    finalizado_em: row.finalizado_em || row.finalizadoEm || "",
    status_montagem: row.status_montagem || row.statusMontagem || "",
    checklists: row.checklists || {},
    observacoes_montagem: row.observacoes_montagem || row.observacoesMontagem || "",
    motivo_recusa: row.motivo_recusa || row.motivoRecusa || "",
    etapa: row.etapa || ""
  };

  const modal = document.getElementById("visualizarChecklistModal");
  if (!modal) return;

  document.getElementById("vcMetaForma").textContent = normRow.forma_numero || "-";
  document.getElementById("vcMetaModelo").textContent = normRow.modelo || "-";
  document.getElementById("vcMetaMontador").textContent = normRow.montador_nome || "-";
  document.getElementById("vcMetaData").textContent = normRow.data_fabricacao ? String(normRow.data_fabricacao).split("T")[0].split("-").reverse().join("/") : "-";

  const formatTimeShort = (isoStr) => {
    if (!isoStr) return "N/A";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  document.getElementById("vcMetaInicio").textContent = formatTimeShort(normRow.inicio_inspecao_montagem);
  document.getElementById("vcMetaFim").textContent = formatTimeShort(normRow.finalizado_em);

  const fallbackDia = normRow.finalizado_em ? String(normRow.finalizado_em).split("T")[0].split("-").reverse().join("/") : "-";
  const fallbackHora = normRow.finalizado_em ? formatTimeShort(normRow.finalizado_em) : "-";

  let checklists = normRow.checklists || {};
  if (typeof checklists === "string") {
    try {
      checklists = JSON.parse(checklists);
    } catch (e) {
      checklists = {};
    }
  }

  const diaInspecao = checklists.dia_inspecao || fallbackDia;
  const horaDispositivo = checklists.horario_dispositivo || fallbackHora;

  document.getElementById("vcMetaDiaInspecao").textContent = diaInspecao;
  document.getElementById("vcMetaHoraDispositivo").textContent = horaDispositivo;

  let geoText = "Não informada";
  const geo = checklists.geolocation;
  if (geo) {
    if (geo.error) {
      geoText = `<span style="color: #ef4444; font-weight: 500;">Indisponível (${geo.error})</span>`;
    } else if (geo.latitude !== undefined && geo.longitude !== undefined) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${geo.latitude},${geo.longitude}`;
      const accuracyStr = geo.accuracy ? ` (±${geo.accuracy.toFixed(1)}m)` : "";
      geoText = `<a href="${mapsUrl}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">📍 Ver no Mapa (Lat: ${geo.latitude.toFixed(6)}, Lng: ${geo.longitude.toFixed(6)})${accuracyStr}</a>`;
    }
  }
  document.getElementById("vcMetaGeolocalizacao").innerHTML = geoText;

  let statusText = "Em Andamento";
  let statusColor = "#64748b";
  if (normRow.status_montagem === "A") {
    statusText = "Aprovado";
    statusColor = "#16a34a";
  } else if (normRow.status_montagem === "RR") {
    statusText = "Reprovado e Retrabalhado";
    statusColor = "#d97706";
  } else if (normRow.status_montagem === "R") {
    statusText = "Reprovado";
    statusColor = "#dc2626";
  }
  const elStatus = document.getElementById("vcMetaStatus");
  elStatus.textContent = statusText;
  elStatus.style.color = statusColor;

  // Render content
  const container = document.getElementById("vcChecklistContent");
  container.innerHTML = "";

  const sections = normRow.etapa === "INSPECAO" ? getInspecaoChecklistSections(normRow.modelo || "") : getMontagemChecklistSections(normRow.modelo || "");

  sections.forEach(section => {
    const secDiv = document.createElement("div");
    secDiv.style.marginBottom = "20px";
    secDiv.innerHTML = `
      <div style="font-weight: bold; background: #e2e8f0; padding: 6px 10px; border-radius: 6px; margin-bottom: 8px; color: #1e293b;">
        ${section.titulo}
      </div>
    `;

    const listDiv = document.createElement("div");
    listDiv.style.display = "flex";
    listDiv.style.flexDirection = "column";
    listDiv.style.gap = "8px";

    section.itens.forEach(item => {
      const resp = checklists[section.id]?.[item.id] || "";
      const photoBase64 = checklists[section.id]?.[item.id + "_photo"] || "";

      let badge = '<span style="color: #64748b; font-weight: bold; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">N/A</span>';
      if (resp === "sim") {
        badge = '<span style="color: #16a34a; font-weight: bold; background: #dcfce7; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">Aprovado</span>';
      } else if (resp === "nao") {
        badge = '<span style="color: #dc2626; font-weight: bold; background: #fee2e2; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">Reprovado</span>';
      }

      let imgHtml = "";
      if (photoBase64) {
        imgHtml = `
          <div style="margin-top: 8px; display: flex; align-items: center; gap: 10px;">
            <img src="${photoBase64}" style="max-width: 150px; max-height: 150px; border-radius: 8px; border: 1px solid #cbd5e1; cursor: pointer;" onclick="abrirFotoVisualizacao('${photoBase64}')" title="Clique para ampliar" />
            <a href="${photoBase64}" download="foto_falha_${item.id || 'falha'}.png" class="btn" style="padding: 6px 12px; font-size: 0.8rem; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
              📥 Baixar Foto
            </a>
          </div>
        `;
      }

      const itemDiv = document.createElement("div");
      itemDiv.style.display = "flex";
      itemDiv.style.flexDirection = "column";
      itemDiv.style.padding = "8px";
      itemDiv.style.background = "#f8fafc";
      itemDiv.style.borderRadius = "8px";
      itemDiv.style.border = "1px solid #f1f5f9";
      itemDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 500; font-size: 0.85rem;">
            ${item.critico ? '<span style="color: #ef4444; margin-right: 4px;">🔴</span>' : ''}
            ${item.texto}
          </span>
          ${badge}
        </div>
        ${imgHtml}
      `;
      listDiv.appendChild(itemDiv);
    });

    secDiv.appendChild(listDiv);
    container.appendChild(secDiv);
  });

  // Render global photos (fotos de recusa da VPS Storage)
  const photosContainer = document.createElement("div");
  photosContainer.id = "vcVpsPhotosContainer";
  container.appendChild(photosContainer);

  const backendUrl = getBackendUrl();
  fetch(`${backendUrl}/inspecoes/${normRow.id}/fotos`)
    .then(res => res.json())
    .then(resData => {
      if (resData.success && resData.data && resData.data.length > 0) {
        const globalDiv = document.createElement("div");
        globalDiv.style.marginTop = "20px";
        globalDiv.style.marginBottom = "20px";
        globalDiv.innerHTML = `
          <div style="font-weight: bold; background: #fee2e2; padding: 6px 10px; border-radius: 6px; margin-bottom: 8px; color: #dc2626;">
            Fotos da Inspeção / Recusa (VPS Storage)
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px;">
            ${resData.data.map((photo, index) => `
              <div style="display: flex; flex-direction: column; gap: 8px; padding: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; align-items: center;" id="photo-card-${photo.id}">
                <img src="${photo.url}" style="max-width: 100%; max-height: 150px; border-radius: 6px; cursor: pointer; object-fit: cover;" onclick="abrirFotoVisualizacao('${photo.url}')" title="Clique para ampliar" />
                <div style="display: flex; gap: 6px; width: 100%;">
                  <a href="${photo.url}" download="${photo.arquivo_nome}" class="btn" style="padding: 6px 10px; font-size: 0.75rem; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; flex: 1; justify-content: center; box-sizing: border-box;">
                    📥 Baixar
                  </a>
                  <button onclick="excluirFotoVps('${photo.id}')" class="btn" style="padding: 6px 10px; font-size: 0.75rem; background: #dc2626; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 4px;">
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            `).join("")}
          </div>
        `;
        photosContainer.appendChild(globalDiv);
      }
    })
    .catch(err => {
      console.error("Erro ao carregar fotos do Storage VPS:", err);
    });

  // Obs
  const obsContainer = document.getElementById("vcObsContainer");
  const elObs = document.getElementById("vcObservacoes");
  const obsVal = normRow.observacoes_montagem || normRow.motivo_recusa || "";
  if (obsVal) {
    elObs.textContent = obsVal;
    obsContainer.style.display = "block";
  } else {
    obsContainer.style.display = "none";
  }

  modal.classList.add("modal-visible");
};

window.excluirFotoVps = async function(photoId) {
  if (!confirm("Tem certeza que deseja excluir esta foto da VPS e do banco de dados?")) return;
  const backendUrl = getBackendUrl();
  const user = state.authUser?.name || "sistema";
  try {
    const res = await fetch(`${backendUrl}/fotos/${photoId}?usuario=${encodeURIComponent(user)}`, {
      method: "DELETE"
    });
    const data = await res.json();
    if (data.success) {
      showMsgBox("Foto excluída com sucesso.", "success");
      const card = document.getElementById(`photo-card-${photoId}`);
      if (card) card.remove();
    } else {
      showMsgBox("Erro ao excluir foto: " + data.error, "error");
    }
  } catch (err) {
    showMsgBox("Falha de rede ao conectar à API de Storage.", "error");
  }
};

/* Sequencia Setor 3 (PWA Offline-First Feature) */

window.readProgS3S4Db = function() {
  try {
    const raw = localStorage.getItem("pwa_prog_s3_s4_v1");
    return raw ? JSON.parse(raw) : { programacoes: {} };
  } catch (err) {
    return { programacoes: {} };
  }
};

window.writeProgS3S4Db = function(db) {
  localStorage.setItem("pwa_prog_s3_s4_v1", JSON.stringify(db));
};

window.getModelosForFormaS3 = function(forma) {
  const num = parseInt(forma.replace("SC", ""), 10);
  if (num >= 37 && num <= 52) {
    return [
      "",
      "10x400", "10x600", "10x1000", "10,5x1000 CR", 
      "11x300", "11x400", "11x600", "11x1000", 
      "12x300", "12x400", "12x600", "12x1000", 
      "13x400", "13x600", "13x1000", 
      "14x600", "14x1000", "14x1500", 
      "15x600", "15x1000", 
      "16x600", "16x1000", 
      "16,5x1000", "16,5x2000", 
      "17,5x1000", 
      "18x1000", "18x2000", 
      "19x1000", 
      "21.5x1000", "21.5x1200"
    ];
  } else {
    return [
      "",
      "7x300", "7x400", 
      "7,5x200", "7,5x300", "7,5x400", "7,5x600", 
      "9x150", "9x150 EDP", "9x200", "9x300", "9x300 EDP", "9x400", "9x500", "9x600", "9x800 EDP", "9x1000"
    ];
  }
};

window.renderSequenciaS3 = async function() {
  const listContainer = el.seqS3List;
  if (!listContainer) return;

  const selectedDate = el.seqS3Data?.value || todayYmd();
  listContainer.innerHTML = '<div class="muted text-center" style="padding: 20px; width: 100%;">Carregando programações...</div>';

  let localDb = readProgS3S4Db();
  let savedModels = {};

  // Tenta buscar no Supabase se online
  if (supabaseClient && navigator.onLine) {
    try {
      const { data, error } = await supabaseClient
        .from("prog_s3_s4")
        .select("forma, modelo")
        .eq("data", selectedDate)
        .eq("setor", "Setor 3");
      
      if (!error && data) {
        data.forEach(item => {
          savedModels[item.forma] = item.modelo || "";
          
          const cacheKey = `${selectedDate}||${item.forma}||Setor 3`;
          localDb.programacoes[cacheKey] = {
            data: selectedDate,
            forma: item.forma,
            setor: "Setor 3",
            modelo: item.modelo || "",
            pendingSync: false
          };
        });
        writeProgS3S4Db(localDb);
      }
    } catch (err) {
      console.error("Erro ao carregar do Supabase:", err);
    }
  }

  // Preenche a partir do cache local se offline
  const prefix = `${selectedDate}||`;
  Object.keys(localDb.programacoes || {}).forEach(key => {
    if (key.startsWith(prefix) && key.endsWith("||Setor 3")) {
      const entry = localDb.programacoes[key];
      if (savedModels[entry.forma] === undefined) {
        savedModels[entry.forma] = entry.modelo || "";
      }
    }
  });

  // Renderiza formas SC01 a SC52
  listContainer.innerHTML = "";
  const shapesCount = 52;
  
  for (let i = 1; i <= shapesCount; i++) {
    const formaName = "SC" + String(i).padStart(2, "0");
    const selectedModel = savedModels[formaName] || "";
    const options = getModelosForFormaS3(formaName);
    
    let selectHtml = `<select class="seq-s3-select" data-forma="${formaName}">`;
    options.forEach(opt => {
      const label = opt === "" ? "Sem Produção (Vazio)" : opt;
      const isSelected = selectedModel === opt ? "selected" : "";
      selectHtml += `<option value="${opt}" ${isSelected}>${label}</option>`;
    });
    selectHtml += `</select>`;

    const div = document.createElement("div");
    div.className = "seq-s3-item seq-s3-row";
    div.dataset.forma = formaName;
    div.innerHTML = `
      <div class="seq-s3-forma-badge">${formaName}</div>
      <div class="seq-s3-select-wrapper">
        ${selectHtml}
        <span class="seq-s3-arrow">▼</span>
      </div>
    `;
    listContainer.appendChild(div);
  }

  updateSeqS3TotalCount();
};

window.updateSeqS3TotalCount = function() {
  const rows = document.querySelectorAll(".seq-s3-row");
  let activeCount = 0;
  rows.forEach(row => {
    if (row.style.display !== "none") {
      activeCount++;
    }
  });
  const elTotal = document.getElementById("seqS3TotalCount");
  if (elTotal) elTotal.textContent = activeCount;
};

window.filterSequenciaS3 = function() {
  const query = el.seqS3Search?.value?.trim().toUpperCase() || "";
  const rows = document.querySelectorAll(".seq-s3-row");
  
  rows.forEach(row => {
    const forma = row.dataset.forma || "";
    if (forma.toUpperCase().includes(query)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
  
  updateSeqS3TotalCount();
};

window.saveSequenciaS3 = async function() {
  const selectedDate = el.seqS3Data?.value;
  if (!selectedDate) {
    showMsgBox("Selecione a data da programação.", "error");
    return;
  }

  const selects = document.querySelectorAll(".seq-s3-select");
  const localDb = readProgS3S4Db();
  let syncPromises = [];
  let isNetworkFailure = false;
  let savedCount = 0;

  // Mostra modal de carregamento
  const loadingModal = document.getElementById("loadingModal");
  if (loadingModal) {
    loadingModal.querySelector(".loading-msg").textContent = "Salvando programação, aguarde...";
    loadingModal.classList.add("modal-visible");
  }

  for (const select of selects) {
    const forma = select.dataset.forma;
    const modelo = select.value;
    const cacheKey = `${selectedDate}||${forma}||Setor 3`;

    // Atualiza cache local
    localDb.programacoes[cacheKey] = {
      data: selectedDate,
      forma: forma,
      setor: "Setor 3",
      modelo: modelo,
      pendingSync: false
    };

    if (supabaseClient && navigator.onLine) {
      const p = supabaseClient
        .from("prog_s3_s4")
        .upsert({
          data: selectedDate,
          forma: forma,
          setor: "Setor 3",
          modelo: modelo
        }, { onConflict: "data,forma,setor" })
        .then(({ error }) => {
          if (error) {
            console.error(`Erro ao salvar fôrma ${forma}:`, error.message);
            localDb.programacoes[cacheKey].pendingSync = true;
          } else {
            savedCount++;
          }
        })
        .catch(err => {
          console.error(err);
          isNetworkFailure = true;
          localDb.programacoes[cacheKey].pendingSync = true;
        });
      syncPromises.push(p);
    } else {
      localDb.programacoes[cacheKey].pendingSync = true;
    }
  }

  if (syncPromises.length > 0) {
    await Promise.all(syncPromises);
  }

  writeProgS3S4Db(localDb);

  if (loadingModal) {
    loadingModal.classList.remove("modal-visible");
  }

  if (isNetworkFailure || !navigator.onLine) {
    setSyncStatus("warn", "Programação salva localmente (sem sinal de rede). Sincronizando em background.");
    showMsgBox("Programação salva localmente devido à falta de sinal. O sistema sincronizará assim que retornar online.", "success");
  } else {
    setSyncStatus("ok", "Programação Setor 3 salva e sincronizada com sucesso!");
    showMsgBox("Programação do Setor 3 salva com sucesso no banco de dados!", "success");
  }

  setMode("HUB");
};


// =========================================================
// MODO ODIN - FUNÇÕES AUXILIARES DE CANCELAMENTO
// =========================================================
async function cancelarOuDesprogramarOdin(forma, setor, card) {
  const isConcretada = isFormaClicked(forma, setor);
  const isLiberada = isFormaLiberada(forma, setor);
  const isProgrammed = state.programmedFormas.has(normalizeUpper(forma));

  if (isConcretada || isLiberada) {
    await cancelarConcretagemOdin(forma, setor, card);
  } else if (isProgrammed) {
    await toggleFormaProgramada(forma, setor, card);
  } else {
    showLibFeedback(`Forma ${forma} não está programada nem concretada/liberada.`, "warn");
  }
}

async function cancelarConcretagemOdin(forma, setor, card) {
  if (!confirm(`MODO ODIN: Tem certeza que deseja CANCELAR/EXCLUIR a concretagem/liberação da forma ${forma} no Setor ${setor}?`)) return;

  setCardState(card, "saving");

  const dataFabricacao = el.libData?.value || todayYmd();
  const normalizedForma = normalizeUpper(forma);

  // 1. Deletar do Supabase (de todas as 3 tabelas relacionadas)
  let apiSuccess = false;
  if (hasApiConfigured()) {
    try {
      const res = await Promise.all([
        supabaseClient.from('producao').delete().eq('data_fabricacao', dataFabricacao).eq('setor', setor).eq('forma', normalizedForma),
        supabaseClient.from('liberacao_formas').delete().eq('data_fabricacao', dataFabricacao).eq('setor', setor).eq('forma', normalizedForma),
        supabaseClient.from('programacao_pcp').delete().eq('data_fabricacao', dataFabricacao).eq('setor', setor).eq('forma', normalizedForma)
      ]);

      const anyError = res.some(r => r.error);
      if (anyError) {
        console.error("Erro ao deletar do Supabase:", res.map(r => r.error).filter(Boolean));
      } else {
        apiSuccess = true;
      }
    } catch (err) {
      console.error("Erro na requisição Supabase:", err);
    }
  }

  // 2. Deletar do banco local (pwa_liberacao_inspecao_v1)
  const db = readDb();
  let record = findRecordByKey(db, dataFabricacao, setor, normalizedForma);
  if (record) {
    db.records = db.records.filter(r => r.id !== record.id);
    db.events = db.events.filter(e => e.recordId !== record.id);
    writeDb(db);
  }

  // 3. Deletar do estado local clickedForms
  const clicked = getClickedFormsToday();
  const key = setor + "||" + normalizedForma;
  delete clicked.formas[key];
  localStorage.setItem(CLICKED_FORMS_KEY, JSON.stringify(clicked));

  // 4. Resetar estados visuais do card
  card.classList.remove("is-liberada", "is-concretada", "is-vibrada", "is-secovibrado");
  const tipoEl = card.querySelector(".fc-tipo");
  if (tipoEl) {
    tipoEl.textContent = "";
    tipoEl.style.display = "none";
  }
  const statusEl = card.querySelector(".fc-status");
  if (statusEl) {
    statusEl.textContent = "";
  }
  setCardState(card, "idle");

  // Re-renderiza para limpar e atualizar
  renderLiberacaoDual();

  if (apiSuccess) {
    setSyncStatus("ok", `Concretagem da forma ${forma} excluída online.`);
    showLibFeedback(`Concretagem ${forma} excluída (online).`, "ok");
  } else {
    setSyncStatus("warn", `Excluído localmente. Sem sincronia online.`);
    showLibFeedback(`Concretagem ${forma} excluída (local).`, "ok");
  }
}

// =========================================================
// DINAMIC SW VERSION BADGE LOADER
// =========================================================
async function updateSwVersionBadge() {
  const badge = document.getElementById("swVersionBadge");
  if (!badge) return;

  // Add click to force reload/update
  badge.title = "Clique para forçar atualização do app";
  badge.style.cursor = "pointer";
  if (!badge.dataset.listenerBound) {
    badge.dataset.listenerBound = "true";
    badge.addEventListener("click", async () => {
      if (confirm("Deseja forçar a atualização deste aplicativo para a versão mais recente?")) {
        badge.textContent = "Atualizando...";
        if (navigator.serviceWorker) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let reg of registrations) {
              await reg.unregister();
            }
          } catch(e) {}
        }
        if ("caches" in window) {
          try {
            const keys = await caches.keys();
            await Promise.all(
              keys
                .filter((key) => key.includes("mapa-concretagem"))
                .map((key) => caches.delete(key))
            );
          } catch(e) {}
        }
        window.location.replace(`./index.html?cache-reset=v5.8&ts=${Date.now()}`);
      }
    });
  }

  try {
    const response = await fetch("sw.js?v=" + Date.now(), { cache: "no-store" });
    if (response.ok) {
      const text = await response.text();
      const match = text.match(/CACHE_NAME\s*=\s*["']mapa-concretagem(?:-teste)?-v(\d+(?:\.\d+)?)/);
      if (match && match[1]) {
        badge.textContent = `v${match[1]}`;
        badge.style.display = "inline-block";
        return;
      }
    }
  } catch (e) {
    console.warn("Erro ao buscar versão do SW:", e);
  }
  // Fallback
  badge.textContent = "v5.8";
  badge.style.display = "inline-block";
}
