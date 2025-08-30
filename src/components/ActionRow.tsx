import { useProfileStore } from "@/src/store/useProfileStore";
import { useThemeColors } from "@/src/theme/useThemeColors";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import React from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";

export default function ActionRow() {
  const c = useThemeColors();
  const profile = useProfileStore();

  const exportCsv = async () => {
    try {
      const rows: string[] = [];
      rows.push("date,weight_kg");
      profile.weightLog.forEach((w) => rows.push(`${w.date},${w.kg}`));
      const csv = rows.join("\n");
      const fileUri = FileSystem.cacheDirectory! + "health-export.csv";
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Export", "CSV created at: " + fileUri);
      }
    } catch (e) {
      Alert.alert("Export failed", String(e));
    }
  };

  return (
    <View style={{ flexDirection:"row", gap: 10 }}>
      <Btn label="Share Data" onPress={exportCsv} />
      <Btn label="Clear Local" onPress={() => profile.clearLocalData()} />
      <Btn label="Sign out" onPress={() => Alert.alert("Sign out", "Hook this to your auth flow")} />
    </View>
  );

  function Btn({ label, onPress }: { label: string; onPress: () => void }) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={{ flex:1, backgroundColor: c.muted, borderColor: c.border, borderWidth: 1,
                 paddingVertical: 12, borderRadius: 12, alignItems:"center" }}>
        <Text style={{ color: c.text.primary, fontWeight: "600" }}>{label}</Text>
      </TouchableOpacity>
    );
  }
}
