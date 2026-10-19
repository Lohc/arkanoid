import {
  BALL_R,
  BALL_SPEED,
  BRICK_POINTS,
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
import type { Ball, GameState, Input, Paddle } from './types';

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
    state.phase !== 'playing'
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

export function step(state: GameState, input: Input, rawDt: number): GameState {
  const dt = Math.min(Math.max(rawDt, 0), MAX_DT);

  switch (state.phase) {
    case 'clearing':
      return state;

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
      let { bricks, score } = state;
      if (hit.hitIndex !== null) {
        const index = hit.hitIndex;
        bricks = bricks.map((b, i) => (i === index ? { ...b, alive: false } : b));
        score += BRICK_POINTS;
        if (bricks.every((b) => !b.alive)) {
          return { ...state, phase: 'won', paddle, ball, bricks, score };
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
          score,
          lives,
        };
      }

      return { ...state, paddle, ball, bricks, score };
    }
  }
}
