import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, Image, useImage, RoundedRect, Rect, Group, Shadow } from '@shopify/react-native-skia';
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
  red:    '#FF4444',
  pink:   '#FF69B4',
  purple: '#A855F7',
  yellow: '#FACC15',
  green:  '#22C55E',
  blue:   '#3B82F6',
};

function VaseItem({ vase, index }: { vase: VaseType; index: number }) {
  const imgSrc = VASE_SOURCES[index % VASE_SOURCES.length];
  const image = useImage(imgSrc);

  const fillRatio = vase.capacity > 0 ? vase.filled / vase.capacity : 0;
  const fillHeight = Math.round(fillRatio * (VASE_H - 20));
  const fillY = VASE_H - 10 - fillHeight;
  const fillColor = COLOR_MAP[vase.color];

  // Bloom pulse animation
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (vase.isBloomed) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 600 }),
          withTiming(1, { duration: 600 }),
        ),
        -1,
        false,
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 600 }),
          withTiming(1, { duration: 600 }),
        ),
        -1,
        false,
      );
    } else {
      pulseScale.value = withSpring(1);
      pulseOpacity.value = withTiming(1);
    }
  }, [vase.isBloomed, pulseScale, pulseOpacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  if (!image) return null;

  return (
    <Animated.View style={[{ width: VASE_W, height: VASE_H }, animStyle]}>
      <Canvas style={{ width: VASE_W, height: VASE_H }}>
        <Group>
          {/* Glow shadow for bloomed vase */}
          {vase.isBloomed && (
            <RoundedRect x={2} y={2} width={VASE_W - 4} height={VASE_H - 4} r={8} color={fillColor} opacity={0}>
              <Shadow dx={0} dy={0} blur={16} color={fillColor} />
            </RoundedRect>
          )}
          {/* Fill bar */}
          {fillHeight > 0 && (
            <Rect
              x={6}
              y={fillY}
              width={VASE_W - 12}
              height={fillHeight}
              color={fillColor}
              opacity={0.6}
            />
          )}
          {/* Vase image on top */}
          <Image image={image} x={0} y={0} width={VASE_W} height={VASE_H} fit="contain" />
          {/* Bloomed overlay */}
          {vase.isBloomed && (
            <RoundedRect
              x={2}
              y={2}
              width={VASE_W - 4}
              height={VASE_H - 4}
              r={8}
              color={fillColor}
              opacity={0.3}
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
