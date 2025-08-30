// src/components/TrendMiniCard.tsx
import TrendChart from "@/src/components/TrendChart";
import { useWorkoutStore } from "@/src/store/useWorkoutStore";
import { useThemeColors } from "@/src/theme/useThemeColors";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

/** Local types so we don't depend on store type exports */
type TrendRange = "7d" | "30d" | "90d";
type TrendMetric = "minutes" | "calories";

type Props = {
  metric?: TrendMetric;       // "minutes" | "calories"
  initialRange?: TrendRange;  // "7d" | "30d" | "90d"
  title?: string;
};

export default React.memo(function TrendMiniCard({
  metric = "minutes",
  initialRange = "30d",
  title,
}: Props) {
  const c = useThemeColors();
  const workouts = useWorkoutStore((s) => s.workouts); // safe: just reads array
  const [range, setRange] = React.useState<TrendRange>(initialRange);
  

  // ✅ Use the live `range` state so chips actually update the series
  const data = React.useMemo(() => computeTrend(workouts, metric, range), [workouts, metric, range]);

  const labels = React.useMemo(
    () =>
      data.dates.map((iso) => {
        const d = new Date(iso);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      }),
    [data.dates]
  );

  const labelText = title ?? (metric === "minutes" ? "Active minutes" : "Calories");

  return (
    <View style={{ backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 16, padding: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Text style={{ color: c.text.primary, fontWeight: "700" }}>{labelText} trend</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Chip label="7d"  active={range === "7d"}  onPress={() => setRange("7d")} />
          <Chip label="30d" active={range === "30d"} onPress={() => setRange("30d")} />
          <Chip label="90d" active={range === "90d"} onPress={() => setRange("90d")} />
        </View>
      </View>

      <TrendChart
        labels={labels}
        values={data.values}
        strokeColor={c.primary}
        gridColor={c.border}
      />
    </View>
  );

  function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={{
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: active ? c.muted : "transparent",
        }}
      >
        <Text style={{ color: active ? c.text.primary : c.text.secondary, fontSize: 12 }}>{label}</Text>
      </TouchableOpacity>
    );
  }
});

/** Pure helper: builds last-N-days series from the workouts array. */
function computeTrend(
  workouts: Array<{ startISO: string; durationMin?: number; calories?: number }>,
  metric: TrendMetric,
  range: TrendRange
) {
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;

  // keys for last N days (oldest → newest)
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }

  // aggregate by day
  const map = new Map<string, number>(keys.map((k) => [k, 0]));
  for (const w of workouts) {
    const day = w.startISO.slice(0, 10);
    if (!map.has(day)) continue;
    const add = metric === "minutes" ? (w.durationMin || 0) : (w.calories || 0);
    map.set(day, (map.get(day) || 0) + add);
  }

  return { dates: keys, values: keys.map((k) => map.get(k) || 0) };
}
