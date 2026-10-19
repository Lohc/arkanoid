export type BrickColor =
  | 'red'
  | 'yellow'
  | 'cyan'
  | 'magenta'
  | 'hotpink'
  | 'green';

export type Phase =
  | 'start'
  | 'serve'
  | 'playing'
  | 'clearing' // último bloque roto, esperando a que terminen las explosiones
  | 'levelClear' // nivel limpiado (no el último), esperando tap
  | 'paused'
  | 'gameover'
  | 'won';

export interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  color: BrickColor;
  alive: boolean;
}
export interface Paddle {
  x: number;
  y: number;
  w: number;
  h: number;
} // x = borde izquierdo
export interface Ball {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
} // x,y = centro

// Animación en el lugar de un bloque roto. x,y = esquina superior izquierda.
export interface Explosion {
  x: number;
  y: number;
  w: number;
  h: number;
  color: BrickColor;
  elapsed: number; // s desde que se rompió
}

export type SoundEvent = 'bounce' | 'break';

export interface GameState {
  phase: Phase;
  pausedFrom: Phase | null; // fase a la que vuelve al reanudar
  paddle: Paddle;
  ball: Ball;
  bricks: Brick[];
  explosions: Explosion[];
  sounds: SoundEvent[]; // sonidos a reproducir producidos en este paso
  lives: number;
  score: number;
  level: number; // 1-based, índice en LEVELS + 1
}

export interface Input {
  paddleTargetX: number | null; // centro deseado del paddle (dedo/ratón), coords de mundo
  keyDir: -1 | 0 | 1; // flechas en web
  tap: boolean; // tap/clic/Espacio en este frame
}
