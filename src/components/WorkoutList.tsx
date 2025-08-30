import { useWorkoutStore, type Workout } from "@/src/store/useWorkoutStore";
import { useThemeColors } from "@/src/theme/useThemeColors";
import React, { useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import WorkoutCard from "./WorkoutCard";

type Props = {
  onEdit?: (w: Workout) => void;
  onAdd?: () => void;
  /** how many calendar days to show initially */
  initialDays?: number; // default 7
  /** how many more days to load each time */
  pageSize?: number;    // default 7
};

export default React.memo(function WorkoutList({
  onEdit,
  onAdd,
  initialDays = 7,
  pageSize = 7,
}: Props) {
  const c = useThemeColors();
  const workouts = useWorkoutStore((s) => s.workouts);
  const removeWorkout = useWorkoutStore((s) => s.removeWorkout);

  const groups = useMemo(() => groupByDateLabel(workouts), [workouts]);

  // number of day-groups currently visible
  const [visibleGroups, setVisibleGroups] = useState<number>(initialDays);

  // clamp in case there are fewer than initialDays
  const sliceEnd = Math.min(visibleGroups, groups.length);
  const visible = groups.slice(0, sliceEnd);
  const hasMore = sliceEnd < groups.length;

  // Reset pagination if data set changes drastically (optional but nice)
  React.useEffect(() => {
    setVisibleGroups(initialDays);
  }, [groups.length, initialDays]);

  if (!workouts.length) {
    return (
      <View
        style={{
          backgroundColor: c.surface,
          borderColor: c.border,
          borderWidth: 1,
          borderRadius: 16,
          padding: 16,
          alignItems: "center",
          rowGap: 8,
        }}
      >
        <Text style={{ color: c.text.primary, fontWeight: "700" }}>No workouts yet</Text>
        <Text style={{ color: c.text.secondary, textAlign: "center" }}>
          Log your first workout to see weekly totals and trends.
        </Text>
        {onAdd ? (
          <TouchableOpacity
            onPress={onAdd}
            style={{
              marginTop: 6,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: c.border,
              backgroundColor: c.muted,
            }}
          >
            <Text style={{ color: c.text.primary, fontWeight: "700" }}>Add workout</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

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
      <Text style={{ color: c.text.primary, fontWeight: "700" }}>Recent workouts</Text>

      {visible.map((g) => (
        <View key={g.label} style={{ rowGap: 6 }}>
          <Text style={{ color: c.text.secondary, fontSize: 12, marginTop: 4 }}>{g.label}</Text>
          {g.items.map((w) => (
            <WorkoutCard
              key={w.id}
              workout={w}
              onEdit={onEdit}
              onDelete={removeWorkout}
            />
          ))}
        </View>
      ))}

      {/* Controls */}
      <View style={{ marginTop: 8, gap: 8 }}>
        {hasMore ? (
          <TouchableOpacity
            onPress={() => setVisibleGroups((v) => v + pageSize)}
            style={{
              alignSelf: "center",
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: c.border,
              backgroundColor: c.muted,
            }}
          >
            <Text style={{ color: c.text.primary, fontWeight: "700" }}>
              Load {Math.min(pageSize, groups.length - sliceEnd)} more days
            </Text>
          </TouchableOpacity>
        ) : null}

        {sliceEnd > initialDays ? (
          <TouchableOpacity
            onPress={() => setVisibleGroups(initialDays)}
            style={{
              alignSelf: "center",
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            <Text style={{ color: c.text.secondary, fontWeight: "600" }}>Collapse</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
});

/** ---- helpers (unchanged except return shape) ---- */
function groupByDateLabel(list: Workout[]) {
  // sort newest first
  const sorted = [...list].sort((a, b) => (a.startISO > b.startISO ? -1 : 1));

  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const tISO = today.toISOString().slice(0, 10);
  const yISO = yest.toISOString().slice(0, 10);

  const map = new Map<string, Workout[]>();

  for (const w of sorted) {
    const dISO = w.startISO.slice(0, 10);
    let label: string;
    if (dISO === tISO) label = "Today";
    else if (dISO === yISO) label = "Yesterday";
    else label = fmtDate(dISO);
    const arr = map.get(label);
    if (arr) arr.push(w);
    else map.set(label, [w]);
  }

  // preserve chronological order of groups (newest first)
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}
