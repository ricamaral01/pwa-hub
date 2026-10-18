import type { Categoria, ItemTraco, Traco } from '../core/model';
import { parseNumero } from '../core/units';

export interface RegistroLegado { tipo: 'tracos' | 'custos' | 'fornecedores' | 'ensaios'; origem: string; id_antigo: string; documento: Record<string, unknown> }
export interface PreviaLegado { lidos: number; convertidos: RegistroLegado[]; avisos: string[] }
const numero = (v: unknown): number | null => typeof v === 'number' && Number.isFinite(v) ? v : parseNumero(String(v ?? ''));
const presente = (v: unknown) => v !== undefined && v !== null && String(v).trim() !== '';
const agora = () => new Date().toISOString();
const auditoria = () => ({ criadoPor: 'importacao', criadoEm: agora(), alteradoPor: 'importacao', alteradoEm: agora() });

function cartaLocal(c: Record<string, unknown>, origem: string, antigo: string, unidade: string): RegistroLegado {
  const spec: [string, Categoria, string, string | null, boolean][] = [
    ['cim','cimento','Cimento','rhoCim',false], ['adic','adicao','Adição','rhoAdic',false],
    ['an','areia','Areia natural 1','rhoAn',true], ['an2','areia','Areia natural 2','rhoAn2',false],
    ['ai','areia','Areia industrial','rhoAi',false], ['b0','brita','Brita 0','rhoB0',false],
    ['b1','brita','Brita 1/2','rhoB1',false], ['agua','agua','Água',null,false],
    ['adit','aditivo','Aditivo 1','rhoAdit',true], ['adit2','aditivo','Aditivo 2','rhoAdit2',false]
  ];
  const itens: ItemTraco[] = [];
  for (const [campo,categoria,nome,rhoCampo,totalIncluiSegundo] of spec) {
    const total = numero(c[campo]);
    if (total === null || total <= 0) continue;
    const segundo = totalIncluiSegundo ? (numero(c[campo+'2']) ?? 0) : 0;
    const massa = total - segundo;
    if (massa < 0) throw new Error(`${campo}: segunda parcela maior que o total.`);
    if (massa === 0) continue;
    const rho = rhoCampo ? numero(c[rhoCampo]) : 1;
    if (rho === null || rho <= 0) throw new Error(`${nome}: massa específica ausente; informe antes de importar.`);
    itens.push({ id: crypto.randomUUID(), nome, categoria, massaKgM3: massa, massaEspecificaKgDm3: rho });
  }
  if (!itens.some(i => i.categoria === 'cimento')) throw new Error('Cimento ausente.');
  const fck = numero(c.fck);
  if (fck === null || fck <= 0) throw new Error('Fck ausente.');
  const documento: Traco = {
    id: crypto.randomUUID(), codigo: '', nome: String(c.tracoNome || c.nome || antigo), unidade: String(c.unidade || unidade),
    versao: 1, revisao: 1, status: 'rascunho', metodo: 'manual',
    objetivo: { fckMPa: fck, sdMPa: numero(c.sd) ?? 4, classe: 'II', estrutura: 'armado', abatimentoMm: numero(c.flow) ?? 0, toleranciaMm: 20 },
    itens, arIncorporadoPct: numero(c.ar) ?? 0, normalizarPara1m3: false, experimentais: [], auditoria: auditoria()
  };
  return { tipo: 'tracos', origem, id_antigo: antigo, documento: { ...documento, dadosOriginais: c } };
}

function cartaPlanilha(row: unknown[], antigo: string, unidade: string): RegistroLegado {
  const map: Record<string, unknown> = {
    id: antigo, tracoNome: row[2], unidade: row[4] || unidade, fck: row[16], flow: row[17],
    cim: row[19], adic: row[20], an: row[21], ai: row[22], b0: row[23], b1: row[24], agua: row[25],
    adit: row[26], adit2: row[27], ar: row[29], rhoCim: row[40], rhoAdic: row[41],
    rhoAn: row[42], rhoAi: row[43], rhoB0: row[44], rhoB1: row[45], rhoAdit: row[46], rhoAdit2: row[47]
  };
  return cartaLocal(map, 'planilha:CartasTraco', antigo, unidade);
}

