import { StyleSheet, Text, View } from 'react-native';

import type { GameState } from '../game/types';

interface Props {
  state: GameState;
  scale: number;
}

// Vidas, nivel y puntos en la franja superior del mundo (encima de los bloques).
export function Hud({ state, scale }: Props) {
  const text = [styles.text, { fontSize: 18 * scale }];
  return (
    <View style={[styles.bar, { top: 22 * scale, paddingHorizontal: 16 * scale }]}>
      <Text style={text}>Vidas: {state.lives}</Text>
      <Text style={text}>Nivel {state.level}</Text>
      <Text style={text}>Puntos: {state.score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
});
