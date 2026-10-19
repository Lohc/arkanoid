import {
  Canvas,
  FilterMode,
  MipmapMode,
  Picture,
  Skia,
  createPicture,
  useImage,
  type SkCanvas,
  type SkImage,
} from '@shopify/react-native-skia';
import { useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { WORLD_H, WORLD_W } from '../game/constants';
import { explosionFrame } from '../game/engine';
import { EXPLOSION_FRAMES, SPRITES, type SpriteFrame } from '../game/sprites';
import type { GameState } from '../game/types';
import { fitWorld } from '../game/viewport';
import { Hud } from './Hud';
import { Overlay } from './Overlay';

const BACKGROUND = '#10101c';
const LETTERBOX = '#000';

function drawSprite(
  canvas: SkCanvas,
  image: SkImage,
  frame: SpriteFrame,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  canvas.drawImageRectOptions(
    image,
    Skia.XYWHRect(frame.sx, frame.sy, frame.sw, frame.sh),
    Skia.XYWHRect(x, y, w, h),
    FilterMode.Nearest,
    MipmapMode.None,
  );
}

function drawWorld(canvas: SkCanvas, image: SkImage, state: GameState, scale: number) {
  canvas.scale(scale, scale);
  const bg = Skia.Paint();
  bg.setColor(Skia.Color(BACKGROUND));
  canvas.drawRect(Skia.XYWHRect(0, 0, WORLD_W, WORLD_H), bg);

  for (const b of state.bricks) {
    if (b.alive) drawSprite(canvas, image, SPRITES.blocks[b.color], b.x, b.y, b.w, b.h);
  }
  for (const e of state.explosions) {
    const frame = EXPLOSION_FRAMES[e.color][explosionFrame(e)];
    if (frame) drawSprite(canvas, image, frame, e.x, e.y, e.w, e.h);
  }
  const { paddle, ball } = state;
  drawSprite(canvas, image, SPRITES.paddle, paddle.x, paddle.y, paddle.w, paddle.h);
  drawSprite(canvas, image, SPRITES.ball, ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2);
}

interface Props {
  state: GameState;
}

// Dibuja el mundo 448×640 escalado uniformemente y centrado (letterbox).
// No recibe eventos: el input lo captura la View padre (useGameInput).
export function GameCanvas({ state }: Props) {
  const image = useImage(require('../../assets/spritesheet-breakout.png'));
  const [size, setSize] = useState({ w: 0, h: 0 });

  const { scale } = fitWorld(size.w, size.h);
  const width = WORLD_W * scale;
  const height = WORLD_H * scale;

  const picture = useMemo(
    () =>
      image && scale > 0
        ? createPicture((canvas) => drawWorld(canvas, image, state, scale))
        : null,
    [image, state, scale],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setSize({ w, h });
  };

  return (
    <View style={styles.container} onLayout={onLayout} pointerEvents="none">
      {picture && (
        <View style={{ width, height }}>
          <Canvas style={StyleSheet.absoluteFill}>
            <Picture picture={picture} />
          </Canvas>
          <Hud state={state} scale={scale} />
          <Overlay phase={state.phase} level={state.level} scale={scale} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LETTERBOX,
  },
});
