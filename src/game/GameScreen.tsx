import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutChangeEvent,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  runOnJS,
  useSharedValue,
  useAnimatedReaction,
  withSpring,
  withTiming,
  interpolate,
  Easing,
  Extrapolation,
} from 'react-native-reanimated';
import {
  Canvas,
  Group,
  LinearGradient,
  Oval,
  RoundedRect,
  Shadow,
  vec,
} from '@shopify/react-native-skia';
import { usePlayerStore } from '@/stores/playerStore';
import { trySwap } from '@/game/engine';
import { useMatch3Store } from '@/game/match3Store';
import type { Board, CascadeStep, CellCoord, FallMove, FlowerType, GravityStep } from '@/game/types';
import { GRID_SIZE } from '@/game/types';

const PALETTE: Record<
  FlowerType,
  { petal: [string, string]; deep: string; highlight: string }
> = {
  rose: { petal: ['#FF8A9B', '#C41E3A'], deep: '#7A0B1E', highlight: '#FFD0D8' },
  tulip: { petal: ['#FFB347', '#E040FB'], deep: '#6A1B9A', highlight: '#FFF3B0' },
  daisy: { petal: ['#FFFFFF', '#F0F0F0'], deep: '#E6C200', highlight: '#FFFDE7' },
  orchid: { petal: ['#E1BEE7', '#7B1FA2'], deep: '#4A148C', highlight: '#F3E5F5' },
  lavender: { petal: ['#D1C4E9', '#9575CD'], deep: '#512DA8', highlight: '#EDE7F6' },
};

