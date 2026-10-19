import {
  BALL_R,
  BALL_SPEED,
  BRICK_POINTS,
  EXPLOSION_FRAME_TIME,
  INITIAL_LIVES,
  MAX_DT,
  PADDLE_H,
  PADDLE_KEY_SPEED,
  PADDLE_W,
  PADDLE_Y,
  WORLD_H,
  WORLD_W,
} from './constants';
import { createBricks } from './level';
import { bounceWalls, bouncePaddle, collideBricks } from './physics';
import { EXPLOSION_FRAMES } from './sprites';
import type { Ball, Explosion, GameState, Input, Paddle } from './types';

// Bola parada encima del centro del paddle, esperando saque.
function ballOnPaddle(paddle: Paddle): Ball {
  return {
    x: paddle.x + paddle.w / 2,
    y: paddle.y - BALL_R,
    r: BALL_R,
    vx: 0,
    vy: 0,
  };
}

export function createInitialState(): GameState {
  const paddle: Paddle = {
    x: (WORLD_W - PADDLE_W) / 2,
    y: PADDLE_Y,
    w: PADDLE_W,
    h: PADDLE_H,
  };
  return {
    phase: 'start',
    pausedFrom: null,
    paddle,
    ball: ballOnPaddle(paddle),
    bricks: createBricks(),
    explosions: [],
    lives: INITIAL_LIVES,
    score: 0,
  };
}

// Congela la partida (app a background); solo desde fases con juego activo.
export function pause(state: GameState): GameState {
  if (
    state.phase !== 'start' &&
    state.phase !== 'serve' &&
    state.phase !== 'playing' &&
    state.phase !== 'clearing'
  ) {
    return state;
  }
  return { ...state, phase: 'paused', pausedFrom: state.phase };
}

// Dedo/ratón tiene prioridad sobre el teclado; siempre dentro del mundo.
function movePaddle(paddle: Paddle, input: Input, dt: number): Paddle {
  const x =
    input.paddleTargetX !== null
      ? input.paddleTargetX - paddle.w / 2
      : paddle.x + input.keyDir * PADDLE_KEY_SPEED * dt;
  return { ...paddle, x: Math.max(0, Math.min(WORLD_W - paddle.w, x)) };
}

// Índice del frame de EXPLOSION_FRAMES que toca dibujar.
export function explosionFrame(explosion: Explosion): number {
  return Math.floor(explosion.elapsed / EXPLOSION_FRAME_TIME);
}

// Avanza las animaciones y descarta las terminadas. Sin explosiones devuelve el mismo array.
function advanceExplosions(explosions: Explosion[], dt: number): Explosion[] {
  if (explosions.length === 0) return explosions;
  return explosions
    .map((e) => ({ ...e, elapsed: e.elapsed + dt }))
    .filter((e) => explosionFrame(e) < EXPLOSION_FRAMES[e.color].length);
}

export function step(state: GameState, input: Input, rawDt: number): GameState {
  const dt = Math.min(Math.max(rawDt, 0), MAX_DT);
  if (state.phase === 'paused') return stepPhase(state, input, dt);

  // Las explosiones avanzan en todas las fases salvo en pausa.
  const explosions = advanceExplosions(state.explosions, dt);
  return stepPhase(
    explosions === state.explosions ? state : { ...state, explosions },
    input,
    dt,
  );
}

function stepPhase(state: GameState, input: Input, dt: number): GameState {
  switch (state.phase) {
    // Bola y paddle quietos hasta que acaba la explosión del último bloque.
    case 'clearing':
      return state.explosions.length === 0 ? { ...state, phase: 'won' } : state;

    case 'gameover':
    case 'won':
      return input.tap ? createInitialState() : state;

    case 'paused':
      return input.tap
        ? { ...state, phase: state.pausedFrom ?? 'start', pausedFrom: null }
        : state;

    case 'start':
    case 'serve': {
      const paddle = movePaddle(state.paddle, input, dt);
      const ball = ballOnPaddle(paddle);
      if (!input.tap) return { ...state, paddle, ball };
      return {
        ...state,
        phase: 'playing',
        paddle,
        ball: { ...ball, vy: -BALL_SPEED },
      };
    }

    case 'playing': {
      const paddle = movePaddle(state.paddle, input, dt);
      let ball: Ball = {
        ...state.ball,
        x: state.ball.x + state.ball.vx * dt,
        y: state.ball.y + state.ball.vy * dt,
      };
      ball = bounceWalls(ball);
      ball = bouncePaddle(ball, paddle);

      const hit = collideBricks(ball, state.bricks);
      ball = hit.ball;
      let { bricks, explosions, score } = state;
      if (hit.hitIndex !== null) {
        const index = hit.hitIndex;
        const { x, y, w, h, color } = bricks[index];
        bricks = bricks.map((b, i) => (i === index ? { ...b, alive: false } : b));
        explosions = [...explosions, { x, y, w, h, color, elapsed: 0 }];
        score += BRICK_POINTS;
        if (bricks.every((b) => !b.alive)) {
          return { ...state, phase: 'clearing', paddle, ball, bricks, explosions, score };
        }
      }

      if (ball.y - ball.r > WORLD_H) {
        const lives = state.lives - 1;
        return {
          ...state,
          phase: lives > 0 ? 'serve' : 'gameover',
          paddle,
          ball: ballOnPaddle(paddle),
          bricks,
          explosions,
          score,
          lives,
        };
      }

      return { ...state, paddle, ball, bricks, explosions, score };
    }
  }
}
