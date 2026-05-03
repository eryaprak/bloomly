import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { usePlayerStore } from '@/stores/playerStore';
import '@/i18n';

export default function LevelFailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { levelId, vasesCompleted, totalVases } = useLocalSearchParams<{
    levelId: string;
    vasesCompleted: string;
    totalVases: string;
  }>();

  const spendGold = usePlayerStore((s) => s.spendGold);

  const levelId_ = parseInt(levelId ?? '1', 10);
  const vasesDone = parseInt(vasesCompleted ?? '0', 10);
  const totalVases_ = parseInt(totalVases ?? '1', 10);

  const progressPct = totalVases_ > 0
    ? Math.min(0.95, Math.max(0.7, vasesDone / totalVases_))
    : 0.85;

  const remaining = totalVases_ - vasesDone;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  }, []);

  const handleBuyMoves = () => {
    const success = spendGold(100);
    if (success) {
      router.replace(`/level/${levelId_}`);
    }
  };

  const handleWatchAd = () => {
    // Placeholder: rewarded video
    router.replace(`/level/${levelId_}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.emoji}>💔</Text>
        <Text style={styles.title}>{t('levelFail')}</Text>

        {remaining > 0 && (
          <Text style={styles.nearMiss}>
            {t('nearMiss', { count: remaining })}
          </Text>
        )}

        {/* Progress bar */}
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${Math.round(progressPct * 100)}%` }]} />
          <Text style={styles.progressLabel}>{Math.round(progressPct * 100)}%</Text>
        </View>

        <Text style={styles.vasesLabel}>
          {t('vasesCompleted', { count: vasesDone })} / {totalVases_}
        </Text>

        {/* Action buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.adBtn} onPress={handleWatchAd}>
            <Text style={styles.adBtnText}>📺  {t('watchAd')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buyBtn} onPress={handleBuyMoves}>
            <Text style={styles.buyBtnText}>🌼  {t('buyMoves')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.retryBtn} onPress={() => router.push(`/level/${levelId_}`)}>
            <Text style={styles.retryBtnText}>{t('retry')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quitBtn} onPress={() => router.push('/(tabs)/')}>
            <Text style={styles.quitBtnText}>{t('giveUp')}</Text>
          </TouchableOpacity>
        </View>
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
    gap: 14,
  },
  emoji: {
    fontSize: 72,
  },
  title: {
    color: '#FF6B6B',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  nearMiss: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.85,
  },
  progressBg: {
    width: '100%',
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#7C3AED',
    borderRadius: 14,
  },
  progressLabel: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    zIndex: 1,
  },
  vasesLabel: {
    color: '#AAAAAA',
    fontSize: 13,
  },
  buttons: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  adBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  adBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  buyBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  retryBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  quitBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  quitBtnText: {
    color: '#888888',
    fontSize: 13,
  },
});