function custoPlanilha(row: unknown[], antigo: string, unidade: string): RegistroLegado {
  return { tipo: 'custos', origem: 'planilha:custo', id_antigo: antigo, documento: {
    id: crypto.randomUUID(), unidade: String(row[6] || unidade), nomeProduto: String(row[2] || ''),
    tipoMaterial: row[3], chaveMCC: row[4], fornecedor: row[5], unidadeMCC: row[6],
    versao: numero(row[7]) ?? 1, revisao: 1, unidadeMedida: row[8], preco: numero(row[9]) ?? 0,
    icmsPct: numero(row[10]) ?? 0, deduzICMS: Boolean(row[11]), frete: numero(row[12]) ?? 0,
    unidFrete: row[13], icmsFreteP: numero(row[14]) ?? 0, deduzICMSFrete: Boolean(row[15]),
    custoLiq: numero(row[16]) ?? 0, ativo: String(row[17]).toLowerCase() !== 'não', observacoes: row[18],
    dadosOriginais: row
  } };
}

function fornecedorPlanilha(row: unknown[], antigo: string, unidade: string): RegistroLegado {
  return { tipo: 'fornecedores', origem: 'planilha:fornecedor', id_antigo: antigo, documento: {
    id: crypto.randomUUID(), unidade, nome: String(row[1] || ''), contato: String(row[2] || ''),
    materiais: [], ativo: true, auditoria: auditoria(), dadosOriginais: row
  } };
}

function ensaioLegado(raw: Record<string, unknown>, origem: string, antigo: string, unidade: string): RegistroLegado {
  const tipoOriginal = String(raw.tipo || '');
  const tipo = tipoOriginal.includes('graudo') ? 'granulometria_graudo' : tipoOriginal.includes('miudo') ? 'granulometria_miudo' :
    tipoOriginal.includes('massa') ? 'massa_especifica_miudo' : '';
  if (!tipo) throw new Error(`Tipo de ensaio não reconhecido: ${tipoOriginal || '(vazio)'}.`);
  return { tipo: 'ensaios', origem, id_antigo: antigo, documento: {
    id: crypto.randomUUID(), unidade, tipo, materialId: String(raw.material || ''),
    materialNomeLegado: String(raw.material || ''), fornecedorLegado: String(raw.fornecedor || ''),
    data: String(raw.data_ensaio || raw.data || raw.timestamp || agora()), responsavel: String(raw.responsavel || ''),
    dados: raw, resultado: raw.resultados || {}, status: 'concluido', auditoria: auditoria()
  } };
}

function ensaioPlanilha(row: unknown[], antigo: string, unidade: string): RegistroLegado {
  let payload: Record<string, unknown> = {};
  if (presente(row[7])) {
    const valor: unknown = typeof row[7] === 'string' ? JSON.parse(row[7]) : row[7];
    if (!valor || typeof valor !== 'object' || Array.isArray(valor)) throw new Error('payload_json inválido.');
    payload = valor as Record<string, unknown>;
  }
  return ensaioLegado({ ...payload, tipo: row[1] || payload.tipo, material: row[2] || payload.material,
    fornecedor: row[3] || payload.fornecedor, data_ensaio: row[4] || payload.data_ensaio,
    responsavel: row[5] || payload.responsavel, timestamp: row[6] || payload.timestamp }, 'planilha:ensaios_granulometria', antigo, unidade);
}

function fornecedorLocal(raw: Record<string, unknown>, origem: string, antigo: string, unidade: string): RegistroLegado {
  const nome = String(raw.fornecedor || raw.nome || '').trim();
  if (!nome) throw new Error('Nome do fornecedor ausente.');
  return { tipo: 'fornecedores', origem, id_antigo: antigo, documento: {
    id: crypto.randomUUID(), unidade, nome, contato: String(raw.contato || ''),
    telefone: String(raw.telefone || ''), materiais: [], ativo: true, auditoria: auditoria(), dadosOriginais: raw
  } };
}

function adicionar(preview: PreviaLegado, rotulo: string, criar: () => RegistroLegado) {
  preview.lidos++;
  try { preview.convertidos.push(criar()); }
  catch (e) { preview.avisos.push(`${rotulo}: ${(e as Error).message}`); }
}

