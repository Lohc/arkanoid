import { StyleSheet, Text, View } from 'react-native';

import { formatHighScoreDate, type HighScore } from '../game/highScores';
import type { Phase } from '../game/types';

interface Message {
  title?: string | ((level: number) => string);
  hint: string;
  dim: boolean; // oscurece el juego detrás del texto
}

const MESSAGES: Partial<Record<Phase, Message>> = {
  start: { hint: 'Toca para empezar', dim: false },
  serve: { hint: 'Toca para sacar', dim: false },
  levelClear: {
    title: (level) => `Nivel ${level} superado`,
    hint: 'Toca para continuar',
    dim: true,
  },
  paused: { title: 'Pausa', hint: 'Toca para seguir', dim: true },
  gameover: { title: 'Game Over', hint: 'Toca para reiniciar', dim: true },
  won: { title: '¡Victoria!', hint: 'Toca para reiniciar', dim: true },
};

// Fases que muestran la tabla de récords.
const SHOWS_HIGH_SCORES: Phase[] = ['start', 'gameover', 'won'];

// Ancho de cada columna (posición, puntos, nivel, fecha) en px de mundo.
const COLUMNS = [32, 80, 56, 112];

interface Props {
  phase: Phase;
  level: number;
  scale: number;
  highScores: HighScore[];
  lastRank: number | null;
}

// Textos de cada fase sobre el área de juego. En `playing` no muestra nada.
export function Overlay({ phase, level, scale, highScores, lastRank }: Props) {
  const message = MESSAGES[phase];
  if (!message) return null;
  const title = typeof message.title === 'function' ? message.title(level) : message.title;
  const showTable = SHOWS_HIGH_SCORES.includes(phase) && highScores.length > 0;

  const row = (cells: string[], style: object, key?: number) => (
    <View key={key} style={styles.row}>
      {cells.map((cell, i) => (
        <Text
          key={i}
          style={[styles.cell, style, { width: COLUMNS[i] * scale, fontSize: 14 * scale }]}
        >
          {cell}
        </Text>
      ))}
    </View>
  );

  return (
    <View style={[StyleSheet.absoluteFill, styles.layer, message.dim && styles.dim]}>
      {title && (
        <Text style={[styles.title, { fontSize: 40 * scale, marginBottom: 12 * scale }]}>
          {title}
        </Text>
      )}
      {lastRank === 0 && (
        <Text style={[styles.record, { fontSize: 22 * scale, marginBottom: 12 * scale }]}>
          ¡Nuevo récord!
        </Text>
      )}
      {showTable && (
        <View style={{ marginBottom: 16 * scale }}>
          <Text style={[styles.heading, { fontSize: 16 * scale, marginBottom: 6 * scale }]}>
            Mejores puntuaciones
          </Text>
          {row(['#', 'Puntos', 'Nivel', 'Fecha'], styles.columnLabel)}
          {highScores.map((h, i) =>
            row(
              [`${i + 1}`, `${h.score}`, `${h.level}`, formatHighScoreDate(h.date)],
              i === lastRank ? styles.current : styles.entry,
              i,
            ),
          )}
        </View>
      )}
      <Text style={[styles.hint, { fontSize: 20 * scale }]}>{message.hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Centrado en la zona libre entre bloques y paddle.
  layer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '15%',
  },
  dim: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
  },
  hint: {
    color: '#fff',
  },
  record: {
    color: '#ff0',
    fontWeight: 'bold',
  },
  heading: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    textAlign: 'center',
  },
  columnLabel: {
    color: '#aaa',
  },
  entry: {
    color: '#fff',
  },
  current: {
    color: '#ff0',
  },
});
