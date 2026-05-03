import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, Dimensions } from 'react-native';
import { useGameStore } from '@/stores/gameStore';
import { PetalColor } from '@/engine/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 7 slots — fit within screen with small margins
const SLOT_GAP = 5;
const DOCK_H_PADDING = 14;
const MAX_DOCK_WIDTH = SCREEN_WIDTH - 32; // 16px margin each side
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
  red:    '#FF4444',
  pink:   '#FF69B4',
  purple: '#A855F7',
  yellow: '#FACC15',
  green:  '#22C55E',
  blue:   '#3B82F6',
};

// How full is the dock? Danger zone colors
function getDangerColor(filled: number, total: number): string {
  const ratio = filled / total;
  if (ratio >= 0.86) return 'rgba(255,60,60,0.7)';   // 6/7 or 7/7 — RED ALERT
  if (ratio >= 0.57) return 'rgba(255,180,0,0.5)';    // 4-5/7 — WARNING
  return 'rgba(180,120,255,0.25)';                     // safe
}

export default function DockBar() {
  const gameState = useGameStore((s) => s.gameState);
  const lastResult = useGameStore((s) => s.lastResult);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (lastResult?.gameOver) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
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
      {/* Inner top highlight for 3D depth illusion */}
      <View style={styles.topHighlight} />

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
                      backgroundColor: 'rgba(0,0,0,0.35)',
                      shadowColor: glowColor,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.7,
                      shadowRadius: 6,
                      elevation: 5,
                    }
                  : styles.emptySlot,
              ]}
            >
              {/* 3D inner shadow top */}
              <View
                style={[
                  styles.slotInnerTop,
                  { backgroundColor: petal ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)' },
                ]}
              />

              {petal && (
                <>
                  {/* Drop shadow underneath petal */}
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

              {/* 3D inner bottom shadow */}
              <View style={styles.slotInnerBottom} />
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: DOCK_H_PADDING,
    backgroundColor: 'rgba(8,4,20,0.75)',
    borderRadius: 22,
    borderWidth: 1.5,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'visible',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
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
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emptySlot: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  slotInnerTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SLOT_SIZE * 0.35,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  slotInnerBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SLOT_SIZE * 0.3,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  petalShadow: {
    position: 'absolute',
    opacity: 0.3,
    top: 4,
    left: 4,
  },
  petalImage: {
    width: SLOT_SIZE - 8,
    height: SLOT_SIZE - 8,
    position: 'absolute',
  },
});
