import {
  BRICK_H,
  BRICK_W,
  BRICKS_OFFSET_X,
  BRICKS_OFFSET_Y,
} from './constants';
import type { Brick, BrickColor } from './types';

// Letra → color. '.' = sin bloque.
const COLOR_CODES: Record<string, BrickColor> = {
  r: 'red',
  y: 'yellow',
  c: 'cyan',
  m: 'magenta',
  p: 'hotpink',
  g: 'green',
};

// Una grilla por nivel: filas de BRICK_COLS caracteres, hasta MAX_BRICK_ROWS filas.
export const LEVELS: string[][] = [
  [
    // Nivel 1 — actual (78 bloques)
    'rrrrrrrrrrrrr',
    'yyyyyyyyyyyyy',
    'ccccccccccccc',
    'mmmmmmmmmmmmm',
    'ppppppppppppp',
    'ggggggggggggg',
  ],
  [
    // Nivel 2 — pirámide invertida (48 bloques)
    'rrrrrrrrrrrrr',
    '.yyyyyyyyyyy.',
    '..ccccccccc..',
    '...mmmmmmm...',
    '....ppppp....',
    '.....ggg.....',
  ],
  [
    // Nivel 3 — tablero (52 bloques)
    'r.r.r.r.r.r.r',
    '.y.y.y.y.y.y.',
    'c.c.c.c.c.c.c',
    '.m.m.m.m.m.m.',
    'p.p.p.p.p.p.p',
    '.g.g.g.g.g.g.',
    'r.r.r.r.r.r.r',
    '.y.y.y.y.y.y.',
  ],
];

// Bloques del nivel (1-based). Los '.' no generan bloque.
export function createBricks(level: number): Brick[] {
  const bricks: Brick[] = [];
  LEVELS[level - 1].forEach((line, row) => {
    [...line].forEach((code, col) => {
      const color = COLOR_CODES[code];
      if (!color) return;
      bricks.push({
        x: BRICKS_OFFSET_X + col * BRICK_W,
        y: BRICKS_OFFSET_Y + row * BRICK_H,
        w: BRICK_W,
        h: BRICK_H,
        color,
        alive: true,
      });
    });
  });
  return bricks;
}
