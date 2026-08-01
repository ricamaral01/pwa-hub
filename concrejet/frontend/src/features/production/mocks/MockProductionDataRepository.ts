import type { LoteResina, Molde, OrdemProducao } from '../domain/types';
import type { ProductionDataRepository } from '../repositories/ProductionDataRepository';
import { MOCK_LOTES, MOCK_MOLDES, MOCK_ORDENS } from './production';

export class MockProductionDataRepository implements ProductionDataRepository {
  getOrdensByMaquina(_maquinaId: string): Promise<OrdemProducao[]> {
    return Promise.resolve(MOCK_ORDENS.filter((ordem) => ordem.estado === 'aberta'));
  }

  getLotesDisponiveis(): Promise<LoteResina[]> {
    return Promise.resolve(MOCK_LOTES.filter((lote) => lote.estado === 'disponivel'));
  }

  getMoldesByItem(itemId: string): Promise<Molde[]> {
    return Promise.resolve(MOCK_MOLDES.filter((molde) => molde.itemId === itemId && molde.ativo));
  }
}
