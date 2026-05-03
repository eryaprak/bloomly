/**
 * Calculate the raw score for completing a level.
 */
export function calculateScore(
  movesUsed: number,
  maxMoves: number,
  blooms: number,
  combos: number,
): number {
  const moveBonus = Math.max(0, maxMoves - movesUsed) * 10;
  const bloomBonus = blooms * 200;
  const comboBonus = combos * 50;
  return moveBonus + bloomBonus + comboBonus;
}

/**
 * Calculate stars based on score relative to max possible score.
 */
export function calculateStars(score: number, maxScore: number): 1 | 2 | 3 {
  if (maxScore <= 0) return 1;
  const ratio = score / maxScore;
  if (ratio >= 0.75) return 3;
  if (ratio >= 0.45) return 2;
  return 1;
}

/**
 * Calculate gold reward based on stars and level ID.
 */
export function calculateGoldReward(stars: 1 | 2 | 3, levelId: number): number {
  const base = 10 + Math.floor(levelId * 1.5);
  const multiplier = stars === 3 ? 3 : stars === 2 ? 2 : 1;
  return base * multiplier;
}
