import React, { useMemo, useCallback, useState } from 'react';
import {
  Canvas,
  Image,
  useImage,
  Circle,
  Group,
  Rect,
} from '@shopify/react-native-skia';
import {
  Dimensions,
  GestureResponderEvent,
  Pressable,
  View,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';

import { useGameStore } from '@/stores/gameStore';
import { PetalColor } from '@/engine/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CELL_PADDING = 4;
const BOARD_PADDING = 16;

function petalAsset(color: PetalColor): number {
  switch (color) {
    case 'red':    return require('@assets/petals/petal_red.png');
    case 'pink':   return require('@assets/petals/petal_pink.png');
    case 'purple': return require('@assets/petals/petal_purple.png');
    case 'yellow': return require('@assets/petals/petal_yellow.png');
    case 'green':  return require('@assets/petals/petal_green.png');
    case 'blue':   return require('@assets/petals/petal_blue.png');
  }
}

const GLOW_COLORS: Record<PetalColor, string> = {
  red: '#FF4444',
  pink: '#FF69B4',
  purple: '#A855F7',
  yellow: '#FACC15',
  green: '#22C55E',
  blue: '#3B82F6',
};

interface GameBoardProps {
  onBloom?: (color: PetalColor) => void;
}

function PetalCell({
  color,
  x,
  y,
  size,
  isSelected,
  iceLayer,
  isLocked,
}: {
  color: PetalColor;
  x: number;
  y: number;
  size: number;
  isSelected: boolean;
  iceLayer: number;
  isLocked: boolean;
}) {
  const imgSrc = petalAsset(color);
  const image = useImage(imgSrc);

  if (!image) return null;

  const glowColor = GLOW_COLORS[color];

  return (
    <Group>
      {isSelected && (
        <Circle
          cx={x + size / 2}
          cy={y + size / 2}
          r={size / 2 + 4}
          color={glowColor}
          opacity={0.4}
        />
      )}
      <Image
        image={image}
        x={x}
        y={y}
        width={size}
        height={size}
        fit="contain"
      />
      {iceLayer > 0 && (
        <Rect x={x} y={y} width={size} height={size} color="#AADDFF" opacity={0.45} />
      )}
      {isLocked && (
        <>
          <Rect x={x} y={y} width={size} height={size} color="#888888" opacity={0.5} />
          <Circle cx={x + size / 2} cy={y + size / 2} r={size * 0.18} color="#333333" />
        </>
      )}
    </Group>
  );
}

export default function GameBoard({ onBloom }: GameBoardProps) {
  const gameState = useGameStore((s) => s.gameState);
  const pickPetal = useGameStore((s) => s.pickPetal);
  const isAnimating = useGameStore((s) => s.isAnimating);
  const lastResult = useGameStore((s) => s.lastResult);

  const [selectedCell, setSelectedCell] = React.useState<{ row: number; col: number } | null>(null);
  // Track actual view width for correct coordinate mapping
  const [viewWidth, setViewWidth] = useState<number>(SCREEN_WIDTH);

  // Notify parent about blooms
  React.useEffect(() => {
    if (lastResult?.bloom && onBloom) {
      onBloom(lastResult.bloom);
    }
  }, [lastResult, onBloom]);

  const board = gameState?.board ?? [];
  const rows = gameState?.level.rows ?? 5;
  const cols = gameState?.level.cols ?? 5;

  const cellSize = useMemo(() => {
    const available = SCREEN_WIDTH - BOARD_PADDING * 2;
    return Math.floor((available - CELL_PADDING * (cols - 1)) / cols);
  }, [cols]);

  const boardWidth = useMemo(
    () => cols * cellSize + (cols - 1) * CELL_PADDING,
    [cols, cellSize],
  );
  const boardHeight = useMemo(
    () => rows * cellSize + (rows - 1) * CELL_PADDING,
    [rows, cellSize],
  );

  // boardLeft is relative to the View (not screen), so use viewWidth
  const boardLeft = useMemo(
    () => (viewWidth - boardWidth) / 2,
    [viewWidth, boardWidth],
  );

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setViewWidth(e.nativeEvent.layout.width);
  }, []);

  const handleTouch = useCallback(
    (e: GestureResponderEvent) => {
      if (!gameState || isAnimating) return;
      const touchX = e.nativeEvent.locationX;
      const touchY = e.nativeEvent.locationY;

      const col = Math.floor((touchX - boardLeft) / (cellSize + CELL_PADDING));
      const row = Math.floor(touchY / (cellSize + CELL_PADDING));

      if (row < 0 || row >= rows || col < 0 || col >= cols) return;
      if (!board[row]?.[col]) return;

      setSelectedCell({ row, col });
      pickPetal(row, col);

      setTimeout(() => setSelectedCell(null), 300);
    },
    [gameState, isAnimating, boardLeft, cellSize, rows, cols, board, pickPetal],
  );

  if (!gameState) return null;

  return (
    <Pressable onPress={handleTouch}>
      <View
        style={[styles.container, { height: boardHeight }]}
        onLayout={handleLayout}
      >
        <Canvas style={{ width: viewWidth, height: boardHeight }}>
          {board.map((rowArr, ri) =>
            rowArr.map((petal, ci) => {
              if (!petal) return null;
              const x = boardLeft + ci * (cellSize + CELL_PADDING);
              const y = ri * (cellSize + CELL_PADDING);
              const isSelected =
                selectedCell?.row === ri && selectedCell?.col === ci;
              return (
                <PetalCell
                  key={petal.id}
                  color={petal.color}
                  x={x}
                  y={y}
                  size={cellSize}
                  isSelected={isSelected}
                  iceLayer={petal.iceLayer}
                  isLocked={petal.isLocked}
                />
              );
            }),
          )}
        </Canvas>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
