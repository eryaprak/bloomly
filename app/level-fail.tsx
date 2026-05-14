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
import '@/i18n';

export default function LevelFailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { levelId, vasesCompleted, totalVases, reason } = useLocalSearchParams<{
    levelId: string;
    vasesCompleted: string;
    totalVases: string;
    reason?: string;
  }>();

  const levelId_ = parseInt(levelId ?? '1', 10);
  const vasesDone = parseInt(vasesCompleted ?? '0', 10);
  const totalVases_ = parseInt(totalVases ?? '1', 10);
  const isOutOfMoves = reason === 'moves';

  const progressPct = totalVases_ > 0
    ? Math.min(0.95, Math.max(0.3, vasesDone / totalVases_))
    : 0.5;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.emoji}>{isOutOfMoves ? '⏱️' : '💔'}</Text>
        <Text style={styles.title}>
          {isOutOfMoves ? t('outOfMoves') : t('levelFail')}
        </Text>

        <Text style={styles.subtitle}>
          {t('vasesCompleted', { count: vasesDone })} / {totalVases_}
        </Text>

        {/* Progress bar */}
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${Math.round(progressPct * 100)}%` }]} />
          <Text style={styles.progressLabel}>{Math.round(progressPct * 100)}%</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => router.push(`/level/${levelId_}`)}
          >
            <Text style={styles.retryBtnText}>{t('retry')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quitBtn}
            onPress={() => router.push('/(tabs)/')}
          >
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
  subtitle: {
    color: '#AAAAAA',
    fontSize: 14,
    textAlign: 'center',
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
  buttons: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  retryBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
