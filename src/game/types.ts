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

export interface GameState {
  phase: Phase;
  pausedFrom: Phase | null; // fase a la que vuelve al reanudar
  paddle: Paddle;
  ball: Ball;
  bricks: Brick[];
  lives: number;
  score: number;
}

export interface Input {
  paddleTargetX: number | null; // centro deseado del paddle (dedo/ratón), coords de mundo
  keyDir: -1 | 0 | 1; // flechas en web
  tap: boolean; // tap/clic/Espacio en este frame
}
