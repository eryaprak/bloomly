// KURAL: ASLA s => ({...}) kullanma. Her selector = s => s.fieldName
import AsyncStorage from '@react-native-async-storage/async-storage';
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

/** Gold + diamonds: AsyncStorage (shop / economy Phase 3). MMKV used for other player fields. */
const ECONOMY_STORAGE_KEY = '@bloomly/player/economy';

async function persistPlayerEconomy(gold: number, diamonds: number): Promise<void> {
  try {
    await AsyncStorage.setItem(ECONOMY_STORAGE_KEY, JSON.stringify({ gold, diamonds }));
  } catch {
    // ignore write errors
  }
}

interface PlayerStore {
  gold: number;
  diamonds: number;
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
  addDiamonds: (n: number) => void;
  spendDiamonds: (n: number) => boolean;
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
  diamonds: 50,
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
    gold: DEFAULT_STATE.gold,
    diamonds: DEFAULT_STATE.diamonds,
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
    const { gold, diamonds } = get();
    const newGold = gold + n;
    set({ gold: newGold });
    void persistPlayerEconomy(newGold, diamonds);
  },

  spendGold: (n) => {
    const { gold, diamonds } = get();
    if (gold < n) return false;
    const newGold = gold - n;
    set({ gold: newGold });
    void persistPlayerEconomy(newGold, diamonds);
    return true;
  },

  addDiamonds: (n) => {
    const { gold, diamonds } = get();
    const next = diamonds + n;
    set({ diamonds: next });
    void persistPlayerEconomy(gold, next);
  },

  spendDiamonds: (n) => {
    const { gold, diamonds } = get();
    if (diamonds < n) return false;
    const next = diamonds - n;
    set({ diamonds: next });
    void persistPlayerEconomy(gold, next);
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

export async function hydratePlayerEconomy(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(ECONOMY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { gold?: unknown; diamonds?: unknown };
      const gold =
        typeof parsed.gold === 'number' && Number.isFinite(parsed.gold)
          ? Math.max(0, Math.floor(parsed.gold))
          : DEFAULT_STATE.gold;
      const diamonds =
        typeof parsed.diamonds === 'number' && Number.isFinite(parsed.diamonds)
          ? Math.max(0, Math.floor(parsed.diamonds))
          : DEFAULT_STATE.diamonds;
      usePlayerStore.setState({ gold, diamonds });
      return;
    }
    const legacyGold = loadFromMMKV('gold', DEFAULT_STATE.gold);
    const diamonds = DEFAULT_STATE.diamonds;
    usePlayerStore.setState({ gold: legacyGold, diamonds });
    await persistPlayerEconomy(legacyGold, diamonds);
  } catch {
    // keep in-memory defaults from create()
  }
}
