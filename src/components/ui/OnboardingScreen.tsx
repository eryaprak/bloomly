import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width: W } = Dimensions.get('window');

interface OnboardingStep {
  emoji: string;
  title: string;
  subtitle: string;
  bg: string;
}

const STEPS: OnboardingStep[] = [
  {
    emoji: '🌸',
    title: 'Welcome to Bloomly!',
    subtitle: 'A relaxing flower puzzle game. Sort petals, fill vases, and build your dream garden.',
    bg: '#0D2A1A',
  },
  {
    emoji: '🎮',
    title: 'Tap Petals to Sort',
    subtitle: 'Tap flower petals on the board to move them into your dock. Fill a vase with matching colors to bloom it!',
    bg: '#1C4A8A',
  },
  {
    emoji: '🌼',
    title: 'Earn Stars & Gold',
    subtitle: 'Complete levels to earn stars. Use them to unlock beautiful garden decorations.',
    bg: '#2D1B5C',
  },
  {
    emoji: '🏡',
    title: 'Grow Your Garden',
    subtitle: 'Unlock benches, fountains, trees and more. Build the garden of your dreams!',
    bg: '#0D1F0D',
  },
];

interface OnboardingScreenProps {
  onDone: () => void;
}

export default function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const emojiScale = useSharedValue(1);
  const contentOpacity = useSharedValue(1);

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  function goNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (isLast) {
      onDone();
      return;
    }
    contentOpacity.value = withTiming(0, { duration: 180 }, () => {
      contentOpacity.value = withTiming(1, { duration: 220 });
    });
    emojiScale.value = withSpring(1.2, { damping: 6 }, () => {
      emojiScale.value = withSpring(1, { damping: 8 });
    });
    setStep((s) => s + 1);
  }

  function skip() {
    Haptics.selectionAsync().catch(() => {});
    onDone();
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: currentStep.bg }]}>
      <View style={styles.skipRow}>
        {!isLast && (
          <TouchableOpacity onPress={skip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <Animated.Text style={[styles.emoji, emojiStyle]}>
          {currentStep.emoji}
        </Animated.Text>

        <Animated.View style={[styles.textBlock, contentStyle]}>
          <Text style={styles.title}>{currentStep.title}</Text>
          <Text style={styles.subtitle}>{currentStep.subtitle}</Text>
        </Animated.View>
      </View>

      {/* Dots */}
      <View style={styles.dotsRow}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === step ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.nextBtn, isLast && styles.nextBtnLast]}
        onPress={goNext}
        activeOpacity={0.85}
      >
        <Text style={styles.nextBtnText}>
          {isLast ? "Let's Play! 🌸" : 'Next →'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  skipRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 8,
    minHeight: 36,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 28,
  },
  emoji: {
    fontSize: 100,
  },
  textBlock: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#FFD700',
    width: 24,
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  nextBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#A78BFA',
  },
  nextBtnLast: {
    backgroundColor: '#16A34A',
    borderColor: '#4ADE80',
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});
