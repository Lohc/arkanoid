import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  HIGH_SCORES_KEY,
  insertHighScore,
  parseHighScores,
  type HighScore,
} from '../game/highScores';
import type { GameState, Phase } from '../game/types';

const isEnded = (phase: Phase) => phase === 'gameover' || phase === 'won';

// Carga el top 5 al montar y registra la partida al entrar en gameover/won.
// Errores de lectura → lista vacía; de escritura → console.warn. Nunca bloquea el juego.
export function useHighScores(state: GameState): {
  highScores: HighScore[];
  lastRank: number | null; // rango de la partida recién terminada; null fuera de gameover/won
} {
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [lastRank, setLastRank] = useState<number | null>(null);
  const listRef = useRef<HighScore[] | null>(null); // null hasta terminar la carga
  const pendingRef = useRef<HighScore | null>(null); // partida terminada antes de la carga
  const prevPhaseRef = useRef(state.phase);

  const record = useCallback((entry: HighScore) => {
    const { list, rank } = insertHighScore(listRef.current ?? [], entry);
    setLastRank(rank);
    if (rank === null) return;
    listRef.current = list;
    setHighScores(list);
    AsyncStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(list)).catch((e) =>
      console.warn('No se pudieron guardar las puntuaciones', e),
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(HIGH_SCORES_KEY)
      .then(parseHighScores, () => [])
      .then((list) => {
        if (cancelled) return;
        listRef.current = list;
        setHighScores(list);
        const pending = pendingRef.current;
        pendingRef.current = null;
        if (pending) record(pending);
      });
    return () => {
      cancelled = true;
    };
  }, [record]);

  // Registro solo en la transición de fase, no en cada render.
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = state.phase;
    if (prev === state.phase) return;
    if (isEnded(state.phase) && !isEnded(prev)) {
      const entry = {
        score: state.score,
        level: state.level,
        date: new Date().toISOString(),
      };
      if (listRef.current) record(entry);
      else pendingRef.current = entry;
    } else if (!isEnded(state.phase)) {
      setLastRank(null);
    }
  }, [state.phase, state.score, state.level, record]);

  // Si la carga termina con la partida ya cerrada (tap → start), no marcar fila.
  return { highScores, lastRank: isEnded(state.phase) ? lastRank : null };
}
