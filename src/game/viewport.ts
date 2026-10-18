import { WORLD_H, WORLD_W } from './constants';

export interface Viewport {
  scale: number; // px de pantalla por unidad de mundo
  offsetX: number; // margen del letterbox, px de pantalla
  offsetY: number;
}

// Encaja el mundo en un área de w×h con escala uniforme, centrado (letterbox).
export function fitWorld(w: number, h: number): Viewport {
  const scale = Math.max(0, Math.min(w / WORLD_W, h / WORLD_H));
  return {
    scale,
    offsetX: (w - WORLD_W * scale) / 2,
    offsetY: (h - WORLD_H * scale) / 2,
  };
}

// Coordenada x de pantalla (relativa al área) a x de mundo.
export function screenToWorldX(viewport: Viewport, x: number): number {
  return (x - viewport.offsetX) / viewport.scale;
}
