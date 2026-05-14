import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePlayerStore } from '@/stores/playerStore';
import { useLifeTimer } from '@/hooks/useLifeTimer';
import '@/i18n';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const gold = usePlayerStore((s) => s.gold);
  const diamonds = usePlayerStore((s) => s.diamonds);
  const streak = usePlayerStore((s) => s.streak);
  const stars = usePlayerStore((s) => s.stars);
  const currentLevel = usePlayerStore((s) => s.currentLevel);
  const { lives, maxLives, countdown } = useLifeTimer();

  const [soundEnabled, setSoundEnabled] = React.useState(true);

  const totalStars = Object.values(stars).reduce((sum, s) => sum + s, 0);
  const levelsCompleted = Math.max(0, currentLevel - 1);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'tr' ? 'en' : 'tr';
    i18n.changeLanguage(nextLang);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('profile')}</Text>

        {/* Stats card */}
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{levelsCompleted}</Text>
              <Text style={styles.statLabel}>{t('totalLevels')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{totalStars}</Text>
              <Text style={styles.statLabel}>{t('totalStars')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{streak}</Text>
              <Text style={styles.statLabel}>{t('streak')}</Text>
            </View>
          </View>

          <View style={styles.goldRow}>
            <Text style={styles.goldLabel}>🌼 {t('gold')}</Text>
            <Text style={styles.goldValue}>{gold.toLocaleString()}</Text>
          </View>

          <View style={styles.goldRow}>
            <Text style={styles.goldLabel}>💎 {t('diamonds')}</Text>
            <Text style={styles.goldValue}>{diamonds.toLocaleString()}</Text>
          </View>

          <View style={styles.livesRow}>
            <Text style={styles.livesLabel}>
              {Array.from({ length: maxLives }).map((_, i) =>
                i < lives ? '♥' : '♡',
              ).join(' ')}
            </Text>
            {lives < maxLives && countdown ? (
              <Text style={styles.countdownText}>{t('nextLifeIn', { time: countdown })}</Text>
            ) : (
              <Text style={styles.livesFullText}>Full</Text>
            )}
          </View>
        </View>

        {/* Settings */}
        <Text style={styles.sectionTitle}>{t('settings')}</Text>

        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t('sound')}</Text>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ true: '#7C3AED' }}
            />
          </View>

          <View style={styles.settingDivider} />

          <TouchableOpacity style={styles.settingRow} onPress={toggleLanguage}>
            <Text style={styles.settingLabel}>{t('language')}</Text>
            <Text style={styles.settingValue}>
              {i18n.language === 'tr' ? '🇹🇷 Türkçe' : '🇬🇧 English'}
            </Text>
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          <TouchableOpacity style={styles.settingRow} onPress={() => Linking.openURL('https://voxduru.com/privacy-policy')}>
            <Text style={styles.settingLabel}>{t('privacyPolicy')}</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1A0A2E',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    paddingVertical: 14,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: '#2D1B5C',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: '#AAAAAA',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#444466',
    alignSelf: 'stretch',
  },
  goldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#444466',
    paddingTop: 12,
    marginBottom: 10,
  },
  goldLabel: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  goldValue: {
    color: '#FFD700',
    fontWeight: '700',
    fontSize: 16,
  },
  livesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  livesLabel: {
    color: '#FF4444',
    fontSize: 18,
    letterSpacing: 3,
  },
  countdownText: {
    color: '#AAAAAA',
    fontSize: 12,
  },
  livesFullText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#CCCCCC',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  settingsCard: {
    backgroundColor: '#2D1B5C',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLabel: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  settingValue: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  settingArrow: {
    color: '#AAAAAA',
    fontSize: 22,
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#444466',
    marginHorizontal: 16,
  },
});
