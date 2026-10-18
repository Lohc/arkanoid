import { BALL_SPEED, MAX_BOUNCE_ANGLE, WORLD_W } from './constants';
import type { Ball, Brick, Paddle } from './types';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Círculo vs AABB: distancia del centro al punto más cercano del rectángulo.
export function circleIntersectsRect(ball: Ball, rect: Rect): boolean {
  const nearestX = Math.max(rect.x, Math.min(ball.x, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(ball.y, rect.y + rect.h));
  const dx = ball.x - nearestX;
  const dy = ball.y - nearestY;
  return dx * dx + dy * dy < ball.r * ball.r;
}

// Rebote en paredes izquierda, derecha y techo. El suelo no rebota (pérdida de vida).
export function bounceWalls(ball: Ball): Ball {
  const next = { ...ball };
  if (next.x - next.r < 0) {
    next.x = next.r;
    next.vx = Math.abs(next.vx);
  } else if (next.x + next.r > WORLD_W) {
    next.x = WORLD_W - next.r;
    next.vx = -Math.abs(next.vx);
  }
  if (next.y - next.r < 0) {
    next.y = next.r;
    next.vy = Math.abs(next.vy);
  }
  return next;
}

// Velocidad de salida del paddle según el punto de impacto:
// centro = vertical, bordes = ±MAX_BOUNCE_ANGLE. Velocidad constante.
export function paddleBounceVelocity(
  ballX: number,
  paddle: Paddle,
): { vx: number; vy: number } {
  const half = paddle.w / 2;
  const rel = Math.max(-1, Math.min(1, (ballX - (paddle.x + half)) / half));
  const angle = (rel * MAX_BOUNCE_ANGLE * Math.PI) / 180;
  return { vx: BALL_SPEED * Math.sin(angle), vy: -BALL_SPEED * Math.cos(angle) };
}

// Solo rebota si la bola baja; la recoloca encima del paddle.
export function bouncePaddle(ball: Ball, paddle: Paddle): Ball {
  if (ball.vy <= 0 || !circleIntersectsRect(ball, paddle)) return ball;
  return {
    ...ball,
    y: paddle.y - ball.r,
    ...paddleBounceVelocity(ball.x, paddle),
  };
}

// Colisión con el primer bloque vivo tocado (máximo uno por paso).
// Invierte el eje de menor penetración y saca la bola del bloque.
export function collideBricks(
  ball: Ball,
  bricks: Brick[],
): { ball: Ball; hitIndex: number | null } {
  const hitIndex = bricks.findIndex(
    (b) => b.alive && circleIntersectsRect(ball, b),
  );
  if (hitIndex === -1) return { ball, hitIndex: null };

  const b = bricks[hitIndex];
  const overlapX = Math.min(ball.x + ball.r - b.x, b.x + b.w - (ball.x - ball.r));
  const overlapY = Math.min(ball.y + ball.r - b.y, b.y + b.h - (ball.y - ball.r));
  const next = { ...ball };

  if (overlapX < overlapY) {
    const fromLeft = ball.x < b.x + b.w / 2;
    next.x += fromLeft ? -overlapX : overlapX;
    next.vx = -next.vx;
  } else {
    const fromAbove = ball.y < b.y + b.h / 2;
    next.y += fromAbove ? -overlapY : overlapY;
    next.vy = -next.vy;
  }
  return { ball: next, hitIndex };
}
