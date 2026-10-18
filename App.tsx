import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { GameCanvas } from './src/components/GameCanvas';
import { createInitialState } from './src/game/engine';

const initialState = createInitialState();

export default function App() {
  return (
    <View style={styles.container}>
      <GameCanvas state={initialState} />
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
