import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useLifeTimer } from '@/hooks/useLifeTimer';
import BonusPopup from '@/components/game/BonusPopup';
import { BonusType } from '@/engine/types';

interface HUDProps {
  levelId: number;
  onBooster?: (type: 'scissors' | 'wind' | 'sun' | 'key') => void;
}

export default function HUD({ levelId, onBooster }: HUDProps) {
  const { t } = useTranslation();
  const gameState = useGameStore((s) => s.gameState);
  const lastResult = useGameStore((s) => s.lastResult);
  const gold = usePlayerStore((s) => s.gold);
  const { lives, maxLives, countdown } = useLifeTimer();

  const movesLeft = gameState?.movesLeft ?? 0;
  const score = gameState?.score ?? 0;

  // Score flash animation
  const scoreFlash = useRef(new Animated.Value(1)).current;
  const prevScore = useRef(score);

  useEffect(() => {
    if (score !== prevScore.current) {
      prevScore.current = score;
      Animated.sequence([
        Animated.timing(scoreFlash, { toValue: 1.35, duration: 120, useNativeDriver: true }),
        Animated.spring(scoreFlash, { toValue: 1, useNativeDriver: true }),
      ]).start();
    }
  }, [score, scoreFlash]);

  // ── Bonus popup state ──────────────────────────────────────────────────────
  const [activeBonusType, setActiveBonusType] = useState<BonusType>(null);
  const [activeBonusGold, setActiveBonusGold] = useState(0);
  const bonusKey = useRef(0);

  useEffect(() => {
    if (lastResult?.bonusType && lastResult.bonusGold > 0) {
      bonusKey.current += 1;
      setActiveBonusType(lastResult.bonusType);
      setActiveBonusGold(lastResult.bonusGold);
    }
  }, [lastResult]);

  const handleBonusDone = () => {
    setActiveBonusType(null);
    setActiveBonusGold(0);
  };
  // ──────────────────────────────────────────────────────────────────────────

  const isMovesLow = movesLeft <= 5;
  const movesColor = isMovesLow ? '#FF6B35' : '#FFFFFF';

  return (
    <View style={styles.container}>
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={[styles.hudChip, isMovesLow && styles.hudChipWarning]}>
          <Text style={styles.chipLabel}>{t('moves')}</Text>
          <Text style={[styles.chipValue, { color: movesColor }]}>{movesLeft}</Text>
        </View>

        <View style={styles.centerChip}>
          <Text style={styles.levelText}>{t('level')} {levelId}</Text>
          <View style={styles.livesRow}>
            {Array.from({ length: maxLives }).map((_, i) => (
              <Text key={i} style={[styles.heart, i < lives ? styles.heartFull : styles.heartEmpty]}>
                ♥
              </Text>
            ))}
            {lives < maxLives && countdown ? (
              <Text style={styles.countdownText}>{countdown}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.hudChip}>
          <Text style={styles.chipLabel}>{t('gold')}</Text>
          <Text style={styles.chipValue}>🌼 {gold}</Text>
        </View>
      </View>

      {/* Score row — bonus popup floats above it */}
      <View style={styles.scoreRow}>
        <Animated.Text style={[styles.scoreText, { transform: [{ scale: scoreFlash }] }]}>
          {score.toLocaleString()}
        </Animated.Text>

        {activeBonusType && (
          <BonusPopup
            key={bonusKey.current}
            bonusType={activeBonusType}
            bonusGold={activeBonusGold}
            onDone={handleBonusDone}
          />
        )}
      </View>

      {/* Booster row */}
      <View style={styles.boosterRow}>
        {(['scissors', 'wind', 'sun', 'key'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={styles.boosterBtn}
            onPress={() => onBooster?.(type)}
          >
            <Text style={styles.boosterIcon}>
              {type === 'scissors' ? '✂️' : type === 'wind' ? '💨' : type === 'sun' ? '☀️' : '🔑'}
            </Text>
            <Text style={styles.boosterLabel}>
              {t(`booster${type.charAt(0).toUpperCase() + type.slice(1)}` as 'boosterScissors')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(180,120,255,0.15)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hudChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 72,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  hudChipWarning: {
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
  },
  centerChip: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  levelText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    textShadowColor: 'rgba(168,85,247,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  livesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  heart: {
    fontSize: 14,
    marginHorizontal: 1,
  },
  heartFull: {
    color: '#FF4444',
  },
  heartEmpty: {
    color: '#555555',
  },
  countdownText: {
    color: '#AAAAAA',
    fontSize: 11,
    marginLeft: 4,
  },
  chipLabel: {
    color: '#CCCCCC',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  chipValue: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  scoreRow: {
    alignItems: 'center',
    marginTop: 4,
  },
  scoreText: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: '800',
    textShadowColor: 'rgba(255,215,0,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  boosterRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 8,
  },
  boosterBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 60,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  boosterIcon: {
    fontSize: 20,
  },
  boosterLabel: {
    color: '#FFFFFF',
    fontSize: 9,
    marginTop: 2,
  },
});
