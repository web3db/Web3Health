import React, { useMemo } from "react";
import { View } from "react-native";
import Svg, { Rect } from "react-native-svg";

type Stage = "awake" | "light" | "deep" | "rem";
export default function Hypnogram({
  segments,
  height = 46,
  colors,
  borderColor,
}: {
  segments: Array<{ stage: Stage; minutes: number }>;
  height?: number;
  colors: Record<Stage, string>;
  borderColor: string;
}) {
  // normalize to total width
  const total = Math.max(1, segments.reduce((a, s) => a + (s.minutes || 0), 0));
  const items = useMemo(() => {
    let x = 0;
    return segments.map((s, i) => {
      const wPct = (s.minutes || 0) / total;
      const item = { x, wPct, stage: s.stage as Stage, key: `${s.stage}-${i}` };
      x += wPct;
      return item;
    });
  }, [segments.map(s => s.minutes + s.stage).join("|")]);

  return (
    <View style={{ height }}>
      <Svg width="100%" height="100%">
        {items.map((it) => (
          <Rect
            key={it.key}
            x={`${it.x * 100}%`}
            y={0}
            width={`${it.wPct * 100}%`}
            height="100%"
            fill={colors[it.stage]}
            stroke={borderColor}
            strokeWidth={1}
          />
        ))}
      </Svg>
    </View>
  );
}
