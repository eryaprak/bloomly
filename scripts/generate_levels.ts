/**
 * generate_levels.ts
 * Run with: npx ts-node -P tsconfig.scripts.json scripts/generate_levels.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateLevel } from '../src/engine/BoardGenerator';
import { isSolvable } from '../src/engine/BoardSolver';
import { LevelConfig, PetalColor, GeneratorParams } from '../src/engine/types';

const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'constants', 'levels');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ─── Rhythm helpers ───────────────────────────────────────────────────────────

/** Every 5th level = easy (confidence boost) */
function isEasyLevel(id: number): boolean {
  return id % 5 === 0 && id % 10 !== 0;
}

/** Every 10th level = bonus (extra easy + generous rewards) */
function isBonusLevel(id: number): boolean {
  return id % 10 === 0;
}

/** Every 9th level = boss (hardest in the run) */
function isBossLevel(id: number): boolean {
  return id % 10 === 9;
}

/** Compute minimum moves required: each petal needs at least 1 move + ice overhead */
function minMovesRequired(params: GeneratorParams): number {
  const capacity = Math.round(6 + params.difficulty * 3);
  const totalPetals = params.colors.length * capacity;
  // Ice petals on average need 1 extra move; assume ~15% ice at given difficulty
  const iceOverhead = params.obstacles.includes('ice') ? Math.ceil(totalPetals * params.difficulty * 0.15) : 0;
  return totalPetals + iceOverhead;
}

function applyRhythm(params: GeneratorParams, id: number): GeneratorParams {
  const minMoves = minMovesRequired(params);
  if (isBonusLevel(id)) {
    return {
      ...params,
      maxMoves: Math.max(minMoves + 5, params.maxMoves + 5),
      obstacles: [],
      difficulty: Math.max(0, params.difficulty - 0.2),
    };
  }
  if (isEasyLevel(id)) {
    return {
      ...params,
      maxMoves: Math.max(minMoves + 3, params.maxMoves + 3),
      difficulty: Math.max(0, params.difficulty - 0.15),
    };
  }
  if (isBossLevel(id)) {
    // Boss is harder via difficulty (more obstacles), not fewer moves
    return {
      ...params,
      maxMoves: Math.max(minMoves + 2, params.maxMoves),
      difficulty: Math.min(1, params.difficulty + 0.2),
    };
  }
  return { ...params, maxMoves: Math.max(minMoves + 2, params.maxMoves) };
}

// ─── Level band configs ───────────────────────────────────────────────────────

function getBaseParams(id: number): GeneratorParams {
  const ALL_COLORS: PetalColor[] = ['red', 'pink', 'purple', 'yellow', 'green', 'blue'];

  if (id <= 5) {
    // Tutorial
    return {
      levelId: id,
      colors: ALL_COLORS.slice(0, 3),
      rows: 5, cols: 5,
      dockSize: 3, maxMoves: 25,
      obstacles: [], difficulty: 0,
    };
  }
  if (id <= 10) {
    return {
      levelId: id,
      colors: ALL_COLORS.slice(0, 3),
      rows: 5, cols: 6,
      dockSize: 3, maxMoves: 22,
      obstacles: [], difficulty: 0.1,
    };
  }
  if (id <= 20) {
    const hasIce = id >= 15;
    // 4 colors needs dockSize > 4 to avoid trivial deadlock (dockSize=5 guarantees pigeonhole match)
    return {
      levelId: id,
      colors: ALL_COLORS.slice(0, 4),
      rows: 6, cols: 6,
      dockSize: 5, maxMoves: 30,
      obstacles: hasIce ? ['ice'] : [],
      difficulty: 0.2 + (id - 11) * 0.01,
    };
  }
  if (id <= 30) {
    const nColors = id <= 25 ? 4 : 5;
    // 5 colors × cap(~7) = ~35 petals; need at least 35 moves plus slack
    return {
      levelId: id,
      colors: ALL_COLORS.slice(0, nColors),
      rows: 6, cols: 7,
      dockSize: 5, maxMoves: 30,
      obstacles: ['ice', 'lock'],
      difficulty: 0.25 + (id - 21) * 0.01,
    };
  }
  if (id <= 40) {
    // 5 colors × cap(~8) = ~40 petals
    return {
      levelId: id,
      colors: ALL_COLORS.slice(0, 5),
      rows: 7, cols: 7,
      dockSize: 5, maxMoves: 35,
      obstacles: ['ice', 'lock'],
      difficulty: 0.35 + (id - 31) * 0.015,
    };
  }
  // 41-50: 5-6 colors
  const nColors = id <= 45 ? 5 : 6;
  // 6 colors × cap(~9) = ~54 petals; need generous moves
  return {
    levelId: id,
    colors: ALL_COLORS.slice(0, nColors),
    rows: 7, cols: 8,
    dockSize: 5, maxMoves: 40,
    obstacles: ['ice', 'lock', 'thorn'],
    difficulty: 0.5 + (id - 41) * 0.02,
  };
}

// ─── Generate ─────────────────────────────────────────────────────────────────

const MAX_RETRIES = 30;

for (let id = 1; id <= 50; id++) {
  const baseParams = getBaseParams(id);
  const params = applyRhythm(baseParams, id);

  let level: LevelConfig | null = null;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    const candidate = generateLevel({ ...params, seed: id * 31337 + attempt * 997 });
    if (isSolvable(candidate)) {
      level = candidate;
      break;
    }
    attempt++;
  }

  if (!level) {
    // Fallback: generate without obstacles if still unsolvable
    const fallbackParams = { ...params, obstacles: [] as ('ice'|'lock'|'thorn')[], difficulty: Math.max(0, params.difficulty - 0.3) };
    for (let fa = 0; fa < MAX_RETRIES; fa++) {
      const candidate = generateLevel({ ...fallbackParams, seed: id * 99991 + fa * 1009 });
      if (isSolvable(candidate)) {
        level = candidate;
        break;
      }
    }
  }

  if (!level) {
    console.error(`[ERROR] Could not generate solvable level ${id} after ${MAX_RETRIES * 2} attempts`);
    process.exit(1);
  }

  const filename = `level_${String(id).padStart(3, '0')}.json`;
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(level, null, 2));
  console.log(`[OK] Level ${id} → ${filename} (solved in attempt ${attempt + 1})`);
}

console.log('\nAll 50 levels generated successfully!');
