import { GeneratorParams, LevelConfig, Petal, PetalColor, Vase } from './types';
import { createRNG, shuffle } from './rng';

// Each vase capacity must be a multiple of 3 (so petals can fully match in sets of 3)
function vaseCapacity(difficulty: number): number {
  // 6 at low difficulty, up to 9 at high — both are multiples of 3
  const raw = 6 + difficulty * 3;
  const rounded = Math.round(raw);
  // Snap to nearest multiple of 3
  return Math.round(rounded / 3) * 3;
}

export function generateLevel(params: GeneratorParams): LevelConfig {
  const {
    levelId,
    colors,
    rows,
    cols,
    dockSize,
    maxMoves,
    obstacles,
    difficulty,
    seed = levelId * 31337,
  } = params;

  const rng = createRNG(seed);
  const capacity = vaseCapacity(difficulty);

  // Build the petals: each color gets exactly `capacity` petals
  const allPetals: PetalColor[] = [];
  for (const color of colors) {
    for (let i = 0; i < capacity; i++) {
      allPetals.push(color);
    }
  }

  const shuffled = shuffle(allPetals, rng);

  // Determine grid positions
  const totalCells = rows * cols;
  const petalCount = shuffled.length;

  // If more petals than cells, trim (should not happen with sensible params)
  const placed = shuffled.slice(0, Math.min(petalCount, totalCells));

  // Create positions list and shuffle them
  const positions: { row: number; col: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      positions.push({ row: r, col: c });
    }
  }
  const shuffledPositions = shuffle(positions, rng);

  // Obstacle placement (difficulty-weighted)
  const obstacleCount = Math.floor(difficulty * placed.length * 0.25);
  const obstaclePositions = new Set<number>(
    shuffle(
      Array.from({ length: placed.length }, (_, i) => i),
      rng,
    ).slice(0, obstacleCount),
  );

  const petals: Petal[] = placed.map((color, i) => {
    const pos = shuffledPositions[i];
    const isObstacle = obstaclePositions.has(i);
    let iceLayer = 0;
    let isLocked = false;

    if (isObstacle && obstacles.includes('ice') && obstacles.includes('lock')) {
      // Randomly assign obstacle type
      const roll = rng();
      if (roll < 0.4 && obstacles.includes('ice')) {
        iceLayer = rng() < 0.5 ? 1 : 2;
      } else if (roll < 0.7 && obstacles.includes('lock')) {
        isLocked = true;
      }
    } else if (isObstacle && obstacles.includes('ice')) {
      iceLayer = rng() < 0.5 ? 1 : 2;
    } else if (isObstacle && obstacles.includes('lock')) {
      isLocked = true;
    }

    return {
      id: `p_${levelId}_${i}`,
      color,
      row: pos.row,
      col: pos.col,
      isLocked,
      iceLayer,
      isCollected: false,
    };
  });

  const vases: Vase[] = colors.map((color) => ({
    color,
    capacity,
    filled: 0,
    isBloomed: false,
  }));

  return {
    id: levelId,
    rows,
    cols,
    colors,
    petals,
    vases,
    dockSize,
    maxMoves,
    obstacles,
    difficulty,
  };
}
