# SPEC 01 — MVP jugable de Arkanoid

> **Estado:** Implementado
> **Depende de:** —
> **Fecha:** 2026-10-18
> **Objetivo:** Crear el proyecto Expo y un nivel único de Arkanoid jugable en iOS, Android y web, con vidas, puntuación y pantallas de inicio y fin.

## Por qué existe esta spec

Es la primera spec: no hay proyecto todavía. Fija las bases técnicas (Expo + TypeScript, Skia, mundo lógico fijo, lógica pura testeada) sobre las que se apoyarán specs futuras.

## Alcance

**Entra:**

- Inicializar git y crear el proyecto Expo con plantilla `blank-typescript` en la raíz del repo.
- Orientación solo vertical en móvil.
- Render con `@shopify/react-native-skia` en iOS, Android y web, recortando sprites de `assets/spritesheet-breakout.png`.
- Mundo lógico fijo de 448×640 escalado uniformemente con letterbox.
- Un nivel: 6 filas × 13 columnas, colores `red`, `yellow`, `cyan`, `magenta`, `hotpink`, `green` (de arriba a abajo).
- Todos los bloques se rompen de un golpe y valen 10 puntos.
- Paddle dibujado a 96×14; bola a 16×16.
- Bola pegada al paddle hasta el saque (tap, clic o `Espacio`).
- Rebote en paddle con ángulo según punto de impacto (centro = vertical, bordes = ±60°), velocidad constante.
- Controles: arrastre táctil en móvil; en web, movimiento de ratón y flechas `←`/`→`.
- 3 vidas, puntuación y HUD con ambos valores.
- Pantallas: inicio ("Toca para empezar"), Game Over y Victoria, estas dos con reinicio al tocar.
- Auto-pausa cuando la app pasa a background (o la pestaña se oculta en web); tocar para reanudar.
- Lógica de juego en módulos puros TypeScript sin React, testeados con Jest (`jest-expo`).

**Fuera de alcance (specs futuras):**

- Sonidos (`assets/sounds/*`).
- Animación de explosión (`EXPLOSION_FRAMES`).
- Varios niveles o progresión.
- Bloques `gray` duros o irrompibles.
- Power-ups.
- Botón o tecla de pausa.
- Persistencia (high scores, ajustes).
- Aceleración progresiva de la bola.

## Modelo de datos

```ts
// src/game/types.ts
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
```

```ts
// src/game/constants.ts
WORLD_W = 448;
WORLD_H = 640;
BRICK_W = 32;
BRICK_H = 16;
BRICK_COLS = 13;
BRICK_ROWS = 6;
BRICKS_OFFSET_X = 16;
BRICKS_OFFSET_Y = 64;
PADDLE_W = 96;
PADDLE_H = 14;
PADDLE_Y = 600;
PADDLE_KEY_SPEED = 480; // px/s
BALL_R = 8;
BALL_SPEED = 360; // px/s
MAX_BOUNCE_ANGLE = 60; // grados
INITIAL_LIVES = 3;
BRICK_POINTS = 10;
MAX_DT = 1 / 30; // s, tope por frame
```

Convenciones:

- Origen arriba-izquierda, unidades de mundo (no píxeles de pantalla).
- Velocidades en px de mundo por segundo; `step` recibe `dt` en segundos.
- `src/game/sprites.ts` copia tipadas las coordenadas `SPRITES` de `assets/spritesheet.js` (sin los helpers DOM).

Transiciones de `phase`:

- `start` → tap → `playing` (saca la bola).
- `serve` → tap → `playing`.
- `playing` → bola sale por abajo → `lives - 1`; si quedan vidas `serve`, si no `gameover`.
- `playing` → último bloque roto → `won`.
- `gameover` / `won` → tap → estado inicial en `start`.
- `start` / `serve` / `playing` → app a background → `paused`; tap → `pausedFrom`.

## Plan de implementación

