import React, { useEffect, useRef, useState } from 'react';
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
  withDelay,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePlayerStore } from '@/stores/playerStore';
import '@/i18n';

const { width: W, height: H } = Dimensions.get('window');

type RewardTier = 'bronze' | 'silver' | 'gold';

function getRewardTier(stars: number): RewardTier {
  if (stars === 3) return 'gold';
  if (stars === 2) return 'silver';
  return 'bronze';
}

function getRewardGold(tier: RewardTier): number {
  switch (tier) {
    case 'gold':   return 80 + Math.floor(Math.random() * 40);
    case 'silver': return 40 + Math.floor(Math.random() * 20);
    default:       return 10 + Math.floor(Math.random() * 15);
  }
}

// Pre-computed confetti pieces
const CONFETTI_PIECES = Array.from({ length: 40 }, (_, i) => ({
  x: (i / 40) * W * 1.1 - W * 0.05,
  startY: -20 - (i % 5) * 30,
  endY: H + 30,
  color: [
    '#FFD700', '#FF5BA8', '#18B850', '#2E78F0',
    '#F5C000', '#9B40F0', '#FF3B3B', '#80EE80',
  ][i % 8],
  w: 7 + (i % 4) * 3,
  h: 4 + (i % 3) * 2,
  rotation: (i * 37) % 360,
  duration: 1800 + (i % 6) * 280,
  delay: (i % 8) * 120,
}));

function ConfettiPiece({ piece }: { piece: typeof CONFETTI_PIECES[0] }) {
  const y = useSharedValue(piece.startY);
  const rotate = useSharedValue(piece.rotation);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(piece.delay, withTiming(1, { duration: 200 }));
    y.value = withDelay(
      piece.delay,
      withTiming(piece.endY, { duration: piece.duration }),
    );
    rotate.value = withDelay(
      piece.delay,
      withRepeat(
        withSequence(
          withTiming(piece.rotation + 360, { duration: piece.duration / 2 }),
          withTiming(piece.rotation + 720, { duration: piece.duration / 2 }),
        ),
        1,
        false,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: piece.x },
      { translateY: y.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: piece.w,
          height: piece.h,
          backgroundColor: piece.color,
          borderRadius: 2,
        },
        style,
      ]}
    />
  );
}

function AnimatedStar({ index, active }: { index: number; active: boolean }) {
  const scale = useSharedValue(0);
  const rotate = useSharedValue('-30deg');

  useEffect(() => {
    if (active) {
      scale.value = withDelay(
        index * 220,
        withSpring(1, { damping: 7, stiffness: 200 }),
      );
      rotate.value = withDelay(
        index * 220,
        withSpring('0deg', { damping: 8 }),
      );
    }
  }, [active, index]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: rotate.value }],
  }));

  return (
    <Animated.Text style={[styles.star, active ? styles.starActive : styles.starInactive, style]}>
      ★
    </Animated.Text>
  );
}

export default function LevelCompleteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    levelId,
    stars: starsParam,
    score: scoreParam,
    movesLeft: movesLeftParam,
  } = useLocalSearchParams<{
    levelId: string;
    stars: string;
    score: string;
    movesLeft: string;
  }>();

  const completeLevel = usePlayerStore((s) => s.completeLevel);
  const addGold = usePlayerStore((s) => s.addGold);

  const levelId_ = parseInt(levelId ?? '1', 10);
  const stars = parseInt(starsParam ?? '1', 10) as 0 | 1 | 2 | 3;
  const score = parseInt(scoreParam ?? '0', 10);
  const movesLeft = parseInt(movesLeftParam ?? '0', 10);
  const efficiencyBonus = movesLeft * 10;

  const [rewardTier] = useState<RewardTier>(getRewardTier(stars));
  const [rewardGold] = useState(() => getRewardGold(getRewardTier(stars)));

  const bloomScale = useSharedValue(0);
  const bloomRotate = useSharedValue('-15deg');
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const cardScale = useSharedValue(0.85);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    completeLevel(levelId_, stars);
    addGold(rewardGold);

    bloomScale.value = withSpring(1, { damping: 8, stiffness: 160 });
    bloomRotate.value = withSpring('0deg', { damping: 10 });

    titleOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    titleY.value = withDelay(300, withSpring(0, { damping: 12 }));

    cardScale.value = withDelay(500, withSpring(1, { damping: 12, stiffness: 150 }));
    cardOpacity.value = withDelay(500, withTiming(1, { duration: 350 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bloomStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bloomScale.value }, { rotate: bloomRotate.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const tierColors: Record<RewardTier, string> = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold:   '#FFD700',
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={['#0D2A0A', '#1A4A10', '#0D3508', '#050D02']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Confetti */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {CONFETTI_PIECES.map((piece, i) => (
          <ConfettiPiece key={i} piece={piece} />
        ))}
      </View>

      <View style={styles.container}>
        {/* Big bloom */}
        <Animated.Text style={[styles.bigBloom, bloomStyle]}>
          🌸
        </Animated.Text>

        <Animated.View style={titleStyle}>
          <Text style={styles.title}>{t('levelComplete')}</Text>
          <Text style={styles.score}>{score.toLocaleString()}</Text>
        </Animated.View>

        {/* Stars */}
        <View style={styles.starsRow}>
          {[1, 2, 3].map((s) => (
            <AnimatedStar key={s} index={s - 1} active={s <= stars} />
          ))}
        </View>

        {/* Reward */}
        <Animated.View style={[styles.rewardCard, { borderColor: tierColors[rewardTier] }, cardStyle]}>
          <Text style={[styles.rewardTitle, { color: tierColors[rewardTier] }]}>
            {t(`reward${rewardTier.charAt(0).toUpperCase() + rewardTier.slice(1)}` as 'rewardGold')}
          </Text>
          <Text style={styles.rewardGold}>
            {t('goldReward', { amount: rewardGold })}
          </Text>
          {efficiencyBonus > 0 && (
            <Text style={styles.efficiencyBonus}>
              {`Kalan hamle: ${movesLeft} → +${efficiencyBonus} 🌼`}
            </Text>
          )}
        </Animated.View>

        <Animated.View style={[{ width: '100%', gap: 12 }, cardStyle]}>
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => router.push(`/level/${levelId_ + 1}`)}
          >
            <LinearGradient
              colors={['#2E8C1A', '#1E6010']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.nextBtnText}>{t('nextLevel')} →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mapBtn}
            onPress={() => router.push('/(tabs)/')}
          >
            <Text style={styles.mapBtnText}>{t('levelMap')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0D2A0A',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  bigBloom: {
    fontSize: 100,
    textShadowColor: 'rgba(255,200,80,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  title: {
    color: '#FFD700',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255,215,0,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  score: {
    color: '#C8E8B0',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  star: {
    fontSize: 44,
  },
  starActive: {
    color: '#FFD700',
    textShadowColor: 'rgba(255,215,0,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  starInactive: {
    color: '#2A4020',
  },
  rewardCard: {
    borderWidth: 2,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(10,25,8,0.85)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  rewardGold: {
    color: '#FFD700',
    fontSize: 26,
    fontWeight: '800',
    textShadowColor: 'rgba(255,215,0,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  efficiencyBonus: {
    color: '#90EE90',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    opacity: 0.9,
  },
  nextBtn: {
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(100,200,80,0.5)',
    shadowColor: '#2E8C1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  mapBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  mapBtnText: {
    color: '#7A9A70',
    fontSize: 14,
    fontWeight: '600',
  },
});
