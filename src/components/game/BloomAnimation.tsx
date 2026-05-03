import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Image, useImage, Circle, Group } from '@shopify/react-native-skia';
import { useSharedValue, withSequence, withTiming, withDelay, runOnJS } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { PetalColor } from '@/engine/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BLOOM_SIZE = 200;

const BLOOM_SOURCES: Record<PetalColor, number> = {
  red:    require('@assets/bloom/bloom_red.png'),
  pink:   require('@assets/bloom/bloom_pink.png'),
  purple: require('@assets/bloom/bloom_purple.png'),
  yellow: require('@assets/bloom/bloom_yellow.png'),
  green:  require('@assets/bloom/bloom_green.png'),
  blue:   require('@assets/bloom/bloom_blue.png'),
};

const PARTICLE_COLORS: Record<PetalColor, string[]> = {
  red:    ['#FF4444', '#FF8888', '#FFAAAA'],
  pink:   ['#FF69B4', '#FFB6C1', '#FF1493'],
  purple: ['#A855F7', '#C084FC', '#7C3AED'],
  yellow: ['#FACC15', '#FDE68A', '#F59E0B'],
  green:  ['#22C55E', '#86EFAC', '#16A34A'],
  blue:   ['#3B82F6', '#93C5FD', '#1D4ED8'],
};

interface Particle {
  cx: number;
  cy: number;
  r: number;
  color: string;
  vx: number;
  vy: number;
}

function generateParticles(color: PetalColor): Particle[] {
  const colors = PARTICLE_COLORS[color];
  return Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * Math.PI * 2 + Math.random() * 0.3;
    const speed = 40 + Math.random() * 80;
    return {
      cx: SCREEN_WIDTH / 2,
      cy: SCREEN_HEIGHT / 2,
      r: 4 + Math.random() * 6,
      color: colors[i % colors.length],
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    };
  });
}

interface BloomAnimationProps {
  color: PetalColor;
  onComplete: () => void;
}

export default function BloomAnimation({ color, onComplete }: BloomAnimationProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const particleProgress = useSharedValue(0);

  const image = useImage(BLOOM_SOURCES[color]);
  const particles = useRef(generateParticles(color)).current;

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }, []);

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    runOnJS(triggerHaptic)();

    scale.value = withSequence(
      withTiming(1.2, { duration: 400 }),
      withTiming(1.0, { duration: 200 }),
      withDelay(800, withTiming(0, { duration: 400 })),
    );

    opacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(1000, withTiming(0, { duration: 400 })),
    );

    particleProgress.value = withTiming(1, { duration: 1800 }, (finished) => {
      if (finished) {
        runOnJS(handleComplete)();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!image) return null;

  const bloomX = (SCREEN_WIDTH - BLOOM_SIZE) / 2;
  const bloomY = (SCREEN_HEIGHT - BLOOM_SIZE) / 2;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
        <Group>
          {particles.map((p, i) => (
            <Circle
              key={i}
              cx={p.cx}
              cy={p.cy}
              r={p.r}
              color={p.color}
              opacity={0.8}
            />
          ))}
          <Group
            transform={[
              { translateX: SCREEN_WIDTH / 2 },
              { translateY: SCREEN_HEIGHT / 2 },
              { scale: 1 },
              { translateX: -SCREEN_WIDTH / 2 },
              { translateY: -SCREEN_HEIGHT / 2 },
            ]}
          >
            <Image
              image={image}
              x={bloomX}
              y={bloomY}
              width={BLOOM_SIZE}
              height={BLOOM_SIZE}
              fit="contain"
            />
          </Group>
        </Group>
      </Canvas>
    </View>
  );
}
