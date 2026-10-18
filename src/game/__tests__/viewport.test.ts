import { WORLD_H, WORLD_W } from '../constants';
import { fitWorld, screenToWorldX } from '../viewport';

describe('fitWorld', () => {
  it('ventana ancha: escala por alto y bandas a los lados', () => {
    const v = fitWorld(1000, WORLD_H);
    expect(v.scale).toBe(1);
    expect(v.offsetX).toBe((1000 - WORLD_W) / 2);
    expect(v.offsetY).toBe(0);
  });

  it('ventana alta: escala por ancho y bandas arriba y abajo', () => {
    const v = fitWorld(WORLD_W * 2, 2000);
    expect(v.scale).toBe(2);
    expect(v.offsetX).toBe(0);
    expect(v.offsetY).toBe((2000 - WORLD_H * 2) / 2);
  });

  it('área vacía: escala 0', () => {
    expect(fitWorld(0, 0).scale).toBe(0);
  });
});

describe('screenToWorldX', () => {
  it('descuenta el letterbox y la escala', () => {
    const v = fitWorld(WORLD_W * 2 + 100, WORLD_H * 2);
    expect(screenToWorldX(v, 50)).toBe(0);
    expect(screenToWorldX(v, 50 + WORLD_W * 2)).toBe(WORLD_W);
  });
});
