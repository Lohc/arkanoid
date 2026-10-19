# SPEC 04 — Niveles extra

> **Estado:** Aprobado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-10-18
> **Objetivo:** Encadenar 3 niveles con layouts de bloques distintos definidos como grillas de texto, pasando al siguiente tras limpiar el actual y mostrando Victoria solo al terminar el último.

## Alcance

**Entra:**

- 3 niveles definidos en `src/game/level.ts` como grillas de texto (una letra por color, `.` vacío).
- Nivel 1 = layout actual (6 filas completas, mismos colores por fila). Nivel 2 = pirámide invertida. Nivel 3 = tablero ajedrezado de 8 filas.
- Grilla de 13 columnas y hasta 8 filas, con el mismo `BRICKS_OFFSET_X` / `BRICKS_OFFSET_Y` de hoy.
- `createBricks(level)` construye los bloques del nivel indicado.
- Campo `level` en `GameState` (1-based).
- Nueva fase `levelClear`: al terminar `clearing` en un nivel que no es el último. Tap → siguiente nivel en `serve`, bola sobre el paddle.
- Al terminar `clearing` en el último nivel → `won` (como hoy).
- Vidas y puntos se mantienen entre niveles.
- Reiniciar desde `gameover` o `won` vuelve al nivel 1 (`createInitialState`).
- Overlay de `levelClear`: título `Nivel N superado`, pista `Toca para continuar`, fondo oscurecido.
- HUD muestra `Nivel N` centrado entre `Vidas` y `Puntos`.
- Tests Jest de layouts y transiciones en `src/game/__tests__/`.

**Fuera de alcance (specs futuras):**

- Bloques `gray` (indestructibles o multi-golpe).
- Aumento de dificultad por nivel (velocidad de bola, tamaño de paddle).
- Vida extra al pasar de nivel.
- Persistencia del nivel alcanzado o de récords.
- Selector de nivel o atajo de depuración para saltar niveles.
- Sonido de nivel superado.

## Modelo de datos

```ts
// src/game/types.ts
export type Phase =
  | 'start'
  | 'serve'
  | 'playing'
  | 'clearing'
  | 'levelClear' // nuevo: nivel limpiado (no el último), esperando tap
  | 'paused'
  | 'gameover'
  | 'won';

export interface GameState {
  // ...campos de SPEC 01, 02 y 03
  level: number; // 1-based, índice en LEVELS + 1
}
```

```ts
// src/game/level.ts
// Letra → color. '.' = sin bloque.
const COLOR_CODES: Record<string, BrickColor> = {
  r: 'red',
  y: 'yellow',
  c: 'cyan',
  m: 'magenta',
  p: 'hotpink',
  g: 'green',
};

export const LEVELS: string[][] = [
  [
    // Nivel 1 — actual (78 bloques)
    'rrrrrrrrrrrrr',
    'yyyyyyyyyyyyy',
    'ccccccccccccc',
    'mmmmmmmmmmmmm',
    'ppppppppppppp',
    'ggggggggggggg',
  ],
  [
    // Nivel 2 — pirámide invertida (48 bloques)
    'rrrrrrrrrrrrr',
    '.yyyyyyyyyyy.',
    '..ccccccccc..',
    '...mmmmmmm...',
    '....ppppp....',
    '.....ggg.....',
  ],
  [
    // Nivel 3 — tablero (52 bloques)
    'r.r.r.r.r.r.r',
    '.y.y.y.y.y.y.',
    'c.c.c.c.c.c.c',
    '.m.m.m.m.m.m.',
    'p.p.p.p.p.p.p',
    '.g.g.g.g.g.g.',
    'r.r.r.r.r.r.r',
    '.y.y.y.y.y.y.',
  ],
];

export function createBricks(level: number): Brick[]; // solo bloques vivos, sin huecos
```

Convenciones:

- Bloque en fila `row`, columna `col`: `x = BRICKS_OFFSET_X + col * BRICK_W`, `y = BRICKS_OFFSET_Y + row * BRICK_H` (igual que hoy).
- Los `.` no generan `Brick`; `bricks` solo contiene bloques del layout.
- `ROW_COLORS` desaparece: el color sale de cada letra.
- Altura máxima de grilla: 64 + 8 · 16 = 192, lejos del paddle (`PADDLE_Y = 600`).

Transiciones de `phase` nuevas o modificadas:

- `clearing` → explosiones vacías y `level < LEVELS.length` → `levelClear` (antes: siempre `won`).
- `clearing` → explosiones vacías y `level === LEVELS.length` → `won`.
- `levelClear` → tap → `serve` con `level + 1`, `bricks = createBricks(level + 1)`, paddle en su posición actual, bola sobre el paddle, `lives` y `score` sin cambios.
- `levelClear` no es pausable (igual que `gameover` / `won`): `pause()` la devuelve sin cambios.

## Plan de implementación

