import {
  GameState,
  LevelConfig,
  MoveResult,
  Petal,
  PetalColor,
  Vase,
  DockSlot,
  BonusType,
} from './types';
import { addToDock, findMatch, removeFromDock, isDockFull } from './DockManager';

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createGame(level: LevelConfig): GameState {
  // Build 3D board: [row][col] = Petal[] stack (index 0=bottom, last=top)
  const board: Petal[][][] = Array.from({ length: level.rows }, () =>
    Array.from({ length: level.cols }, () => [] as Petal[]),
  );

  // Group petals by (row, col), sort by layer ascending, push onto stack
  const cellMap = new Map<string, Petal[]>();
  for (const petal of level.petals) {
    if (petal.row >= 0 && petal.row < level.rows && petal.col >= 0 && petal.col < level.cols) {
      const key = `${petal.row}_${petal.col}`;
      const arr = cellMap.get(key) ?? [];
      arr.push({ ...petal, isCollected: false });
      cellMap.set(key, arr);
    }
  }

  for (const [key, petals] of cellMap.entries()) {
    const [r, c] = key.split('_').map(Number);
    // Sort by layer ascending: layer 0 = bottom, highest layer = top
    petals.sort((a, b) => (a.layer ?? 0) - (b.layer ?? 0));
    board[r][c] = petals;
  }

  const dock: DockSlot[] = Array.from({ length: level.dockSize }, () => ({ petal: null }));

  // Deep-copy vases
  const vases: Vase[] = level.vases.map((v) => ({ ...v }));

  return {
    phase: 'playing',
    level,
    board,
    dock,
    vases,
    score: 0,
    combo: 0,
    stars: 0,
    movesLeft: level.maxMoves,
  };
}

// ─── Select Petal ─────────────────────────────────────────────────────────────

export function selectPetal(
  state: GameState,
  row: number,
  col: number,
): { newState: GameState; result: MoveResult } {
  const failResult: MoveResult = {
    success: false,
    dockMatch: false,
    vaseFilled: false,
    bloom: null,
    gameOver: false,
    levelComplete: false,
    comboCount: 0,
    bonusType: null,
    bonusGold: 0,
  };

  // Guard: not in playing phase
  if (state.phase !== 'playing') {
    return { newState: state, result: failResult };
  }

  const stack = state.board[row]?.[col];
  if (!stack || stack.length === 0) {
    return { newState: state, result: failResult };
  }

  // Only the top-of-stack is selectable
  const petal = stack[stack.length - 1];

  // Guard: locked petal
  if (petal.isLocked) {
    return { newState: state, result: failResult };
  }

  // Ice layer handling — counts as 1 move
  if (petal.iceLayer > 0) {
    // Reduce ice by 1; petal is NOT collected yet
    const newBoard = state.board.map((rowArr, ri) =>
      rowArr.map((cellStack, ci) => {
        if (ri !== row || ci !== col) return cellStack;
        const last = cellStack[cellStack.length - 1];
        if (!last) return cellStack;
        return [
          ...cellStack.slice(0, -1),
          { ...last, iceLayer: last.iceLayer - 1 },
        ];
      }),
    );
    const newMovesLeft = state.movesLeft - 1;
    const newState: GameState = {
      ...state,
      board: newBoard,
      movesLeft: newMovesLeft,
    };
    const outOfMoves = newMovesLeft <= 0;
    const gameOver = outOfMoves || checkGameOver(newState);
    return {
      newState: { ...newState, phase: gameOver ? 'failed' : 'playing' },
      result: {
        ...failResult,
        success: true,
        gameOver,
        comboCount: state.combo,
        bonusType: null,
        bonusGold: 0,
      },
    };
  }

  // Try adding petal to dock
  const { newDock, overflow } = addToDock(state.dock, petal);
  if (overflow) {
    // Dock full, cannot add
    return {
      newState: { ...state, phase: 'failed' },
      result: { ...failResult, gameOver: true },
    };
  }

  // Remove top petal from stack
  const newBoard = state.board.map((rowArr, ri) =>
    rowArr.map((cellStack, ci) => {
      if (ri !== row || ci !== col) return cellStack;
      return cellStack.slice(0, -1); // pop top
    }),
  );

  let currentDock = newDock;
  let currentVases = state.vases.map((v) => ({ ...v }));
  let dockMatch = false;
  let vaseFilled = false;
  let bloom: PetalColor | null = null;
  let combo = state.combo;
  let scoreGain = 0;

  // Check for dock matches repeatedly (chain reactions)
  let matchResult = findMatch(currentDock);
  while (matchResult !== null) {
    dockMatch = true;
    currentDock = removeFromDock(currentDock, matchResult.indices);

    const updated = fillVaseInternal(currentVases, matchResult.color, 3);
    currentVases = updated.vases;
    if (updated.filled) {
      vaseFilled = true;
      scoreGain += 100;
    }
    if (updated.bloomed) {
      bloom = matchResult.color;
      combo += 1;
      scoreGain += 200 + combo * 50;
    }

    matchResult = findMatch(currentDock);
  }

  // Combo only resets when no match occurred AND no bloom is pending
  if (!dockMatch && state.combo > 0) {
    // Keep combo alive during build-up moves after a bloom
  } else if (!dockMatch) {
    combo = 0;
  }

  // ─── Bonus Detection ────────────────────────────────────────────────────────
  const filledBeforeAdd = state.dock.filter((s) => s.petal !== null).length;

  let bonusType: BonusType = null;
  let bonusGold = 0;

  if (dockMatch) {
    const colorInDockBefore = state.dock.filter(
      (s) => s.petal?.color === petal.color,
    ).length;
    if (colorInDockBefore === 2) {
      bonusType = 'combo';
      bonusGold = 50;
    }

    if (combo >= 2 && bonusType === null) {
      bonusType = 'chain';
      bonusGold = combo * 30;
    } else if (combo >= 2) {
      bonusType = 'chain';
      bonusGold = 50 + combo * 30;
    }

    if (filledBeforeAdd >= 5 && bonusType === null) {
      bonusType = 'close_call';
      bonusGold = 30;
    } else if (filledBeforeAdd >= 5) {
      bonusGold += 30;
    }
  }
  // ────────────────────────────────────────────────────────────────────────────

  const newMovesLeft = state.movesLeft - 1;

  const newState: GameState = {
    ...state,
    board: newBoard,
    dock: currentDock,
    vases: currentVases,
    score: state.score + scoreGain,
    combo,
    phase: 'playing',
    movesLeft: newMovesLeft,
  };

  const levelComplete = checkLevelComplete(currentVases);
  const outOfMoves = !levelComplete && newMovesLeft <= 0;
  const gameOver = !levelComplete && (outOfMoves || checkGameOver(newState));

  const finalPhase = levelComplete ? 'complete' : gameOver ? 'failed' : 'playing';
  const stars = levelComplete ? calculateStars(combo) : state.stars;

  return {
    newState: {
      ...newState,
      phase: finalPhase,
      stars,
    },
    result: {
      success: true,
      dockMatch,
      vaseFilled,
      bloom,
      gameOver,
      levelComplete,
      comboCount: combo,
      bonusType,
      bonusGold,
    },
  };
}

