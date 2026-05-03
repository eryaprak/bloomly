import { LevelConfig, PetalColor, Petal } from './types';

interface SolverState {
  board: Map<string, Petal>;
  dock: PetalColor[];
  vases: Map<PetalColor, number>;
  movesLeft: number;
  dockSize: number;
}

function petalKey(row: number, col: number): string {
  return `${row}_${col}`;
}

/**
 * Apply the dock-match rule: remove any 3 petals of the same color from dock,
 * add them to vases. Repeat until no matches.
 */
function applyMatches(
  dock: PetalColor[],
  vases: Map<PetalColor, number>,
  capacities: Map<PetalColor, number>,
): PetalColor[] {
  let changed = true;
  let d = [...dock];
  while (changed) {
    changed = false;
    const counts = new Map<PetalColor, number[]>();
    d.forEach((color, i) => {
      const arr = counts.get(color) ?? [];
      arr.push(i);
      counts.set(color, arr);
    });
    for (const [color, indices] of counts.entries()) {
      if (indices.length >= 3) {
        const toRemove = new Set(indices.slice(0, 3));
        d = d.filter((_, i) => !toRemove.has(i));
        const current = vases.get(color) ?? 0;
        const capacity = capacities.get(color) ?? 6;
        vases.set(color, Math.min(current + 3, capacity));
        changed = true;
        break;
      }
    }
  }
  return d;
}

function isDockDeadlocked(dock: PetalColor[], dockSize: number): boolean {
  if (dock.length < dockSize) return false;
  const counts = new Map<PetalColor, number>();
  for (const c of dock) counts.set(c, (counts.get(c) ?? 0) + 1);
  return ![...counts.values()].some((v) => v >= 3);
}

/**
 * Greedy solver with look-ahead to avoid dock deadlock.
 * Handles ice layers: each ice layer costs 1 extra move before collection.
 */
export function isSolvable(level: LevelConfig): boolean {
  const capacities = new Map<PetalColor, number>(
    level.vases.map((v) => [v.color, v.capacity]),
  );

  // Build board map — skip locked petals
  const boardMap = new Map<string, Petal>();
  for (const petal of level.petals) {
    if (!petal.isLocked) {
      boardMap.set(petalKey(petal.row, petal.col), { ...petal });
    }
  }

  const vaseFills = new Map<PetalColor, number>(level.colors.map((c) => [c, 0]));

  const state: SolverState = {
    board: boardMap,
    dock: [],
    vases: vaseFills,
    movesLeft: level.maxMoves,
    dockSize: level.dockSize,
  };

  const MAX_ITERATIONS = 3000;

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    // Win check
    const allBloomed = level.colors.every(
      (c) => (state.vases.get(c) ?? 0) >= (capacities.get(c) ?? 6),
    );
    if (allBloomed) return true;

    if (state.movesLeft <= 0) return false;
    if (isDockDeadlocked(state.dock, state.dockSize)) return false;

    const dockCounts = new Map<PetalColor, number>();
    for (const c of state.dock) dockCounts.set(c, (dockCounts.get(c) ?? 0) + 1);

    // Collect accessible petals (non-locked; handle ice as needing extra moves)
    const candidates: Petal[] = [];
    for (const petal of state.board.values()) {
      if (!petal.isCollected) candidates.push(petal);
    }

    if (candidates.length === 0) {
      // No more petals; check if done
      const allDone = level.colors.every(
        (c) => (state.vases.get(c) ?? 0) >= (capacities.get(c) ?? 6),
      );
      return allDone;
    }

    // Scoring: prefer petals that bring dock closer to a match
    // Penalise picking a color already over-represented vs others, favour ice-free
    let bestPetal: Petal | null = null;
    let bestScore = -Infinity;

    const uniqueDockColors = new Set(state.dock).size;
    const dockFreeSlots = state.dockSize - state.dock.length;

    for (const petal of candidates) {
      const inDock = dockCounts.get(petal.color) ?? 0;
      let score = 0;

      // Highest priority: would complete a triple
      if (inDock >= 2) score += 100;
      else if (inDock === 1) score += 20;
      else {
        // New color in dock — penalise if dock is getting full and we'd create deadlock
        const wouldMakeUniques = uniqueDockColors + (inDock === 0 ? 1 : 0);
        const slotsAfter = dockFreeSlots - 1;
        // If all dock slots would be unique colors → likely deadlock risk
        if (slotsAfter === 0 && wouldMakeUniques === state.dockSize) {
          score -= 50;
        }
      }

      // Penalise ice (needs extra moves)
      score -= petal.iceLayer * 5;

      if (score > bestScore) {
        bestScore = score;
        bestPetal = petal;
      }
    }

    if (bestPetal === null) return false;

    const key = petalKey(bestPetal.row, bestPetal.col);

    if (bestPetal.iceLayer > 0) {
      const updated: Petal = { ...bestPetal, iceLayer: bestPetal.iceLayer - 1 };
      state.board.set(key, updated);
      state.movesLeft -= 1;
    } else {
      state.board.delete(key);
      state.dock.push(bestPetal.color);
      state.movesLeft -= 1;
      state.dock = applyMatches(state.dock, state.vases, capacities);
    }
  }

  return false;
}
