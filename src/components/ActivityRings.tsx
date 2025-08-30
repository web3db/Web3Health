import { useThemeColors } from '@/src/theme/useThemeColors';
import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type Ring = {
  current: number;
  goal: number;
};

type Props = {
  size?: number;            // overall diameter
  strokeWidth?: number;     // thickness of each ring
  move: Ring;               // kcal
  exercise: Ring;           // minutes
  stand: Ring;              // hours
  labels?: { move?: string; exercise?: string; stand?: string };
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const pct = (cur: number, goal: number) => clamp01(cur / Math.max(1, goal));

export default function ActivityRings({
  size = 220,
  strokeWidth = 14,
  move,
  exercise,
  stand,
  labels,
}: Props) {
  const c = useThemeColors();

  // Geometry
  const gap = 8; // spacing between rings
  const center = size / 2;
  const rOuter = center - strokeWidth / 2;
  const rMid = rOuter - strokeWidth - gap;
  const rInner = rMid - strokeWidth - gap;

  // Progress
  const pMove = pct(move.current, move.goal);
  const pExer = pct(exercise.current, exercise.goal);
  const pStand = pct(stand.current, stand.goal);

  // Circle math
  const circ = (r: number) => 2 * Math.PI * r;
  const dash = (p: number, r: number) => {
    const perim = circ(r);
    return { dashArray: perim, dashOffset: perim * (1 - p) };
  };

  // Labels
  const labelMove = labels?.move ?? 'Move';
  const labelExer = labels?.exercise ?? 'Exercise';
  const labelStand = labels?.stand ?? 'Stand';

  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: size,
          height: size,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Tracks */}
          <Circle
            cx={center}
            cy={center}
            r={rOuter}
            stroke={c.border}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            opacity={0.45}
          />
          <Circle
            cx={center}
            cy={center}
            r={rMid}
            stroke={c.border}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            opacity={0.45}
          />
          <Circle
            cx={center}
            cy={center}
            r={rInner}
            stroke={c.border}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            opacity={0.45}
          />

          {/* Progress rings */}
          <Circle
            cx={center}
            cy={center}
            r={rOuter}
            stroke={c.rings.move}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={dash(pMove, rOuter).dashArray}
            strokeDashoffset={dash(pMove, rOuter).dashOffset}
            transform={`rotate(-90 ${center} ${center})`}
          />
          <Circle
            cx={center}
            cy={center}
            r={rMid}
            stroke={c.rings.exercise}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={dash(pExer, rMid).dashArray}
            strokeDashoffset={dash(pExer, rMid).dashOffset}
            transform={`rotate(-90 ${center} ${center})`}
          />
          <Circle
            cx={center}
            cy={center}
            r={rInner}
            stroke={c.rings.stand}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={dash(pStand, rInner).dashArray}
            strokeDashoffset={dash(pStand, rInner).dashOffset}
            transform={`rotate(-90 ${center} ${center})`}
          />
        </Svg>

        {/* Center headline */}
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text style={{ color: c.text.primary, fontSize: 28, fontWeight: '700' }}>
            {Math.round(move.current)}
          </Text>
          <Text style={{ color: c.text.secondary, fontSize: 13 }}>
            / {Math.round(move.goal)} kcal
          </Text>
        </View>
      </View>

      {/* Legend with numeric progress + % */}
      <View style={{ marginTop: 12, gap: 6 }}>
        <LegendItem
          color={c.rings.move}
          label={labelMove}
          value={`${Math.round(move.current)}/${Math.round(move.goal)} kcal`}
          percent={`${Math.round(pMove * 100)}%`}
        />
        <LegendItem
          color={c.rings.exercise}
          label={labelExer}
          value={`${Math.round(exercise.current)}/${Math.round(exercise.goal)} min`}
          percent={`${Math.round(pExer * 100)}%`}
        />
        <LegendItem
          color={c.rings.stand}
          label={labelStand}
          value={`${Math.round(stand.current)}/${Math.round(stand.goal)} hr`}
          percent={`${Math.round(pStand * 100)}%`}
        />
      </View>
    </View>
  );
}

function LegendItem({
  color,
  label,
  value,
  percent,
}: {
  color: string;
  label: string;
  value: string;
  percent: string;
}) {
  const c = useThemeColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ color: c.text.primary, fontSize: 14, fontWeight: '600' }}>{label}</Text>
      <Text style={{ color: c.text.secondary, fontSize: 14 }}>· {value}</Text>
      <Text style={{ color: color, fontSize: 12, fontWeight: '700' }}> · {percent}</Text>
    </View>
  );
}
