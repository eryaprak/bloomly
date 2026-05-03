import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';
import { useGameStore } from '@/stores/gameStore';
import { PetalColor } from '@/engine/types';

const SLOT_SIZE = 56;
const SLOT_GAP = 8;

const PETAL_SOURCES: Record<PetalColor, any> = {
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

export default function DockBar() {
  const gameState = useGameStore((s) => s.gameState);
  const lastResult = useGameStore((s) => s.lastResult);

  const shakeAnim = useRef(new Animated.Value(0)).current;

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
        {dock.map((slot, i) => {
          const petal = slot.petal;
          const borderColor = petal ? SLOT_BORDER_COLORS[petal.color] : 'rgba(255,255,255,0.2)';
          return (
            <View
              key={`${i}-${petal?.color ?? 'empty'}`}
              style={[
                styles.slot,
                {
                  borderColor,
                  borderWidth: petal ? 2.5 : 1.5,
                  backgroundColor: petal ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.06)',
                  shadowColor: petal ? borderColor : 'transparent',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: petal ? 0.6 : 0,
                  shadowRadius: petal ? 8 : 0,
                },
              ]}
            >
              {petal && (
                <Image
                  source={PETAL_SOURCES[petal.color]}
                  style={styles.petalImage}
                  resizeMode="contain"
                />
              )}
            </View>
          );
        })}
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
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petalImage: {
    width: SLOT_SIZE - 12,
    height: SLOT_SIZE - 12,
  },
});
