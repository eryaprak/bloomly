import {
  GRID_SIZE,
  FLOWER_TYPES,
  type Board,
  type BoardWithHoles,
  type CellCoord,
  type ClearStep,
  type FallMove,
  type FlowerType,
  type GravityStep,
  type CascadeStep,
  type SwapRejectResult,
  type TrySwapResult,
} from './types';

const MULTIPLIERS = [1, 2, 3, 5, 5, 5] as const;
const BASE_PER_TILE = 10;

export function randomFlower(): FlowerType {
  return FLOWER_TYPES[(Math.random() * FLOWER_TYPES.length) | 0]!;
}

function cloneBoardWithHoles(b: BoardWithHoles): BoardWithHoles {
  return b.map((row) => [...row]) as BoardWithHoles;
}

export function cloneBoard(b: Board): Board {
  return b.map((row) => [...row]) as Board;
}

function swapCells(board: Board, a: CellCoord, b: CellCoord): Board {
  const next = cloneBoard(board);
  const t = next[a.row][a.col]!;
  next[a.row][a.col] = next[b.row][b.col]!;
  next[b.row][b.col] = t;
  return next;
}

export function areAdjacent(a: CellCoord, b: CellCoord): boolean {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return dr + dc === 1;
}

function wouldCreateImmediateMatch(
  board: BoardWithHoles,
  row: number,
  col: number,
  type: FlowerType,
): boolean {
  if (col >= 2) {
    const l1 = board[row][col - 1];
    const l2 = board[row][col - 2];
    if (l1 === type && l2 === type) return true;
  }
  if (row >= 2) {
    const u1 = board[row - 1][col];
    const u2 = board[row - 2][col];
    if (u1 === type && u2 === type) return true;
  }
  return false;
}

/** New random board with no starting 3+ matches. */
export function createInitialBoard(): Board {
  const b: BoardWithHoles = Array.from({ length: GRID_SIZE }, () =>
    Array<FlowerType | null>(GRID_SIZE).fill(null),
  );
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      let t: FlowerType;
      let guard = 0;
      do {
        t = randomFlower();
        guard++;
      } while (guard < 80 && wouldCreateImmediateMatch(b, r, c, t));
      b[r][c] = t;
    }
  }
  return b as Board;
}

/** All cells that participate in at least one horizontal or vertical run of 3+. */
export function findMatchCells(board: BoardWithHoles): CellCoord[] {
  const marked = new Set<string>();
  const key = (r: number, c: number) => `${r},${c}`;

  for (let r = 0; r < GRID_SIZE; r++) {
    let c = 0;
    while (c < GRID_SIZE) {
      const t = board[r][c];
      if (t === null) {
        c++;
        continue;
      }
      let run = 1;
      while (c + run < GRID_SIZE && board[r][c + run] === t) run++;
      if (run >= 3) {
        for (let k = 0; k < run; k++) marked.add(key(r, c + k));
      }
      c += run;
    }
  }

  for (let c = 0; c < GRID_SIZE; c++) {
    let r = 0;
    while (r < GRID_SIZE) {
      const t = board[r][c];
      if (t === null) {
        r++;
        continue;
      }
      let run = 1;
      while (r + run < GRID_SIZE && board[r + run][c] === t) run++;
      if (run >= 3) {
        for (let k = 0; k < run; k++) marked.add(key(r + k, c));
      }
      r += run;
    }
  }

  return [...marked].map((s) => {
    const [row, col] = s.split(',').map(Number);
    return { row, col };
  });
}

function comboMultiplier(comboIndex: number): number {
  return MULTIPLIERS[Math.min(comboIndex, MULTIPLIERS.length - 1)]!;
}

function applyGravityAndSpawn(board: BoardWithHoles): {
  board: Board;
  falls: FallMove[];
  spawns: { row: number; col: number; type: FlowerType }[];
} {
  const falls: FallMove[] = [];
  const spawns: { row: number; col: number; type: FlowerType }[] = [];
  const work = cloneBoardWithHoles(board);

  for (let c = 0; c < GRID_SIZE; c++) {
    const existing: { type: FlowerType; fromRow: number }[] = [];
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      const cell = work[r][c];
      if (cell !== null) {
        existing.push({ type: cell, fromRow: r });
      }
    }

    for (let r = 0; r < GRID_SIZE; r++) {
      work[r][c] = null;
    }

    let write = GRID_SIZE - 1;
    for (const item of existing) {
      work[write][c] = item.type;
      if (write !== item.fromRow) {
        falls.push({
          from: { row: item.fromRow, col: c },
          to: { row: write, col: c },
          type: item.type,
        });
      }
      write--;
    }

    while (write >= 0) {
      const t = randomFlower();
      spawns.push({ row: write, col: c, type: t });
      work[write][c] = t;
      write--;
    }
  }

  return { board: work as Board, falls, spawns };
}

/**
 * From a board that may contain matches, repeatedly clear → gravity → spawn until stable.
 */
export function resolveChainsFromBoard(start: Board): {
  steps: CascadeStep[];
  totalScore: number;
  finalBoard: Board;
  maxComboIndex: number;
} {
  let current: BoardWithHoles = cloneBoard(start) as BoardWithHoles;
  const steps: CascadeStep[] = [];
  let totalScore = 0;
  let comboIndex = 0;
  let maxComboIndex = -1;

  for (;;) {
    const cells = findMatchCells(current);
    if (cells.length === 0) break;

    const mult = comboMultiplier(comboIndex);
    const tileCount = cells.length;
    const points = tileCount * BASE_PER_TILE * mult;
    totalScore += points;
    maxComboIndex = comboIndex;

    const clearStep: ClearStep = {
      kind: 'clear',
      cells,
      tileCount,
      comboIndex,
      multiplier: mult,
      points,
    };
    steps.push(clearStep);

    for (const { row, col } of cells) {
      current[row][col] = null;
    }

    const { board: filled, falls, spawns } = applyGravityAndSpawn(current);
    const gravityStep: GravityStep = {
      kind: 'gravity',
      falls,
      spawns,
      boardAfter: filled,
    };
    steps.push(gravityStep);
    current = filled as BoardWithHoles;
    comboIndex++;
  }

  return { steps, totalScore, finalBoard: current as Board, maxComboIndex };
}

export function trySwap(board: Board, a: CellCoord, b: CellCoord): TrySwapResult {
  if (!areAdjacent(a, b)) {
    const r: SwapRejectResult = { ok: false, reason: 'not_adjacent' };
    return r;
  }

  const swapped = swapCells(board, a, b);
  if (findMatchCells(swapped).length === 0) {
    const r: SwapRejectResult = { ok: false, reason: 'no_match' };
    return r;
  }

  const { steps, totalScore, finalBoard, maxComboIndex } = resolveChainsFromBoard(swapped);

  return {
    ok: true,
    boardAfterSwap: swapped,
    steps,
    totalScore,
    maxComboIndex,
    finalBoard,
  };
}

/** Apply swap without resolving (for invalid-match rewind animation). */
export function swapOnly(board: Board, a: CellCoord, b: CellCoord): Board {
  return swapCells(board, a, b);
}

export function boardToKey(board: Board): string {
  return board.map((row) => row.join('')).join('|');
}