1. `git init`. Crear proyecto Expo `blank-typescript` en la raíz (generar en carpeta temporal y mover si el CLI rechaza el directorio no vacío). Conservar `assets/`, `specs/`, `.agents/`, `.claude/`, `CLAUDE.md`, `skills-lock.json`. Fijar `"orientation": "portrait"` en `app.json`. Verificar: `npm run web` abre la pantalla por defecto.
2. Añadir Jest: `jest-expo`, `jest`, `@types/jest`; script `"test": "jest"`. Un test trivial en `src/game/__tests__/` pasa con `npm test`.
3. Crear `src/game/constants.ts`, `src/game/types.ts`, `src/game/sprites.ts` y `src/game/level.ts` con `createBricks(): Brick[]`. Test: 78 bloques, color correcto por fila, ninguno fuera de `WORLD_W`.
4. Crear `src/game/physics.ts`: rebote en paredes izquierda/derecha/techo, rebote en paddle por punto de impacto, colisión bola-bloque (círculo vs AABB, invierte el eje de menor penetración, máximo un bloque por paso). Tests por caso, incluido 0° en el centro y ±60° en los bordes.
5. Crear `src/game/engine.ts`: `createInitialState()` y `step(state, input, dt): GameState` (puro). Aplica `MAX_DT`, mueve paddle (target o teclado, limitado al mundo), mantiene la bola pegada en `start`/`serve`, gestiona fases, vidas y puntuación. Tests: perder bola resta vida, tercera pérdida da `gameover`, romper bloque suma 10, romper el último da `won`, tap en `gameover` reinicia.
6. Instalar `@shopify/react-native-skia` y configurar web (`npx setup-skia-web`, cargar CanvasKit con `WithSkiaWeb`/`LoadSkiaWeb` antes de montar el juego). Crear `src/components/GameCanvas.tsx` que dibuja un `GameState` estático (fondo, bloques, paddle, bola) desde el spritesheet, escalado con letterbox. Verificar en web y en Android.
7. Crear `src/hooks/useGameLoop.ts`: bucle `requestAnimationFrame`, estado en `useRef`, llama `step` y fuerza re-render. Conectar en `App.tsx`. Verificar: forzando `phase: 'playing'` la bola rebota sola.
8. Crear `src/input/useGameInput.ts`: arrastre táctil (`onTouchStart`/`onTouchMove`) y puntero en web (`onPointerMove`/`onPointerDown`) convertidos a coords de mundo; teclado `←`/`→`/`Espacio` vía `window` solo en web. Verificar: el paddle sigue al dedo/ratón y a las flechas.
9. Crear `src/components/Hud.tsx` (vidas y puntos) y `src/components/Overlay.tsx` (textos de `start`, `serve`, `paused`, `gameover`, `won`) como `Text` de React Native sobre el canvas.
10. Auto-pausa: suscribirse a `AppState` (en web refleja la visibilidad de la pestaña) y pasar a `paused`. Verificar minimizando la app y cambiando de pestaña.
11. Actualizar `CLAUDE.md` con los comandos reales (`npm start`, `npm run web`, `npm run android`, `npm run ios`, `npm test`) y la estructura de `src/`.

## Criterios de aceptación

