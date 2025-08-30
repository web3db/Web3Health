import { sleepStagePalette } from "@/src/theme/sleepColors";
import { useThemeColors } from "@/src/theme/useThemeColors";
import React, { useMemo } from "react";
import { Text, View } from "react-native";
type Stage = "awake" | "light" | "deep" | "rem";

export default function StageDistribution({
  title,
  segments,
  colors = sleepStagePalette,
}: {
  title: string;
  segments: Array<{ stage: Stage; minutes: number }>;
  colors?: Record<Stage, string>;
}) {
  const c = useThemeColors();
  const totals = useMemo(() => {
    const t = segments.reduce((acc, s) => { acc[s.stage] = (acc[s.stage] ?? 0) + s.minutes; return acc; }, {} as Record<Stage, number>);
    const sum = Object.values(t).reduce((a, b) => a + b, 0) || 1;
    const pct = (n: number) => (n / sum) * 100;
    return {
      awake: pct(t.awake ?? 0),
      light: pct(t.light ?? 0),
      deep: pct(t.deep ?? 0),
      rem: pct(t.rem ?? 0),
    };
  }, [segments.map(s => s.stage + s.minutes).join("|")]);


  return (
    <View style={{ backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 16, padding: 12, rowGap: 8 }}>
      <Text style={{ color: c.text.primary, fontWeight: "700" }}>{title}</Text>

      {/* stacked bar */}
      <View style={{ height: 18, borderRadius: 9, overflow: "hidden", flexDirection: "row", borderColor: c.border, borderWidth: 1 }}>
        <View style={{ width: `${totals.deep}%`,  backgroundColor: colors.deep  }} />
        <View style={{ width: `${totals.rem}%`,   backgroundColor: colors.rem   }} />
        <View style={{ width: `${totals.light}%`, backgroundColor: colors.light }} />
        <View style={{ width: `${totals.awake}%`, backgroundColor: colors.awake }} />
      </View>

      {/* legend */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <Legend label={`Deep ${totals.deep.toFixed(0)}%`}   color={colors.deep}  />
        <Legend label={`REM ${totals.rem.toFixed(0)}%`}     color={colors.rem}   />
        <Legend label={`Light ${totals.light.toFixed(0)}%`} color={colors.light} />
        <Legend label={`Awake ${totals.awake.toFixed(0)}%`} color={colors.awake} />
      </View>
    </View>
  );

  function Legend({ label, color }: { label: string; color: string }) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: color, borderWidth: 1, borderColor: c.border }} />
        <Text style={{ color: c.text.secondary, fontSize: 12 }}>{label}</Text>
      </View>
    );
  }
}