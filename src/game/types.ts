/** Match-3 flower species (Bloomly GDD). */
export type FlowerType = 'rose' | 'tulip' | 'daisy' | 'orchid' | 'lavender';

export const FLOWER_TYPES: readonly FlowerType[] = [
  'rose',
  'tulip',
  'daisy',
  'orchid',
  'lavender',
] as const;

export const GRID_SIZE = 8;

export type CellCoord = { row: number; col: number };

/** Logical board: each cell holds a flower type. */
export type Board = FlowerType[][];

/** Internal board with holes while resolving cascades. */
export type BoardWithHoles = (FlowerType | null)[][];

export type SwapAttempt = {
  a: CellCoord;
  b: CellCoord;
};

export type SwapValidation = 'not_adjacent' | 'no_match';

export type ComboMultiplierTable = readonly number[];

/** One tile moved from gravity before refill. */
export type FallMove = {
  from: CellCoord;
  to: CellCoord;
  type: FlowerType;
};

/** New random flowers appearing at the top of a column. */
export type SpawnEntry = {
  row: number;
  col: number;
  type: FlowerType;
};

/** Cleared cells (match) before gravity. */
export type ClearStep = {
  kind: 'clear';
  cells: CellCoord[];
  /** Tiles cleared in this step (for scoring). */
  tileCount: number;
  /** 0 = first match in chain, 1 = first cascade, … */
  comboIndex: number;
  multiplier: number;
  points: number;
};

export type GravityStep = {
  kind: 'gravity';
  falls: FallMove[];
  spawns: SpawnEntry[];
  boardAfter: Board;
};

export type CascadeStep = ClearStep | GravityStep;

export type SwapResolveResult = {
  ok: true;
  /** Board immediately after swap (still matches present). */
  boardAfterSwap: Board;
  steps: CascadeStep[];
  totalScore: number;
  maxComboIndex: number;
  /** Board after all clears and cascades. */
  finalBoard: Board;
};

export type SwapRejectResult = {
  ok: false;
  reason: SwapValidation;
};

export type TrySwapResult = SwapResolveResult | SwapRejectResult;

export type ScoreBreakdown = {
  basePoints: number;
  multiplier: number;
  tiles: number;
};

export type Match3LevelConfig = {
  targetScore: number;
  movesLimit: number;
};

export type Match3MetaBar = {
  gold: number;
  diamonds: number;
  lives: number;
  maxLives: number;
};
