import { isDemoMode } from '@/config/runtime';
import { ApiProductionDataRepository } from '../data/ApiProductionDataRepository';
import { MockProductionDataRepository } from '../mocks/MockProductionDataRepository';
import type { ProductionDataRepository } from './ProductionDataRepository';

let repository: ProductionDataRepository | null = null;

export function getProductionDataRepository(): ProductionDataRepository {
  repository ??= isDemoMode
    ? new MockProductionDataRepository()
    : new ApiProductionDataRepository();
  return repository;
}
