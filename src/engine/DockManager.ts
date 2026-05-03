import {
  DockSlot,
  Petal,
  PetalColor,
} from './types';

export interface MatchResult {
  indices: number[];
  color: PetalColor;
}

/**
 * Add a petal to the first available dock slot.
 * Returns overflow=true if dock was already full.
 */
export function addToDock(
  dock: DockSlot[],
  petal: Petal,
): { newDock: DockSlot[]; overflow: boolean } {
  const firstEmpty = dock.findIndex((slot) => slot.petal === null);
  if (firstEmpty === -1) {
    return { newDock: dock, overflow: true };
  }
  const newDock = dock.map((slot, i) =>
    i === firstEmpty ? { petal: { ...petal, isCollected: true } } : { ...slot },
  );
  return { newDock, overflow: false };
}

/**
 * Find any 3 petals of the same color in the dock (position-independent).
 * Returns the indices of those petals and their color, or null if no match.
 */
export function findMatch(dock: DockSlot[]): MatchResult | null {
  const colorMap = new Map<PetalColor, number[]>();

  dock.forEach((slot, i) => {
    if (slot.petal !== null) {
      const color = slot.petal.color;
      const existing = colorMap.get(color) ?? [];
      existing.push(i);
      colorMap.set(color, existing);
    }
  });

  for (const [color, indices] of colorMap.entries()) {
    if (indices.length >= 3) {
      return { indices: indices.slice(0, 3), color };
    }
  }
  return null;
}

/**
 * Remove petals at the specified indices from the dock, compacting remaining petals to the left.
 */
export function removeFromDock(dock: DockSlot[], indices: number[]): DockSlot[] {
  const indexSet = new Set(indices);
  const remaining = dock.filter((_, i) => !indexSet.has(i));
  const filled = remaining.filter((s) => s.petal !== null);
  const empties: DockSlot[] = Array.from(
    { length: dock.length - filled.length },
    () => ({ petal: null }),
  );
  return [...filled, ...empties];
}

/**
 * Returns true if every slot in the dock is occupied.
 */
export function isDockFull(dock: DockSlot[]): boolean {
  return dock.every((slot) => slot.petal !== null);
}
