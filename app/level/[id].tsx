import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import { loadLevel } from '@/constants/levelLoader';
import GameBoard from '@/components/game/GameBoard';
import DockBar from '@/components/game/DockBar';
import VaseRow from '@/components/game/Vase';
import HUD from '@/components/game/HUD';
import BloomAnimation from '@/components/game/BloomAnimation';
import GardenBackground from '@/components/game/GardenBackground';
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

  const bloomedColors: PetalColor[] = gameState?.vases
    .filter((v) => v.isBloomed)
    .map((v) => v.color) ?? [];

  if (!gameState) {
    return (
      <LinearGradient
        colors={['#1C4A8A', '#2E7A3A', '#1A3A0E']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      >
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.bgBase}>
      {/* === LAYERED BOTANICAL BACKGROUND === */}
      <LinearGradient
        colors={['#1C4A8A', '#3A7AC8', '#6ABEAA', '#3A7A28', '#1A3A0E']}
        locations={[0, 0.28, 0.55, 0.70, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Garden Bloom flowers + decorative elements */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GardenBackground bloomedColors={bloomedColors} />
      </View>

      {/* Subtle board area shadow/vignette overlay */}
      <View style={styles.vignetteOverlay} pointerEvents="none" />

      {/* === GAME UI === */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  bgBase: {
    flex: 1,
    backgroundColor: '#1C4A8A',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
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
    fontWeight: '600',
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
