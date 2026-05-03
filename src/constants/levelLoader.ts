import { LevelConfig } from '@/engine/types';

// Static require map — Metro bundler needs static requires
const LEVEL_MAP: Record<number, () => LevelConfig> = {
  1:  () => require('@/constants/levels/level_001.json') as LevelConfig,
  2:  () => require('@/constants/levels/level_002.json') as LevelConfig,
  3:  () => require('@/constants/levels/level_003.json') as LevelConfig,
  4:  () => require('@/constants/levels/level_004.json') as LevelConfig,
  5:  () => require('@/constants/levels/level_005.json') as LevelConfig,
  6:  () => require('@/constants/levels/level_006.json') as LevelConfig,
  7:  () => require('@/constants/levels/level_007.json') as LevelConfig,
  8:  () => require('@/constants/levels/level_008.json') as LevelConfig,
  9:  () => require('@/constants/levels/level_009.json') as LevelConfig,
  10: () => require('@/constants/levels/level_010.json') as LevelConfig,
  11: () => require('@/constants/levels/level_011.json') as LevelConfig,
  12: () => require('@/constants/levels/level_012.json') as LevelConfig,
  13: () => require('@/constants/levels/level_013.json') as LevelConfig,
  14: () => require('@/constants/levels/level_014.json') as LevelConfig,
  15: () => require('@/constants/levels/level_015.json') as LevelConfig,
  16: () => require('@/constants/levels/level_016.json') as LevelConfig,
  17: () => require('@/constants/levels/level_017.json') as LevelConfig,
  18: () => require('@/constants/levels/level_018.json') as LevelConfig,
  19: () => require('@/constants/levels/level_019.json') as LevelConfig,
  20: () => require('@/constants/levels/level_020.json') as LevelConfig,
  21: () => require('@/constants/levels/level_021.json') as LevelConfig,
  22: () => require('@/constants/levels/level_022.json') as LevelConfig,
  23: () => require('@/constants/levels/level_023.json') as LevelConfig,
  24: () => require('@/constants/levels/level_024.json') as LevelConfig,
  25: () => require('@/constants/levels/level_025.json') as LevelConfig,
  26: () => require('@/constants/levels/level_026.json') as LevelConfig,
  27: () => require('@/constants/levels/level_027.json') as LevelConfig,
  28: () => require('@/constants/levels/level_028.json') as LevelConfig,
  29: () => require('@/constants/levels/level_029.json') as LevelConfig,
  30: () => require('@/constants/levels/level_030.json') as LevelConfig,
  31: () => require('@/constants/levels/level_031.json') as LevelConfig,
  32: () => require('@/constants/levels/level_032.json') as LevelConfig,
  33: () => require('@/constants/levels/level_033.json') as LevelConfig,
  34: () => require('@/constants/levels/level_034.json') as LevelConfig,
  35: () => require('@/constants/levels/level_035.json') as LevelConfig,
  36: () => require('@/constants/levels/level_036.json') as LevelConfig,
  37: () => require('@/constants/levels/level_037.json') as LevelConfig,
  38: () => require('@/constants/levels/level_038.json') as LevelConfig,
  39: () => require('@/constants/levels/level_039.json') as LevelConfig,
  40: () => require('@/constants/levels/level_040.json') as LevelConfig,
  41: () => require('@/constants/levels/level_041.json') as LevelConfig,
  42: () => require('@/constants/levels/level_042.json') as LevelConfig,
  43: () => require('@/constants/levels/level_043.json') as LevelConfig,
  44: () => require('@/constants/levels/level_044.json') as LevelConfig,
  45: () => require('@/constants/levels/level_045.json') as LevelConfig,
  46: () => require('@/constants/levels/level_046.json') as LevelConfig,
  47: () => require('@/constants/levels/level_047.json') as LevelConfig,
  48: () => require('@/constants/levels/level_048.json') as LevelConfig,
  49: () => require('@/constants/levels/level_049.json') as LevelConfig,
  50: () => require('@/constants/levels/level_050.json') as LevelConfig,
};

export function loadLevel(id: number): LevelConfig | null {
  const loader = LEVEL_MAP[id];
  if (!loader) return null;
  try {
    return loader();
  } catch {
    return null;
  }
}

export const TOTAL_LEVELS = 50;
