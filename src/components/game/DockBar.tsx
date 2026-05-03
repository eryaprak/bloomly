import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Canvas, Image, useImage, RoundedRect, Group, Shadow } from '@shopify/react-native-skia';
import { useGameStore } from '@/stores/gameStore';
import { PetalColor } from '@/engine/types';

const SLOT_SIZE = 56;
const SLOT_GAP = 8;

const PETAL_SOURCES: Record<PetalColor, number> = {
  red:    require('@assets/petals/petal_red.png'),
  pink:   require('@assets/petals/petal_pink.png'),
  purple: require('@assets/petals/petal_purple.png'),
  yellow: require('@assets/petals/petal_yellow.png'),
  green:  require('@assets/petals/petal_green.png'),
  blue:   require('@assets/petals/petal_blue.png'),
};

const SLOT_BORDER_COLORS: Record<PetalColor, string> = {
  red:    '#FF4444',
  pink:   '#FF69B4',
  purple: '#A855F7',
  yellow: '#FACC15',
  green:  '#22C55E',
  blue:   '#3B82F6',
};

function DockSlotImage({ color }: { color: PetalColor }) {
  const image = useImage(PETAL_SOURCES[color]);
  if (!image) return null;
  const borderColor = SLOT_BORDER_COLORS[color];
  return (
    <Group>
      {/* Glow shadow */}
      <RoundedRect x={0} y={0} width={SLOT_SIZE} height={SLOT_SIZE} r={10} color={borderColor} opacity={0.18}>
        <Shadow dx={0} dy={0} blur={10} color={borderColor} />
      </RoundedRect>
      {/* Colored border */}
      <RoundedRect x={1} y={1} width={SLOT_SIZE - 2} height={SLOT_SIZE - 2} r={9} color="transparent" style="stroke" strokeWidth={2.5}>
        <Shadow dx={0} dy={0} blur={6} color={borderColor} />
      </RoundedRect>
      <Image image={image} x={4} y={4} width={SLOT_SIZE - 8} height={SLOT_SIZE - 8} fit="contain" />
    </Group>
  );
}

function EmptySlot() {
  return (
    <Group>
      <RoundedRect x={1} y={1} width={SLOT_SIZE - 2} height={SLOT_SIZE - 2} r={9} color="rgba(255,255,255,0.06)" />
      <RoundedRect x={1} y={1} width={SLOT_SIZE - 2} height={SLOT_SIZE - 2} r={9} color="rgba(255,255,255,0.2)" style="stroke" strokeWidth={1.5} />
    </Group>
  );
}

export default function DockBar() {
  const gameState = useGameStore((s) => s.gameState);
  const lastResult = useGameStore((s) => s.lastResult);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Shake when dock is full (game over trigger)
  useEffect(() => {
    if (lastResult?.gameOver) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [lastResult, shakeAnim]);

  if (!gameState) return null;

  const dock = gameState.dock;
  const slotCount = dock.length;
  const totalWidth = slotCount * SLOT_SIZE + (slotCount - 1) * SLOT_GAP;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateX: shakeAnim }] }]}
    >
      <View style={[styles.row, { width: totalWidth }]}>
        {dock.map((slot, i) => (
          <View key={i} style={styles.slot}>
            <Canvas style={{ width: SLOT_SIZE, height: SLOT_SIZE }}>
              {slot.petal ? (
                <DockSlotImage color={slot.petal.color} />
              ) : (
                <EmptySlot />
              )}
            </Canvas>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: 'rgba(10,5,25,0.6)',
    borderRadius: 24,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(180,120,255,0.25)',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  row: {
    flexDirection: 'row',
    gap: SLOT_GAP,
  },
  slot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
  },
});
