import { useThemeColors } from "@/src/theme/useThemeColors";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function RawLogsSheet({
  title, labels, values, unitLabel, onClose, format
}: {
  title: string;
  labels: string[];
  values: number[];
  unitLabel: string;
  onClose: () => void;
  format: (v: number) => string;
}) {
  const c = useThemeColors();

  return (
    <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "#0006" }}>
      <View style={{ backgroundColor: c.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, borderColor: c.border, borderWidth: 1, maxHeight: "70%" }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <Text style={{ color: c.text.primary, fontSize: 16, fontWeight: "700" }}>{title}</Text>
          <TouchableOpacity onPress={onClose}><Text style={{ color: c.text.secondary }}>Close</Text></TouchableOpacity>
        </View>

        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderColor: c.border }}>
          <Text style={{ color: c.text.secondary, flex: 1 }}>Date</Text>
          <Text style={{ color: c.text.secondary }}>{unitLabel}</Text>
        </View>

        {/* Rows */}
        <View style={{ paddingTop: 4 }}>
          {labels.map((d, i) => (
            <View key={d + i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
              <Text style={{ color: c.text.primary, flex: 1 }}>{d}</Text>
              <Text style={{ color: c.text.primary }}>{format(values[i])}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
