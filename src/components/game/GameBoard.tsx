import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  withRepeat,
  cancelAnimation,
} from 'react-native-reanimated';

import { useGameStore } from '@/stores/gameStore';
import { PetalColor, Petal } from '@/engine/types';
import { PETAL_RICH, THEME } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CELL_PADDING = 4;
const BOARD_PADDING = 16;

const PETAL_SOURCES: Record<PetalColor, any> = {
  red:    require('@assets/petals/petal_red.png'),
  pink:   require('@assets/petals/petal_pink.png'),
  purple: require('@assets/petals/petal_purple.png'),
  yellow: require('@assets/petals/petal_yellow.png'),
  green:  require('@assets/petals/petal_green.png'),
  blue:   require('@assets/petals/petal_blue.png'),
};

// ─── Top Petal Cell (fully interactive) ──────────────────────────────────────

interface TopPetalCellProps {
  petal: Petal;
  size: number;
  isSelected: boolean;
  isRevealing: boolean;
  onPress: () => void;
}

function TopPetalCell({ petal, size, isSelected, isRevealing, onPress }: TopPetalCellProps) {
  const scale = useSharedValue(isRevealing ? 0.75 : 1);
  const opacity = useSharedValue(isRevealing ? 0.35 : 1);
  const rotate = useSharedValue(isRevealing ? '-5deg' : '0deg');
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  useEffect(() => {
    if (isRevealing) {
      scale.value = withSpring(1, { damping: 11, stiffness: 190 });
      opacity.value = withTiming(1, { duration: 260 });
      rotate.value = withSequence(
        withTiming('5deg', { duration: 100 }),
        withSpring('0deg', { damping: 8, stiffness: 200 }),
      );
    }
  }, [isRevealing, scale, opacity, rotate]);

  useEffect(() => {
    if (isSelected) {
      pulseOpacity.value = 0.7;
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.22, { duration: 360 }),
          withTiming(1.0, { duration: 360 }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(pulseScale);
      pulseScale.value = withTiming(1, { duration: 140 });
      pulseOpacity.value = withTiming(0, { duration: 140 });
    }
  }, [isSelected, pulseScale, pulseOpacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: rotate.value }],
    opacity: opacity.value,
  }));

  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const handlePress = useCallback(() => {
    if (petal.isLocked) return;
    scale.value = withSequence(
      withTiming(0.76, { duration: 65 }),
      withSpring(1, { damping: 9, stiffness: 220 }),
    );
    onPress();
  }, [petal.isLocked, scale, onPress]);

  const rich = PETAL_RICH[petal.color];

  return (
    <Pressable onPress={handlePress} style={{ width: size, height: size }}>
      <Animated.View style={[{ width: size, height: size }, animStyle]}>

        {/* Continuous pulse ring (selected) */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.pulseRing,
            {
              borderColor: rich.glow,
              borderRadius: size * 0.5,
              top: -(size * 0.14),
              left: -(size * 0.14),
              right: -(size * 0.14),
              bottom: -(size * 0.14),
            },
            pulseRingStyle,
          ]}
        />

        {/* Tile backing card (cream/white, gives depth) */}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: size * 0.22,
              backgroundColor: 'rgba(255,252,240,0.20)',
              borderWidth: isSelected ? 2 : 1,
              borderColor: isSelected ? rich.glow : 'rgba(255,235,160,0.25)',
            },
          ]}
        />

        {/* Outer soft glow shadow */}
        <View
          style={[
            styles.shadowLayerSoft,
            {
              width: size + 6,
              height: size + 6,
              borderRadius: (size + 6) / 2,
              backgroundColor: rich.glow,
              left: -3,
              top: 3,
            },
          ]}
        />

        {/* Drop shadow */}
        <View
          style={[
            styles.shadowLayer,
            {
              width: size - 2,
              height: size - 2,
              borderRadius: (size - 2) / 2,
              backgroundColor: rich.shadow,
              left: 2,
              top: 6,
            },
          ]}
        />

        <Image
          source={PETAL_SOURCES[petal.color]}
          style={{ width: size, height: size, position: 'absolute' }}
          resizeMode="contain"
        />

        {/* Inner specular highlight (top-left shine) */}
        <View
          style={[
            styles.innerHighlight,
            {
              width: size * 0.62,
              height: size * 0.42,
              borderRadius: size * 0.24,
              backgroundColor: rich.highlight,
              top: size * 0.07,
              left: size * 0.14,
            },
          ]}
        />

        {/* Bottom vignette */}
        <View
          style={[
            styles.bottomShadow,
            {
              width: size * 0.72,
              height: size * 0.28,
              borderRadius: size * 0.16,
              bottom: size * 0.05,
              left: size * 0.14,
            },
          ]}
        />

        {petal.iceLayer > 0 && (
          <View
            style={[
              StyleSheet.absoluteFill,
              styles.iceOverlay,
              { opacity: petal.iceLayer >= 2 ? 0.7 : 0.45, borderRadius: size * 0.18 },
            ]}
          />
        )}

        {petal.iceLayer >= 2 && (
          <View
            style={[
              StyleSheet.absoluteFill,
              styles.iceCrack,
              { borderRadius: size * 0.18 },
            ]}
          />
        )}

        {petal.isLocked && (
          <View style={[StyleSheet.absoluteFill, styles.lockOverlay, { borderRadius: size * 0.18 }]}>
            <View style={[styles.lockBody, { width: size * 0.38, height: size * 0.32, borderRadius: size * 0.06 }]}>
              <View style={[styles.lockShackle, { width: size * 0.22, height: size * 0.2, borderRadius: size * 0.12, borderWidth: size * 0.045 }]} />
            </View>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ─── Under-layer Petal (dimmed, not interactive) ──────────────────────────────

interface UnderPetalProps {
  color: PetalColor;
  size: number;
  layerIndex: number;
}

function UnderPetal({ color, size, layerIndex }: UnderPetalProps) {
  const scaleFactor = 0.82 - layerIndex * 0.06;
  const scaledSize = Math.floor(size * scaleFactor);
  const offset = Math.floor((size - scaledSize) / 2);

  return (
    <View
      style={{
        position: 'absolute',
        left: offset + layerIndex * 2,
        top: offset + layerIndex * 2,
        width: scaledSize,
        height: scaledSize,
        opacity: 0.38 - layerIndex * 0.08,
      }}
      pointerEvents="none"
    >
      <Image
        source={PETAL_SOURCES[color]}
        style={{ width: scaledSize, height: scaledSize }}
        resizeMode="contain"
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: `rgba(0,0,0,${0.62 + layerIndex * 0.08})`,
            borderRadius: scaledSize * 0.18,
          },
        ]}
      />
    </View>
  );
}

