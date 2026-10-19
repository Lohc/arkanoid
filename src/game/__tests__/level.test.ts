import {
  BRICK_COLS,
  BRICK_H,
  BRICK_W,
  BRICKS_OFFSET_X,
  BRICKS_OFFSET_Y,
  MAX_BRICK_ROWS,
  WORLD_W,
} from '../constants';
import { createBricks, LEVELS } from '../level';

describe('LEVELS', () => {
  it('tiene 3 niveles', () => {
    expect(LEVELS).toHaveLength(3);
  });

  it.each(LEVELS.map((layout, i) => [i + 1, layout] as const))(
    'nivel %i: 1–8 filas de 13 caracteres válidos y al menos un bloque',
    (_level, layout) => {
      expect(layout.length).toBeGreaterThanOrEqual(1);
      expect(layout.length).toBeLessThanOrEqual(MAX_BRICK_ROWS);
      for (const line of layout) {
        expect(line).toHaveLength(BRICK_COLS);
        expect(line).toMatch(/^[rycmpg.]+$/);
      }
      expect(layout.join('')).toMatch(/[rycmpg]/);
    },
  );
});

describe('createBricks', () => {
  it('nivel 1: 78 bloques vivos con el color de cada fila, de arriba a abajo', () => {
    const bricks = createBricks(1);
    expect(bricks).toHaveLength(78);
    expect(bricks.every((b) => b.alive)).toBe(true);
    const expected = ['red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green'];
    expected.forEach((color, row) => {
      const rowBricks = bricks.filter(
        (b) => b.y === BRICKS_OFFSET_Y + row * BRICK_H,
      );
      expect(rowBricks).toHaveLength(BRICK_COLS);
      expect(rowBricks.every((b) => b.color === color)).toBe(true);
      rowBricks.forEach((b, col) => {
        expect(b.x).toBe(BRICKS_OFFSET_X + col * BRICK_W);
      });
    });
  });

  it('nivel 2 tiene 48 bloques y nivel 3 tiene 52', () => {
    expect(createBricks(2)).toHaveLength(48);
    expect(createBricks(3)).toHaveLength(52);
  });

  it.each([1, 2, 3])(
    'nivel %i: un bloque por cada letra y ninguno en un "."',
    (level) => {
      const bricks = createBricks(level);
      LEVELS[level - 1].forEach((line, row) => {
        [...line].forEach((code, col) => {
          const at = bricks.filter(
            (b) =>
              b.x === BRICKS_OFFSET_X + col * BRICK_W &&
              b.y === BRICKS_OFFSET_Y + row * BRICK_H,
          );
          expect(at).toHaveLength(code === '.' ? 0 : 1);
        });
      });
    },
  );

  it.each([1, 2, 3])('nivel %i: ningún bloque fuera de WORLD_W', (level) => {
    for (const b of createBricks(level)) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w).toBeLessThanOrEqual(WORLD_W);
    }
  });
});
