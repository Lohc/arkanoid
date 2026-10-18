import { StyleSheet, Text, View } from 'react-native';

import type { Phase } from '../game/types';

interface Message {
  title?: string;
  hint: string;
  dim: boolean; // oscurece el juego detrás del texto
}

const MESSAGES: Partial<Record<Phase, Message>> = {
  start: { hint: 'Toca para empezar', dim: false },
  serve: { hint: 'Toca para sacar', dim: false },
  paused: { title: 'Pausa', hint: 'Toca para seguir', dim: true },
  gameover: { title: 'Game Over', hint: 'Toca para reiniciar', dim: true },
  won: { title: '¡Victoria!', hint: 'Toca para reiniciar', dim: true },
};

interface Props {
  phase: Phase;
  scale: number;
}

// Textos de cada fase sobre el área de juego. En `playing` no muestra nada.
export function Overlay({ phase, scale }: Props) {
  const message = MESSAGES[phase];
  if (!message) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.layer, message.dim && styles.dim]}>
      {message.title && (
        <Text style={[styles.title, { fontSize: 40 * scale, marginBottom: 12 * scale }]}>
          {message.title}
        </Text>
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
});
