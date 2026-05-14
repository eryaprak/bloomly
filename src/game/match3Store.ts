import { create } from 'zustand';
import { createInitialBoard } from './engine';
import type { Board } from './types';

const DEFAULT_TARGET = 4800;
const DEFAULT_MOVES = 28;

export type Match3Store = {
  board: Board;
  score: number;
  movesLeft: number;
  targetScore: number;
  lastMaxCombo: number;
  reset: () => void;
  setBoard: (b: Board) => void;
  addScore: (n: number) => void;
  setLastCombo: (n: number) => void;
  consumeMove: () => void;
};

export const useMatch3Store = create<Match3Store>((set) => ({
  board: createInitialBoard(),
  score: 0,
  movesLeft: DEFAULT_MOVES,
  targetScore: DEFAULT_TARGET,
  lastMaxCombo: 0,
  reset: () =>
    set({
      board: createInitialBoard(),
      score: 0,
      movesLeft: DEFAULT_MOVES,
      targetScore: DEFAULT_TARGET,
      lastMaxCombo: 0,
    }),
  setBoard: (board) => set({ board }),
  addScore: (n) => set((s) => ({ score: s.score + n })),
  setLastCombo: (n) => set((s) => ({ lastMaxCombo: Math.max(s.lastMaxCombo, n) })),
  consumeMove: () => set((s) => ({ movesLeft: Math.max(0, s.movesLeft - 1) })),
}));