function StylizedFlower({
  cx,
  cy,
  R,
  type,
}: {
  cx: number;
  cy: number;
  R: number;
  type: FlowerType;
}) {
  const colors = PALETTE[type];
  const pr = R * 0.42;

  if (type === 'daisy') {
    const petals = 10;
    const nodes = [];
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2;
      const ox = Math.cos(a) * R * 0.38;
      const oy = Math.sin(a) * R * 0.38;
      nodes.push(
        <Group key={i} transform={[{ rotate: a }]} origin={vec(cx, cy)}>
          <Oval x={cx + ox - pr * 0.5} y={cy + oy - pr * 1.1} width={pr} height={pr * 1.35} color="white">
            <LinearGradient
              start={vec(cx + ox, cy + oy - pr)}
              end={vec(cx + ox, cy + oy + pr * 0.2)}
              colors={colors.petal}
            />
            <Shadow dx={1} dy={2} blur={3} color="rgba(0,0,0,0.22)" />
          </Oval>
        </Group>,
      );
    }
    return (
      <Group>
        {nodes}
        <Oval x={cx - R * 0.22} y={cy - R * 0.22} width={R * 0.44} height={R * 0.44} color={colors.deep}>
          <LinearGradient
            start={vec(cx - R * 0.1, cy - R * 0.1)}
            end={vec(cx + R * 0.1, cy + R * 0.1)}
            colors={[colors.highlight, colors.deep]}
          />
          <Shadow dx={0} dy={1} blur={2} color="rgba(0,0,0,0.25)" />
        </Oval>
      </Group>
    );
  }

  if (type === 'lavender') {
    return (
      <Group>
        {[-0.22, -0.1, 0, 0.1, 0.2].map((off, i) => (
          <Oval
            key={i}
            x={cx + off * R - R * 0.08}
            y={cy - R * 0.45 + i * R * 0.12}
            width={R * 0.16}
            height={R * 0.14}
            color={colors.deep}
          >
            <LinearGradient
              start={vec(cx + off * R, cy - R * 0.45 + i * R * 0.12)}
              end={vec(cx + off * R, cy - R * 0.35 + i * R * 0.12)}
              colors={colors.petal}
            />
            <Shadow dx={0.5} dy={1.5} blur={2} color="rgba(0,0,0,0.18)" />
          </Oval>
        ))}
        <RoundedRect x={cx - R * 0.06} y={cy + R * 0.22} width={R * 0.12} height={R * 0.28} r={3} color="#2E7D32">
          <LinearGradient start={vec(cx, cy + R * 0.22)} end={vec(cx, cy + R * 0.5)} colors={['#66BB6A', '#1B5E20']} />
        </RoundedRect>
      </Group>
    );
  }

  if (type === 'tulip') {
    const w = R * 0.55;
    const top = cy - R * 0.35;
    const bot = cy + R * 0.38;
    return (
      <Group>
        <RoundedRect x={cx - R * 0.08} y={cy + R * 0.12} width={R * 0.16} height={R * 0.38} r={4} color="#2E7D32">
          <LinearGradient start={vec(cx, cy + R * 0.12)} end={vec(cx, cy + R * 0.5)} colors={['#66BB6A', '#1B5E20']} />
          <Shadow dx={1} dy={2} blur={3} color="rgba(0,0,0,0.25)" />
        </RoundedRect>
        <RoundedRect x={cx - w} y={top} width={w * 2} height={bot - top} r={w * 0.85} color={colors.deep} opacity={0}>
          <LinearGradient start={vec(cx, top)} end={vec(cx, bot)} colors={colors.petal} />
          <Shadow dx={1} dy={3} blur={6} color="rgba(0,0,0,0.28)" />
        </RoundedRect>
      </Group>
    );
  }

  if (type === 'orchid') {
    return (
      <Group>
        <Group transform={[{ rotate: -0.35 }]} origin={vec(cx, cy)}>
          <Oval x={cx - R * 0.62} y={cy - R * 0.28} width={R * 0.72} height={R * 0.52} color={colors.deep}>
            <LinearGradient start={vec(cx - R * 0.5, cy)} end={vec(cx + R * 0.1, cy)} colors={colors.petal} />
            <Shadow dx={2} dy={3} blur={5} color="rgba(0,0,0,0.28)" />
          </Oval>
        </Group>
        <Group transform={[{ rotate: 0.35 }]} origin={vec(cx, cy)}>
          <Oval x={cx - R * 0.1} y={cy - R * 0.28} width={R * 0.72} height={R * 0.52} color={colors.deep}>
            <LinearGradient start={vec(cx + R * 0.5, cy)} end={vec(cx - R * 0.1, cy)} colors={colors.petal} />
            <Shadow dx={-1} dy={3} blur={5} color="rgba(0,0,0,0.22)" />
          </Oval>
        </Group>
        <Oval x={cx - R * 0.12} y={cy - R * 0.08} width={R * 0.24} height={R * 0.2} color={colors.highlight}>
          <LinearGradient start={vec(cx, cy - R * 0.1)} end={vec(cx, cy + R * 0.08)} colors={[colors.highlight, '#FCE4EC']} />
        </Oval>
      </Group>
    );
  }

  const petals = 6;
  const els = [];
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2;
    els.push(
      <Group key={i} transform={[{ rotate: a }]} origin={vec(cx, cy)}>
        <RoundedRect
          x={cx - pr * 0.45}
          y={cy - R * 0.62}
          width={pr * 0.9}
          height={R * 0.52}
          r={pr * 0.45}
          color={colors.deep}
        >
          <LinearGradient start={vec(cx, cy - R * 0.62)} end={vec(cx, cy - R * 0.15)} colors={colors.petal} />
          <Shadow dx={1} dy={2} blur={4} color="rgba(0,0,0,0.22)" />
        </RoundedRect>
      </Group>,
    );
  }
  return (
    <Group>
      {els}
      <Oval x={cx - R * 0.18} y={cy - R * 0.18} width={R * 0.36} height={R * 0.36} color={colors.deep}>
        <LinearGradient
          start={vec(cx - R * 0.08, cy - R * 0.08)}
          end={vec(cx + R * 0.08, cy + R * 0.08)}
          colors={[colors.highlight, colors.deep]}
        />
        <Shadow dx={0} dy={1} blur={2} color="rgba(0,0,0,0.3)" />
      </Oval>
    </Group>
  );
}

function swapOffsets(
  row: number,
  col: number,
  cell: number,
  t: number,
  ar: number,
  ac: number,
  br: number,
  bc: number,
): { ox: number; oy: number } {
  if (ar < 0) return { ox: 0, oy: 0 };
  if (row === ar && col === ac) {
    return { ox: (bc - ac) * cell * t, oy: (br - ar) * cell * t };
  }
  if (row === br && col === bc) {
    return { ox: (ac - bc) * cell * t, oy: (ar - br) * cell * t };
  }
  return { ox: 0, oy: 0 };
}

