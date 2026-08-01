import type { LoteResina, Molde, OrdemProducao } from '../domain/types';
import type { ProductionDataRepository } from '../repositories/ProductionDataRepository';

const unavailableMessage = 'Dados de producao ainda nao possuem endpoints no backend da Fase 0.';

export class ApiProductionDataRepository implements ProductionDataRepository {
  getOrdensByMaquina(_maquinaId: string): Promise<OrdemProducao[]> {
    return Promise.reject(new Error(unavailableMessage));
  }

  getLotesDisponiveis(): Promise<LoteResina[]> {
    return Promise.reject(new Error(unavailableMessage));
  }

  getMoldesByItem(_itemId: string): Promise<Molde[]> {
    return Promise.reject(new Error(unavailableMessage));
  }
}
