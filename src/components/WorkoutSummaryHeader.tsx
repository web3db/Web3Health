import { useWorkoutStore } from "@/src/store/useWorkoutStore";
import { useThemeColors } from "@/src/theme/useThemeColors";
import React, { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = { onPressEditGoal?: () => void };

// Helper kept outside component so it's stable
function startOfWeek(d: Date) {
  // Monday as first day (adjust if you prefer Sunday)
  const copy = new Date(d);
  const day = (copy.getDay() + 6) % 7; // 0..6 with Monday=0
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - day);
  return copy;
}

export default React.memo(function WorkoutSummaryHeader({ onPressEditGoal }: Props) {
  const c = useThemeColors();

  // ✅ Select only raw store fields (stable references)
  const workouts = useWorkoutStore((s) => s.workouts);
  const weeklyGoalMin = useWorkoutStore((s) => s.weeklyGoalMin);

  // ✅ Derive summary locally; this won’t ping Zustand subscriptions
  const { minutes, sessions, calories } = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now);

    const items = workouts.filter((w) => {
      const d = new Date(w.startISO);
      return d >= start && d <= now;
    });

    const minutes = items.reduce((a, w) => a + (w.durationMin || 0), 0);
    const sessions = items.length;
    const calories = items.reduce((a, w) => a + (w.calories || 0), 0);

    return { minutes, sessions, calories };
  }, [workouts]);

  const goalMin = weeklyGoalMin || 0;
  const pct = useMemo(() => {
    const denom = Math.max(1, goalMin);
    return Math.min(1, Math.max(0, minutes / denom));
  }, [minutes, goalMin]);

  const remaining = Math.max(0, goalMin - minutes);

  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderColor: c.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 12,
        rowGap: 10,
      }}
    >
      {/* Header row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: c.text.primary, fontWeight: "700" }}>This week</Text>
        <TouchableOpacity onPress={onPressEditGoal} hitSlop={8}>
          <Text style={{ color: c.primary, fontWeight: "600" }}>Edit goal</Text>
        </TouchableOpacity>
      </View>

      {/* Goal progress */}
      <View
        style={{
          height: 12,
          borderRadius: 8,
          overflow: "hidden",
          backgroundColor: c.muted,
          borderColor: c.border,
          borderWidth: 1,
        }}
      >
        <View
          style={{
            width: `${pct * 100}%`,
            height: "100%",
            backgroundColor: c.primary,
          }}
        />
      </View>

      {/* Numbers row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: c.text.secondary }}>{minutes} min / {goalMin} min</Text>
        <Text style={{ color: c.text.secondary }}>Remaining: {remaining} min</Text>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Stat label="Sessions" value={sessions} />
        <Stat label="Calories" value={`${calories} kcal`} />
      </View>
    </View>
  );

  function Stat({ label, value }: { label: string; value: number | string }) {
    return (
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          alignItems: "center",
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: c.muted,
        }}
      >
        <Text style={{ color: c.text.primary, fontWeight: "700" }}>{value}</Text>
        <Text style={{ color: c.text.secondary, fontSize: 12 }}>{label}</Text>
      </View>
    );
  }
});
