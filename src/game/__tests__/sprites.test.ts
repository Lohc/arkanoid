import { BRICK_H, BRICK_W } from '../constants';
import { EXPLOSION_FRAMES, SPRITES } from '../sprites';
import type { BrickColor } from '../types';

describe('EXPLOSION_FRAMES', () => {
  it('tiene 4 frames de 32×16 por cada color de bloque', () => {
    for (const color of Object.keys(SPRITES.blocks) as BrickColor[]) {
      const frames = EXPLOSION_FRAMES[color];
      expect(frames).toHaveLength(4);
      for (const f of frames) {
        expect(f.sw).toBe(BRICK_W);
        expect(f.sh).toBe(BRICK_H);
      }
    }
  });
});
