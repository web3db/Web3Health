import { useProfileStore } from "@/src/store/useProfileStore";
import { useThemeColors } from "@/src/theme/useThemeColors";
import { ageFromDob, bmi, heightLabel, weightLabel } from "@/src/utils/profileUtils";
import React, { useMemo } from "react";
import { Text, View } from "react-native";

const Chip = ({ label }: { label: string }) => {
  const c = useThemeColors();
  return (
    <View style={{ backgroundColor: c.muted, borderColor: c.border, borderWidth: 1,
      paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, marginRight: 8, marginBottom: 8 }}>
      <Text style={{ color: c.text.secondary, fontSize: 12 }}>{label}</Text>
    </View>
  );
};

export default function VitalsCard() {
  const c = useThemeColors();
  const { dob, unit, heightCm, weightKg, goalWeightKg, startWeightKg } = useProfileStore();

  const bmiVal = useMemo(() => bmi(weightKg, heightCm), [weightKg, heightCm]);

  return (
    <View style={{ backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 16, padding: 12 }}>
      <Text style={{ color: c.text.primary, fontWeight: "700", marginBottom: 8 }}>Vitals & Baseline</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        <Chip label={`Age ${ageFromDob(dob)}`} />
        <Chip label={`Height ${heightLabel(heightCm, unit)}`} />
        <Chip label={`Weight ${weightLabel(weightKg, unit)}`} />
        {goalWeightKg != null && <Chip label={`Goal ${weightLabel(goalWeightKg, unit)}`} />}
        {startWeightKg != null && <Chip label={`Start ${weightLabel(startWeightKg, unit)}`} />}
        {bmiVal && <Chip label={`BMI ${bmiVal.toFixed(1)}`} />}
      </View>
    </View>
  );
}
