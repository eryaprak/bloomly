import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useLifeTimer } from '@/hooks/useLifeTimer';
import BonusPopup from '@/components/game/BonusPopup';
import { BonusType } from '@/engine/types';
import { THEME } from '@/constants/theme';

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

  const score = gameState?.score ?? 0;
  const movesLeft = gameState?.movesLeft ?? 0;
  const maxMoves = gameState?.level.maxMoves ?? 0;

  const scoreFlash = useRef(new Animated.Value(1)).current;
  const prevScore = useRef(score);

  useEffect(() => {
    if (score !== prevScore.current) {
      prevScore.current = score;
      Animated.sequence([
        Animated.timing(scoreFlash, { toValue: 1.38, duration: 110, useNativeDriver: true }),
        Animated.spring(scoreFlash, { toValue: 1, useNativeDriver: true }),
      ]).start();
    }
  }, [score, scoreFlash]);

  const movesFlash = useRef(new Animated.Value(1)).current;
  const prevMoves = useRef(movesLeft);

  useEffect(() => {
    if (movesLeft !== prevMoves.current) {
      prevMoves.current = movesLeft;
      const isLow = movesLeft <= 5;
      Animated.sequence([
        Animated.timing(movesFlash, { toValue: isLow ? 1.5 : 1.2, duration: 100, useNativeDriver: true }),
        Animated.spring(movesFlash, { toValue: 1, useNativeDriver: true }),
      ]).start();
    }
  }, [movesLeft, movesFlash]);

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

  return (
    <View style={styles.container}>
      {/* Top golden highlight */}
      <View style={styles.topHighlight} />

      {/* Top row */}
      <View style={styles.topRow}>
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

        <View style={[styles.hudChip, movesLeft <= 5 && styles.hudChipDanger]}>
          <Text style={styles.chipLabel}>{t('moves')}</Text>
          <Animated.Text
            style={[
              styles.chipValue,
              movesLeft <= 5 && styles.movesLow,
              { transform: [{ scale: movesFlash }] },
            ]}
          >
            {movesLeft}
          </Animated.Text>
        </View>
      </View>

      {/* Score row */}
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
    paddingBottom: 7,
    backgroundColor: THEME.hud.bg,
    borderBottomWidth: 1.5,
    borderBottomColor: THEME.hud.border,
    shadowColor: THEME.hud.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1.5,
    backgroundColor: 'rgba(255,235,100,0.30)',
    borderRadius: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  hudChip: {
    alignItems: 'center',
    backgroundColor: THEME.hud.chipBg,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 76,
    borderWidth: 1.5,
    borderColor: THEME.hud.chipBorder,
    shadowColor: THEME.hud.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  centerChip: {
    alignItems: 'center',
    flex: 1,
  },
  levelText: {
    color: '#FFF8E0',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(212,175,55,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  livesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  heart: {
    fontSize: 13,
    marginHorizontal: 1,
  },
  heartFull: {
    color: '#FF4444',
    textShadowColor: 'rgba(255,50,50,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  heartEmpty: {
    color: '#4A3A2A',
  },
  countdownText: {
    color: '#C8A850',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '600',
  },
  chipLabel: {
    color: THEME.hud.labelColor,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipValue: {
    color: THEME.hud.goldColor,
    fontWeight: '800',
    fontSize: 17,
    textShadowColor: 'rgba(255,215,0,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  hudChipDanger: {
    borderColor: 'rgba(255,80,80,0.7)',
    backgroundColor: 'rgba(90,20,20,0.85)',
  },
  movesLow: {
    color: '#FF5555',
    textShadowColor: 'rgba(255,80,80,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  scoreRow: {
    alignItems: 'center',
    marginTop: 4,
  },
  scoreText: {
    color: '#FFD700',
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255,215,0,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  boosterRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 9,
  },
  boosterBtn: {
    alignItems: 'center',
    backgroundColor: THEME.booster.bg,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minWidth: 62,
    borderWidth: 1,
    borderColor: THEME.booster.border,
    shadowColor: THEME.booster.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  boosterIcon: {
    fontSize: 20,
  },
  boosterLabel: {
    color: '#D4B870',
    fontSize: 9,
    marginTop: 2,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
