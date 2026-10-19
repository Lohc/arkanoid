import { useAudioPlayer } from 'expo-audio';
import { useEffect } from 'react';

import type { GameState } from '../game/types';

// Reproduce los sonidos que el engine produjo en el paso de `state`. Un player por
// sonido: si vuelve a dispararse mientras suena, se reinicia desde 0.
export function useGameSounds(state: GameState): void {
  const bounce = useAudioPlayer(require('../../assets/sounds/ball-bounce.mp3'));
  const breakSound = useAudioPlayer(require('../../assets/sounds/break-sound.mp3'));

  useEffect(() => {
    for (const sound of state.sounds) {
      const player = sound === 'bounce' ? bounce : breakSound;
      player.seekTo(0);
      player.play();
    }
  }, [state, bounce, breakSound]);
}
