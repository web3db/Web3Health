import { useProfileStore } from "@/src/store/useProfileStore";
import { useThemeColors } from "@/src/theme/useThemeColors";
import React, { useEffect, useState } from "react";
import { Alert, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function EditMedicalSheet({
  visible, onClose
}: { visible: boolean; onClose: () => void }) {
  const c = useThemeColors();
  const { medical, update } = useProfileStore();

  const [resting, setResting] = useState(String(medical.restingHrBaseline ?? ""));
  const [allergies, setAllergies] = useState(medical.allergiesNote ?? "");

  useEffect(() => {
    setResting(String(medical.restingHrBaseline ?? ""));
    setAllergies(medical.allergiesNote ?? "");
  }, [visible]);

  const save = () => {
    const val = resting.trim() === "" ? undefined : Number(resting);
    if (val != null && (Number.isNaN(val) || val < 30 || val > 120)) {
      Alert.alert("Invalid HR", "Enter a resting HR between 30 and 120 bpm.");
      return;
    }
    update({ medical: { restingHrBaseline: val, allergiesNote: allergies.trim() } });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex:1, justifyContent:"flex-end", backgroundColor:"#0006" }}>
        <View style={{ backgroundColor:c.surface, borderColor:c.border, borderWidth:1,
                       borderTopLeftRadius:16, borderTopRightRadius:16, padding:16, gap:10 }}>
          <Text style={{ color:c.text.primary, fontWeight:"700", fontSize:16 }}>Medical Info</Text>

          <Field label="Resting HR baseline (bpm)"
                 value={resting} onChangeText={setResting} keyboardType="numeric" />
          <Field label="Allergies / medical notes"
                 value={allergies} onChangeText={setAllergies} multiline numberOfLines={3} />

          <View style={{ flexDirection:"row", justifyContent:"space-between", marginTop:4 }}>
            <TouchableOpacity onPress={() => { setResting(""); setAllergies(""); }}>
              <Text style={{ color:c.text.secondary }}>Clear</Text>
            </TouchableOpacity>
            <View style={{ flexDirection:"row", gap:12 }}>
              <TouchableOpacity onPress={onClose}><Text style={{ color:c.text.secondary }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={save}><Text style={{ color:c.text.primary, fontWeight:"700" }}>Save</Text></TouchableOpacity>
            </View>
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
      <Text style={{ color:c.text.secondary, marginBottom:4 }}>{props.label}</Text>
      <TextInput {...props}
        style={{ borderWidth:1, borderColor:c.border, color:c.text.primary, borderRadius:8, padding:10 }}
      />
    </View>
  );
}
