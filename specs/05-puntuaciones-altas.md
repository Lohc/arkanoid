# SPEC 05 — Puntuaciones altas persistentes

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 04
> **Fecha:** 2026-10-19
> **Objetivo:** Guardar en el dispositivo las 5 mejores puntuaciones (puntos, nivel y fecha) y mostrarlas en inicio, Game Over y Victoria, avisando cuando la partida bate el récord.

## Alcance

**Entra:**

- Dependencia `@react-native-async-storage/async-storage` (instalada con `npx expo install @react-native-async-storage/async-storage`). En web usa `localStorage`.
- Top 5 guardado bajo la clave `arkanoid:highScores:v1` como JSON.
- Cada entrada: puntos, nivel alcanzado y fecha (ISO 8601).
- Sin nombre ni iniciales: un jugador por dispositivo.
- La partida se registra una sola vez al entrar en `gameover` o `won`.
- Puntuación 0 no se registra.
- Empate de puntos: la entrada nueva queda debajo de la existente.
- Lógica pura (validar, insertar, rango, formato de fecha) en `src/game/highScores.ts`, testeada con Jest.
- Hook `src/storage/useHighScores.ts`: carga al montar, registra y guarda al terminar la partida.
- El engine no cambia.
- Lista con columnas posición, puntos, nivel y fecha (`dd/mm/aaaa`) en `start`, `gameover` y `won`, bajo el encabezado `Mejores puntuaciones`.
- En `gameover` / `won`, la fila de la partida actual (si entró al top 5) se pinta en amarillo (`#ff0`).
- Si la partida queda #1, se muestra `¡Nuevo récord!` en amarillo bajo el título.
- Lista vacía: no se muestra encabezado ni tabla.
- Datos guardados inválidos o error de lectura → lista vacía. Error de escritura → se ignora con `console.warn`. El juego nunca se bloquea.

**Fuera de alcance (specs futuras):**

- Nombre o iniciales del jugador.
- Borrar récords desde la app.
- Récord visible en el HUD durante la partida.
- Récords online o sincronizados entre dispositivos.
- Migración de esquemas futuros (`v2`).
- Persistencia de otros datos (nivel alcanzado, ajustes, sonido).

## Modelo de datos

```ts
// src/game/highScores.ts
export interface HighScore {
  score: number; // entero > 0
  level: number; // 1-based, nivel en el que terminó la partida
  date: string; // ISO 8601, new Date().toISOString()
}

export const HIGH_SCORES_KEY = 'arkanoid:highScores:v1';
export const MAX_HIGH_SCORES = 5;

// JSON guardado → lista válida ordenada. null, JSON roto o forma inválida → [].
// Descarta entradas inválidas y recorta a MAX_HIGH_SCORES.
export function parseHighScores(raw: string | null): HighScore[];

// Inserta `entry` por puntos descendente (empate: debajo de las existentes) y recorta.
// rank = índice 0-based de la entrada en la lista resultante, o null si no entró o score es 0.
export function insertHighScore(
  list: HighScore[],
  entry: HighScore,
): { list: HighScore[]; rank: number | null };

// ISO → 'dd/mm/aaaa' en hora local.
export function formatHighScoreDate(iso: string): string;
```

```ts
// src/storage/useHighScores.ts
export function useHighScores(state: GameState): {
  highScores: HighScore[];
  lastRank: number | null; // rango de la partida recién terminada; null fuera de gameover/won
};
```

Convenciones:

- Formato guardado: `JSON.stringify(HighScore[])`, ya ordenado.
- Entrada válida: `score` entero > 0, `level` entero ≥ 1, `date` string parseable por `Date`.
- Registro: el hook detecta la transición de fase a `gameover` o `won` comparando con la fase anterior (en un ref) e inserta `{ score: state.score, level: state.level, date }`.
- `lastRank` vuelve a `null` al salir de `gameover` / `won` (tap → `start`).
- `¡Nuevo récord!` ⇔ `lastRank === 0`.
- Si la partida termina antes de que acabe la carga inicial, se registra tras la carga sobre la lista cargada.

## Plan de implementación

1. Crear `src/game/highScores.ts` con `HighScore`, constantes, `parseHighScores`, `insertHighScore` y `formatHighScoreDate`. Tests en `src/game/__tests__/highScores.test.ts`: `parseHighScores(null)` y JSON roto → `[]`; descarta entradas inválidas; recorta a 5; insertar en lista vacía → rank 0; insertar en medio → rank correcto; empate → debajo; 6.ª peor que las 5 → rank `null` y lista igual; score 0 → `null`; formato `dd/mm/aaaa`. `npx tsc --noEmit` pasa.
2. Instalar `@react-native-async-storage/async-storage`. Crear `src/storage/useHighScores.ts` (carga con `getItem` + `parseHighScores`, registra con `insertHighScore`, guarda con `setItem`, errores según Alcance). Llamarlo en `App.tsx` y pasar `highScores` y `lastRank` a `GameCanvas`. Recompilar con `npx expo run:android`. Verificar en web: tras un Game Over, `localStorage['arkanoid:highScores:v1']` contiene la partida.
3. En `src/components/Overlay.tsx`: tabla de récords en `start`, `gameover` y `won` con encabezado `Mejores puntuaciones`, fila `lastRank` en amarillo, `¡Nuevo récord!` si `lastRank === 0`, oculta si la lista está vacía. `GameCanvas` reenvía las props. Verificar en web y Android.

