import { useWorkoutStore, type Workout } from "@/src/store/useWorkoutStore";
import { useThemeColors } from "@/src/theme/useThemeColors";
import { workoutPalette } from "@/src/theme/workoutColors";
import React, { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  workout: Workout;
  onEdit?: (w: Workout) => void;
  onDelete?: (id: string) => void;
};

export default React.memo(function WorkoutCard({ workout, onEdit, onDelete }: Props) {
  const c = useThemeColors();
  const removeWorkout = useWorkoutStore((s) => s.removeWorkout); // fallback if onDelete not passed

  const time = useMemo(() => {
    const start = new Date(workout.startISO);
    const end = new Date(start.getTime() + (workout.durationMin || 0) * 60_000);
    const f = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `${f(start)}–${f(end)}`;
  }, [workout.startISO, workout.durationMin]);

  const color = workoutPalette[workout.type];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        gap: 12,
      }}
    >
      {/* type badge */}
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          backgroundColor: color,
          borderColor: c.border,
          borderWidth: 1,
        }}
      />

      {/* main block */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text.primary, fontWeight: "700" }}>
          {titleCase(workout.type)} · {workout.durationMin} min
        </Text>
        <Text style={{ color: c.text.secondary, fontSize: 12 }}>
          {time}
          {workout.distanceKm != null ? ` • ${round(workout.distanceKm, 2)} km` : ""}
          {workout.calories != null ? ` • ${workout.calories} kcal` : ""}
        </Text>
        {workout.notes ? (
          <Text style={{ color: c.text.secondary, fontSize: 12 }} numberOfLines={1}>
            {workout.notes}
          </Text>
        ) : null}
      </View>

      {/* actions */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <TouchableOpacity onPress={() => onEdit?.(workout)} hitSlop={8}>
          <Text style={{ color: c.primary, fontWeight: "600" }}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => (onDelete ? onDelete(workout.id) : removeWorkout(workout.id))}
          hitSlop={8}
        >
          <Text style={{ color: c.text.secondary }}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  function titleCase(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function round(n: number, d = 1) {
    const p = Math.pow(10, d);
    return Math.round(n * p) / p;
  }
});
