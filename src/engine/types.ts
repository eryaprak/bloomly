export type PetalColor = 'red' | 'pink' | 'purple' | 'yellow' | 'green' | 'blue';

export type BonusType = 'combo' | 'chain' | 'close_call' | null;

export interface Petal {
  id: string;
  color: PetalColor;
  row: number;
  col: number;
  isLocked: boolean;
  iceLayer: number;     // 0=none, 1=single ice, 2=double ice
  isCollected: boolean; // moved to dock
}

export interface Vase {
  color: PetalColor;
  capacity: number;     // petals it can hold (6-9)
  filled: number;       // current petal count
  isBloomed: boolean;   // capacity reached and bloomed
}

export interface DockSlot {
  petal: Petal | null;
}

export interface LevelConfig {
  id: number;
  rows: number;
  cols: number;
  colors: PetalColor[];
  petals: Petal[];
  vases: Vase[];
  dockSize: number;     // 7 (Triple Match 3D style)
  maxMoves: number;
  obstacles: ('ice' | 'lock' | 'thorn')[];
  difficulty: number;   // 0.0 - 1.0
}

export type GamePhase =
  | 'idle'
  | 'playing'
  | 'animating'
  | 'checking'
  | 'blooming'
  | 'complete'
  | 'failed';

export interface GameState {
  phase: GamePhase;
  level: LevelConfig;
  board: (Petal | null)[][];
  dock: DockSlot[];
  vases: Vase[];
  movesLeft: number;
  score: number;
  combo: number;
  stars: 0 | 1 | 2 | 3;
}

export interface MoveResult {
  success: boolean;
  dockMatch: boolean;
  vaseFilled: boolean;
  bloom: PetalColor | null;
  gameOver: boolean;
  levelComplete: boolean;
  comboCount: number;
  bonusType: BonusType;
  bonusGold: number;
}

export interface GeneratorParams {
  levelId: number;
  colors: PetalColor[];
  rows: number;
  cols: number;
  dockSize: number;
  maxMoves: number;
  obstacles: ('ice' | 'lock' | 'thorn')[];
  difficulty: number;
  seed?: number;
}

export interface DifficultyAdjustment {
  extraMoves: number;
  extraDockSlot: boolean;
  removeObstacle: boolean;
  reduceColors: boolean;
  hintAvailable: boolean;
}

export interface PlayerStats {
  avgFailCount: number;
  avgStars: number;
  levelsPlayed: number;
}
