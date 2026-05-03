import {
  GameState,
  LevelConfig,
  MoveResult,
  Petal,
  PetalColor,
  Vase,
  DockSlot,
} from './types';
import { addToDock, findMatch, removeFromDock, isDockFull } from './DockManager';

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createGame(level: LevelConfig): GameState {
  // Build 2D board filled with nulls
  const board: (Petal | null)[][] = Array.from({ length: level.rows }, () =>
    Array<Petal | null>(level.cols).fill(null),
  );

  // Place petals onto board
  for (const petal of level.petals) {
    if (petal.row >= 0 && petal.row < level.rows && petal.col >= 0 && petal.col < level.cols) {
      board[petal.row][petal.col] = { ...petal, isCollected: false };
    }
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
    movesLeft: level.maxMoves,
    score: 0,
    combo: 0,
    stars: 0,
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
  };

  // Guard: not in playing phase
  if (state.phase !== 'playing') {
    return { newState: state, result: failResult };
  }

  const petal = state.board[row]?.[col];
  if (!petal) {
    return { newState: state, result: failResult };
  }

  // Guard: locked petal
  if (petal.isLocked) {
    return { newState: state, result: failResult };
  }

  // Ice layer handling
  if (petal.iceLayer > 0) {
    // Reduce ice by 1; petal is NOT collected yet
    const newBoard = state.board.map((r, ri) =>
      r.map((p, ci) =>
        ri === row && ci === col && p ? { ...p, iceLayer: p.iceLayer - 1 } : p,
      ),
    );
    const newState: GameState = {
      ...state,
      board: newBoard,
      movesLeft: state.movesLeft - 1,
    };
    const gameOver = checkGameOver(newState);
    return {
      newState: { ...newState, phase: gameOver ? 'failed' : 'playing' },
      result: {
        ...failResult,
        success: true,
        gameOver,
        comboCount: state.combo,
      },
    };
  }

  // Try adding petal to dock
  const { newDock, overflow } = addToDock(state.dock, petal);
  if (overflow) {
    // Dock full, cannot add
    const gameOver = true;
    return {
      newState: { ...state, phase: 'failed' },
      result: { ...failResult, gameOver },
    };
  }

  // Remove petal from board
  const newBoard = state.board.map((r, ri) =>
    r.map((p, ci) => (ri === row && ci === col ? null : p)),
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
  // This allows building up to the next bloom without losing combo
  if (!dockMatch && state.combo > 0) {
    // Keep combo alive during build-up moves after a bloom
    // Only reset if we haven't had a recent bloom (combo was already 0)
    // combo stays so consecutive blooms can chain
  } else if (!dockMatch) {
    combo = 0;
  }

  const movesLeft = state.movesLeft - 1;

  const newState: GameState = {
    ...state,
    board: newBoard,
    dock: currentDock,
    vases: currentVases,
    movesLeft,
    score: state.score + scoreGain,
    combo,
    phase: 'playing',
  };

  const levelComplete = checkLevelComplete(currentVases);
  const gameOver = !levelComplete && checkGameOver(newState);

  const finalPhase = levelComplete ? 'complete' : gameOver ? 'failed' : 'playing';
  const stars = levelComplete ? calculateStars(movesLeft, state.level.maxMoves, combo) : state.stars;

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
  if (state.movesLeft <= 0) return true;
  if (isDockFull(state.dock) && findMatch(state.dock) === null) return true;
  return false;
}

// ─── Star Calculation ─────────────────────────────────────────────────────────

export function calculateStars(
  movesLeft: number,
  maxMoves: number,
  combo: number,
): 0 | 1 | 2 | 3 {
  const ratio = movesLeft / maxMoves;
  if (ratio >= 0.5 || combo >= 3) return 3;
  if (ratio >= 0.25) return 2;
  if (ratio >= 0) return 1;
  return 0;
}
