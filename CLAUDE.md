# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado del proyecto

Juego Arkanoid con **React Native + Expo** (TypeScript), objetivo: iOS, Android y web. Render con `@shopify/react-native-skia`, audio con `expo-audio`.

Specs implementadas (ver `specs/`): 01 MVP jugable, 02 animación de explosión, 03 sonidos de rebote/rotura, 04 niveles extra (3 niveles).

## Comandos

- `npm install` — dependencias; `postinstall` copia `canvaskit.wasm` a `public/` (Skia web, ignorado en git).
- `npm start` — servidor Metro.
- `npm run web` — juego en el navegador.
- `npm run android` / `npm run ios` — `expo run:android` / `expo run:ios`: compila la app nativa (genera `/android`, `/ios`, ignorados en git) y la abre en dispositivo/emulador. Usa `expo-dev-client`, **no Expo Go**. Tras compilar, `npm start` basta para recargar JS; recompilar solo al cambiar dependencias nativas.
- `npm test` — Jest (`jest-expo`); tests en `src/game/__tests__/`. Un archivo: `npx jest src/game/__tests__/engine.test.ts`.
- `npx tsc --noEmit` — typecheck.

## Estructura

- `src/game/` — lógica pura TS, sin React: `constants`, `types` (`GameState`, `Phase`, `SoundEvent`…), `sprites` (coordenadas `SPRITES` y `EXPLOSION_FRAMES` copiadas de `assets/spritesheet.js`), `level` (niveles como grillas de texto, `createBricks(level)`), `physics` (colisiones), `engine` (`createInitialState`, `step(state, input, dt)`, `pause`), `viewport` (letterbox 448×640 y pantalla→mundo). Mundo lógico fijo 448×640; velocidades en px/s.
- Fases (`Phase`): `start` → `serve` → `playing` → `clearing` (último bloque roto, esperando explosiones) → `levelClear` (nivel no final) o `won`; además `paused` y `gameover`.
- El engine no tiene efectos: explosiones viven en `GameState` y avanzan con `step`; sonidos se emiten como eventos en `GameState.sounds` y los reproduce la capa React.
- `src/hooks/useGameLoop.ts` — bucle `requestAnimationFrame`, estado en ref, auto-pausa con `AppState`.
- `src/input/useGameInput.ts` — dedo (nativo), puntero y teclado (web) → `Input` en coords de mundo. Sus `viewProps` van en la View contenedora; los hijos usan `pointerEvents="none"`.
- `src/audio/useGameSounds.ts` — un player `expo-audio` por sonido; reproduce los `sounds` de cada estado nuevo (`seekTo(0)` + `play()`).
- `src/components/` — `GameCanvas` (Skia, letterbox), `Hud` (vidas, nivel, puntos) y `Overlay` (`Text` de RN sobre el canvas, escalados).
- `index.ts` (nativo) / `index.web.ts` (web: carga CanvasKit con `LoadSkiaWeb` antes de importar `App`).

## Flujo de trabajo: spec-driven

Toda feature nace como spec en `specs/`; el código implementa lo que dice la spec. Cambios de alcance van a la spec, no al código.

Skills instaladas en `.agents/skills/` (enlazadas desde `.claude/skills/`, origen `Klerith/fernando-skills`, ver `skills-lock.json`):

- `/spec <descripción>` — fase de preguntas obligatoria, luego guarda `specs/NN-slug.md` en `Borrador`. No escribe código. Plantilla: `.agents/skills/spec/template.md`.
- `/spec-impl <NN-slug>` — solo implementa specs en `Aprobado`. Crea rama `spec-NN-slug` (según `AutoCreateBranch` en `specs/.spec-config.yml`), implementa un paso del plan a la vez pausando para revisar diff, **nunca hace commit automático**.

Ciclo de vida (etiquetas en español, mantener consistencia): `Borrador` → `En revisión` → `Aprobado` (lo cambia el humano) → `Implementado` (al verificar todos los criterios) / `Obsoleto`.

Formato de las specs del repo (seguir el de las existentes):

- Cabecera en blockquote: `# SPEC NN — Título`, `> **Estado:**`, `> **Depende de:** SPEC 01, …`, `> **Fecha:** YYYY-MM-DD`, `> **Objetivo:**` (una sola frase).
- Secciones: `## Por qué existe esta spec` (opcional), `## Alcance` (**Entra:** / **Fuera de alcance (specs futuras):**), `## Modelo de datos` (TS real con rutas, p. ej. `// src/game/types.ts`), `## Plan de implementación` (pasos numerados, cada uno ejecutable y commiteable), `## Criterios de aceptación` (checklist booleana `- [ ]`), `## Decisiones` (**Sí:**/**No:** con motivo), `## Riesgos` (tabla, opcional), `## Lo que **no** entra en esta spec`.
- Nombres concretos de archivos/funciones, sin TODOs, sin código largo.

Convenciones al implementar:

- Lógica nueva en `src/game/` pura y con tests Jest en `src/game/__tests__/`; React solo dibuja, captura input o reproduce efectos.
- Al cerrar una spec: marcar criterios `- [x]`, cambiar estado a `Implementado` y commit (mensajes `feat: …` en español).

## Assets

- `assets/spritesheet-breakout.png` — spritesheet único (paddle, bola, bloques de 7 colores, frames de explosión).
- `assets/spritesheet.js` — coordenadas de recorte (`SPRITES`, `EXPLOSION_FRAMES`, `EXPLOSION_DURATION = 150` ms) más helpers de dibujo. Los helpers usan Canvas 2D del DOM (`Image`, `document.createElement('canvas')`) y variables globales: **no funcionan en iOS/Android**. Reutilizar las coordenadas; el renderizado debe resolverse con una solución compatible con React Native.
- `assets/sounds/` — `ball-bounce.mp3`, `break-sound.mp3`.
