import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { useGameSounds } from './src/audio/useGameSounds';
import { GameCanvas } from './src/components/GameCanvas';
import { useGameLoop } from './src/hooks/useGameLoop';
import { useGameInput } from './src/input/useGameInput';
import { useHighScores } from './src/storage/useHighScores';

export default function App() {
  const { viewProps, readInput } = useGameInput();
  const state = useGameLoop(readInput);
  useGameSounds(state);
  const { highScores, lastRank } = useHighScores(state);

  return (
    <View style={styles.container} {...viewProps}>
      <GameCanvas state={state} highScores={highScores} lastRank={lastRank} />
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
