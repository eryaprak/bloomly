import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePlayerStore } from '@/stores/playerStore';
import { TOTAL_LEVELS } from '@/constants/levelLoader';
import '@/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMNS = 5;
const BTN_SIZE = (SCREEN_WIDTH - 32 - 8 * (COLUMNS - 1)) / COLUMNS;

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const currentLevel = usePlayerStore((s) => s.currentLevel);
  const stars = usePlayerStore((s) => s.stars);

  const levels = useMemo(
    () =>
      Array.from({ length: TOTAL_LEVELS }, (_, i) => {
        const id = i + 1;
        return {
          id,
          isUnlocked: id <= currentLevel,
          stars: stars[id] ?? 0,
        };
      }),
    [currentLevel, stars],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('levelMap')}</Text>
        <TouchableOpacity
          style={styles.match3Btn}
          onPress={() => router.push('/match3')}
          activeOpacity={0.85}
        >
          <Text style={styles.match3BtnTxt}>Match-3</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.grid}>
        {levels.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.levelBtn,
              level.id === currentLevel && styles.currentBtn,
              !level.isUnlocked && styles.lockedBtn,
            ]}
            onPress={() => {
              if (level.isUnlocked) {
                router.push(`/level/${level.id}`);
              }
            }}
            activeOpacity={level.isUnlocked ? 0.7 : 1}
          >
            {!level.isUnlocked ? (
              <Text style={styles.lockIcon}>🔒</Text>
            ) : (
              <>
                <Text style={styles.levelNumber}>{level.id}</Text>
                {level.stars > 0 && (
                  <View style={styles.starsRow}>
                    {[1, 2, 3].map((s) => (
                      <Text
                        key={s}
                        style={[
                          styles.starDot,
                          s <= level.stars ? styles.starFull : styles.starEmpty,
                        ]}
                      >
                        ★
                      </Text>
                    ))}
                  </View>
                )}
              </>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1A0A2E',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 12,
  },
  match3Btn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A78BFA',
  },
  match3BtnTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 32,
  },
  levelBtn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    backgroundColor: '#2D1B5C',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
  },
  currentBtn: {
    backgroundColor: '#7C3AED',
    borderColor: '#A78BFA',
    shadowColor: '#A78BFA',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  lockedBtn: {
    backgroundColor: '#1A1A2E',
    borderColor: '#333355',
    opacity: 0.5,
  },
  levelNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  lockIcon: {
    fontSize: 18,
  },
  starsRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  starDot: {
    fontSize: 8,
  },
  starFull: {
    color: '#FFD700',
  },
  starEmpty: {
    color: '#555555',
  },
});