const Match3Cell = React.memo(function Match3Cell({
  row,
  col,
  type,
  cell,
  pad,
  swapT,
  swapAR,
  swapAC,
  swapBR,
  swapBC,
  popP,
  isPopping,
  fallDy,
}: {
  row: number;
  col: number;
  type: FlowerType;
  cell: number;
  pad: number;
  swapT: number;
  swapAR: number;
  swapAC: number;
  swapBR: number;
  swapBC: number;
  popP: number;
  isPopping: boolean;
  fallDy: number;
}) {
  const baseX = pad + col * cell + cell * 0.5;
  const baseY = pad + row * cell + cell * 0.5;
  const R = cell * 0.36;
  const { ox, oy } = swapOffsets(row, col, cell, swapT, swapAR, swapAC, swapBR, swapBC);
  const scale = isPopping ? interpolate(popP, [0, 1], [1, 0.15], Extrapolation.CLAMP) : 1;
  const opacity = isPopping ? interpolate(popP, [0, 0.65, 1], [1, 0.85, 0], Extrapolation.CLAMP) : 1;

  return (
    <Group origin={vec(baseX, baseY)}>
      <Group transform={[{ translateY: fallDy }]} origin={vec(baseX, baseY)}>
        <Group transform={[{ translateX: ox }, { translateY: oy }]} origin={vec(baseX, baseY)}>
          <Group transform={[{ scale }]} origin={vec(baseX, baseY)}>
            <Group opacity={opacity}>
              <RoundedRect
                x={pad + col * cell + cell * 0.06}
                y={pad + row * cell + cell * 0.06}
                width={cell * 0.88}
                height={cell * 0.88}
                r={cell * 0.18}
                color="rgba(255,255,255,0.06)"
              >
                <Shadow dx={0} dy={2} blur={4} color="rgba(0,0,0,0.35)" />
              </RoundedRect>
              <StylizedFlower cx={baseX} cy={baseY} R={R} type={type} />
            </Group>
          </Group>
        </Group>
      </Group>
    </Group>
  );
});

function waitForTiming(
  sv: import('react-native-reanimated').SharedValue<number>,
  to: number,
  duration: number,
): Promise<void> {
  return new Promise((resolve) => {
    sv.value = 0;
    sv.value = withTiming(
      to,
      { duration, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(resolve)();
      },
    );
  });
}

function waitForSpring(
  sv: import('react-native-reanimated').SharedValue<number>,
  target: number,
): Promise<void> {
  return new Promise((resolve) => {
    sv.value = withSpring(
      target,
      { damping: 16, stiffness: 210, mass: 0.85 },
      (finished) => {
        if (finished) runOnJS(resolve)();
      },
    );
  });
}

type GameScreenProps = {
  onClose?: () => void;
};

