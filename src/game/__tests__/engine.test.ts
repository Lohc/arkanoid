import {
  BALL_R,
  BALL_SPEED,
  BRICK_POINTS,
  EXPLOSION_FRAME_TIME,
  INITIAL_LIVES,
  MAX_DT,
  PADDLE_KEY_SPEED,
  PADDLE_W,
  PADDLE_Y,
  WORLD_H,
  WORLD_W,
} from '../constants';
import { createInitialState, explosionFrame, pause, step } from '../engine';
import type { GameState, Input } from '../types';

const idle: Input = { paddleTargetX: null, keyDir: 0, tap: false };
const tap: Input = { ...idle, tap: true };
const DT = 1 / 60;

// Partida en juego con la bola en una posición y velocidad dadas.
function playing(
  ball: Partial<GameState['ball']>,
  over: Partial<GameState> = {},
): GameState {
  const s = createInitialState();
  return { ...s, phase: 'playing', ball: { ...s.ball, ...ball }, ...over };
}

// Bola cayendo por debajo del mundo, lejos de los bloques.
const falling = { x: 20, y: WORLD_H + BALL_R + 1, vx: 0, vy: BALL_SPEED };

describe('createInitialState', () => {
  it('empieza en start con 3 vidas, 0 puntos, 78 bloques y la bola sobre el paddle', () => {
    const s = createInitialState();
    expect(s.phase).toBe('start');
    expect(s.lives).toBe(INITIAL_LIVES);
    expect(s.score).toBe(0);
    expect(s.bricks).toHaveLength(78);
    expect(s.ball.x).toBe(s.paddle.x + PADDLE_W / 2);
    expect(s.ball.y).toBe(PADDLE_Y - BALL_R);
  });
});

describe('paddle', () => {
  it('sigue al objetivo del dedo/ratón', () => {
    const s = step(createInitialState(), { ...idle, paddleTargetX: 100 }, DT);
    expect(s.paddle.x).toBe(100 - PADDLE_W / 2);
  });

  it('se mueve con el teclado a PADDLE_KEY_SPEED', () => {
    const s0 = createInitialState();
    const s = step(s0, { ...idle, keyDir: 1 }, DT);
    expect(s.paddle.x).toBeCloseTo(s0.paddle.x + PADDLE_KEY_SPEED * DT);
  });

  it('nunca sale del mundo', () => {
    const left = step(createInitialState(), { ...idle, paddleTargetX: -500 }, DT);
    expect(left.paddle.x).toBe(0);
    const right = step(createInitialState(), { ...idle, paddleTargetX: 5000 }, DT);
    expect(right.paddle.x).toBe(WORLD_W - PADDLE_W);
  });

  it('lleva la bola pegada antes del saque', () => {
    const s = step(createInitialState(), { ...idle, paddleTargetX: 100 }, DT);
    expect(s.phase).toBe('start');
    expect(s.ball.x).toBe(100);
  });
});

describe('fases', () => {
  it('tap en start saca la bola hacia arriba', () => {
    const s = step(createInitialState(), tap, DT);
    expect(s.phase).toBe('playing');
    expect(s.ball.vx).toBe(0);
    expect(s.ball.vy).toBe(-BALL_SPEED);
  });

  it('aplica el tope MAX_DT', () => {
    const s = step(playing({ x: 200, y: 400, vx: 0, vy: -BALL_SPEED }), idle, 1);
    expect(s.ball.y).toBeCloseTo(400 - BALL_SPEED * MAX_DT);
  });

  it('perder la bola resta una vida y espera saque con la bola en el paddle', () => {
    const s = step(playing(falling), idle, DT);
    expect(s.lives).toBe(INITIAL_LIVES - 1);
    expect(s.phase).toBe('serve');
    expect(s.ball.y).toBe(PADDLE_Y - BALL_R);
    expect(s.ball.vy).toBe(0);
  });

  it('tap en serve vuelve a sacar', () => {
    const s = step(playing(falling), idle, DT);
    expect(step(s, tap, DT).phase).toBe('playing');
  });

  it('la tercera pérdida da gameover', () => {
    let s = createInitialState();
    for (let i = 0; i < INITIAL_LIVES; i++) {
      s = step({ ...s, phase: 'playing', ball: { ...s.ball, ...falling } }, idle, DT);
    }
    expect(s.lives).toBe(0);
    expect(s.phase).toBe('gameover');
  });

  it('tap en gameover reinicia', () => {
    const s = step(playing(falling, { lives: 1 }), idle, DT);
    expect(s.phase).toBe('gameover');
    expect(step(s, idle, DT)).toBe(s);
    const r = step({ ...s, score: 120 }, tap, DT);
    expect(r).toEqual(createInitialState());
  });
});

