import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import { loadLevel } from '@/constants/levelLoader';
import GameBoard from '@/components/game/GameBoard';
import DockBar from '@/components/game/DockBar';
import VaseRow from '@/components/game/Vase';
import HUD from '@/components/game/HUD';
import BloomAnimation from '@/components/game/BloomAnimation';
import { PetalColor } from '@/engine/types';
import '@/i18n';

export default function LevelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const startLevel = useGameStore((s) => s.startLevel);
  const gameState = useGameStore((s) => s.gameState);
  const resetGame = useGameStore((s) => s.resetGame);
  const loseLife = usePlayerStore((s) => s.loseLife);
  const addFail = usePlayerStore((s) => s.addFail);

  const [bloomColor, setBloomColor] = useState<PetalColor | null>(null);

  const levelId = parseInt(id ?? '1', 10);

  useEffect(() => {
    const level = loadLevel(levelId);
    if (level) {
      startLevel(level);
    }
    return () => {
      resetGame();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId]);

  // Watch for phase changes
  useEffect(() => {
    if (!gameState) return;
    if (gameState.phase === 'complete') {
      const stars = gameState.stars;
      const score = gameState.score;
      setTimeout(() => {
        router.push({
          pathname: '/level-complete',
          params: { levelId: String(levelId), stars: String(stars), score: String(score) },
        });
      }, 500);
    } else if (gameState.phase === 'failed') {
      loseLife();
      addFail(levelId);
      const vasesDone = gameState.vases.filter((v) => v.isBloomed).length;
      const totalVases = gameState.vases.length;
      setTimeout(() => {
        router.push({
          pathname: '/level-fail',
          params: {
            levelId: String(levelId),
            vasesCompleted: String(vasesDone),
            totalVases: String(totalVases),
          },
        });
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.phase]);

  const handleBloom = useCallback((color: PetalColor) => {
    setBloomColor(color);
  }, []);

  const handleBloomComplete = useCallback(() => {
    setBloomColor(null);
  }, []);

  if (!gameState) {
    return (
      <LinearGradient
        colors={['#1A0A2E', '#2D1B52', '#1A0A2E']}
        style={styles.loading}
      >
        <Text style={styles.loadingText}>Loading...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#0F0720', '#1E0D40', '#2A1260', '#1E0D40', '#0F0720']}
      locations={[0, 0.25, 0.5, 0.75, 1]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <HUD levelId={levelId} />
          <View style={styles.vaseSection}>
            <VaseRow />
          </View>
          <View style={styles.boardSection}>
            <GameBoard onBloom={handleBloom} />
          </View>
          <View style={styles.dockSection}>
            <DockBar />
          </View>
        </View>
        {bloomColor && (
          <BloomAnimation color={bloomColor} onComplete={handleBloomComplete} />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  vaseSection: {
    paddingTop: 8,
  },
  boardSection: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dockSection: {
    paddingBottom: 16,
  },
});