export function GameScreen({ onClose }: GameScreenProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const gold = usePlayerStore((s) => s.gold);
  const diamonds = usePlayerStore((s) => s.diamonds);
  const lives = usePlayerStore((s) => s.lives);
  const maxLives = usePlayerStore((s) => s.maxLives);

  const board = useMatch3Store((s) => s.board);
  const score = useMatch3Store((s) => s.score);
  const movesLeft = useMatch3Store((s) => s.movesLeft);
  const targetScore = useMatch3Store((s) => s.targetScore);
  const lastMaxCombo = useMatch3Store((s) => s.lastMaxCombo);
  const reset = useMatch3Store((s) => s.reset);
  const setBoard = useMatch3Store((s) => s.setBoard);
  const addScore = useMatch3Store((s) => s.addScore);
  const setLastCombo = useMatch3Store((s) => s.setLastCombo);
  const consumeMove = useMatch3Store((s) => s.consumeMove);

  const layout = useRef({ x: 0, y: 0, w: 320, h: 320 });
  const [popping, setPopping] = useState<Set<string> | null>(null);
  const busyRef = useRef(false);

  const swapT = useSharedValue(0);
  const swapAR = useSharedValue(-1);
  const swapAC = useSharedValue(-1);
  const swapBR = useSharedValue(-1);
  const swapBC = useSharedValue(-1);
  const popT = useSharedValue(0);
  const fallP = useSharedValue(0);

  const [swapUi, setSwapUi] = useState({ t: 0, ar: -1, ac: -1, br: -1, bc: -1 });
  const [popUi, setPopUi] = useState(0);
  const [fallUi, setFallUi] = useState(0);
  const [falling, setFalling] = useState<FallMove[] | null>(null);

  useAnimatedReaction(
    () => ({
      t: swapT.value,
      ar: swapAR.value,
      ac: swapAC.value,
      br: swapBR.value,
      bc: swapBC.value,
    }),
    (v) => {
      runOnJS(setSwapUi)({ t: v.t, ar: v.ar, ac: v.ac, br: v.br, bc: v.bc });
    },
  );

  useAnimatedReaction(
    () => popT.value,
    (p) => {
      runOnJS(setPopUi)(p);
    },
  );

  useAnimatedReaction(
    () => fallP.value,
    (f) => {
      runOnJS(setFallUi)(f);
    },
  );

  const boardPx = Math.min(width - 32, width * 0.92);
  const cell = boardPx / GRID_SIZE;
  const pad = cell * 0.04;
  const cellRef = useRef(cell);
  cellRef.current = cell;

  const onBoardLayout = useCallback((e: LayoutChangeEvent) => {
    const { width: w, height: h, x, y } = e.nativeEvent.layout;
    layout.current = { x, y, w, h };
  }, []);

  const hitCell = useCallback((lx: number, ly: number): CellCoord | null => {
    const cs = cellRef.current;
    const { x, y, w } = layout.current;
    const relX = lx - x;
    const relY = ly - y;
    if (relX < 0 || relY < 0 || relX > w || relY > w) return null;
    const c = Math.floor(relX / cs);
    const r = Math.floor(relY / cs);
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return null;
    return { row: r, col: c };
  }, []);

  const playCascade = useCallback(
    async (steps: CascadeStep[], finalBoard: Board) => {
      for (let i = 0; i < steps.length; ) {
        const s = steps[i];
        if (s.kind !== 'clear') {
          i++;
          continue;
        }
        i++;
        const gravity = steps[i] as GravityStep | undefined;
        if (!gravity || gravity.kind !== 'gravity') continue;
        i++;

        const keys = new Set(s.cells.map((c) => `${c.row},${c.col}`));
        setPopping(keys);
        popT.value = 0;
        await waitForTiming(popT, 1, 300);
        setPopping(null);
        popT.value = 0;
        setBoard(gravity.boardAfter);
        if (gravity.falls.length > 0) {
          setFalling(gravity.falls);
          fallP.value = 1;
          await waitForSpring(fallP, 0);
          setFalling(null);
        }
      }
      setBoard(finalBoard);
    },
    [setBoard, popT, fallP],
  );

  const animateSwapForward = useCallback(async () => {
    swapT.value = 0;
    await waitForSpring(swapT, 1);
  }, [swapT]);

  const animateSwapReverse = useCallback(async () => {
    swapT.value = 1;
    await waitForSpring(swapT, 0);
  }, [swapT]);

  const clearSwapVisual = useCallback(() => {
    swapAR.value = -1;
    swapAC.value = -1;
    swapBR.value = -1;
    swapBC.value = -1;
    swapT.value = 0;
  }, [swapAR, swapAC, swapBR, swapBC, swapT]);

  const handleSwap = useCallback(
    async (a: CellCoord, b: CellCoord) => {
      if (busyRef.current) return;
      const stateBoard = useMatch3Store.getState().board;
      const res = trySwap(stateBoard, a, b);
      if (!res.ok) {
        if (res.reason === 'not_adjacent') return;
        swapAR.value = a.row;
        swapAC.value = a.col;
        swapBR.value = b.row;
        swapBC.value = b.col;
        await animateSwapForward();
        await animateSwapReverse();
        clearSwapVisual();
        return;
      }
      busyRef.current = true;
      consumeMove();
      swapAR.value = a.row;
      swapAC.value = a.col;
      swapBR.value = b.row;
      swapBC.value = b.col;
      await animateSwapForward();
      setBoard(res.boardAfterSwap);
      clearSwapVisual();
      addScore(res.totalScore);
      setLastCombo(res.maxComboIndex);
      await playCascade(res.steps, res.finalBoard);
      busyRef.current = false;
    },
    [
      addScore,
      animateSwapForward,
      animateSwapReverse,
      clearSwapVisual,
      consumeMove,
      playCascade,
      setBoard,
      setLastCombo,
      swapAR,
      swapAC,
      swapBR,
      swapBC,
    ],
  );

  const startRef = useRef<CellCoord | null>(null);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onStart((e) => {
          runOnJS((lx: number, ly: number) => {
            startRef.current = hitCell(lx, ly);
          })(e.x, e.y);
        })
        .onEnd((e) => {
          const start = startRef.current;
          startRef.current = null;
          if (!start) return;
          const tx = e.translationX;
          const ty = e.translationY;
          const th = 24;
          let nr = start.row;
          let nc = start.col;
          if (Math.abs(tx) > Math.abs(ty) && Math.abs(tx) > th) {
            nc += tx > 0 ? 1 : -1;
          } else if (Math.abs(ty) > th) {
            nr += ty > 0 ? 1 : -1;
          } else {
            return;
          }
          if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) return;
          const end: CellCoord = { row: nr, col: nc };
          runOnJS(handleSwap)(start, end);
        }),
    [handleSwap, hitCell],
  );

  const close = onClose ?? (() => router.back());

  const comboLabel = [1, 2, 3, 5][Math.min(lastMaxCombo, 3)] ?? 1;

  const fallDistByCell = useMemo(() => {
    const m = new Map<string, number>();
    if (!falling) return m;
    for (const f of falling) {
      const distRows = f.to.row - f.from.row;
      m.set(`${f.to.row},${f.to.col}`, distRows * cell);
    }
    return m;
  }, [falling, cell]);

  const cells = useMemo(() => {
    const list: React.ReactNode[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const key = `${r}-${c}`;
        const type = board[r]![c]!;
        const popKey = `${r},${c}`;
        const isPopping = popping?.has(popKey) ?? false;
        const dist = fallDistByCell.get(`${r},${c}`) ?? 0;
        const fallDy = dist > 0 ? -dist * fallUi : 0;
        list.push(
          <Match3Cell
            key={key}
            row={r}
            col={c}
            type={type}
            cell={cell}
            pad={pad}
            swapT={swapUi.t}
            swapAR={swapUi.ar}
            swapAC={swapUi.ac}
            swapBR={swapUi.br}
            swapBC={swapUi.bc}
            popP={popUi}
            isPopping={isPopping}
            fallDy={fallDy}
          />,
        );
      }
    }
    return list;
  }, [board, cell, pad, popping, swapUi, popUi, fallDistByCell, fallUi]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topRow}>
        <Pressable onPress={close} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backTxt}>←</Text>
        </Pressable>
        <View style={styles.currencyRow}>
          <Text style={styles.currency}>🪙 {gold}</Text>
          <Text style={styles.currency}>💎 {diamonds}</Text>
          <Text style={styles.currency}>❤️ {lives}/{maxLives}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Text style={styles.statMain}>
          {score} / {targetScore}
        </Text>
        <Text style={styles.statSub}>Moves: {movesLeft}</Text>
        <Text style={styles.statSub}>Best chain mult: ×{comboLabel}</Text>
      </View>

      <GestureDetector gesture={pan}>
        <View style={[styles.boardWrap, { width: boardPx, height: boardPx }]} onLayout={onBoardLayout}>
          <Canvas style={styles.canvas}>{cells}</Canvas>
        </View>
      </GestureDetector>

      <View style={styles.footer}>
        <Pressable style={styles.btn} onPress={reset}>
          <Text style={styles.btnTxt}>New board</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#12081F' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  backBtn: { padding: 8 },
  backTxt: { color: '#E9D5FF', fontSize: 22, fontWeight: '700' },
  currencyRow: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  currency: { color: '#F5F3FF', fontSize: 14, fontWeight: '700' },
  stats: { paddingHorizontal: 20, paddingBottom: 10 },
  statMain: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  statSub: { color: '#C4B5FD', fontSize: 13, marginTop: 4 },
  boardWrap: {
    alignSelf: 'center',
    marginTop: 8,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(167,139,250,0.45)',
    backgroundColor: 'rgba(30,16,48,0.95)',
  },
  canvas: { flex: 1 },
  footer: { flex: 1, justifyContent: 'flex-end', padding: 20 },
  btn: {
    alignSelf: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  btnTxt: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
