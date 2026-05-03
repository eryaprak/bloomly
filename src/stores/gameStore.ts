// KURAL: ASLA s => ({...}) kullanma. Her selector = s => s.fieldName
import { create } from 'zustand';
import { GameState, MoveResult, LevelConfig } from '@/engine/types';
import { createGame, selectPetal } from '@/engine/GameEngine';

interface GameStore {
  gameState: GameState | null;
  lastResult: MoveResult | null;
  isAnimating: boolean;
  startLevel: (level: LevelConfig) => void;
  pickPetal: (row: number, col: number) => void;
  setAnimating: (v: boolean) => void;
  resetGame: () => void;
  addMoves: (n: number) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  lastResult: null,
  isAnimating: false,

  startLevel: (level) =>
    set({ gameState: createGame(level), lastResult: null, isAnimating: false }),

  pickPetal: (row, col) => {
    const gameState = get().gameState;
    if (!gameState || get().isAnimating) return;
    const { newState, result } = selectPetal(gameState, row, col);
    console.log('[PICK]', { row, col, success: result.success, dockMatch: result.dockMatch, dock: newState.dock.map(s => s.petal?.color ?? 'empty') });
    set({ gameState: newState, lastResult: result });
  },

  setAnimating: (v) => set({ isAnimating: v }),

  resetGame: () => set({ gameState: null, lastResult: null, isAnimating: false }),

  addMoves: (n) => {
    const gameState = get().gameState;
    if (!gameState) return;
    set({ gameState: { ...gameState, movesLeft: gameState.movesLeft + n, phase: 'playing' }, lastResult: null });
  },
}));
