import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('OperationPage dependencies', () => {
  it('nao importa mocks diretamente', () => {
    const source = readFileSync(resolve(__dirname, 'OperationPage.tsx'), 'utf8');

    expect(source).not.toContain('@/mocks/production');
    expect(source).not.toContain('MOCK_ORDENS');
    expect(source).not.toContain('MOCK_LOTES');
    expect(source).toContain('/production-catalog');
  });
});
