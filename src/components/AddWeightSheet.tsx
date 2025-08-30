import { useProfileStore } from "@/src/store/useProfileStore";
import { useThemeColors } from "@/src/theme/useThemeColors";
import React, { useState } from "react";
import { Alert, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";

const KG_PER_LB = 1 / 2.20462;

export default function AddWeightSheet({
  visible, onClose,
}: { visible: boolean; onClose: () => void }) {
  const c = useThemeColors();
  const { unit, addWeightEntry } = useProfileStore();

  const [dateISO, setDateISO] = useState(new Date().toISOString().slice(0, 10));
  const [weightStr, setWeightStr] = useState("");

  const onSave = () => {
    const w = Number(weightStr);
    if (Number.isNaN(w) || w <= 0) {
      Alert.alert("Invalid weight", "Enter a positive number.");
      return;
    }
    // Convert to kg if needed
    const kg = unit === "metric" ? w : w * KG_PER_LB;

    // Guard rails (25–400 kg)
    const bounded = Math.max(25, Math.min(400, kg));
    addWeightEntry(bounded, dateISO);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex:1, justifyContent:"flex-end", backgroundColor:"#0006" }}>
        <View style={{
          backgroundColor: c.surface, borderTopLeftRadius:16, borderTopRightRadius:16,
          padding:16, gap:10, borderColor: c.border, borderWidth: 1
        }}>
          <Text style={{ color: c.text.primary, fontWeight:"700", fontSize:16 }}>Add Weight</Text>

          <Field
            label={`Weight (${unit === "metric" ? "kg" : "lb"})`}
            value={weightStr}
            onChangeText={setWeightStr}
            keyboardType="numeric"
          />
          <Field
            label="Date (YYYY-MM-DD)"
            value={dateISO}
            onChangeText={setDateISO}
            keyboardType="numeric"
          />

          <View style={{ flexDirection:"row", justifyContent:"flex-end", gap: 12 }}>
            <TouchableOpacity onPress={onClose}><Text style={{ color: c.text.secondary }}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={onSave}><Text style={{ color: c.text.primary, fontWeight:"700" }}>Save</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Field(props: any) {
  const c = useThemeColors();
  return (
    <View>
      <Text style={{ color: c.text.secondary, marginBottom: 4 }}>{props.label}</Text>
      <TextInput {...props} style={{ borderWidth:1, borderColor:c.border, color:c.text.primary, borderRadius:8, padding:10 }} />
    </View>
  );
}
