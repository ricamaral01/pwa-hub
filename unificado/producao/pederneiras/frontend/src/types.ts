export type Tab = 'apontamento' | 'mao-de-obra' | 'mensal' | 'indicadores' | 'produtos';
export type Product = {
  id:number; familia:string; letra:string|null; descricao:string; cod_pro:string|null;
  cod_sma:string|null; volume_m3:number|null; ativo:boolean; pendencia:string|null;
};
export type Item = {id:number; produto_id:number; quantidade:number; descricao:string; familia:string; volume_m3:number|null};
export type Day = {
  data:string; status:'rascunho'|'enviado'|'confirmado'; enviado_em:string|null;
  confirmado_em:string|null; liberacao_prevista:string; itens:Item[];
  postes:number; volume_m3:number|null; produtos_sem_volume:number;
};
export type Area = {
  id?:number; atividade_id:number; descricao:string; tipo:'MOD'|'MOI'; ordem:number;
  ativo:boolean; homens:number; observacao:string|null; registro_id:number|null;
};
export type Labor = {
  data:string; areas:Area[]; homens:number; mod:number; moi:number;
  salvo_em:string|null; confirmado_em:string|null;
};
export type MonthDay = {
  data:string; status:Day['status']; postes:number; homens:number; mod:number; moi:number;
  postes_homem:number|null; volume_m3:number|null; produtos_sem_volume:number;
  areas:Area[]; itens:Item[];
};
export type Month = {
  mes:string; meta:{dias_uteis:number;pcs_dia:number;meta_postes_homem:number}|null;
  meta_total:number|null; dias:MonthDay[]; dias_producao:number; postes:number;
  media_postes_dia:number|null; homens:number; postes_homem:number|null;
  volume_m3:number|null; produtos_sem_volume:number; pendencias:string[];
};
export type Preview = {
  aplicado:boolean; resumo:Record<string,number>; diferencas:Array<{
    linha:number; acao:'criar'|'atualizar'|'igual'|'conflito'; motivo?:string;
    produto_id?:number|null; produto:Partial<Product>; alteracoes?:Record<string,{de:unknown;para:unknown}>;
  }>;
};
export const number = (value:unknown) => Number(value || 0);
export const fmt = (value:unknown, digits=0) =>
  value === null || value === undefined ? '—' : new Intl.NumberFormat('pt-BR', {maximumFractionDigits:digits, minimumFractionDigits:digits}).format(Number(value));
export const todayISO = () => new Intl.DateTimeFormat('en-CA', {timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const monthISO = () => todayISO().slice(0,7);
export const minusDay = (iso:string) => { const d=new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate()-1); return d.toISOString().slice(0,10); };