## Criterios de aceptación

- [x] `npm test` pasa, incluidos los tests nuevos de `highScores`.
- [x] `npx tsc --noEmit` pasa sin errores.
- [x] Primera ejecución (sin datos): la pantalla de inicio no muestra tabla.
- [x] Terminar una partida con puntos > 0 la añade a la lista en Game Over, en amarillo.
- [x] Batir la mejor puntuación muestra `¡Nuevo récord!`; entrar al top 5 sin ser #1 no lo muestra.
- [x] Terminar con 0 puntos no añade entrada.
- [x] Ganar los 3 niveles registra la partida con nivel 3 y la muestra en Victoria.
- [x] La lista nunca tiene más de 5 filas y está ordenada por puntos descendente.
- [x] Cada fila muestra posición, puntos, nivel y fecha `dd/mm/aaaa`.
- [x] Tras el tap de reinicio, la pantalla de inicio muestra la lista sin filas en amarillo.
- [x] Cerrar y volver a abrir la app (o recargar la pestaña) conserva la lista.
- [ ] Con un valor inválido en `arkanoid:highScores:v1` la app arranca sin errores y con lista vacía.
- [x] La tabla no se solapa con bloques, HUD ni paddle.
- [x] Funciona en web y Android sin errores en consola.

## Decisiones

- **Sí:** AsyncStorage. Un solo API en iOS, Android y web; los datos son mínimos.
- **No:** `expo-sqlite/kv-store`. Soporte web más inmaduro, sin ventaja para 5 entradas.
- **No:** JSON con `expo-file-system`. No funciona en web.
- **Sí:** top 5 con puntos, nivel y fecha. Da contexto a cada récord y cabe en el overlay.
- **No:** top 10 o un único récord. 10 no cabe bien; uno solo da poca información.
- **Sí:** sin nombre. Un jugador por dispositivo; evita UI de texto y una fase nueva.
- **No:** iniciales arcade o `TextInput`. Nueva fase y UI; su propia spec si llega.
- **Sí:** lógica pura en `src/game/highScores.ts` + hook de persistencia. Testeable con Jest sin mockear AsyncStorage; mismo patrón que `useGameSounds`.
- **No:** evento `gameEnded` emitido por el engine. Toca engine y tipos para algo que la transición de fase ya expresa sin ambigüedad.
- **Sí:** clave versionada `arkanoid:highScores:v1`. Permite cambiar el esquema en el futuro sin leer datos viejos como nuevos.
- **Sí:** datos inválidos → lista vacía; error de escritura → `console.warn`. Los récords no deben romper el juego.
- **No:** mensaje de error en pantalla. Ruido para el jugador sin acción posible.
- **Sí:** empate debajo. El récord más antiguo conserva su puesto (convención arcade).
- **Sí:** puntuación 0 no se registra. No es un récord.
- **Sí:** `¡Nuevo récord!` solo para el #1. El aviso conserva su valor; la fila amarilla ya marca la entrada al top 5.
- **No:** récord en HUD. Elegido no incluirlo; otra spec si hace falta.
- **No:** borrar récords desde la app. Se borra desinstalando o limpiando datos del sitio.

## Riesgos

| Riesgo                                                     | Mitigación                                                                        |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------- |
| AsyncStorage es nativa: el dev-client actual no la incluye | Paso 2 recompila con `npx expo run:android` / `npx expo run:ios`.                 |
| Registrar la misma partida dos veces (re-renders)          | Registro solo en la transición de fase, detectada con ref de fase anterior.       |
| Partida termina antes de completar la carga inicial        | Registro diferido hasta que la carga termina; se inserta sobre la lista cargada.  |
| Tests de Jest que importen AsyncStorage fallan sin mock    | Los tests solo cubren `src/game/highScores.ts`, que no importa AsyncStorage.      |
| Tabla de 5 filas no cabe entre bloques y paddle            | Tamaño de fuente escalado y pequeño; criterio de aceptación verifica sin solapes. |

## Lo que **no** entra en esta spec

- Nombre o iniciales.
- Borrar récords.
- Récord en el HUD.
- Récords online o sincronizados.
- Migración a `v2`.
- Persistencia de ajustes o progreso.

Cada uno, si llega, va en su propia spec.