export function converterObjetosLegados(valores: unknown[], origem: string, unidade: string): PreviaLegado {
  const preview: PreviaLegado = { lidos: 0, convertidos: [], avisos: [] };
  valores.forEach((raw, index) => {
    const c = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
    const antigo = String(c.id || c.codigo || `${origem}:${index + 1}`);
    adicionar(preview, `${origem}/${antigo}`, () => cartaLocal(c, origem, antigo, unidade));
  });
  return preview;
}

export function converterLocalStorage(unidade: string): PreviaLegado {
  const chaves = ['ct_cartas_traco','ct_carta_traco_atual','concretrack_premium_bank_v4','ctDosagemCompare_A','ctDosagemCompare_B','ctDosagemCompare_C'];
  const tudo: PreviaLegado = { lidos: 0, convertidos: [], avisos: [] };
  for (const chave of chaves) {
    const raw = localStorage.getItem(chave);
    if (!raw) continue;
    try {
      const valor: unknown = JSON.parse(raw);
      const parte = converterObjetosLegados(Array.isArray(valor) ? valor : [valor], `localStorage:${chave}`, unidade);
      tudo.lidos += parte.lidos; tudo.convertidos.push(...parte.convertidos); tudo.avisos.push(...parte.avisos);
    } catch { tudo.avisos.push(`${chave}: JSON inválido.`); }
  }
  for (const chave of ['cadastroFornecedoresV1', 'ensaiosME', 'ensaiosGranMiudo', 'ensaiosGranGraudo']) {
    const raw = localStorage.getItem(chave);
    if (!raw) continue;
    try {
      const valores: unknown = JSON.parse(raw);
      if (!Array.isArray(valores)) throw new Error('array esperado');
      valores.forEach((valor, index) => {
        const d = valor && typeof valor === 'object' ? valor as Record<string, unknown> : {};
        const antigo = String(d.id || d.timestamp || `${chave}:${index + 1}`);
        adicionar(tudo, `${chave}/${antigo}`, () => chave === 'cadastroFornecedoresV1' ?
          fornecedorLocal(d, `localStorage:${chave}`, antigo, unidade) :
          ensaioLegado({ ...d, tipo: d.tipo || (chave === 'ensaiosGranMiudo' ? 'gran_miudo' : chave === 'ensaiosGranGraudo' ? 'gran_graudo' : 'massa_especifica') }, `localStorage:${chave}`, antigo, unidade));
      });
    } catch { tudo.avisos.push(`${chave}: formato inválido.`); }
  }
  return tudo;
}

export async function converterArquivoLegado(file: File, unidade: string): Promise<PreviaLegado> {
  const nome = file.name.toLowerCase();
  if (nome.endsWith('.json')) {
    const valor: unknown = JSON.parse(await file.text());
    return converterObjetosLegados(Array.isArray(valor) ? valor : [valor], `json:${file.name}`, unidade);
  }
  if (!nome.endsWith('.xlsx') && !nome.endsWith('.csv')) throw new Error('Escolha .xlsx, .csv ou .json.');
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
  const preview: PreviaLegado = { lidos: 0, convertidos: [], avisos: [] };
  for (const nomeAba of workbook.SheetNames) {
    const aba = nomeAba.toLowerCase();
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[nomeAba], { header: 1, defval: '', raw: true });
    rows.slice(1).forEach((row, index) => {
      if (!row.some(presente)) return;
      const antigo = String(row[0] || `${file.name}:${nomeAba}:${index + 2}`);
      const rotulo = `${file.name}/${nomeAba}/${antigo}`;
      if (aba === 'cartastraco' || (nome.endsWith('.csv') && nome.includes('cartas'))) adicionar(preview, rotulo, () => cartaPlanilha(row, antigo, unidade));
      else if (aba === 'custo' || (nome.endsWith('.csv') && nome.includes('custo'))) adicionar(preview, rotulo, () => custoPlanilha(row, antigo, unidade));
      else if (aba === 'fornecedor' || (nome.endsWith('.csv') && nome.includes('fornecedor'))) adicionar(preview, rotulo, () => fornecedorPlanilha(row, antigo, unidade));
      else if (aba === 'ensaios_granulometria' || (nome.endsWith('.csv') && nome.includes('ensaios_granulometria'))) adicionar(preview, rotulo, () => ensaioPlanilha(row, antigo, unidade));
      else { preview.lidos++; preview.avisos.push(`${rotulo}: aba sem conversor validado; não será importada.`); }
    });
  }
  return preview;
}
