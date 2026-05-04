import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, Dimensions } from 'react-native';
import { useGameStore } from '@/stores/gameStore';
import { PetalColor } from '@/engine/types';
import { THEME } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLOT_GAP = 5;
const DOCK_H_PADDING = 14;
const MAX_DOCK_WIDTH = SCREEN_WIDTH - 32;
const SLOT_SIZE = Math.floor(
  (MAX_DOCK_WIDTH - DOCK_H_PADDING * 2 - SLOT_GAP * 6) / 7,
);

const PETAL_SOURCES: Record<PetalColor, any> = {
  red:    require('@assets/petals/petal_red.png'),
  pink:   require('@assets/petals/petal_pink.png'),
  purple: require('@assets/petals/petal_purple.png'),
  yellow: require('@assets/petals/petal_yellow.png'),
  green:  require('@assets/petals/petal_green.png'),
  blue:   require('@assets/petals/petal_blue.png'),
};

const GLOW_COLORS: Record<PetalColor, string> = {
  red:    '#FF3B3B',
  pink:   '#FF5BA8',
  purple: '#9B40F0',
  yellow: '#F5C000',
  green:  '#18B850',
  blue:   '#2E78F0',
};

function getDangerColor(filled: number, total: number): string {
  const ratio = filled / total;
  if (ratio >= 0.86) return 'rgba(255,60,60,0.75)';
  if (ratio >= 0.57) return 'rgba(255,180,0,0.55)';
  return THEME.dock.border;
}

export default function DockBar() {
  const gameState = useGameStore((s) => s.gameState);
  const lastResult = useGameStore((s) => s.lastResult);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (lastResult?.gameOver) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 11, duration: 52, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -11, duration: 52, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 52, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 52, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4, duration: 52, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 52, useNativeDriver: true }),
      ]).start();
    }
  }, [lastResult, shakeAnim]);

  if (!gameState) return null;

  const dock = gameState.dock;
  const slotCount = dock.length;
  const filledCount = dock.filter((s) => s.petal !== null).length;
  const dangerBorderColor = getDangerColor(filledCount, slotCount);

  const totalWidth = slotCount * SLOT_SIZE + (slotCount - 1) * SLOT_GAP + DOCK_H_PADDING * 2;

  return (
    <Animated.View
      style={[
        styles.container,
        { width: totalWidth, borderColor: dangerBorderColor },
        { transform: [{ translateX: shakeAnim }] },
      ]}
    >
      {/* Top golden highlight line */}
      <View style={styles.topHighlight} />

      {/* Subtle inner side highlights for 3D convex feel */}
      <View style={styles.leftEdge} />
      <View style={styles.rightEdge} />

      <View style={styles.row}>
        {dock.map((slot, i) => {
          const petal = slot.petal;
          const glowColor = petal ? GLOW_COLORS[petal.color] : 'transparent';

          return (
            <View
              key={`${i}-${petal?.color ?? 'empty'}`}
              style={[
                styles.slot,
                petal
                  ? {
                      borderColor: glowColor,
                      borderWidth: 2,
                      backgroundColor: 'rgba(255,248,220,0.14)',
                      shadowColor: glowColor,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.85,
                      shadowRadius: 7,
                      elevation: 6,
                    }
                  : styles.emptySlot,
              ]}
            >
              {/* Inner top sheen */}
              <View
                style={[
                  styles.slotInnerTop,
                  { backgroundColor: petal ? 'rgba(255,248,200,0.12)' : 'rgba(255,235,160,0.06)' },
                ]}
              />

              {petal && (
                <>
                  <View
                    style={[
                      styles.petalShadow,
                      {
                        width: SLOT_SIZE - 8,
                        height: SLOT_SIZE - 8,
                        backgroundColor: glowColor,
                        borderRadius: (SLOT_SIZE - 8) / 2,
                      },
                    ]}
                  />
                  <Image
                    source={PETAL_SOURCES[petal.color]}
                    style={styles.petalImage}
                    resizeMode="contain"
                  />
                </>
              )}

              {/* Inner bottom shadow (depth) */}
              <View style={styles.slotInnerBottom} />
            </View>
          );
        })}
      </View>

      {/* Bottom shadow strip */}
      <View style={styles.bottomEdge} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: DOCK_H_PADDING,
    backgroundColor: THEME.dock.bg,
    borderRadius: 24,
    borderWidth: 1.5,
    shadowColor: THEME.dock.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
    overflow: 'hidden',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 2,
    backgroundColor: THEME.dock.highlight,
    borderRadius: 1,
  },
  leftEdge: {
    position: 'absolute',
    top: 10,
    left: 0,
    width: 2,
    bottom: 10,
    backgroundColor: 'rgba(255,220,120,0.15)',
    borderRadius: 1,
  },
  rightEdge: {
    position: 'absolute',
    top: 10,
    right: 0,
    width: 2,
    bottom: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 1,
  },
  bottomEdge: {
    position: 'absolute',
    bottom: 0,
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 1,
  },
  row: {
    flexDirection: 'row',
    gap: SLOT_GAP,
    alignItems: 'center',
  },
  slot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emptySlot: {
    borderWidth: 1,
    borderColor: 'rgba(200,168,80,0.25)',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  slotInnerTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SLOT_SIZE * 0.36,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  slotInnerBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SLOT_SIZE * 0.32,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  petalShadow: {
    position: 'absolute',
    opacity: 0.32,
    top: 4,
    left: 4,
  },
  petalImage: {
    width: SLOT_SIZE - 8,
    height: SLOT_SIZE - 8,
    position: 'absolute',
  },
});
