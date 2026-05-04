import React, { useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Canvas,
  Image,
  useImage,
  RoundedRect,
  Rect,
  Group,
  Shadow,
  LinearGradient,
  vec,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useGameStore } from '@/stores/gameStore';
import { PetalColor, Vase as VaseType } from '@/engine/types';

const VASE_W = 64;
const VASE_H = 96;
const VASE_GAP = 12;

const VASE_SOURCES = [
  require('@assets/vases/vase_ceramic.png'),
  require('@assets/vases/vase_crystal.png'),
  require('@assets/vases/vase_glass.png'),
  require('@assets/vases/vase_gold.png'),
];

const COLOR_MAP: Record<PetalColor, string> = {
  red:    '#FF3B3B',
  pink:   '#FF5BA8',
  purple: '#9B40F0',
  yellow: '#F5C000',
  green:  '#18B850',
  blue:   '#2E78F0',
};

const COLOR_LIGHT: Record<PetalColor, string> = {
  red:    '#FF8888',
  pink:   '#FFB0D0',
  purple: '#C880FF',
  yellow: '#FFE880',
  green:  '#80EE80',
  blue:   '#80C8FF',
};

function VaseItem({ vase, index }: { vase: VaseType; index: number }) {
  const imgSrc = VASE_SOURCES[index % VASE_SOURCES.length];
  const image = useImage(imgSrc);

  const fillRatio = vase.capacity > 0 ? vase.filled / vase.capacity : 0;
  const targetFillHeight = Math.round(fillRatio * (VASE_H - 22));

  // Animate fill height with spring
  const animFillH = useSharedValue(targetFillHeight);
  const prevFillH = useRef(targetFillHeight);

  useEffect(() => {
    if (targetFillHeight !== prevFillH.current) {
      prevFillH.current = targetFillHeight;
      animFillH.value = withSpring(targetFillHeight, { damping: 14, stiffness: 160 });
    }
  }, [targetFillHeight]);

  const fillColor = COLOR_MAP[vase.color];
  const fillColorLight = COLOR_LIGHT[vase.color];

  // Bloom burst + pulse animation
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);
  const wasBloomed = useRef(false);

  useEffect(() => {
    if (vase.isBloomed && !wasBloomed.current) {
      wasBloomed.current = true;
      // Burst
      pulseScale.value = withSequence(
        withSpring(1.22, { damping: 7, stiffness: 220 }),
        withSpring(1.0, { damping: 10, stiffness: 180 }),
      );
      // Then settle into gentle pulse
      setTimeout(() => {
        pulseScale.value = withRepeat(
          withSequence(
            withTiming(1.1, { duration: 650 }),
            withTiming(1.0, { duration: 650 }),
          ),
          -1,
          false,
        );
        pulseOpacity.value = withRepeat(
          withSequence(
            withTiming(0.72, { duration: 650 }),
            withTiming(1, { duration: 650 }),
          ),
          -1,
          false,
        );
      }, 700);
    } else if (!vase.isBloomed) {
      wasBloomed.current = false;
      pulseScale.value = withSpring(1);
      pulseOpacity.value = withTiming(1);
    }
  }, [vase.isBloomed]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  // Derive static fill values for canvas (Skia can't use shared values directly without AnimatedCanvas)
  const fillH = targetFillHeight;
  const fillY = VASE_H - 12 - fillH;

  if (!image) return null;

  return (
    <Animated.View style={[{ width: VASE_W, height: VASE_H }, animStyle]}>
      <Canvas style={{ width: VASE_W, height: VASE_H }}>
        <Group>
          {/* Bloom glow halo */}
          {vase.isBloomed && (
            <RoundedRect x={1} y={1} width={VASE_W - 2} height={VASE_H - 2} r={10} color={fillColor} opacity={0}>
              <Shadow dx={0} dy={0} blur={24} color={fillColor} />
            </RoundedRect>
          )}

          {/* Gradient fill bar (light at top, rich at bottom) */}
          {fillH > 0 && (
            <Rect x={7} y={fillY} width={VASE_W - 14} height={fillH} color={fillColor} opacity={0.7}>
              <LinearGradient
                start={vec(VASE_W / 2, fillY)}
                end={vec(VASE_W / 2, fillY + fillH)}
                colors={[fillColorLight, fillColor]}
              />
            </Rect>
          )}

          {/* Vase image */}
          <Image image={image} x={0} y={0} width={VASE_W} height={VASE_H} fit="contain" />

          {/* Bloomed color overlay */}
          {vase.isBloomed && (
            <RoundedRect
              x={3}
              y={3}
              width={VASE_W - 6}
              height={VASE_H - 6}
              r={10}
              color={fillColor}
              opacity={0.42}
            />
          )}

          {/* Top sheen highlight */}
          {fillH > 6 && (
            <Rect
              x={10}
              y={fillY + 2}
              width={VASE_W - 28}
              height={Math.min(8, fillH - 4)}
              color="rgba(255,255,255,0.22)"
            />
          )}
        </Group>
      </Canvas>
    </Animated.View>
  );
}

export default function VaseRow() {
  const gameState = useGameStore((s) => s.gameState);

  const vases = gameState?.vases ?? [];

  const totalWidth = useMemo(
    () => vases.length * VASE_W + (vases.length - 1) * VASE_GAP,
    [vases.length],
  );

  if (!gameState) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.row, { width: totalWidth }]}>
        {vases.map((vase, i) => (
          <View key={`${vase.color}-${i}`} style={styles.vaseWrapper}>
            <VaseItem vase={vase} index={i} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    gap: VASE_GAP,
    alignItems: 'flex-end',
  },
  vaseWrapper: {
    width: VASE_W,
    height: VASE_H,
  },
});
