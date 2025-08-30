import { useProfileStore } from "@/src/store/useProfileStore";
import { useThemeColors } from "@/src/theme/useThemeColors";
import { prettyDate, weightLabel } from "@/src/utils/profileUtils";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function HistoryAccountCard({ onAdd }: { onAdd: () => void }) {
  const c = useThemeColors();
  const { trackingSinceISO, longestStreakDays, weightLog, unit } = useProfileStore();

  return (
    <View style={{ backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 16, padding: 12 }}>
      {/* Header row with Add */}
      <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom: 8 }}>
        <Text style={{ color: c.text.primary, fontWeight:"700" }}>History & Account</Text>
        <TouchableOpacity onPress={onAdd}><Text style={{ color: c.text.secondary }}>Add weight</Text></TouchableOpacity>
      </View>

      <Text style={{ color: c.text.primary }}>Tracking since: {prettyDate(trackingSinceISO)}</Text>
      <Text style={{ color: c.text.primary, marginTop: 4 }}>Longest streak: {longestStreakDays ?? "—"} days</Text>

      <View style={{ height: 1, backgroundColor: c.border, marginVertical: 8 }} />

      <Text style={{ color: c.text.primary, fontWeight: "600", marginBottom: 6 }}>Recent weight logs</Text>
      {weightLog.slice(0,5).map((w) => (
        <View key={`${w.date}-${w.kg}`} style={{ flexDirection:"row", justifyContent:"space-between", marginBottom: 4 }}>
          <Text style={{ color: c.text.secondary }}>{prettyDate(w.date)}</Text>
          <Text style={{ color: c.text.primary }}>{weightLabel(w.kg, unit)}</Text>
        </View>
      ))}
      {weightLog.length === 0 && <Text style={{ color: c.text.secondary }}>No weight entries yet</Text>}
    </View>
  );
}