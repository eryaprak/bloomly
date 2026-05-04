import React, { useMemo } from 'react';
import { Dimensions, View } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  RadialGradient,
  LinearGradient,
  vec,
  Path,
  Skia,
  Shadow,
  RoundedRect,
  Rect,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { PetalColor } from '@/engine/types';

const { width: W, height: H } = Dimensions.get('window');

const BLOOM_COLORS: Record<PetalColor, { center: string; outer: string; glow: string }> = {
  red:    { center: '#FF7070', outer: '#CC2020', glow: '#FF3B3B' },
  pink:   { center: '#FFB0D0', outer: '#DD5090', glow: '#FF5BA8' },
  purple: { center: '#D090FF', outer: '#8020D0', glow: '#9B40F0' },
  yellow: { center: '#FFE070', outer: '#DDA000', glow: '#F5C000' },
  green:  { center: '#90EE90', outer: '#228B22', glow: '#18B850' },
  blue:   { center: '#80C8FF', outer: '#1060CC', glow: '#2E78F0' },
};

const FLOWER_SLOTS = [
  { rx: 0.08, ry: 0.80 },
  { rx: 0.22, ry: 0.85 },
  { rx: 0.40, ry: 0.78 },
  { rx: 0.58, ry: 0.84 },
  { rx: 0.75, ry: 0.79 },
  { rx: 0.90, ry: 0.87 },
  { rx: 0.15, ry: 0.92 },
  { rx: 0.50, ry: 0.94 },
  { rx: 0.82, ry: 0.91 },
];

// Scattered tiny clouds / light puffs in sky area
const CLOUD_PUFFS = Array.from({ length: 8 }, (_, i) => ({
  x: (i / 8) * W * 1.1 + 10,
  y: H * 0.05 + (i % 3) * H * 0.06,
  r: 18 + (i % 4) * 10,
  o: 0.08 + (i % 3) * 0.04,
}));

// Tree silhouette paths (pre-computed, left + right edges)
function makeTreePath(baseX: number, baseY: number, trunkH: number, crownR: number): ReturnType<typeof Skia.Path.Make> {
  const p = Skia.Path.Make();
  // trunk
  p.moveTo(baseX - 5, baseY);
  p.lineTo(baseX + 5, baseY);
  p.lineTo(baseX + 5, baseY - trunkH);
  p.lineTo(baseX - 5, baseY - trunkH);
  p.close();
  // crown (3 stacked circles via oval)
  p.addOval({ x: baseX - crownR, y: baseY - trunkH - crownR * 1.8, width: crownR * 2, height: crownR * 2.4 });
  p.addOval({ x: baseX - crownR * 0.8, y: baseY - trunkH - crownR * 2.4, width: crownR * 1.6, height: crownR * 2 });
  return p;
}

const TREE_PATHS = [
  makeTreePath(W * 0.04, H * 0.68, 60, 28),
  makeTreePath(W * 0.12, H * 0.70, 45, 22),
  makeTreePath(W * 0.92, H * 0.67, 65, 30),
  makeTreePath(W * 0.84, H * 0.71, 48, 24),
];

// Floating leaf shapes for gentle animation
const LEAF_BASE = Array.from({ length: 12 }, (_, i) => ({
  x: (i / 12) * W * 0.9 + W * 0.05,
  y: H * 0.42 + (i % 5) * H * 0.04,
  r: 3 + (i % 3) * 2,
  speed: 1800 + i * 300,
  phase: i * 0.4,
}));

// Grass tufts along the horizon
const GRASS_TUFTS = Array.from({ length: 22 }, (_, i) => ({
  x: (i / 22) * W + (i % 3) * 5,
  y: H * 0.64 + (i % 4) * 5,
  h: 14 + (i % 5) * 6,
  o: 0.55 + (i % 3) * 0.15,
}));

function FlowerBloom({ x, y, color }: { x: number; y: number; color: PetalColor }) {
  const c = BLOOM_COLORS[color];
  const R = 20;
  const PR = 9;

  const petalPaths = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (i / 6) * Math.PI * 2;
      const px = x + Math.cos(angle) * R;
      const py = y + Math.sin(angle) * R;
      const path = Skia.Path.Make();
      path.addOval({ x: px - PR, y: py - PR / 1.5, width: PR * 2, height: PR * 2.2 });
      return path;
    });
  }, [x, y]);

  return (
    <Group>
      <Circle cx={x} cy={y} r={R + PR + 10} color={c.glow} opacity={0.18}>
        <Shadow dx={0} dy={0} blur={18} color={c.glow} />
      </Circle>
      {petalPaths.map((path, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <Group key={i}>
            <Path path={path} color={c.outer} opacity={0.94}>
              <RadialGradient
                c={vec(x + Math.cos(angle) * R, y + Math.sin(angle) * R)}
                r={PR * 1.6}
                colors={[c.center, c.outer]}
              />
            </Path>
          </Group>
        );
      })}
      <Circle cx={x} cy={y} r={9} color={c.center}>
        <RadialGradient c={vec(x - 2, y - 3)} r={9} colors={['#FFFDE0', c.center]} />
        <Shadow dx={0} dy={0} blur={8} color={c.glow} />
      </Circle>
    </Group>
  );
}