describe('bloques', () => {
  // Bola subiendo justo debajo del primer bloque (x 16..48, y 64..80).
  const underFirst = { x: 32, y: 80 + BALL_R + 1, vx: 0, vy: -BALL_SPEED };

  it('romper un bloque lo elimina y suma 10 puntos', () => {
    const s = step(playing(underFirst), idle, DT);
    expect(s.bricks[0].alive).toBe(false);
    expect(s.bricks.filter((b) => b.alive)).toHaveLength(77);
    expect(s.score).toBe(BRICK_POINTS);
    expect(s.ball.vy).toBeGreaterThan(0);
  });

  it('romper el último bloque da won, y tap reinicia', () => {
    const s0 = createInitialState();
    const bricks = s0.bricks.map((b, i) => ({ ...b, alive: i === 0 }));
    const s = step(playing(underFirst, { bricks }), idle, DT);
    expect(s.phase).toBe('won');
    expect(step(s, tap, DT)).toEqual(createInitialState());
  });
});

describe('pausa', () => {
  it('congela la bola y tap vuelve a la fase anterior', () => {
    const s = pause(playing({ x: 200, y: 400, vx: 100, vy: -100 }));
    expect(s.phase).toBe('paused');
    expect(s.pausedFrom).toBe('playing');
    const still = step(s, { ...idle, keyDir: 1 }, DT);
    expect(still).toBe(s);
    const resumed = step(s, tap, DT);
    expect(resumed.phase).toBe('playing');
    expect(resumed.pausedFrom).toBeNull();
    expect(resumed.ball).toEqual(s.ball);
  });

  it('no pausa en gameover', () => {
    const s = { ...createInitialState(), phase: 'gameover' as const };
    expect(pause(s)).toBe(s);
  });
});

it('step no muta el estado recibido', () => {
  const s = createInitialState();
  const copy = JSON.parse(JSON.stringify(s));
  step({ ...s, phase: 'playing', ball: { ...s.ball, vy: -BALL_SPEED } }, idle, DT);
  expect(s).toEqual(copy);
});

describe('explosiones', () => {
  // Bola subiendo justo debajo del primer bloque (x 16..48, y 64..80).
  const underFirst = { x: 32, y: 80 + BALL_R + 1, vx: 0, vy: -BALL_SPEED };
  const DURATION = EXPLOSION_FRAME_TIME * 4;

  // Avanza `seconds` en pasos de DT con la entrada dada.
  function run(s: GameState, seconds: number, input: Input = idle): GameState {
    for (let t = 0; t < seconds; t += DT) s = step(s, input, DT);
    return s;
  }

  it('romper un bloque crea una explosión con su posición y color', () => {
    const s0 = playing(underFirst);
    const { x, y, w, h, color } = s0.bricks[0];
    const s = step(s0, idle, DT);
    expect(s.explosions).toEqual([{ x, y, w, h, color, elapsed: 0 }]);
    expect(explosionFrame(s.explosions[0])).toBe(0);
  });

  it('cambia de frame cada EXPLOSION_FRAME_TIME y desaparece tras 4 frames', () => {
    const s = step(playing(underFirst), idle, DT);
    const ball = { x: 200, y: 400, vx: 0, vy: 0 }; // quieta, lejos de todo
    const quiet = { ...s, ball: { ...s.ball, ...ball } };
    expect(explosionFrame(run(quiet, EXPLOSION_FRAME_TIME + DT).explosions[0])).toBe(1);
    expect(run(quiet, DURATION - 2 * DT).explosions).toHaveLength(1);
    expect(run(quiet, DURATION + DT).explosions).toHaveLength(0);
  });

  it('no avanza en pausa', () => {
    const s = pause(step(playing(underFirst), idle, DT));
    expect(step(s, idle, DT)).toBe(s);
    expect(run(s, DURATION + DT).explosions).toEqual(s.explosions);
  });

  it('sigue avanzando en serve tras perder la bola', () => {
    const s = step(playing(underFirst), idle, DT);
    const lost = step({ ...s, ball: { ...s.ball, ...falling } }, idle, DT);
    expect(lost.phase).toBe('serve');
    expect(lost.explosions[0].elapsed).toBeCloseTo(DT);
    expect(run(lost, DURATION + DT).explosions).toHaveLength(0);
  });

  it('tap en gameover deja las explosiones vacías', () => {
    const s = step(playing(underFirst), idle, DT);
    const over = step({ ...s, lives: 1, ball: { ...s.ball, ...falling } }, idle, DT);
    expect(over.phase).toBe('gameover');
    expect(over.explosions).toHaveLength(1);
    expect(step(over, tap, DT).explosions).toEqual([]);
  });
});
