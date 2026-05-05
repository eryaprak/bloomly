import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { BonusType } from '@/engine/types';

interface BonusPopupProps {
  bonusType: BonusType;
  bonusGold: number;
  onDone?: () => void;
}

const BONUS_CONFIG: Record<
  NonNullable<BonusType>,
  { label: string; color: string; emoji: string }
> = {
  combo:      { label: 'COMBO!',      color: '#FFD700', emoji: '⚡' },
  chain:      { label: 'CHAIN!',      color: '#FF69B4', emoji: '🔗' },
  close_call: { label: 'CLOSE CALL!', color: '#FF6B35', emoji: '🔥' },
};

export default function BonusPopup({ bonusType, bonusGold, onDone }: BonusPopupProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.7);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!bonusType) return;

    const dismiss = () => {
      onDoneRef.current?.();
    };

    // Reset
    translateY.value = 0;
    opacity.value = 0;
    scale.value = 0.7;

    // Animate: pop in → hold → fade up and out
    opacity.value = withSequence(
      withTiming(1, { duration: 200, easing: Easing.out(Easing.back(1.5)) }),
      withTiming(1, { duration: 800 }),
      withTiming(0, { duration: 400 }, (finished) => {
        if (finished) runOnJS(dismiss)();
      }),
    );
    scale.value = withSequence(
      withTiming(1.1, { duration: 200, easing: Easing.out(Easing.back(1.5)) }),
      withTiming(1.0, { duration: 100 }),
      withTiming(1.0, { duration: 800 }),
      withTiming(0.8, { duration: 400 }),
    );
    translateY.value = withSequence(
      withTiming(-6, { duration: 200 }),
      withTiming(-10, { duration: 800 }),
      withTiming(-40, { duration: 400 }),
    );
  }, [bonusType, bonusGold]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (!bonusType) return null;

  const cfg = BONUS_CONFIG[bonusType];

  return (
    <Animated.View style={[styles.container, animStyle]}>
      <Text style={styles.emoji}>{cfg.emoji}</Text>
      <Text style={[styles.label, { color: cfg.color }]}>{cfg.label}</Text>
      {bonusGold > 0 && (
        <Text style={[styles.gold, { color: cfg.color }]}>+{bonusGold} 🌼</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 100,
    flexDirection: 'row',
    gap: 8,
  },
  emoji: {
    fontSize: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  gold: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 2,
  },
});
