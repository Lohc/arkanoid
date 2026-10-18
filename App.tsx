import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { GameCanvas } from './src/components/GameCanvas';
import { useGameLoop } from './src/hooks/useGameLoop';
import { useGameInput } from './src/input/useGameInput';

export default function App() {
  const { viewProps, readInput } = useGameInput();
  const state = useGameLoop(readInput);

  return (
    <View style={styles.container} {...viewProps}>
      <GameCanvas state={state} />
      <StatusBar style="light" hidden />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
