import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Image, useImage, Circle, Group } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { PetalColor } from '@/engine/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BLOOM_SIZE = 220;

const BLOOM_SOURCES: Record<PetalColor, number> = {
  red:    require('@assets/bloom/bloom_red.png'),
  pink:   require('@assets/bloom/bloom_pink.png'),
  purple: require('@assets/bloom/bloom_purple.png'),
  yellow: require('@assets/bloom/bloom_yellow.png'),
  green:  require('@assets/bloom/bloom_green.png'),
  blue:   require('@assets/bloom/bloom_blue.png'),
};

const PARTICLE_COLORS: Record<PetalColor, string[]> = {
  red:    ['#FF3B3B', '#FF7777', '#FFAAAA'],
  pink:   ['#FF5BA8', '#FFB0D0', '#FF1493'],
  purple: ['#9B40F0', '#C080FF', '#7020CC'],
  yellow: ['#F5C000', '#FFE066', '#F59E0B'],
  green:  ['#18B850', '#80EE80', '#0E7030'],
  blue:   ['#2E78F0', '#80C8FF', '#1040C0'],
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
  const cx = SCREEN_WIDTH / 2;
  const cy = SCREEN_HEIGHT / 2;
  return Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * Math.PI * 2 + (i % 3) * 0.18;
    const speed = 55 + (i % 5) * 22;
    return {
      cx,
      cy,
      r: 4 + (i % 4) * 2.5,
      color: colors[i % colors.length],
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    };
  });
}

// Individual animated particle rendered as a Reanimated View
function AnimatedParticle({
  particle,
  progress,
}: {
  particle: Particle;
  progress: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      transform: [
        { translateX: particle.cx + particle.vx * p - particle.r },
        { translateY: particle.cy + particle.vy * p + 40 * p * p - particle.r },
      ],
      opacity: p < 0.15 ? p / 0.15 : Math.max(0, 1 - (p - 0.4) / 0.6),
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: particle.r * 2,
          height: particle.r * 2,
          borderRadius: particle.r,
          backgroundColor: particle.color,
        },
        style,
      ]}
    />
  );
}

interface BloomAnimationProps {
  color: PetalColor;
  onComplete: () => void;
}

export default function BloomAnimation({ color, onComplete }: BloomAnimationProps) {
  const bloomScale = useSharedValue(0);
  const bloomOpacity = useSharedValue(0);
  const flashOpacity = useSharedValue(0);
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

    // Screen flash
    flashOpacity.value = withSequence(
      withTiming(0.2, { duration: 80 }),
      withTiming(0, { duration: 250 }),
    );

    // Bloom image
    bloomScale.value = withSequence(
      withSpring(1.3, { damping: 7, stiffness: 200 }),
      withTiming(1.0, { duration: 180 }),
      withDelay(750, withTiming(0, { duration: 380 })),
    );
    bloomOpacity.value = withSequence(
      withTiming(1, { duration: 250 }),
      withDelay(900, withTiming(0, { duration: 380 })),
    );

    // Particles
    particleProgress.value = withTiming(1, { duration: 1700 }, (finished) => {
      if (finished) runOnJS(handleComplete)();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bloomStyle = useAnimatedStyle(() => ({
    opacity: bloomOpacity.value,
    transform: [
      { translateX: (SCREEN_WIDTH - BLOOM_SIZE) / 2 },
      { translateY: (SCREEN_HEIGHT - BLOOM_SIZE) / 2 },
      { scale: bloomScale.value },
    ],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Screen flash */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }, flashStyle]}
      />

      {/* Particles (Reanimated Views — actually animate) */}
      {particles.map((p, i) => (
        <AnimatedParticle key={i} particle={p} progress={particleProgress} />
      ))}

      {/* Bloom image */}
      {image && (
        <Animated.View style={[{ position: 'absolute', width: BLOOM_SIZE, height: BLOOM_SIZE }, bloomStyle]}>
          <Canvas style={{ width: BLOOM_SIZE, height: BLOOM_SIZE }}>
            <Group>
              <Image
                image={image}
                x={0}
                y={0}
                width={BLOOM_SIZE}
                height={BLOOM_SIZE}
                fit="contain"
              />
            </Group>
          </Canvas>
        </Animated.View>
      )}
    </View>
  );
}
