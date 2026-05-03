import { DifficultyAdjustment, PlayerStats } from './types';

export function adjustDifficulty(
  failCount: number,
  playerProfile: 'casual' | 'core',
): DifficultyAdjustment {
  const base: DifficultyAdjustment = {
    extraMoves: 0,
    extraDockSlot: false,
    removeObstacle: false,
    reduceColors: false,
    hintAvailable: false,
  };

  // Core players get less assistance
  const threshold = playerProfile === 'casual' ? 1 : 1.5;

  if (failCount <= 3) {
    return base;
  }

  if (failCount <= 5) {
    return { ...base, hintAvailable: true };
  }

  if (failCount <= 7) {
    return {
      ...base,
      hintAvailable: true,
      extraMoves: Math.floor(1 * threshold),
    };
  }

  if (failCount <= 10) {
    return {
      ...base,
      hintAvailable: true,
      extraMoves: Math.floor(2 * threshold),
      removeObstacle: true,
    };
  }

  if (failCount <= 13) {
    return {
      ...base,
      hintAvailable: true,
      extraMoves: Math.floor(2 * threshold),
      removeObstacle: true,
      extraDockSlot: true,
    };
  }

  // failCount 14-15+
  return {
    hintAvailable: true,
    extraMoves: Math.floor(3 * threshold),
    removeObstacle: true,
    extraDockSlot: true,
    reduceColors: true,
  };
}

export function detectPlayerProfile(stats: PlayerStats): 'casual' | 'core' {
  if (stats.levelsPlayed < 3) return 'casual';
  if (stats.avgFailCount < 2 && stats.avgStars > 2.5) return 'core';
  return 'casual';
}
