import {
  createGame,
  selectPetal,
  checkDockMatch,
  fillVase,
  checkLevelComplete,
  checkGameOver,
  calculateStars,
} from '../GameEngine';
import { GameState, LevelConfig, Petal, PetalColor } from '../types';
import { adjustDifficulty, detectPlayerProfile } from '../AdaptiveDifficulty';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePetal(
  id: string,
  color: PetalColor,
  row: number,
  col: number,
  overrides: Partial<Petal> = {},
): Petal {
  return {
    id,
    color,
    row,
    col,
    isLocked: false,
    iceLayer: 0,
    isCollected: false,
    ...overrides,
  };
}

function makeSimpleLevel(overrides: Partial<LevelConfig> = {}): LevelConfig {
  return {
    id: 1,
    rows: 3,
    cols: 3,
    colors: ['red', 'blue'],
    petals: [
      makePetal('p1', 'red', 0, 0),
      makePetal('p2', 'red', 0, 1),
      makePetal('p3', 'red', 0, 2),
      makePetal('p4', 'blue', 1, 0),
      makePetal('p5', 'blue', 1, 1),
      makePetal('p6', 'blue', 1, 2),
    ],
    vases: [
      { color: 'red', capacity: 3, filled: 0, isBloomed: false },
      { color: 'blue', capacity: 3, filled: 0, isBloomed: false },
    ],
    dockSize: 3,
    maxMoves: 20,
    obstacles: [],
    difficulty: 0,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GameEngine', () => {
  // 1. createGame creates state and board of correct dimensions
  test('createGame initialises board with correct dimensions', () => {
    const level = makeSimpleLevel();
    const state = createGame(level);
    expect(state.board.length).toBe(level.rows);
    expect(state.board[0].length).toBe(level.cols);
    expect(state.phase).toBe('playing');
  });

  // 2. createGame places petals on board (as stacks)
  test('createGame places petals on board correctly', () => {
    const level = makeSimpleLevel();
    const state = createGame(level);
    // board[r][c] is now Petal[] (stack), top of stack is last element
    expect(state.board[0][0].length).toBeGreaterThan(0);
    expect(state.board[0][0][state.board[0][0].length - 1]?.color).toBe('red');
    expect(state.board[1][0][state.board[1][0].length - 1]?.color).toBe('blue');
    expect(state.board[2][2].length).toBe(0);
  });

  // 3. selectPetal — valid petal moves to dock
  test('selectPetal adds valid petal to dock', () => {
    const level = makeSimpleLevel();
    const state = createGame(level);
    const { newState, result } = selectPetal(state, 0, 0);
    expect(result.success).toBe(true);
    // Stack at [0][0] should be empty after picking
    expect(newState.board[0][0].length).toBe(0);
    expect(newState.dock.some((s) => s.petal?.color === 'red')).toBe(true);
  });

  // 4. selectPetal — locked petal fails
  test('selectPetal fails on locked petal', () => {
    const level = makeSimpleLevel({
      petals: [makePetal('p1', 'red', 0, 0, { isLocked: true })],
    });
    const state = createGame(level);
    const { result } = selectPetal(state, 0, 0);
    expect(result.success).toBe(false);
  });

  // 5. selectPetal — ice layer 1 reduces ice, petal NOT collected
  test('selectPetal on ice layer 1 breaks ice and does not collect petal', () => {
    const level = makeSimpleLevel({
      petals: [makePetal('p1', 'red', 0, 0, { iceLayer: 1 })],
    });
    const state = createGame(level);
    const { newState, result } = selectPetal(state, 0, 0);
    expect(result.success).toBe(true);
    const topPetal = newState.board[0][0][newState.board[0][0].length - 1];
    expect(topPetal?.iceLayer).toBe(0);
    expect(newState.dock.every((s) => s.petal === null)).toBe(true);
  });

  // 6. selectPetal — ice layer 0 collects petal
  test('selectPetal on ice layer 0 collects petal into dock', () => {
    const level = makeSimpleLevel({
      petals: [makePetal('p1', 'red', 0, 0, { iceLayer: 0 })],
    });
    const state = createGame(level);
    const { newState, result } = selectPetal(state, 0, 0);
    expect(result.success).toBe(true);
    expect(newState.board[0][0].length).toBe(0);
    expect(newState.dock.some((s) => s.petal?.color === 'red')).toBe(true);
  });

  // 7. dock 3 same color → match detected
  test('checkDockMatch detects 3 matching petals', () => {
    const dock = [
      { petal: makePetal('a', 'red', 0, 0) },
      { petal: makePetal('b', 'red', 0, 1) },
      { petal: makePetal('c', 'red', 0, 2) },
    ];
    const result = checkDockMatch(dock);
    expect(result.matched).toBe(true);
    expect(result.color).toBe('red');
    expect(result.indices.length).toBe(3);
  });

  // 8. dock match fills vase
  test('dock match after selectPetal fills vase', () => {
    const level: LevelConfig = {
      id: 1,
      rows: 3,
      cols: 3,
      colors: ['red'],
      petals: [
        makePetal('p1', 'red', 0, 0),
        makePetal('p2', 'red', 0, 1),
        makePetal('p3', 'red', 0, 2),
      ],
      vases: [{ color: 'red', capacity: 3, filled: 0, isBloomed: false }],
      dockSize: 4,
      maxMoves: 20,
      obstacles: [],
      difficulty: 0,
    };
    let state = createGame(level);
    // Add two to dock manually
    let { newState } = selectPetal(state, 0, 0);
    state = newState;
    ({ newState } = selectPetal(state, 0, 1));
    state = newState;
    // Third petal triggers match
    const { newState: finalState, result } = selectPetal(state, 0, 2);
    expect(result.dockMatch).toBe(true);
    expect(finalState.vases[0].filled).toBeGreaterThan(0);
  });

  // 9. vase blooms when capacity reached
  test('vase blooms when filled to capacity', () => {
    const level: LevelConfig = {
      id: 2,
      rows: 2,
      cols: 3,
      colors: ['red'],
      petals: [
        makePetal('p1', 'red', 0, 0),
        makePetal('p2', 'red', 0, 1),
        makePetal('p3', 'red', 0, 2),
      ],
      vases: [{ color: 'red', capacity: 3, filled: 0, isBloomed: false }],
      dockSize: 4,
      maxMoves: 20,
      obstacles: [],
      difficulty: 0,
    };
    let state = createGame(level);
    let { newState } = selectPetal(state, 0, 0);
    state = newState;
    ({ newState } = selectPetal(state, 0, 1));
    state = newState;
    const { newState: finalState, result } = selectPetal(state, 0, 2);
    expect(result.bloom).toBe('red');
    expect(finalState.vases[0].isBloomed).toBe(true);
  });

  // 10. all vases bloomed → level complete
  test('level completes when all vases bloom', () => {
    const level: LevelConfig = {
      id: 3,
      rows: 2,
      cols: 3,
      colors: ['red'],
      petals: [
        makePetal('p1', 'red', 0, 0),
        makePetal('p2', 'red', 0, 1),
        makePetal('p3', 'red', 0, 2),
      ],
      vases: [{ color: 'red', capacity: 3, filled: 0, isBloomed: false }],
      dockSize: 4,
      maxMoves: 20,
      obstacles: [],
      difficulty: 0,
    };
    let state = createGame(level);
    let { newState } = selectPetal(state, 0, 0);
    state = newState;
    ({ newState } = selectPetal(state, 0, 1));
    state = newState;
    const { newState: finalState, result } = selectPetal(state, 0, 2);
    expect(result.levelComplete).toBe(true);
    expect(finalState.phase).toBe('complete');
  });

  // 11. dock full + no match → game over
  test('game over when dock is full and no match', () => {
    const level: LevelConfig = {
      id: 4,
      rows: 2,
      cols: 4,
      colors: ['red', 'blue', 'green'],
      petals: [
        makePetal('p1', 'red', 0, 0),
        makePetal('p2', 'blue', 0, 1),
        makePetal('p3', 'green', 0, 2),
      ],
      vases: [
        { color: 'red', capacity: 6, filled: 0, isBloomed: false },
        { color: 'blue', capacity: 6, filled: 0, isBloomed: false },
        { color: 'green', capacity: 6, filled: 0, isBloomed: false },
      ],
      dockSize: 3,
      maxMoves: 20,
      obstacles: [],
      difficulty: 0,
    };
    let state = createGame(level);
    let { newState } = selectPetal(state, 0, 0);
    state = newState;
    ({ newState } = selectPetal(state, 0, 1));
    state = newState;
    // Third petal fills dock (dockSize=3), no match (all different colors)
    const { newState: finalState, result } = selectPetal(state, 0, 2);
    expect(result.gameOver).toBe(true);
    expect(finalState.phase).toBe('failed');
  });

  // 12. moves no longer depleted — skipping old movesLeft test
  // Game over is now dock-overflow only. Just verify checkGameOver works.
  test('checkGameOver returns false when dock is not full', () => {
    const level = makeSimpleLevel({ dockSize: 5 });
    const state = createGame(level);
    expect(checkGameOver(state)).toBe(false);
  });

  // 13. star calculation: high combo → 3 stars
  test('calculateStars returns 3 for high combo', () => {
    expect(calculateStars(3)).toBe(3);
  });

  // 14. star calculation: no combo → 1 star
  test('calculateStars returns 1 for zero combo', () => {
    expect(calculateStars(0)).toBe(1);
  });

  // 15. combo increments on consecutive blooms
  test('combo increments on consecutive blooms', () => {
    const level: LevelConfig = {
      id: 5,
      rows: 3,
      cols: 3,
      colors: ['red', 'blue'],
      petals: [
        makePetal('p1', 'red', 0, 0),
        makePetal('p2', 'red', 0, 1),
        makePetal('p3', 'red', 0, 2),
        makePetal('p4', 'blue', 1, 0),
        makePetal('p5', 'blue', 1, 1),
        makePetal('p6', 'blue', 1, 2),
      ],
      vases: [
        { color: 'red', capacity: 3, filled: 0, isBloomed: false },
        { color: 'blue', capacity: 3, filled: 0, isBloomed: false },
      ],
      dockSize: 4,
      maxMoves: 20,
      obstacles: [],
      difficulty: 0,
    };
    let state = createGame(level);
    // Bloom red
    for (const [r, c] of [[0,0],[0,1],[0,2]] as [number,number][]) {
      const { newState } = selectPetal(state, r, c);
      state = newState;
    }
    const comboBefore = state.combo;
    // Bloom blue
    for (const [r, c] of [[1,0],[1,1],[1,2]] as [number,number][]) {
      const { newState } = selectPetal(state, r, c);
      state = newState;
    }
    expect(state.combo).toBeGreaterThan(comboBefore);
  });

  // 16. adaptive difficulty: 7 fails → +1 move
  test('adaptive difficulty gives +1 move after 7 fails', () => {
    const adj = adjustDifficulty(7, 'casual');
    expect(adj.extraMoves).toBeGreaterThanOrEqual(1);
    expect(adj.hintAvailable).toBe(true);
  });

  // 17. adaptive difficulty: 4 fails → hint available, no extra moves
  test('adaptive difficulty gives hint after 4 fails', () => {
    const adj = adjustDifficulty(4, 'casual');
    expect(adj.hintAvailable).toBe(true);
    expect(adj.extraMoves).toBe(0);
  });

  // 18. detectPlayerProfile: high fail, low stars → casual
  test('detectPlayerProfile returns casual for weak players', () => {
    const profile = detectPlayerProfile({ avgFailCount: 5, avgStars: 1.5, levelsPlayed: 10 });
    expect(profile).toBe('casual');
  });

  // 19. detectPlayerProfile: low fail, high stars → core
  test('detectPlayerProfile returns core for strong players', () => {
    const profile = detectPlayerProfile({ avgFailCount: 1, avgStars: 3, levelsPlayed: 10 });
    expect(profile).toBe('core');
  });

  // 20. checkLevelComplete returns false when vases not bloomed
  test('checkLevelComplete returns false when vases not all bloomed', () => {
    const vases = [
      { color: 'red' as PetalColor, capacity: 6, filled: 6, isBloomed: true },
      { color: 'blue' as PetalColor, capacity: 6, filled: 3, isBloomed: false },
    ];
    expect(checkLevelComplete(vases)).toBe(false);
  });

  // 21. movesLeft decrements on each valid pick
  test('movesLeft decrements on each valid petal pick', () => {
    const level = makeSimpleLevel({ maxMoves: 10 });
    const state = createGame(level);
    expect(state.movesLeft).toBe(10);
    const { newState } = selectPetal(state, 0, 0);
    expect(newState.movesLeft).toBe(9);
    const { newState: s2 } = selectPetal(newState, 0, 1);
    expect(s2.movesLeft).toBe(8);
  });

  // 22. out-of-moves triggers phase 'failed'
  test('out-of-moves triggers game over with failed phase', () => {
    const level: LevelConfig = {
      id: 99,
      rows: 2,
      cols: 2,
      colors: ['red', 'blue'],
      petals: [
        makePetal('p1', 'red', 0, 0),
        makePetal('p2', 'blue', 0, 1),
        makePetal('p3', 'red', 1, 0),
        makePetal('p4', 'blue', 1, 1),
      ],
      vases: [
        { color: 'red', capacity: 6, filled: 0, isBloomed: false },
        { color: 'blue', capacity: 6, filled: 0, isBloomed: false },
      ],
      dockSize: 7,
      maxMoves: 2,
      obstacles: [],
      difficulty: 0,
    };
    let state = createGame(level);
    expect(state.movesLeft).toBe(2);
    ({ newState: state } = selectPetal(state, 0, 0));
    expect(state.movesLeft).toBe(1);
    const { newState: finalState, result } = selectPetal(state, 0, 1);
    expect(finalState.movesLeft).toBe(0);
    expect(result.gameOver).toBe(true);
    expect(finalState.phase).toBe('failed');
  });
});
