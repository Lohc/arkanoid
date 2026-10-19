# Juego de Arkanoid

Arkanoid para iOS, Android y web hecho con React Native + Expo (TypeScript). Render con `@shopify/react-native-skia` y audio con `expo-audio`.

## Cómo se juega

- 3 niveles con layouts distintos: filas completas, pirámide invertida y tablero ajedrezado.
- 3 vidas; cada bloque roto vale 10 puntos. Vidas y puntos se mantienen entre niveles.
- La bola sale pegada al paddle; el ángulo de rebote depende del punto de impacto.
- Al romper un bloque se ve una animación de explosión y suena `break-sound.mp3`; los rebotes suenan con `ball-bounce.mp3`.
- La partida se pausa sola si la app pasa a segundo plano (o se oculta la pestaña); tocar para reanudar.

### Controles

| Acción       | Móvil             | Web                              |
| ------------ | ----------------- | -------------------------------- |
| Mover paddle | Arrastrar el dedo | Ratón o flechas `←` / `→`        |
| Sacar        | Tocar             | Clic o `Espacio`                 |
| Continuar    | Tocar             | Clic (inicio, nivel, fin, pausa) |

## Requisitos

- Node.js y npm.
- Para móvil: Android Studio / Xcode. El proyecto usa `expo-dev-client`, **no funciona con Expo Go**.

## Puesta en marcha

```bash
npm install        # también copia canvaskit.wasm a public/ (Skia web)
npm run web        # jugar en el navegador
npm run android    # compila y abre en Android (expo run:android)
npm run ios        # compila y abre en iOS (expo run:ios)
npm start          # solo el servidor Metro
```

Las carpetas nativas `android/` e `ios/` se generan al compilar y están ignoradas en git.

## Tests y typecheck

```bash
npm test                                         # Jest (jest-expo)
npx jest src/game/__tests__/engine.test.ts       # un archivo
npx tsc --noEmit                                 # typecheck
```

## Estructura

```
src/
  game/        lógica pura TS (engine, physics, level, sprites, viewport) + __tests__/
  hooks/       useGameLoop: bucle requestAnimationFrame y auto-pausa
  input/       useGameInput: dedo, puntero y teclado → coords de mundo
  audio/       useGameSounds: reproduce los eventos de sonido del engine
  components/  GameCanvas (Skia), Hud, Overlay
assets/        spritesheet-breakout.png, spritesheet.js (coordenadas), sounds/
specs/         especificaciones de cada feature
```

El mundo lógico mide 448×640 y se escala con letterbox a cualquier pantalla. El engine (`step(state, input, dt)`) no tiene efectos: React solo dibuja, captura input y reproduce sonidos.

## Desarrollo spec-driven

Cada feature se define primero como spec en `specs/NN-slug.md` y luego se implementa:

1. `/spec <descripción>` — crea la spec en estado `Borrador` tras una ronda de preguntas.
2. Revisión humana → estado `Aprobado`.
3. `/spec-impl <NN-slug>` — crea la rama `spec-NN-slug` e implementa paso a paso, sin commits automáticos.
4. Criterios de aceptación verificados → estado `Implementado`.

Specs implementadas:

- [SPEC 01 — MVP jugable](specs/01-mvp-jugable.md)
- [SPEC 02 — Animación de explosión de bloques](specs/02-animacion-explosion-bloques.md)
- [SPEC 03 — Sonidos de rebote y rotura](specs/03-sonidos-rebote-rotura.md)
- [SPEC 04 — Niveles extra](specs/04-niveles-extra.md)
