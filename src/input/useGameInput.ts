import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Platform,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PointerEvent,
  type ViewProps,
} from 'react-native';

import type { Input } from '../game/types';
import { fitWorld, screenToWorldX, type Viewport } from '../game/viewport';

interface Keys {
  left: boolean;
  right: boolean;
}

// Normaliza dedo, ratón y teclado a `Input` en coords de mundo.
// `viewProps` va en la View que cubre el área de juego; sus hijos deben tener
// pointerEvents="none" para que las coordenadas sean siempre relativas a esa View.
// `readInput` devuelve el input del frame y consume el tap.
export function useGameInput(): { viewProps: ViewProps; readInput: () => Input } {
  const viewport = useRef<Viewport>(fitWorld(0, 0));
  const target = useRef<number | null>(null);
  const tap = useRef(false);
  const keys = useRef<Keys>({ left: false, right: false });

  const readInput = useCallback((): Input => {
    const { left, right } = keys.current;
    const input: Input = {
      paddleTargetX: target.current,
      keyDir: left === right ? 0 : left ? -1 : 1,
      tap: tap.current,
    };
    tap.current = false;
    return input;
  }, []);

  const viewProps = useMemo((): ViewProps => {
    const onLayout = (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      viewport.current = fitWorld(width, height);
    };
    const aim = (x: number) => {
      if (viewport.current.scale > 0) target.current = screenToWorldX(viewport.current, x);
    };

    if (Platform.OS === 'web') {
      return {
        onLayout,
        onPointerMove: (e: PointerEvent) => aim(e.nativeEvent.offsetX),
        onPointerDown: (e: PointerEvent) => {
          aim(e.nativeEvent.offsetX);
          tap.current = true;
        },
      };
    }
    return {
      onLayout,
      onTouchStart: (e: GestureResponderEvent) => {
        aim(e.nativeEvent.locationX);
        tap.current = true;
      },
      onTouchMove: (e: GestureResponderEvent) => aim(e.nativeEvent.locationX),
    };
  }, []);

  // Teclado solo en web. Las flechas anulan el objetivo del ratón hasta que vuelva a moverse.
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const onKey = (e: KeyboardEvent) => {
      const down = e.type === 'keydown';
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        keys.current[e.key === 'ArrowLeft' ? 'left' : 'right'] = down;
        if (down) target.current = null;
        e.preventDefault();
      } else if (e.code === 'Space') {
        if (down && !e.repeat) tap.current = true;
        e.preventDefault();
      }
    };
    const onBlur = () => {
      keys.current = { left: false, right: false };
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  return { viewProps, readInput };
}
