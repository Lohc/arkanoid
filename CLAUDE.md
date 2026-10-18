# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado del proyecto

Juego Arkanoid con **React Native + Expo** (TypeScript), objetivo: iOS, Android y web. Render con `@shopify/react-native-skia`.

## Comandos

- `npm install` — dependencias; `postinstall` copia `canvaskit.wasm` a `public/` (Skia web, ignorado en git).
- `npm start` — servidor Metro.
- `npm run web` — juego en el navegador.
- `npm run android` / `npm run ios` — abre en dispositivo/emulador. Usa `expo-dev-client`, **no Expo Go**: la primera vez (o tras cambiar dependencias nativas) compilar con `npx expo run:android` / `npx expo run:ios` (genera `/android`, `/ios`, ignorados en git).
- `npm test` — Jest (`jest-expo`); tests en `src/game/__tests__/`. Un archivo: `npx jest src/game/__tests__/engine.test.ts`.
- `npx tsc --noEmit` — typecheck.

## Estructura

- `src/game/` — lógica pura TS, sin React: `constants`, `types`, `sprites` (coordenadas copiadas de `assets/spritesheet.js`), `level` (bloques), `physics` (colisiones), `engine` (`createInitialState`, `step(state, input, dt)`, `pause`), `viewport` (letterbox 448×640 y pantalla→mundo). Mundo lógico fijo 448×640; velocidades en px/s.
- `src/hooks/useGameLoop.ts` — bucle `requestAnimationFrame`, estado en ref, auto-pausa con `AppState`.
- `src/input/useGameInput.ts` — dedo (nativo), puntero y teclado (web) → `Input` en coords de mundo. Sus `viewProps` van en la View contenedora; los hijos usan `pointerEvents="none"`.
- `src/components/` — `GameCanvas` (Skia, letterbox), `Hud` y `Overlay` (`Text` de RN sobre el canvas, escalados).
- `index.ts` (nativo) / `index.web.ts` (web: carga CanvasKit con `LoadSkiaWeb` antes de importar `App`).

## Flujo de trabajo: spec-driven

Skills instaladas en `.agents/skills/` (enlazadas desde `.claude/skills/`, origen `Klerith/fernando-skills`, ver `skills-lock.json`):

- `/spec <descripción>` — diseña una spec con preguntas previas y la guarda en `specs/NN-slug.md` en estado `Draft`/`Borrador`. No escribe código. Plantilla: `.agents/skills/spec/template.md`.
- `/spec-impl <NN-slug>` — solo implementa specs en estado `Approved`/`Aprobado` (el cambio de estado lo hace el humano). Crea rama `spec-NN-slug` (según `AutoCreateBranch` en `specs/.spec-config.yml`), implementa paso a paso pausando para revisar diff, **nunca hace commit automático**.

Implementar lo que dice la spec; cambios de alcance van a la spec, no al código.

## Assets

- `assets/spritesheet-breakout.png` — spritesheet único (paddle, bola, bloques de 7 colores, frames de explosión).
- `assets/spritesheet.js` — coordenadas de recorte (`SPRITES`, `EXPLOSION_FRAMES`, `EXPLOSION_DURATION = 150` ms) más helpers de dibujo. Los helpers usan Canvas 2D del DOM (`Image`, `document.createElement('canvas')`) y variables globales: **no funcionan en iOS/Android**. Reutilizar las coordenadas; el renderizado debe resolverse con una solución compatible con React Native.
- `assets/sounds/` — `ball-bounce.mp3`, `break-sound.mp3`.
