# SPEC 02 — Animación de explosión de bloques

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-18
> **Objetivo:** Mostrar la animación de 4 frames de `EXPLOSION_FRAMES` en el lugar de cada bloque roto, gestionada por el engine puro.

## Alcance

**Entra:**

- Usar los frames de destrucción que ya existen en `assets/spritesheet-breakout.png` (columnas `sx` 256–352, una fila por color), con las coordenadas de `EXPLOSION_FRAMES` de `assets/spritesheet.js`. No se crean sprites ni imágenes nuevas.
- Copiar tipadas esas coordenadas, sin cambios, a `src/game/sprites.ts` (solo los 6 colores de `BrickColor`), igual que `SPRITES` en SPEC 01.
- Cada frame dura 150 ms (`EXPLOSION_DURATION` interpretado por frame); animación completa de 600 ms.
- Al romperse, el bloque desaparece al instante (colisión igual que hoy) y en su lugar se dibujan los frames de explosión de su color.
- Estado de explosiones en `GameState`, avanzado por `step(state, input, dt)`.
- Las explosiones avanzan en todas las fases salvo `paused`, donde se congelan.
- Reiniciar partida (`createInitialState`) vacía las explosiones.
- Nueva fase `clearing`: al romper el último bloque, bola y paddle se congelan hasta que terminan todas las explosiones; entonces pasa a `won`.
- `clearing` es pausable (auto-pausa por `AppState`) y vuelve a `clearing` al reanudar.
- Tests Jest del comportamiento en `src/game/__tests__/`.

**Fuera de alcance (specs futuras):**

- Sonido de rotura (`break-sound.mp3`) y de rebote.
- Explosión de bloques `gray`.
- Partículas, screen shake u otros efectos.
- Animación del paddle o de la bola.

## Modelo de datos

```ts
// src/game/types.ts
export type Phase =
  | 'start'
  | 'serve'
  | 'playing'
  | 'clearing' // nuevo: último bloque roto, esperando fin de explosiones
  | 'paused'
  | 'gameover'
  | 'won';

export interface Explosion {
  x: number; // esquina superior izquierda del bloque roto
  y: number;
  w: number;
  h: number;
  color: BrickColor;
  elapsed: number; // s desde que se rompió
}

export interface GameState {
  // ...campos de SPEC 01
  explosions: Explosion[];
}
```

```ts
// src/game/constants.ts
EXPLOSION_FRAME_TIME = 0.15; // s por frame
```

```ts
// src/game/sprites.ts
export const EXPLOSION_FRAMES: Record<BrickColor, SpriteFrame[]>; // 4 frames por color
```

Convenciones:

- `elapsed` en segundos, avanza con el mismo `dt` acotado por `MAX_DT`.
- Frame actual = `Math.floor(elapsed / EXPLOSION_FRAME_TIME)`; una explosión se elimina cuando el frame actual ≥ `EXPLOSION_FRAMES[color].length` (600 ms).

Transiciones de `phase` nuevas o modificadas:

- `playing` → último bloque roto → `clearing` (antes: `won`).
- `clearing` → explosiones vacías → `won`. Ignora input; bola y paddle no se mueven.
- `clearing` → app a background → `paused`; tap → `clearing`.

## Plan de implementación

1. Añadir `EXPLOSION_FRAMES` a `src/game/sprites.ts` y `EXPLOSION_FRAME_TIME` a `src/game/constants.ts`. Test: 4 frames por cada color de `BrickColor`, todos de 32×16.
2. Añadir `Explosion`, `explosions` y fase `clearing` en `src/game/types.ts`. `createInitialState()` devuelve `explosions: []`. `npx tsc --noEmit` pasa.
3. En `src/game/engine.ts`: función pura que avanza `elapsed` y descarta las terminadas; llamarla en `step` en todas las fases salvo `paused`. Al romper un bloque en `playing`, añadir su `Explosion` con `elapsed: 0`. Tests: romper bloque crea explosión con posición y color del bloque; desaparece tras 600 ms; no avanza en `paused`; sigue avanzando en `serve` tras perder la bola; tap en `gameover` deja `explosions` vacío.
4. En `src/game/engine.ts`: romper el último bloque pasa a `clearing`; en `clearing` no se mueven bola ni paddle y se pasa a `won` cuando `explosions` queda vacío. `pause()` acepta `clearing`. Tests: último bloque → `clearing` con bola quieta; tras 600 ms → `won`; pausa desde `clearing` y reanudar vuelve a `clearing`. Ajustar el test existente de victoria de SPEC 01.
5. En `src/components/GameCanvas.tsx`: dibujar cada explosión con el frame de su `elapsed` tras los bloques y antes del paddle. Comprobar que `src/components/Overlay.tsx` no muestra texto en `clearing`. Verificar en web y Android.

