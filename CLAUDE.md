# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado del proyecto

Juego Arkanoid con **React Native + Expo**, objetivo: iOS, Android y web. **Aún no hay código de app** (sin `package.json`, sin comandos de build/test). Al crear el proyecto Expo, actualizar este archivo con los comandos reales.

El repo tampoco es todavía un repositorio git; `/spec-impl` necesita git para crear ramas.

## Flujo de trabajo: spec-driven

Skills instaladas en `.agents/skills/` (enlazadas desde `.claude/skills/`, origen `Klerith/fernando-skills`, ver `skills-lock.json`):

- `/spec <descripción>` — diseña una spec con preguntas previas y la guarda en `specs/NN-slug.md` en estado `Draft`/`Borrador`. No escribe código. Plantilla: `.agents/skills/spec/template.md`.
- `/spec-impl <NN-slug>` — solo implementa specs en estado `Approved`/`Aprobado` (el cambio de estado lo hace el humano). Crea rama `spec-NN-slug` (según `AutoCreateBranch` en `specs/.spec-config.yml`), implementa paso a paso pausando para revisar diff, **nunca hace commit automático**.

Implementar lo que dice la spec; cambios de alcance van a la spec, no al código.

## Assets

- `assets/spritesheet-breakout.png` — spritesheet único (paddle, bola, bloques de 7 colores, frames de explosión).
- `assets/spritesheet.js` — coordenadas de recorte (`SPRITES`, `EXPLOSION_FRAMES`, `EXPLOSION_DURATION = 150` ms) más helpers de dibujo. Los helpers usan Canvas 2D del DOM (`Image`, `document.createElement('canvas')`) y variables globales: **no funcionan en iOS/Android**. Reutilizar las coordenadas; el renderizado debe resolverse con una solución compatible con React Native.
- `assets/sounds/` — `ball-bounce.mp3`, `break-sound.mp3`.
