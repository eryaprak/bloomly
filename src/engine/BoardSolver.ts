import { LevelConfig, PetalColor, Petal } from './types';

interface SolverState {
  // Map from "row_col_layer" key to petal; we pick top-of-stack each cell
  stacks: Map<string, Petal[]>;
  dock: PetalColor[];
  vases: Map<PetalColor, number>;
  dockSize: number;
}

function cellKey(row: number, col: number): string {
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
 * Stack-aware: only top-of-stack petals are accessible.
 * Ice layers: each ice layer costs 1 extra move before collection.
 */
export function isSolvable(level: LevelConfig): boolean {
  const capacities = new Map<PetalColor, number>(
    level.vases.map((v) => [v.color, v.capacity]),
  );

  // Build stacks per cell
  const stacks = new Map<string, Petal[]>();
  for (const petal of level.petals) {
    if (petal.isLocked) continue;
    const key = cellKey(petal.row, petal.col);
    const arr = stacks.get(key) ?? [];
    arr.push({ ...petal });
    stacks.set(key, arr);
  }
  // Sort each stack by layer ascending (bottom first, top last)
  for (const [key, arr] of stacks.entries()) {
    arr.sort((a, b) => (a.layer ?? 0) - (b.layer ?? 0));
    stacks.set(key, arr);
  }

  const vaseFills = new Map<PetalColor, number>(level.colors.map((c) => [c, 0]));

  const state: SolverState = {
    stacks,
    dock: [],
    vases: vaseFills,
    dockSize: level.dockSize,
  };

  const MAX_ITERATIONS = 5000;

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    // Win check
    const allBloomed = level.colors.every(
      (c) => (state.vases.get(c) ?? 0) >= (capacities.get(c) ?? 6),
    );
    if (allBloomed) return true;

    if (isDockDeadlocked(state.dock, state.dockSize)) return false;

    const dockCounts = new Map<PetalColor, number>();
    for (const c of state.dock) dockCounts.set(c, (dockCounts.get(c) ?? 0) + 1);

    // Collect accessible petals: only top of each non-empty stack
    const candidates: { key: string; petal: Petal }[] = [];
    for (const [key, stack] of state.stacks.entries()) {
      if (stack.length === 0) continue;
      const top = stack[stack.length - 1];
      candidates.push({ key, petal: top });
    }

    if (candidates.length === 0) {
      // No more petals; check if done
      return level.colors.every(
        (c) => (state.vases.get(c) ?? 0) >= (capacities.get(c) ?? 6),
      );
    }

    // Scoring: prefer petals that bring dock closer to a match
    let bestKey: string | null = null;
    let bestPetal: Petal | null = null;
    let bestScore = -Infinity;

    const uniqueDockColors = new Set(state.dock).size;
    const dockFreeSlots = state.dockSize - state.dock.length;

    for (const { key, petal } of candidates) {
      const inDock = dockCounts.get(petal.color) ?? 0;
      let score = 0;

      if (inDock >= 2) score += 100;
      else if (inDock === 1) score += 20;
      else {
        const wouldMakeUniques = uniqueDockColors + (inDock === 0 ? 1 : 0);
        const slotsAfter = dockFreeSlots - 1;
        if (slotsAfter === 0 && wouldMakeUniques === state.dockSize) {
          score -= 50;
        }
      }

      // Penalise ice (needs extra hits before collecting)
      score -= petal.iceLayer * 5;

      if (score > bestScore) {
        bestScore = score;
        bestKey = key;
        bestPetal = petal;
      }
    }

    if (bestKey === null || bestPetal === null) return false;

    const stack = state.stacks.get(bestKey)!;

    if (bestPetal.iceLayer > 0) {
      // Chip ice, keep in stack
      const updated: Petal = { ...bestPetal, iceLayer: bestPetal.iceLayer - 1 };
      state.stacks.set(bestKey, [...stack.slice(0, -1), updated]);
    } else {
      // Pop petal from stack
      const newStack = stack.slice(0, -1);
      if (newStack.length === 0) {
        state.stacks.delete(bestKey);
      } else {
        state.stacks.set(bestKey, newStack);
      }
      state.dock.push(bestPetal.color);
      state.dock = applyMatches(state.dock, state.vases, capacities);
    }
  }

  return false;
}
