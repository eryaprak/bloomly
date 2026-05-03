// KURAL: ASLA s => ({...}) kullanma. Her selector = s => s.fieldName
import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';

let storage: MMKV;
try {
  storage = createMMKV({ id: 'player-store' });
} catch {
  // Fallback: in-memory only (test env or init failure)
  storage = createMMKV();
}

function loadFromMMKV<T>(key: string, fallback: T): T {
  try {
    const raw = storage.getString(key);
    if (raw !== undefined) return JSON.parse(raw) as T;
  } catch {
    // corrupted data — return fallback
  }
  return fallback;
}

function saveToMMKV(key: string, value: unknown): void {
  try {
    storage.set(key, JSON.stringify(value));
  } catch {
    // ignore write errors
  }
}

interface PlayerStore {
  gold: number;
  lives: number;
  maxLives: number;
  streak: number;
  lastLoginDate: string;
  lastLifeTime: number; // timestamp ms
  currentLevel: number;
  stars: Record<number, number>;
  gardenObjects: string[];
  failCounts: Record<number, number>;
  addGold: (n: number) => void;
  spendGold: (n: number) => boolean;
  loseLife: () => void;
  gainLife: () => void;
  updateStreak: () => void;
  completeLevel: (id: number, s: number) => void;
  addFail: (levelId: number) => void;
  unlockGardenObject: (name: string) => void;
  setLives: (n: number) => void;
  setLastLifeTime: (t: number) => void;
}

const DEFAULT_STATE = {
  gold: 500,
  lives: 5,
  maxLives: 5,
  streak: 0,
  lastLoginDate: '',
  lastLifeTime: 0,
  currentLevel: 1,
  stars: {} as Record<number, number>,
  gardenObjects: [] as string[],
  failCounts: {} as Record<number, number>,
};

function loadPersistedState() {
  return {
    gold: loadFromMMKV('gold', DEFAULT_STATE.gold),
    lives: loadFromMMKV('lives', DEFAULT_STATE.lives),
    maxLives: DEFAULT_STATE.maxLives,
    streak: loadFromMMKV('streak', DEFAULT_STATE.streak),
    lastLoginDate: loadFromMMKV('lastLoginDate', DEFAULT_STATE.lastLoginDate),
    lastLifeTime: loadFromMMKV('lastLifeTime', DEFAULT_STATE.lastLifeTime),
    currentLevel: loadFromMMKV('currentLevel', DEFAULT_STATE.currentLevel),
    stars: loadFromMMKV('stars', DEFAULT_STATE.stars),
    gardenObjects: loadFromMMKV('gardenObjects', DEFAULT_STATE.gardenObjects),
    failCounts: loadFromMMKV('failCounts', DEFAULT_STATE.failCounts),
  };
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  ...loadPersistedState(),

  addGold: (n) => {
    const newGold = get().gold + n;
    saveToMMKV('gold', newGold);
    set({ gold: newGold });
  },

  spendGold: (n) => {
    const current = get().gold;
    if (current < n) return false;
    const newGold = current - n;
    saveToMMKV('gold', newGold);
    set({ gold: newGold });
    return true;
  },

  loseLife: () => {
    const current = get().lives;
    if (current <= 0) return;
    const newLives = current - 1;
    const now = Date.now();
    saveToMMKV('lives', newLives);
    saveToMMKV('lastLifeTime', now);
    set({ lives: newLives, lastLifeTime: now });
  },

  gainLife: () => {
    const { lives, maxLives } = get();
    if (lives >= maxLives) return;
    const newLives = lives + 1;
    saveToMMKV('lives', newLives);
    set({ lives: newLives });
  },

  updateStreak: () => {
    const today = new Date().toDateString();
    const last = get().lastLoginDate;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let streak = get().streak;
    if (last === today) return;
    if (last === yesterday) {
      streak += 1;
    } else {
      streak = 1;
    }
    saveToMMKV('streak', streak);
    saveToMMKV('lastLoginDate', today);
    set({ streak, lastLoginDate: today });
  },

  completeLevel: (id, s) => {
    const stars = { ...get().stars };
    const existing = stars[id] ?? 0;
    if (s > existing) stars[id] = s;
    const currentLevel = get().currentLevel;
    const newCurrentLevel = Math.max(currentLevel, id + 1);
    saveToMMKV('stars', stars);
    saveToMMKV('currentLevel', newCurrentLevel);
    set({ stars, currentLevel: newCurrentLevel });
  },

  addFail: (levelId) => {
    const failCounts = { ...get().failCounts };
    failCounts[levelId] = (failCounts[levelId] ?? 0) + 1;
    saveToMMKV('failCounts', failCounts);
    set({ failCounts });
  },

  unlockGardenObject: (name) => {
    const objs = get().gardenObjects;
    if (objs.includes(name)) return;
    const newObjs = [...objs, name];
    saveToMMKV('gardenObjects', newObjs);
    set({ gardenObjects: newObjs });
  },

  setLives: (n) => {
    saveToMMKV('lives', n);
    set({ lives: n });
  },

  setLastLifeTime: (t) => {
    saveToMMKV('lastLifeTime', t);
    set({ lastLifeTime: t });
  },
}));
