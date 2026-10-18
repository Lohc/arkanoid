import {
  BRICK_COLS,
  BRICK_H,
  BRICK_ROWS,
  BRICK_W,
  BRICKS_OFFSET_X,
  BRICKS_OFFSET_Y,
} from './constants';
import type { Brick, BrickColor } from './types';

// Color de cada fila, de arriba a abajo.
export const ROW_COLORS: BrickColor[] = [
  'red',
  'yellow',
  'cyan',
  'magenta',
  'hotpink',
  'green',
];

export function createBricks(): Brick[] {
  const bricks: Brick[] = [];
  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      bricks.push({
        x: BRICKS_OFFSET_X + col * BRICK_W,
        y: BRICKS_OFFSET_Y + row * BRICK_H,
        w: BRICK_W,
        h: BRICK_H,
        color: ROW_COLORS[row],
        alive: true,
      });
    }
  }
  return bricks;
}
