import React, { useMemo, useCallback, useState } from 'react';
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

// Inner highlight tints for 3D illusion
const HIGHLIGHT_COLORS: Record<PetalColor, string> = {
  red:    'rgba(255,160,160,0.35)',
  pink:   'rgba(255,200,220,0.35)',
  purple: 'rgba(200,150,255,0.35)',
  yellow: 'rgba(255,250,150,0.40)',
  green:  'rgba(150,255,180,0.35)',
  blue:   'rgba(130,200,255,0.35)',
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

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    if (isLocked) return;
    scale.value = withSequence(
      withTiming(0.85, { duration: 80 }),
      withSpring(1, { damping: 12, stiffness: 180 }),
    );
    onPress();
  }, [isLocked, scale, onPress]);

  const glowColor = GLOW_COLORS[color];
  const highlightColor = HIGHLIGHT_COLORS[color];

  return (
    <Pressable onPress={handlePress} style={{ width: size, height: size }}>
      <Animated.View style={[{ width: size, height: size }, animStyle]}>
        {/* Selection glow ring */}
        {isSelected && (
          <View
            style={[
              StyleSheet.absoluteFill,
              styles.selectionRing,
              {
                borderColor: glowColor,
                shadowColor: glowColor,
                borderRadius: size / 2,
              },
            ]}
          />
        )}

        {/* Drop shadow layer for 3D depth */}
        <View
          style={[
            styles.shadowLayer,
            {
              width: size - 4,
              height: size - 4,
              borderRadius: (size - 4) / 2,
              backgroundColor: glowColor,
              left: 2,
              top: 4,
            },
          ]}
        />

        {/* Petal image */}
        <Image
          source={PETAL_SOURCES[color]}
          style={{ width: size, height: size, position: 'absolute' }}
          resizeMode="contain"
        />

        {/* Inner highlight for 3D pop */}
        <View
          style={[
            styles.innerHighlight,
            {
              width: size * 0.55,
              height: size * 0.35,
              borderRadius: size * 0.2,
              backgroundColor: highlightColor,
              top: size * 0.1,
              left: size * 0.2,
            },
          ]}
        />

        {/* Ice overlay */}
        {iceLayer > 0 && (
          <View
            style={[
              StyleSheet.absoluteFill,
              styles.iceOverlay,
              { opacity: iceLayer >= 2 ? 0.65 : 0.42, borderRadius: size * 0.15 },
            ]}
          />
        )}

        {/* Ice crack lines for double ice */}
        {iceLayer >= 2 && (
          <View
            style={[
              StyleSheet.absoluteFill,
              styles.iceCrack,
              { borderRadius: size * 0.15 },
            ]}
          />
        )}

        {/* Lock overlay */}
        {isLocked && (
          <View style={[StyleSheet.absoluteFill, styles.lockOverlay, { borderRadius: size * 0.15 }]}>
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
      setTimeout(() => setSelectedCell(null), 300);
    },
    [gameState, isAnimating, board, pickPetal],
  );

  if (!gameState) return null;

  return (
    <View
      style={[styles.container, { height: boardHeight }]}
      onLayout={handleLayout}
    >
      {/* Board grid using absolute positioning */}
      <View style={[styles.boardArea, { width: boardWidth, height: boardHeight }]}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardArea: {
    position: 'relative',
  },
  selectionRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderWidth: 2.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  shadowLayer: {
    position: 'absolute',
    opacity: 0.28,
  },
  innerHighlight: {
    position: 'absolute',
    opacity: 1,
    transform: [{ rotate: '-20deg' }],
  },
  iceOverlay: {
    backgroundColor: '#AADDFF',
    borderWidth: 1,
    borderColor: 'rgba(180,230,255,0.7)',
  },
  iceCrack: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(200,240,255,0.85)',
  },
  lockOverlay: {
    backgroundColor: 'rgba(40,40,60,0.62)',
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
