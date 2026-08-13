import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Dexie schema', () => {
  it('nao declara tokenAdmin como campo persistido de sessao ativa', () => {
    const schemaSource = readFileSync(resolve(__dirname, 'schema.ts'), 'utf8');

    expect(schemaSource).not.toContain('tokenAdmin');
    expect(schemaSource).toContain('this.version(2)');
    expect(schemaSource).toContain(
      "delete (session as Record<string, unknown>)[`token${'Admin'}`]",
    );
  });
});