- [x] El repo es un repositorio git y `npm install` termina sin errores.
- [x] `npm test` pasa todos los tests de `src/game/`.
- [x] `npm run web` abre el juego sin errores en consola.
- [x] El juego arranca en Android (Expo Go o emulador) sin errores.
- [x] El juego arranca en iOS (Expo Go o simulador) sin errores; si no hay entorno iOS disponible, se indica en la entrega.
- [x] La pantalla inicial muestra 78 bloques en 6 filas: red, yellow, cyan, magenta, hotpink, green de arriba a abajo.
- [x] La pantalla inicial muestra "Toca para empezar" y la bola sobre el paddle.
- [x] El área de juego mantiene proporción 448:640 con letterbox en cualquier tamaño de ventana.
- [x] En móvil la app no rota a horizontal.
- [x] Arrastrar el dedo mueve el paddle; en web el ratón y las flechas lo mueven.
- [x] El paddle nunca sale de los límites del mundo.
- [x] Tap, clic o `Espacio` saca la bola.
- [x] La bola rebota en paredes laterales y techo.
- [x] Golpear el centro del paddle hace salir la bola vertical; golpear un borde la hace salir a ~60°.
- [x] Romper un bloque lo elimina y suma exactamente 10 puntos al HUD.
- [x] Perder la bola resta una vida y la deja pegada al paddle esperando saque.
- [x] Perder la tercera vida muestra Game Over; tocar reinicia con 3 vidas, 0 puntos y 78 bloques.
- [x] Romper los 78 bloques muestra Victoria; tocar reinicia.
- [x] Enviar la app a background (o cambiar de pestaña) y volver la muestra en pausa con la bola en la misma posición; tocar reanuda.
- [x] `CLAUDE.md` lista los comandos reales de build y test.

## Decisiones

- **Sí:** Skia. Canvas 2D real en las tres plataformas y recorte directo con las coordenadas de `SPRITES`.
- **No:** Views + `Image`. Muchas Views re-renderizadas por frame rinden peor.
- **No:** `react-native-game-engine`. Abstracción extra sin mejorar el render.
- **Sí:** mundo lógico fijo 448×640 escalado. Física idéntica en todos los dispositivos; 13 bloques de 32 px + márgenes de 16 encajan exactos.
- **No:** mundo a pantalla completa. Bloques deformados y física dependiente del dispositivo.
- **Sí:** copiar coordenadas a `src/game/sprites.ts`. `assets/spritesheet.js` usa globales sin `export` y helpers DOM incompatibles con móvil.
- **Sí:** lógica pura (`step(state, input, dt)`) separada de React. Testeable con Jest y desacoplada del render.
- **Sí:** velocidades en px/s con `dt` y tope `MAX_DT`. Independiente de la tasa de refresco; evita saltos tras tirones.
- **Sí:** paddle escalado a 96×14. El sprite nativo (162 px) ocupa 36% del ancho y hace el juego trivial.
- **Sí:** ángulo de rebote por punto de impacto y velocidad constante. Da control al jugador sin complicar el balance.
- **No:** aceleración progresiva. Otra spec.
- **Sí:** auto-pausa por `AppState`, sin botón. Evita perder vidas al cambiar de app.
- **Sí:** HUD y overlays como `Text` de React Native. Evita cargar fuentes en Skia.
- **Sí:** solo vertical. Encaja con el mundo 448×640.
- **Sí:** TypeScript. Tipos para el estado del juego y los sprites.
- **No:** sonidos, explosión, bloques gray, varios niveles. Fuera del MVP por decisión del usuario.

## Riesgos

| Riesgo                                                | Mitigación                                                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Skia en web requiere cargar `canvaskit.wasm`          | Paso 6 incluye `setup-skia-web` y carga explícita antes de montar; verificar con `npm run web`.         |
| Re-render de React a 60 fps degrada en móviles lentos | Árbol pequeño (canvas + HUD). Si se nota, migrar a valores compartidos de Skia/Reanimated en otra spec. |
| Túnel de la bola a través de bloques con `dt` grande  | `MAX_DT` limita el avance a 12 px por paso, menos que el alto de un bloque (16 px).                     |
| `create-expo-app` rechaza el directorio no vacío      | Generar en carpeta temporal y mover archivos (paso 1).                                                  |
| Eventos de puntero distintos entre web y nativo       | Capa única `useGameInput` que normaliza a `Input` en coords de mundo.                                   |

## Lo que **no** entra en esta spec

- Sonidos.
- Animación de explosión.
- Varios niveles.
- Bloques gray duros o irrompibles.
- Power-ups.
- Botón o tecla de pausa.
- Persistencia de puntuaciones.
- Aceleración de la bola.

Cada uno, si llega, va en su propia spec.
