// KURAL: ASLA s => ({...}) kullanma. Her selector = s => s.fieldName
import { create } from 'zustand';
import { GameState, MoveResult, LevelConfig } from '@/engine/types';
import { createGame, selectPetal } from '@/engine/GameEngine';
import { usePlayerStore } from '@/stores/playerStore';

interface GameStore {
  gameState: GameState | null;
  lastResult: MoveResult | null;
  isAnimating: boolean;
  chainCount: number;
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
  chainCount: 0,

  startLevel: (level) =>
    set({ gameState: createGame(level), lastResult: null, isAnimating: false, chainCount: 0 }),

  pickPetal: (row, col) => {
    const gameState = get().gameState;
    if (!gameState || get().isAnimating) return;

    const { newState, result } = selectPetal(gameState, row, col);

    // ── Chain counter ──────────────────────────────────────────────────────────
    let chainCount = get().chainCount;
    if (result.dockMatch) {
      chainCount += 1;
    } else {
      chainCount = 0;
    }

    // Patch bonusType to 'chain' if this is a 2nd+ consecutive match
    // (engine sets combo-based chain, but chainCount is per-move streak)
    let patchedResult = result;
    if (result.dockMatch && chainCount >= 2 && result.bonusType !== 'chain') {
      patchedResult = {
        ...result,
        bonusType: 'chain',
        bonusGold: result.bonusGold + chainCount * 20,
      };
    }

    // ── Award bonus gold ───────────────────────────────────────────────────────
    if (patchedResult.bonusGold > 0) {
      usePlayerStore.getState().addGold(patchedResult.bonusGold);
    }

    // ── Efficiency bonus on level complete: remaining moves × 10 gold ─────────
    if (patchedResult.levelComplete && newState.movesLeft > 0) {
      const movesBonus = newState.movesLeft * 10;
      usePlayerStore.getState().addGold(movesBonus);
      // Merge into patchedResult so HUD can show it
      patchedResult = {
        ...patchedResult,
        bonusGold: patchedResult.bonusGold + movesBonus,
        bonusType: patchedResult.bonusType ?? 'combo',
      };
    }

    set({ gameState: newState, lastResult: patchedResult, chainCount });
  },

  setAnimating: (v) => set({ isAnimating: v }),

  resetGame: () => set({ gameState: null, lastResult: null, isAnimating: false, chainCount: 0 }),

  addMoves: (n) => {
    const gameState = get().gameState;
    if (!gameState) return;
    set({ gameState: { ...gameState, movesLeft: gameState.movesLeft + n, phase: 'playing' }, lastResult: null });
  },
}));
