import {
  BALL_R,
  BALL_SPEED,
  BRICK_H,
  BRICK_W,
  PADDLE_H,
  PADDLE_W,
  PADDLE_Y,
  WORLD_W,
} from '../constants';
import { bounceWalls, bouncePaddle, collideBricks } from '../physics';
import type { Ball, Brick, Paddle } from '../types';

const ball = (over: Partial<Ball>): Ball => ({
  x: 200,
  y: 300,
  r: BALL_R,
  vx: 0,
  vy: 0,
  ...over,
});

const brick = (over: Partial<Brick> = {}): Brick => ({
  x: 100,
  y: 100,
  w: BRICK_W,
  h: BRICK_H,
  color: 'red',
  alive: true,
  ...over,
});

const paddle: Paddle = { x: 176, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H };
const deg = (vx: number, vy: number) => (Math.atan2(vx, -vy) * 180) / Math.PI;

describe('bounceWalls', () => {
  it('rebota en la pared izquierda', () => {
    const b = bounceWalls(ball({ x: 3, vx: -100, vy: -50 }));
    expect(b.x).toBe(BALL_R);
    expect(b.vx).toBe(100);
    expect(b.vy).toBe(-50);
  });

  it('rebota en la pared derecha', () => {
    const b = bounceWalls(ball({ x: WORLD_W - 2, vx: 100 }));
    expect(b.x).toBe(WORLD_W - BALL_R);
    expect(b.vx).toBe(-100);
  });

  it('rebota en el techo', () => {
    const b = bounceWalls(ball({ y: 2, vy: -100 }));
    expect(b.y).toBe(BALL_R);
    expect(b.vy).toBe(100);
  });

  it('no rebota en el suelo', () => {
    const b = bounceWalls(ball({ y: 700, vy: 100 }));
    expect(b.vy).toBe(100);
  });
});

describe('bouncePaddle', () => {
  const hitting = (x: number) =>
    bouncePaddle(ball({ x, y: PADDLE_Y, vx: 50, vy: 300 }), paddle);

  it('golpe en el centro sale vertical (0°)', () => {
    const b = hitting(paddle.x + PADDLE_W / 2);
    expect(deg(b.vx, b.vy)).toBeCloseTo(0);
    expect(b.vy).toBeCloseTo(-BALL_SPEED);
    expect(b.y).toBe(PADDLE_Y - BALL_R);
  });

  it('golpe en el borde derecho sale a +60°', () => {
    const b = hitting(paddle.x + PADDLE_W);
    expect(deg(b.vx, b.vy)).toBeCloseTo(60);
  });

  it('golpe en el borde izquierdo sale a -60°', () => {
    const b = hitting(paddle.x);
    expect(deg(b.vx, b.vy)).toBeCloseTo(-60);
  });

  it('mantiene la velocidad constante', () => {
    const b = hitting(paddle.x + 20);
    expect(Math.hypot(b.vx, b.vy)).toBeCloseTo(BALL_SPEED);
  });

  it('ignora la bola si sube', () => {
    const b = ball({ x: 220, y: PADDLE_Y, vy: -300 });
    expect(bouncePaddle(b, paddle)).toBe(b);
  });

  it('ignora la bola si no toca el paddle', () => {
    const b = ball({ x: 20, y: PADDLE_Y, vy: 300 });
    expect(bouncePaddle(b, paddle)).toBe(b);
  });
});

describe('collideBricks', () => {
  it('golpe por abajo invierte vy y saca la bola', () => {
    const { ball: b, hitIndex } = collideBricks(
      ball({ x: 116, y: 122, vx: 30, vy: -200 }),
      [brick()],
    );
    expect(hitIndex).toBe(0);
    expect(b.vy).toBe(200);
    expect(b.vx).toBe(30);
    expect(b.y - BALL_R).toBeGreaterThanOrEqual(100 + BRICK_H);
  });

  it('golpe lateral invierte vx y saca la bola', () => {
    const { ball: b, hitIndex } = collideBricks(
      ball({ x: 94, y: 108, vx: 200, vy: -30 }),
      [brick()],
    );
    expect(hitIndex).toBe(0);
    expect(b.vx).toBe(-200);
    expect(b.vy).toBe(-30);
    expect(b.x + BALL_R).toBeLessThanOrEqual(100);
  });

  it('rompe como máximo un bloque por paso', () => {
    const bricks = [brick(), brick({ x: 100 + BRICK_W })];
    const { hitIndex } = collideBricks(
      ball({ x: 100 + BRICK_W, y: 122, vy: -200 }),
      bricks,
    );
    expect(hitIndex).toBe(0);
  });

  it('ignora bloques rotos', () => {
    const b = ball({ x: 116, y: 122, vy: -200 });
    const res = collideBricks(b, [brick({ alive: false })]);
    expect(res.hitIndex).toBeNull();
    expect(res.ball).toBe(b);
  });
});