## Criterios de aceptación

- [ ] `npm test` pasa, incluidos los tests nuevos de explosiones.
- [ ] `npx tsc --noEmit` pasa sin errores.
- [ ] Al romper un bloque, en su lugar se ve la animación de 4 frames de su color y luego queda vacío.
- [ ] La animación dura ~600 ms (150 ms por frame).
- [ ] Romper un bloque sigue sumando exactamente 10 puntos en el momento del choque.
- [ ] La bola no rebota en un bloque que está explotando.
- [ ] Varias explosiones simultáneas se animan de forma independiente.
- [ ] Perder la bola mientras hay explosiones en curso no las interrumpe.
- [ ] Enviar la app a background con explosiones en curso las congela; al reanudar continúan desde el mismo frame.
- [ ] Al romper el último bloque, bola y paddle se quedan quietos, se ve la explosión completa y después aparece Victoria.
- [ ] Reiniciar desde Game Over o Victoria no muestra explosiones residuales.
- [ ] Funciona en web y Android sin errores en consola.

## Decisiones

- **Sí:** 150 ms por frame (600 ms total). 150 ms totales (~37 ms/frame) apenas se percibe.
- **Sí:** estado en `GameState` avanzado por `step`. Puro, testeable con Jest y la pausa lo congela sin código extra.
- **No:** animar solo en la capa de render. Reloj propio, pausa manual y sin tests.
- **Sí:** el bloque desaparece al chocar y se dibuja la explosión en su lugar. Los frames tienen el mismo tamaño que el bloque y la colisión no cambia.
- **No:** mantener el sprite del bloque debajo de la explosión. Taparía los frames transparentes.
- **Sí:** nueva fase `clearing` antes de `won`. Se ve estallar el último bloque y es imposible perder una vida tras ganar.
- **No:** pasar a `won` al instante. El último bloque no se vería explotar.
- **No:** dejar la bola en juego durante la espera. Podría perder una vida después de haber ganado.
- **Sí:** las explosiones avanzan en todas las fases salvo `paused`. Perder la bola no corta animaciones; reiniciar las borra al crear estado nuevo.
- **Sí:** reutilizar los frames de `EXPLOSION_FRAMES` del spritesheet existente. Los assets ya traen la animación; copiar las coordenadas es necesario porque `assets/spritesheet.js` no exporta nada y sus helpers usan el DOM (no funcionan en iOS/Android).
- **No:** dibujar la explosión con primitivas de Skia ni con assets nuevos. Ya tenemos los sprites.
- **Sí:** copiar solo los 6 colores de `BrickColor`. `gray` no existe todavía en el juego.

## Riesgos

| Riesgo                                                 | Mitigación                                                                 |
| ------------------------------------------------------ | -------------------------------------------------------------------------- |
| Test de victoria de SPEC 01 espera `won` inmediato     | Paso 4 lo ajusta a `clearing` → `won`.                                     |
| `switch` exhaustivo en `step`/`Overlay` sin `clearing` | `tsc --noEmit` en paso 2 detecta los casos faltantes.                      |
| Frames de explosión con transparencia sobre fondo      | Se dibujan sobre `BACKGROUND`, igual que los bloques; verificar en paso 5. |

## Lo que **no** entra en esta spec

- Sonidos.
- Explosión de bloques `gray`.
- Partículas o screen shake.
- Animaciones de paddle o bola.

Cada uno, si llega, va en su propia spec.
