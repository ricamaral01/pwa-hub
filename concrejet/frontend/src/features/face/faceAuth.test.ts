import { describe, expect, it } from 'vitest';
import { FACE_MODEL, syntheticEmbedding } from './faceAuth';

describe('faceAuth synthetic fixtures', () => {
  it('gera embedding sintetico deterministico sem dados reais de rosto', () => {
    const first = syntheticEmbedding('device-a', 'challenge-a');
    const second = syntheticEmbedding('device-a', 'challenge-a');

    expect(first).toHaveLength(FACE_MODEL.dimensao);
    expect(first).toEqual(second);
    expect(first.every((value) => value >= -1 && value <= 1)).toBe(true);
  });
});
