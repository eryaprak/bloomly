import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

  // Watch for phase changes
  useEffect(() => {
    if (!gameState) return;
    if (gameState.phase === 'complete') {
      const stars = gameState.stars;
      const score = gameState.score;
      const movesLeft = gameState.movesLeft;
      setTimeout(() => {
        router.push({
          pathname: '/level-complete',
          params: { levelId: String(levelId), stars: String(stars), score: String(score), movesLeft: String(movesLeft) },
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

  // Derive bloomed vase colors for garden preview
  const bloomedColors: PetalColor[] = gameState?.vases
    .filter((v) => v.isBloomed)
    .map((v) => v.color) ?? [];

  if (!gameState) {
    return (
      <View style={styles.bgBase}>
        {/* Sky gradient layers */}
        <View style={styles.skyTop} pointerEvents="none" />
        <View style={styles.skyMid} pointerEvents="none" />
        <View style={[styles.loading]}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.bgBase}>
      {/* === LAYERED GARDEN BACKGROUND === */}

      {/* 1. Deep sky gradient (top) */}
      <View style={styles.skyTop} pointerEvents="none" />
      {/* 2. Mid-sky glow (aurora-ish) */}
      <View style={styles.skyMid} pointerEvents="none" />
      {/* 3. Horizon band */}
      <View style={styles.horizon} pointerEvents="none" />
      {/* 4. Ground perspective layer */}
      <View style={styles.ground} pointerEvents="none" />
      {/* 5. Ground texture dots (perspectivic grid feel) */}
      <View style={styles.groundPattern} pointerEvents="none">
        {GROUND_DOTS.map((dot, i) => (
          <View key={i} style={[styles.groundDot, { left: dot.x, top: dot.y, width: dot.r, height: dot.r, borderRadius: dot.r / 2, opacity: dot.o }]} />
        ))}
      </View>

      {/* 6. Garden Bloom flowers (Skia, static / decorative) */}
      <View style={styles.gardenLayer} pointerEvents="none">
        <GardenBackground bloomedColors={bloomedColors} />
      </View>

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

// Pre-computed scattered ground dots for perspective grid
const GROUND_DOTS: { x: number; y: number; r: number; o: number }[] = [
  { x: 20,  y: 10, r: 3, o: 0.25 }, { x: 80,  y: 18, r: 4, o: 0.2 },
  { x: 150, y: 8,  r: 3, o: 0.22 }, { x: 220, y: 15, r: 5, o: 0.18 },
  { x: 290, y: 5,  r: 3, o: 0.2  }, { x: 350, y: 20, r: 4, o: 0.25 },
  { x: 30,  y: 40, r: 6, o: 0.15 }, { x: 100, y: 50, r: 7, o: 0.12 },
  { x: 180, y: 35, r: 5, o: 0.18 }, { x: 260, y: 48, r: 8, o: 0.1 },
  { x: 320, y: 38, r: 6, o: 0.15 }, { x: 10,  y: 70, r: 9, o: 0.1 },
  { x: 130, y: 75, r: 10,o: 0.08 }, { x: 240, y: 68, r: 9, o: 0.1 },
  { x: 360, y: 72, r: 8, o: 0.1 },
];

const styles = StyleSheet.create({
  bgBase: {
    flex: 1,
    backgroundColor: '#060314', // deep cosmic black
  },
  // Deep indigo/violet sky at top
  skyTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0D0630',
    bottom: '50%',
  },
  // Mid-sky softer purple glow
  skyMid: {
    ...StyleSheet.absoluteFillObject,
    top: '20%',
    bottom: '45%',
    backgroundColor: '#1A0A50',
    opacity: 0.7,
  },
  // Horizon warm glow line
  horizon: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '52%',
    height: 40,
    backgroundColor: '#3B1070',
    opacity: 0.55,
  },
  // Ground — dark earthy green
  ground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: '55%',
    backgroundColor: '#0E1A0A',
  },
  // Ground pattern container (bottom portion)
  groundPattern: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  groundDot: {
    position: 'absolute',
    backgroundColor: '#2A4020',
  },
  gardenLayer: {
    ...StyleSheet.absoluteFillObject,
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