// ─── Dock Match Check ─────────────────────────────────────────────────────────

export function checkDockMatch(
  dock: DockSlot[],
): { matched: boolean; color: PetalColor | null; indices: number[] } {
  const match = findMatch(dock);
  if (match) {
    return { matched: true, color: match.color, indices: match.indices };
  }
  return { matched: false, color: null, indices: [] };
}

// ─── Fill Vase ────────────────────────────────────────────────────────────────

function fillVaseInternal(
  vases: Vase[],
  color: PetalColor,
  count: number,
): { vases: Vase[]; filled: boolean; bloomed: boolean } {
  let filled = false;
  let bloomed = false;
  const newVases = vases.map((v) => {
    if (v.color !== color || v.isBloomed) return { ...v };
    const newFilled = Math.min(v.filled + count, v.capacity);
    filled = newFilled > v.filled;
    const isBloomed = newFilled >= v.capacity;
    if (isBloomed && !v.isBloomed) bloomed = true;
    return { ...v, filled: newFilled, isBloomed };
  });
  return { vases: newVases, filled, bloomed };
}

export function fillVase(state: GameState, color: PetalColor, count: number): GameState {
  const { vases } = fillVaseInternal(state.vases, color, count);
  return { ...state, vases };
}

// ─── Completion Checks ────────────────────────────────────────────────────────

export function checkLevelComplete(vases: Vase[]): boolean {
  return vases.length > 0 && vases.every((v) => v.isBloomed);
}

export function checkGameOver(state: GameState): boolean {
  // Only game over if dock is full and deadlocked (no possible match)
  if (isDockFull(state.dock) && findMatch(state.dock) === null) return true;
  return false;
}

// ─── Star Calculation ─────────────────────────────────────────────────────────

export function calculateStars(
  combo: number,
): 0 | 1 | 2 | 3 {
  if (combo >= 3) return 3;
  if (combo >= 1) return 2;
  return 1;
}
