import { describe, expect, it } from 'vitest';
import { syntheticEmbedding } from './faceAuth';

describe('faceAuth synthetic fixtures', () => {
  it('gera embedding sintetico deterministico sem dados reais de rosto', () => {
    const first = syntheticEmbedding('device-a', 'challenge-a');
    const second = syntheticEmbedding('device-a', 'challenge-a');

    expect(first).toHaveLength(32);
    expect(first).toEqual(second);
    expect(first.every((value) => value >= 0 && value <= 1)).toBe(true);
  });
});