1. En `src/game/level.ts`: añadir `COLOR_CODES` y `LEVELS`, eliminar `ROW_COLORS`, `createBricks(level)` lee la grilla. `createInitialState()` llama `createBricks(1)`. Ajustar `src/game/__tests__/level.test.ts`. Tests: cada layout tiene 1–8 filas de exactamente 13 caracteres válidos (`rycmpg.`) y al menos un bloque; `createBricks(1)` = 78 bloques con las mismas posiciones y colores que hoy; nivel 2 = 48; nivel 3 = 52; ningún bloque en posición de `.`. El juego se comporta igual que antes. `npx tsc --noEmit` pasa.
2. En `src/game/types.ts`: añadir `level` y fase `levelClear`. En `src/game/engine.ts`: `createInitialState()` devuelve `level: 1`; `clearing` pasa a `levelClear` o `won` según el nivel; `levelClear` + tap carga el siguiente nivel en `serve`. Tests: limpiar nivel 1 → `levelClear` tras la explosión; tap → `serve`, `level: 2`, 48 bloques, mismas vidas y puntos; sin tap sigue en `levelClear`; limpiar nivel 3 → `won`; tap en `won` → `level: 1`; `pause()` en `levelClear` no cambia el estado. Ajustar los tests de victoria existentes (`engine.test.ts`) para que partan del nivel 3 o esperen `levelClear`.
3. En `src/components/Overlay.tsx`: mensaje de `levelClear` con título `Nivel N superado` (recibe `level` como prop) y pista `Toca para continuar`, con `dim`. En `src/components/Hud.tsx`: `Nivel N` centrado. Pasar `level` desde `App.tsx`. Verificar en web y Android.

## Criterios de aceptación

- [ ] `npm test` pasa, incluidos los tests nuevos de niveles.
- [ ] `npx tsc --noEmit` pasa sin errores.
- [ ] El nivel 1 se ve igual que antes de esta spec.
- [ ] El HUD muestra `Nivel 1` al empezar, centrado entre Vidas y Puntos.
- [ ] Al romper el último bloque del nivel 1 se ve su explosión y después `Nivel 1 superado` / `Toca para continuar` sobre fondo oscurecido.
- [ ] Tras el tap aparece el nivel 2 (pirámide) con la bola sobre el paddle y `Toca para sacar`.
- [ ] Vidas y puntos al empezar el nivel 2 son los mismos que al terminar el nivel 1.
- [ ] El nivel 3 (tablero de 8 filas) se ve completo sin solaparse con HUD ni paddle.
- [ ] Al limpiar el nivel 3 aparece `¡Victoria!`.
- [ ] Reiniciar desde Game Over o Victoria vuelve al nivel 1 con vidas y puntos iniciales.
- [ ] Enviar la app a background en `levelClear` y volver mantiene `levelClear`.
- [ ] Funciona en web y Android sin errores en consola.

## Decisiones

- **Sí:** 3 niveles. Suficiente para validar el encadenado sin dedicar la spec al diseño de contenido.
- **Sí:** layouts como grillas de texto. Legibles, editables a mano y fáciles de validar con tests.
- **No:** niveles generados por código. Menos legible; el diseño no se ve en el código.
- **Sí:** `LEVELS` dentro de `src/game/level.ts`. Ese módulo ya es dueño de construir los bloques; un archivo aparte dividiría la misma responsabilidad.
- **Sí:** grilla de 13 × hasta 8 filas con los offsets actuales. Reutiliza geometría y deja margen de sobra hasta el paddle.
- **No:** grilla fija 13 × 6. Limita la variedad de diseños.
- **Sí:** fase `levelClear` con tap. El jugador ve que superó el nivel y decide cuándo seguir.
- **No:** carga automática del siguiente nivel. Sin feedback de nivel superado.
- **Sí:** `levelClear` no pausable. Es una pantalla estática como `gameover` / `won`; no hay nada que congelar.
- **Sí:** solo cambia el layout. Dificultad por diseño de bloques; física sin cambios.
- **No:** subir velocidad de bola o acortar paddle. Más tuning y tests; otra spec si hace falta.
- **Sí:** vidas y puntos se mantienen entre niveles; reiniciar vuelve al nivel 1. Convención Arkanoid.
- **No:** vida extra por nivel ni persistencia. Reglas y almacenamiento nuevos; otra spec.
- **No:** bloques `gray`. Cambian colisión y condición de nivel limpio; su propia spec.
- **No:** atajo de depuración para saltar niveles. Las transiciones se cubren con tests del engine.

## Riesgos

| Riesgo                                                     | Mitigación                                                               |
| ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| Tests de victoria de SPEC 01/02 esperan `won` tras nivel 1 | Paso 2 los ajusta (partir del nivel 3 o esperar `levelClear`).           |
| Layout mal escrito (fila de longitud distinta, letra rara) | Test del paso 1 valida dimensiones y caracteres de cada layout.          |
| `switch` exhaustivo en `stepPhase` sin `levelClear`        | `npx tsc --noEmit` en paso 2 detecta el caso faltante.                   |
| Overlay oculta `levelClear` si falta su mensaje            | Paso 3 añade el mensaje; criterio de aceptación lo verifica visualmente. |

## Lo que **no** entra en esta spec

- Bloques `gray`.
- Dificultad creciente por nivel.
- Vida extra por nivel.
- Persistencia de nivel o récords.
- Selector de nivel o atajo de depuración.
- Sonido de nivel superado.

Cada uno, si llega, va en su propia spec.
