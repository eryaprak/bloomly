import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePlayerStore } from '@/stores/playerStore';
import '@/i18n';

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

export default function LevelCompleteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { levelId, stars: starsParam, score: scoreParam, movesLeft: movesLeftParam } = useLocalSearchParams<{
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
  const [goldAnim] = useState(new Animated.Value(0));
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    completeLevel(levelId_, stars);
    addGold(rewardGold);

    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.1, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1.0, useNativeDriver: true }),
    ]).start();

    Animated.timing(goldAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tierColors: Record<RewardTier, string> = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold:   '#FFD700',
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Bloom emoji big */}
        <Animated.Text style={[styles.bigBloom, { transform: [{ scale: scaleAnim }] }]}>
          🌸
        </Animated.Text>

        <Text style={styles.title}>{t('levelComplete')}</Text>
        <Text style={styles.score}>{score.toLocaleString()}</Text>

        {/* Stars */}
        <View style={styles.starsRow}>
          {[1, 2, 3].map((s) => (
            <Text key={s} style={[styles.star, s <= stars ? styles.starActive : styles.starInactive]}>
              ★
            </Text>
          ))}
        </View>

        {/* Reward */}
        <View style={[styles.rewardCard, { borderColor: tierColors[rewardTier] }]}>
          <Text style={[styles.rewardTitle, { color: tierColors[rewardTier] }]}>
            {t(`reward${rewardTier.charAt(0).toUpperCase() + rewardTier.slice(1)}` as 'rewardGold')}
          </Text>
          <Animated.Text style={styles.rewardGold}>
            {t('goldReward', { amount: rewardGold })}
          </Animated.Text>
        </View>

        {/* Next level button */}
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => router.push(`/level/${levelId_ + 1}`)}
        >
          <Text style={styles.nextBtnText}>{t('nextLevel')} →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mapBtn}
          onPress={() => router.push('/(tabs)/')}
        >
          <Text style={styles.mapBtnText}>{t('levelMap')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1A0A2E',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  bigBloom: {
    fontSize: 96,
  },
  title: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  score: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  star: {
    fontSize: 40,
  },
  starActive: {
    color: '#FFD700',
  },
  starInactive: {
    color: '#444444',
  },
  rewardCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  rewardGold: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: '800',
  },
  nextBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  mapBtn: {
    paddingVertical: 10,
  },
  mapBtnText: {
    color: '#AAAAAA',
    fontSize: 14,
  },
});
