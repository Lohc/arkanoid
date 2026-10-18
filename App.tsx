import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { GameCanvas } from './src/components/GameCanvas';
import type { Input } from './src/game/types';
import { useGameLoop } from './src/hooks/useGameLoop';

// Sin controles todavía (paso 8).
const idleInput: Input = { paddleTargetX: null, keyDir: 0, tap: false };
const readIdleInput = () => idleInput;

export default function App() {
  const state = useGameLoop(readIdleInput);

  return (
    <View style={styles.container}>
      <GameCanvas state={state} />
      <StatusBar style='light' hidden />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
