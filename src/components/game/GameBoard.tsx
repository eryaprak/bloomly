import React, { useMemo, useCallback, useState, useEffect } from 'react';
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
import { PetalColor } from '@/engine/types';

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

const GLOW_COLORS: Record<PetalColor, string> = {
  red:    '#FF4444',
  pink:   '#FF69B4',
  purple: '#A855F7',
  yellow: '#FACC15',
  green:  '#22C55E',
  blue:   '#3B82F6',
};

// Lighter inner highlight tints for 3D illusion
const HIGHLIGHT_COLORS: Record<PetalColor, string> = {
  red:    'rgba(255,170,170,0.42)',
  pink:   'rgba(255,210,230,0.42)',
  purple: 'rgba(210,160,255,0.42)',
  yellow: 'rgba(255,252,160,0.48)',
  green:  'rgba(160,255,190,0.42)',
  blue:   'rgba(140,210,255,0.42)',
};

interface PetalCellProps {
  color: PetalColor;
  size: number;
  isSelected: boolean;
  iceLayer: number;
  isLocked: boolean;
  onPress: () => void;
}

function PetalCell({ color, size, isSelected, iceLayer, isLocked, onPress }: PetalCellProps) {
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  // Continuous pulse animation when selected
  useEffect(() => {
    if (isSelected) {
      pulseOpacity.value = 0.6;
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.18, { duration: 380 }),
          withTiming(1.0, { duration: 380 }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(pulseScale);
      pulseScale.value = withTiming(1, { duration: 150 });
      pulseOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [isSelected, pulseScale, pulseOpacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const handlePress = useCallback(() => {
    if (isLocked) return;
    scale.value = withSequence(
      withTiming(0.80, { duration: 70 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
    onPress();
  }, [isLocked, scale, onPress]);

  const glowColor = GLOW_COLORS[color];
  const highlightColor = HIGHLIGHT_COLORS[color];

  return (
    <Pressable onPress={handlePress} style={{ width: size, height: size }}>
      <Animated.View style={[{ width: size, height: size }, animStyle]}>

        {/* Continuous pulse ring (selected) */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.pulseRing,
            {
              borderColor: glowColor,
              borderRadius: size * 0.5,
              top: -(size * 0.12),
              left: -(size * 0.12),
              right: -(size * 0.12),
              bottom: -(size * 0.12),
            },
            pulseRingStyle,
          ]}
        />

        {/* Strong drop shadow for 3D depth */}
        <View
          style={[
            styles.shadowLayer,
            {
              width: size - 2,
              height: size - 2,
              borderRadius: (size - 2) / 2,
              backgroundColor: glowColor,
              left: 3,
              top: 5,
            },
          ]}
        />

        {/* Secondary softer shadow */}
        <View
          style={[
            styles.shadowLayerSoft,
            {
              width: size + 4,
              height: size + 4,
              borderRadius: (size + 4) / 2,
              backgroundColor: glowColor,
              left: -2,
              top: 2,
            },
          ]}
        />

        {/* Petal image */}
        <Image
          source={PETAL_SOURCES[color]}
          style={{ width: size, height: size, position: 'absolute' }}
          resizeMode="contain"
        />

        {/* Top-left highlight for 3D pop */}
        <View
          style={[
            styles.innerHighlight,
            {
              width: size * 0.58,
              height: size * 0.38,
              borderRadius: size * 0.22,
              backgroundColor: highlightColor,
              top: size * 0.08,
              left: size * 0.16,
            },
          ]}
        />

        {/* Bottom shadow gradient for depth */}
        <View
          style={[
            styles.bottomShadow,
            {
              width: size * 0.7,
              height: size * 0.25,
              borderRadius: size * 0.15,
              bottom: size * 0.06,
              left: size * 0.15,
            },
          ]}
        />

        {/* Ice overlay */}
        {iceLayer > 0 && (
          <View
            style={[
              StyleSheet.absoluteFill,
              styles.iceOverlay,
              { opacity: iceLayer >= 2 ? 0.7 : 0.45, borderRadius: size * 0.18 },
            ]}
          />
        )}

        {/* Ice crack lines for double ice */}
        {iceLayer >= 2 && (
          <View
            style={[
              StyleSheet.absoluteFill,
              styles.iceCrack,
              { borderRadius: size * 0.18 },
            ]}
          />
        )}

        {/* Lock overlay */}
        {isLocked && (
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
      if (!board[row]?.[col]) return;

      setSelectedCell({ row, col });
      pickPetal(row, col);
      setTimeout(() => setSelectedCell(null), 350);
    },
    [gameState, isAnimating, board, pickPetal],
  );

  if (!gameState) return null;

  // Build grid background slots (empty cell markers)
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
      {/* Board frame with inner glow */}
      <View
        style={[
          styles.boardFrame,
          { width: boardWidth + 24, height: boardHeight + 24 },
        ]}
      >
        {/* Board area */}
        <View style={[styles.boardArea, { width: boardWidth, height: boardHeight }]}>

          {/* Grid slot backgrounds (empty cells) */}
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
                  borderRadius: cellSize * 0.2,
                },
              ]}
            />
          ))}

          {/* Petals */}
          {board.map((rowArr, ri) =>
            rowArr.map((petal, ci) => {
              if (!petal) return null;
              const left = ci * (cellSize + CELL_PADDING);
              const top = ri * (cellSize + CELL_PADDING);
              const isSelected = selectedCell?.row === ri && selectedCell?.col === ci;

              return (
                <View
                  key={petal.id}
                  style={{ position: 'absolute', left, top }}
                >
                  <PetalCell
                    color={petal.color}
                    size={cellSize}
                    isSelected={isSelected}
                    iceLayer={petal.iceLayer}
                    isLocked={petal.isLocked}
                    onPress={() => handlePetalPress(ri, ci)}
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
    backgroundColor: 'rgba(15, 8, 35, 0.55)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  boardArea: {
    position: 'relative',
  },
  gridSlot: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2.5,
  },
  shadowLayer: {
    position: 'absolute',
    opacity: 0.35,
  },
  shadowLayerSoft: {
    position: 'absolute',
    opacity: 0.12,
  },
  innerHighlight: {
    position: 'absolute',
    opacity: 1,
    transform: [{ rotate: '-18deg' }],
  },
  bottomShadow: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.3)',
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
