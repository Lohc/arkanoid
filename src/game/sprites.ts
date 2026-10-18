import type { BrickColor } from './types';

// Recortes de assets/spritesheet-breakout.png, copiados de SPRITES en assets/spritesheet.js.
export interface SpriteFrame {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export const SPRITES: {
  paddle: SpriteFrame;
  ball: SpriteFrame;
  blocks: Record<BrickColor, SpriteFrame>;
} = {
  paddle: { sx: 32, sy: 112, sw: 162, sh: 14 },
  ball: { sx: 32, sy: 32, sw: 16, sh: 16 },
  blocks: {
    red: { sx: 32, sy: 176, sw: 32, sh: 16 },
    yellow: { sx: 32, sy: 240, sw: 32, sh: 16 },
    cyan: { sx: 32, sy: 192, sw: 32, sh: 16 },
    magenta: { sx: 32, sy: 224, sw: 32, sh: 16 },
    hotpink: { sx: 32, sy: 256, sw: 32, sh: 16 },
    green: { sx: 32, sy: 208, sw: 32, sh: 16 },
  },
};
