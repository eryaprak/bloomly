import React, { useMemo } from 'react';
import { Dimensions, View } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  RadialGradient,
  vec,
  Path,
  Skia,
  Shadow,
  RoundedRect,
} from '@shopify/react-native-skia';
import { PetalColor } from '@/engine/types';

const { width: W, height: H } = Dimensions.get('window');

const BLOOM_COLORS: Record<PetalColor, { center: string; outer: string; glow: string }> = {
  red:    { center: '#FF7070', outer: '#CC2020', glow: '#FF2222' },
  pink:   { center: '#FFB0D0', outer: '#DD5090', glow: '#FF69B4' },
  purple: { center: '#D090FF', outer: '#8020D0', glow: '#A855F7' },
  yellow: { center: '#FFE070', outer: '#DDA000', glow: '#FACC15' },
  green:  { center: '#90EE90', outer: '#228B22', glow: '#22C55E' },
  blue:   { center: '#80C8FF', outer: '#1060CC', glow: '#3B82F6' },
};

// Pre-defined bloom flower positions (bottom area of screen, garden area)
// x: 0-1 relative, y: bottom portion
const FLOWER_SLOTS = [
  { rx: 0.08, ry: 0.78 },
  { rx: 0.22, ry: 0.83 },
  { rx: 0.40, ry: 0.76 },
  { rx: 0.58, ry: 0.82 },
  { rx: 0.75, ry: 0.77 },
  { rx: 0.90, ry: 0.85 },
  { rx: 0.15, ry: 0.91 },
  { rx: 0.50, ry: 0.93 },
  { rx: 0.82, ry: 0.90 },
];

// Stars in the sky (static decorative)
const STARS = Array.from({ length: 32 }, (_, i) => ({
  x: (((i * 137.5) % 100) / 100) * W,
  y: (((i * 97.3 + 13) % 55) / 100) * H,
  r: 0.8 + (i % 3) * 0.6,
  o: 0.3 + (i % 5) * 0.1,
}));

// Garden grass tufts (static decorative)
const GRASS_TUFTS: { x: number; y: number; h: number; o: number }[] = Array.from({ length: 18 }, (_, i) => ({
  x: (i / 18) * W + (i % 3) * 8,
  y: H * 0.56 + (i % 4) * 6,
  h: 12 + (i % 5) * 5,
  o: 0.3 + (i % 3) * 0.1,
}));

function FlowerBloom({ x, y, color }: { x: number; y: number; color: PetalColor }) {
  const c = BLOOM_COLORS[color];
  const R = 18; // petal orbit radius
  const PR = 8; // petal size

  // Build 6 petal paths
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
      {/* Glow halo */}
      <Circle cx={x} cy={y} r={R + PR + 6} color={c.glow} opacity={0.12}>
        <Shadow dx={0} dy={0} blur={14} color={c.glow} />
      </Circle>

      {/* Petals */}
      {petalPaths.map((path, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <Group key={i}>
            <Path path={path} color={c.outer} opacity={0.92}>
              <RadialGradient
                c={vec(x + Math.cos(angle) * R, y + Math.sin(angle) * R)}
                r={PR * 1.4}
                colors={[c.center, c.outer]}
              />
            </Path>
          </Group>
        );
      })}

      {/* Center circle */}
      <Circle cx={x} cy={y} r={8} color={c.center}>
        <RadialGradient c={vec(x - 2, y - 2)} r={8} colors={['#FFFFFF', c.center]} />
        <Shadow dx={0} dy={0} blur={6} color={c.glow} />
      </Circle>
    </Group>
  );
}

function FlowerSlot({ x, y }: { x: number; y: number }) {
  // Empty slot: subtle dotted circle placeholder
  return (
    <Circle cx={x} cy={y} r={24} color="rgba(255,255,255,0.04)" style="stroke" strokeWidth={1.5} />
  );
}

interface GardenBackgroundProps {
  bloomedColors: PetalColor[];
}

export default function GardenBackground({ bloomedColors }: GardenBackgroundProps) {
  return (
    <Canvas style={{ width: W, height: H }}>
      {/* Stars */}
      <Group>
        {STARS.map((s, i) => (
          <Circle key={i} cx={s.x} cy={s.y} r={s.r} color={`rgba(255,255,255,${s.o})`} />
        ))}
      </Group>

      {/* Horizontal aurora bands */}
      <RoundedRect x={0} y={H * 0.28} width={W} height={60} r={0} color="#5B21B6" opacity={0.08} />
      <RoundedRect x={0} y={H * 0.38} width={W} height={30} r={0} color="#7C3AED" opacity={0.06} />

      {/* Grass tufts */}
      <Group>
        {GRASS_TUFTS.map((g, i) => (
          <Group key={i}>
            <Path
              path={(() => {
                const p = Skia.Path.Make();
                p.moveTo(g.x, g.y);
                p.lineTo(g.x - 3, g.y - g.h);
                p.lineTo(g.x, g.y - g.h * 0.7);
                p.lineTo(g.x + 3, g.y - g.h);
                p.lineTo(g.x, g.y);
                p.close();
                return p;
              })()}
              color={`rgba(34,80,20,${g.o})`}
            />
          </Group>
        ))}
      </Group>

      {/* Flower slots (empty circles for unfilled slots) */}
      {FLOWER_SLOTS.slice(bloomedColors.length).map((slot, i) => (
        <FlowerSlot key={`empty-${i}`} x={slot.rx * W} y={slot.ry * H} />
      ))}

      {/* Bloomed flowers */}
      {bloomedColors.map((color, i) => {
        const slot = FLOWER_SLOTS[i];
        if (!slot) return null;
        return (
          <FlowerBloom key={`bloom-${i}-${color}`} x={slot.rx * W} y={slot.ry * H} color={color} />
        );
      })}
    </Canvas>
  );
}
