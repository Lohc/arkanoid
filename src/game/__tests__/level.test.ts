import { BRICK_COLS, BRICKS_OFFSET_Y, BRICK_H, WORLD_W } from '../constants';
import { createBricks } from '../level';

describe('createBricks', () => {
  const bricks = createBricks();

  it('crea 78 bloques vivos', () => {
    expect(bricks).toHaveLength(78);
    expect(bricks.every((b) => b.alive)).toBe(true);
  });

  it('asigna el color correcto a cada fila, de arriba a abajo', () => {
    const expected = ['red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green'];
    expected.forEach((color, row) => {
      const rowBricks = bricks.filter(
        (b) => b.y === BRICKS_OFFSET_Y + row * BRICK_H,
      );
      expect(rowBricks).toHaveLength(BRICK_COLS);
      expect(rowBricks.every((b) => b.color === color)).toBe(true);
    });
  });

  it('no deja ningún bloque fuera de WORLD_W', () => {
    for (const b of bricks) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w).toBeLessThanOrEqual(WORLD_W);
    }
  });
});
