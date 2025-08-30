import { useThemeColors } from "@/src/theme/useThemeColors";
import { workoutPalette, type WorkoutType } from "@/src/theme/workoutColors";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  onQuickAdd?: (type: WorkoutType) => void; // open AddWorkoutSheet prefilled with this type
  onMore?: () => void;                      // optional "More..." action
};

const TYPES: WorkoutType[] = ["run", "walk", "cycle", "strength", "yoga", "hiit", "swim"];

export default React.memo(function QuickStartRow({ onQuickAdd, onMore }: Props) {
  const c = useThemeColors();

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
      <Text style={{ color: c.text.primary, fontWeight: "700" }}>Quick start</Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {TYPES.map((t) => (
          <Chip key={t} label={titleCase(t)} color={workoutPalette[t]} onPress={() => onQuickAdd?.(t)} />
        ))}
        {onMore ? <Chip label="More…" color="transparent" outline onPress={onMore} /> : null}
      </View>
    </View>
  );

  function Chip({
    label,
    color,
    outline,
    onPress,
  }: {
    label: string;
    color: string;
    outline?: boolean;
    onPress: () => void;
  }) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={{
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: outline ? "transparent" : color,
        }}
      >
        <Text style={{ color: outline ? c.text.secondary : c.text.primary, fontSize: 12 }}>{label}</Text>
      </TouchableOpacity>
    );
  }

  function titleCase(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
});
