# SPEC 03 — Sonidos de rebote y rotura de bloques

> **Estado:** Aprobada
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-10-18
> **Objetivo:** Reproducir `ball-bounce.mp3` cuando la bola rebota en paredes, techo o paddle y `break-sound.mp3` cuando rompe un bloque, en iOS, Android y web.

## Alcance

**Entra:**

- Dependencia `expo-audio` (instalada con `npx expo install expo-audio`).
- Usar los assets existentes `assets/sounds/ball-bounce.mp3` y `assets/sounds/break-sound.mp3`. No se crean sonidos nuevos.
- `ball-bounce.mp3` al rebotar en pared izquierda, derecha, techo o paddle.
- `break-sound.mp3` al romper un bloque. El choque con el bloque no suena a rebote.
- El engine puro emite eventos de sonido del paso en `GameState.sounds`; el engine no reproduce nada.
- Hook `src/audio/useGameSounds.ts` que crea un player por sonido y reproduce los eventos de cada estado nuevo.
- Si un sonido se dispara mientras aún suena, se reinicia desde 0 (`seekTo(0)` + `play()`).
- Respetar el modo silencio de iOS (default de `expo-audio`).
- Tests Jest de los eventos en `src/game/__tests__/`.

**Fuera de alcance (specs futuras):**

- Botón o tecla de silencio, control de volumen y su persistencia.
- Música de fondo.
- Sonidos de perder vida, Game Over, Victoria o saque.
- Solape real del mismo sonido (pool de players).
- Sonido de bloques `gray`.

## Modelo de datos

```ts
// src/game/types.ts
export type SoundEvent = 'bounce' | 'break';

export interface GameState {
  // ...campos de SPEC 01 y SPEC 02
  sounds: SoundEvent[]; // sonidos a reproducir producidos en este paso
}
```

Convenciones:

- `sounds` solo describe el paso actual. `step` lo vacía al empezar cada paso, en todas las fases (incluida `paused`); solo `playing` añade eventos.
- `pause()` y `createInitialState()` devuelven `sounds: []`.
- Sin duplicados en un paso: paddle y pared en el mismo paso → un solo `'bounce'`.
- Rebote detectado en `playing` comparando la velocidad de la bola antes y después de `bounceWalls` / `bouncePaddle` (`src/game/physics.ts`, sin cambios).
- `'break'` cuando `collideBricks` devuelve `hitIndex !== null`.

## Plan de implementación

1. En `src/game/types.ts`: añadir `SoundEvent` y `sounds`. En `src/game/engine.ts`: `createInitialState()` y `pause()` devuelven `sounds: []`; `step` vacía `sounds` al inicio de cada paso. Tests: estado inicial sin sonidos; `pause()` sobre un estado con sonidos los vacía; un paso en `paused` deja `sounds` vacío. `npx tsc --noEmit` pasa.
2. En `src/game/engine.ts` (`playing`): añadir `'bounce'` si `bounceWalls` o `bouncePaddle` cambian la velocidad y `'break'` si se rompe un bloque. Tests: rebote en pared lateral, techo y paddle → `['bounce']`; romper bloque → contiene `'break'` y no `'bounce'` por el bloque; romper el último bloque (paso a `clearing`) → `'break'`; paso sin choques → `[]`; perder la bola → `[]`.
3. Instalar `expo-audio`. Crear `src/audio/useGameSounds.ts`: `useAudioPlayer` por cada mp3; `useEffect` con dependencia `[state]` que reproduce cada evento de `state.sounds` con `seekTo(0)` + `play()`. Llamarlo en `App.tsx` con el estado de `useGameLoop`. Recompilar con `npx expo run:android`. Verificar en web y Android.

## Criterios de aceptación

- [ ] `npm test` pasa, incluidos los tests nuevos de sonidos.
- [ ] `npx tsc --noEmit` pasa sin errores.
- [ ] La bola rebota en pared izquierda, derecha, techo y paddle y suena `ball-bounce.mp3` en cada rebote.
- [ ] Romper un bloque suena `break-sound.mp3` y no suena `ball-bounce.mp3` por ese choque.
- [ ] Romper el último bloque suena `break-sound.mp3`.
- [ ] Dos roturas seguidas muy rápidas suenan ambas (la segunda reinicia la primera).
- [ ] No suena nada en `start`, `serve`, `paused`, `clearing`, `gameover` ni `won`.
- [ ] Enviar la app a background y volver no repite ningún sonido.
- [ ] En iOS con el interruptor de silencio activado no suena nada.
- [ ] En web, el primer rebote tras el clic de saque suena.
- [ ] Funciona en web y Android sin errores en consola.

## Decisiones

- **Sí:** `expo-audio`. API actual de Expo, un solo código para iOS, Android y web.
- **No:** `expo-av`. Deprecada en SDKs recientes.
- **No:** `HTMLAudioElement`. Solo web.
- **Sí:** eventos `sounds` en `GameState` producidos por `step`. Engine puro, testeable con Jest; el hook solo reproduce.
- **No:** deducir los sonidos en el hook comparando estados. Frágil (signo de velocidad, bloques vivos) y sin tests.
- **Sí:** `step` y `pause()` vacían `sounds`. Un estado repetido o pausado nunca vuelve a sonar.
- **Sí:** `ball-bounce.mp3` en paredes, techo y paddle; el bloque solo suena a rotura. Evita dos sonidos en el mismo choque.
- **Sí:** un player por sonido y reiniciar desde 0. Simple; corta la cola del anterior, aceptable con sonidos cortos.
- **No:** pool de players. Más código sin necesidad demostrada.
- **Sí:** respetar el modo silencio de iOS. Convención de juegos casuales; default de `expo-audio`.
- **No:** mute o volumen en esta spec. Requiere UI y persistencia; va en su propia spec.
- **Sí:** hook separado `src/audio/useGameSounds.ts`. No mezcla audio con el bucle de `useGameLoop`.

## Riesgos

| Riesgo                                                                | Mitigación                                                                                          |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `expo-audio` es nativa: el dev-client actual no la incluye            | Paso 3 recompila con `npx expo run:android` / `npx expo run:ios`.                                   |
| Política de autoplay del navegador bloquea audio antes de interacción | El primer sonido llega tras el tap/clic de saque, que cuenta como gesto del usuario.                |
| React agrupa dos renders y se pierde un estado con sonidos            | `forceRender` es uno por frame de `requestAnimationFrame`; verificar en paso 3 con roturas rápidas. |
| Latencia de `seekTo(0)` + `play()` en Android                         | Sonidos cortos; verificar en dispositivo en paso 3.                                                 |

## Lo que **no** entra en esta spec

- Silencio, volumen y su persistencia.
- Música de fondo.
- Sonidos de vida perdida, Game Over, Victoria o saque.
- Solape real del mismo sonido.

Cada uno, si llega, va en su propia spec.