function FlowerSlot({ x, y }: { x: number; y: number }) {
  return (
    <Circle cx={x} cy={y} r={26} color="rgba(255,255,255,0.06)" style="stroke" strokeWidth={1.5} />
  );
}

// Animated floating leaf component
function FloatingLeaf({ leaf }: { leaf: typeof LEAF_BASE[0] }) {
  const offsetY = useSharedValue(0);

  React.useEffect(() => {
    offsetY.value = withRepeat(
      withSequence(
        withTiming(-14 - leaf.phase * 3, { duration: leaf.speed }),
        withTiming(0, { duration: leaf.speed }),
      ),
      -1,
      true,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offsetY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: leaf.x,
          top: leaf.y,
          width: leaf.r * 2,
          height: leaf.r * 2,
          borderRadius: leaf.r,
          backgroundColor: `rgba(80,160,60,0.28)`,
        },
        animStyle,
      ]}
      pointerEvents="none"
    />
  );
}

interface GardenBackgroundProps {
  bloomedColors: PetalColor[];
}

export default function GardenBackground({ bloomedColors }: GardenBackgroundProps) {
  return (
    <>
      <Canvas style={{ position: 'absolute', width: W, height: H }} pointerEvents="none">
        {/* === SKY GRADIENT === */}
        <Rect x={0} y={0} width={W} height={H * 0.68}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, H * 0.68)}
            colors={['#2461A8', '#4A90D9', '#87CEEB', '#B2DFDB']}
          />
        </Rect>

        {/* === HORIZON WARM GLOW === */}
        <Rect x={0} y={H * 0.56} width={W} height={H * 0.08}>
          <LinearGradient
            start={vec(0, H * 0.56)}
            end={vec(0, H * 0.64)}
            colors={['rgba(255,200,80,0)', 'rgba(255,200,80,0.22)', 'rgba(255,200,80,0)']}
          />
        </Rect>

        {/* === GROUND GRADIENT === */}
        <Rect x={0} y={H * 0.62} width={W} height={H * 0.38}>
          <LinearGradient
            start={vec(0, H * 0.62)}
            end={vec(0, H)}
            colors={['#3A7020', '#2D5A1B', '#1A3A0E', '#0E2008']}
          />
        </Rect>

        {/* === CLOUD PUFFS === */}
        <Group>
          {CLOUD_PUFFS.map((c, i) => (
            <Circle key={i} cx={c.x} cy={c.y} r={c.r} color={`rgba(255,255,255,${c.o})`} />
          ))}
        </Group>

        {/* === TREE SILHOUETTES === */}
        <Group>
          {TREE_PATHS.map((path, i) => (
            <Path key={i} path={path} color="rgba(10,35,8,0.55)" />
          ))}
        </Group>

        {/* === GRASS TUFTS === */}
        <Group>
          {GRASS_TUFTS.map((g, i) => {
            const p = Skia.Path.Make();
            p.moveTo(g.x, g.y);
            p.lineTo(g.x - 3, g.y - g.h);
            p.lineTo(g.x, g.y - g.h * 0.65);
            p.lineTo(g.x + 3, g.y - g.h);
            p.lineTo(g.x, g.y);
            p.close();
            return (
              <Path key={i} path={p} color={`rgba(40,100,25,${g.o})`} />
            );
          })}
        </Group>

        {/* === FLOWER SLOTS === */}
        {FLOWER_SLOTS.slice(bloomedColors.length).map((slot, i) => (
          <FlowerSlot key={`empty-${i}`} x={slot.rx * W} y={slot.ry * H} />
        ))}

        {/* === BLOOMED FLOWERS === */}
        {bloomedColors.map((color, i) => {
          const slot = FLOWER_SLOTS[i];
          if (!slot) return null;
          return (
            <FlowerBloom key={`bloom-${i}-${color}`} x={slot.rx * W} y={slot.ry * H} color={color} />
          );
        })}
      </Canvas>

      {/* === FLOATING LEAVES (Reanimated, outside Canvas) === */}
      <View style={{ position: 'absolute', width: W, height: H }} pointerEvents="none">
        {LEAF_BASE.map((leaf, i) => (
          <FloatingLeaf key={i} leaf={leaf} />
        ))}
      </View>
    </>
  );
}
