import { useEffect, useReducer, useRef } from 'react';

import { createInitialState, step } from '../game/engine';
import type { GameState, Input } from '../game/types';

// Avanza el juego en cada frame con requestAnimationFrame. El estado vive en un ref
// (el bucle no depende de renders) y un contador fuerza el re-render del frame.
// `readInput` se llama una vez por frame.
export function useGameLoop(readInput: () => Input): GameState {
  const stateRef = useRef<GameState>(createInitialState());
  const readInputRef = useRef(readInput);
  readInputRef.current = readInput;
  const [, forceRender] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    let frame = 0;
    let last: number | null = null;

    const tick = (now: number) => {
      // Primer frame: sin dt previo, no avanza.
      const dt = last === null ? 0 : (now - last) / 1000;
      last = now;
      stateRef.current = step(stateRef.current, readInputRef.current(), dt);
      forceRender();
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return stateRef.current;
}
