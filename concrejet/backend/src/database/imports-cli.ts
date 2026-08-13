import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';
import { buildTypeOrmOptions } from './typeorm.config';
import { HistoricalImportService } from '../modules/importacao/historical-import.service';

config({ path: resolve(process.cwd(), '..', '.env') });
config();

const command = process.argv[2];
const arg = process.argv[3];

const configService = {
  get: (key: string) => {
    const value = process.env[key];
    if (key === 'DATABASE_PORT') return Number(value ?? 5432);
    if (key === 'DATABASE_SSL') return value === 'true';
    return value;
  },
} as never;

async function main() {
  const dataSource = new DataSource(buildTypeOrmOptions(configService) as never);
  await dataSource.initialize();
  const service = new HistoricalImportService(dataSource);
  let result: unknown;
  if (command === 'analyze') result = await service.analyzePath(arg);
  else if (command === 'dry-run') result = await service.dryRun(required(arg));
  else if (command === 'execute') result = await service.execute(required(arg));
  else if (command === 'reconcile') result = await service.reconcile(required(arg));
  else if (command === 'rollback') result = await service.rollback(required(arg));
  else throw new Error('Comando invalido. Use analyze|dry-run|execute|reconcile|rollback.');
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
  await dataSource.destroy();
}

function required(value?: string): string {
  if (!value) throw new Error('Informe o id do lote.');
  return value;
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
