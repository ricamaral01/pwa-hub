import type { LoteResina, Molde, OrdemProducao } from '../domain/types';

export interface ProductionDataRepository {
  getOrdensByMaquina(maquinaId: string): Promise<OrdemProducao[]>;
  getLotesDisponiveis(): Promise<LoteResina[]>;
  getMoldesByItem(itemId: string): Promise<Molde[]>;
}