// ─── Stack Cell renderer ──────────────────────────────────────────────────────

interface StackCellProps {
  stack: Petal[];
  size: number;
  isSelected: boolean;
  prevTopId: string | null;
  onPressTop: () => void;
}

function StackCell({ stack, size, isSelected, prevTopId, onPressTop }: StackCellProps) {
  if (stack.length === 0) return null;

  const topPetal = stack[stack.length - 1];
  const isRevealing = prevTopId !== null && prevTopId !== topPetal.id;

  return (
    <View style={{ width: size, height: size }}>
      {stack.slice(0, -1).map((underPetal, idx) => {
        const layerIndex = stack.length - 2 - idx;
        return (
          <UnderPetal
            key={underPetal.id}
            color={underPetal.color}
            size={size}
            layerIndex={layerIndex}
          />
        );
      })}
      <View style={StyleSheet.absoluteFill}>
        <TopPetalCell
          petal={topPetal}
          size={size}
          isSelected={isSelected}
          isRevealing={isRevealing}
          onPress={onPressTop}
        />
      </View>
    </View>
  );
}

// ─── GameBoard ────────────────────────────────────────────────────────────────

interface GameBoardProps {
  onBloom?: (color: PetalColor) => void;
}

export default function GameBoard({ onBloom }: GameBoardProps) {
  const gameState = useGameStore((s) => s.gameState);
  const pickPetal = useGameStore((s) => s.pickPetal);
  const isAnimating = useGameStore((s) => s.isAnimating);
  const lastResult = useGameStore((s) => s.lastResult);

  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [viewWidth, setViewWidth] = useState<number>(SCREEN_WIDTH);

  const prevTopIds = useRef<Map<string, string>>(new Map());

  React.useEffect(() => {
    if (lastResult?.bloom && onBloom) {
      onBloom(lastResult.bloom);
    }
  }, [lastResult, onBloom]);

  const board = gameState?.board ?? [];
  const rows = gameState?.level.rows ?? 5;
  const cols = gameState?.level.cols ?? 5;

  const cellSize = useMemo(() => {
    const available = viewWidth - BOARD_PADDING * 2;
    return Math.floor((available - CELL_PADDING * (cols - 1)) / cols);
  }, [cols, viewWidth]);

  const boardWidth = useMemo(
    () => cols * cellSize + (cols - 1) * CELL_PADDING,
    [cols, cellSize],
  );
  const boardHeight = useMemo(
    () => rows * cellSize + (rows - 1) * CELL_PADDING,
    [rows, cellSize],
  );

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setViewWidth(e.nativeEvent.layout.width);
  }, []);

  const handlePetalPress = useCallback(
    (row: number, col: number) => {
      if (!gameState || isAnimating) return;
      const stack = board[row]?.[col];
      if (!stack || stack.length === 0) return;

      const newMap = new Map<string, string>();
      for (let r = 0; r < board.length; r++) {
        for (let c = 0; c < (board[r]?.length ?? 0); c++) {
          const s = board[r][c];
          if (s && s.length > 0) {
            newMap.set(`${r}_${c}`, s[s.length - 1].id);
          }
        }
      }
      prevTopIds.current = newMap;

      setSelectedCell({ row, col });
      pickPetal(row, col);
      setTimeout(() => setSelectedCell(null), 350);
    },
    [gameState, isAnimating, board, pickPetal],
  );

  if (!gameState) return null;

  const gridSlots: { left: number; top: number }[] = [];
  for (let ri = 0; ri < rows; ri++) {
    for (let ci = 0; ci < cols; ci++) {
      gridSlots.push({
        left: ci * (cellSize + CELL_PADDING),
        top: ri * (cellSize + CELL_PADDING),
      });
    }
  }

  return (
    <View
      style={[styles.container, { height: boardHeight + BOARD_PADDING * 2 }]}
      onLayout={handleLayout}
    >
      <View
        style={[
          styles.boardFrame,
          { width: boardWidth + 28, height: boardHeight + 28 },
        ]}
      >
        {/* Frosted glass inner top highlight */}
        <View style={styles.boardTopHighlight} />

        <View style={[styles.boardArea, { width: boardWidth, height: boardHeight }]}>

          {/* Grid slot backgrounds */}
          {gridSlots.map(({ left, top }, idx) => (
            <View
              key={`slot-${idx}`}
              style={[
                styles.gridSlot,
                {
                  position: 'absolute',
                  left,
                  top,
                  width: cellSize,
                  height: cellSize,
                  borderRadius: cellSize * 0.22,
                },
              ]}
            />
          ))}

          {/* Stacks */}
          {board.map((rowArr, ri) =>
            rowArr.map((stack, ci) => {
              if (!stack || stack.length === 0) return null;
              const left = ci * (cellSize + CELL_PADDING);
              const top = ri * (cellSize + CELL_PADDING);
              const isSelected = selectedCell?.row === ri && selectedCell?.col === ci;
              const cellKey = `${ri}_${ci}`;
              const prevTopId = prevTopIds.current.get(cellKey) ?? null;

              return (
                <View
                  key={cellKey}
                  style={{ position: 'absolute', left, top }}
                >
                  <StackCell
                    stack={stack}
                    size={cellSize}
                    isSelected={isSelected}
                    prevTopId={prevTopId}
                    onPressTop={() => handlePetalPress(ri, ci)}
                  />
                </View>
              );
            }),
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,248,235,0.10)',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: THEME.board.border,
    shadowColor: THEME.board.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 14,
    overflow: 'visible',
  },
  boardTopHighlight: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 2,
    backgroundColor: 'rgba(255,240,170,0.35)',
    borderRadius: 1,
  },
  boardArea: {
    position: 'relative',
  },
  gridSlot: {
    backgroundColor: 'rgba(255,248,220,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.18)',
    shadowColor: '#C8A850',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 1,
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 3,
  },
  shadowLayer: {
    position: 'absolute',
    opacity: 0.42,
  },
  shadowLayerSoft: {
    position: 'absolute',
    opacity: 0.13,
  },
  innerHighlight: {
    position: 'absolute',
    opacity: 1,
    transform: [{ rotate: '-18deg' }],
  },
  bottomShadow: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  iceOverlay: {
    backgroundColor: '#AADDFF',
    borderWidth: 1.5,
    borderColor: 'rgba(180,230,255,0.75)',
  },
  iceCrack: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(200,240,255,0.9)',
  },
  lockOverlay: {
    backgroundColor: 'rgba(40,40,60,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBody: {
    backgroundColor: '#888',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    overflow: 'visible',
  },
  lockShackle: {
    borderColor: '#888',
    borderTopWidth: 0,
    marginTop: -10,
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
});
