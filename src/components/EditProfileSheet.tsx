import { useProfileStore } from "@/src/store/useProfileStore";
import { useThemeColors } from "@/src/theme/useThemeColors";
import React, { useState } from "react";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function EditProfileSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const c = useThemeColors();
  const { name, dob, heightCm, weightKg, goalWeightKg, update } = useProfileStore();
  const [state, setState] = useState({ name, dob, height: String(heightCm ?? ""), weight: String(weightKg ?? ""), goal: String(goalWeightKg ?? "") });

  const save = () => {
    const h = state.height ? Math.max(80, Math.min(260, Number(state.height))) : undefined;
    const w = state.weight ? Math.max(25, Math.min(400, Number(state.weight))) : undefined;
    const g = state.goal ? Math.max(25, Math.min(400, Number(state.goal))) : undefined;
    update({ name: state.name || name, dob: state.dob || dob, heightCm: h, weightKg: w, goalWeightKg: g });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex:1, justifyContent:"flex-end", backgroundColor:"#0006" }}>
        <View style={{ backgroundColor: c.surface, borderTopLeftRadius: 16, borderTopRightRadius:16, padding: 16, gap: 8, borderColor: c.border, borderWidth: 1 }}>
          <Text style={{ color: c.text.primary, fontWeight:"700", fontSize:16 }}>Edit Profile</Text>

          <Field label="Name" value={state.name} onChangeText={(v:string)=>setState(s=>({...s, name:v}))} />
          <Field label="DOB (YYYY-MM-DD)" value={state.dob ?? ""} onChangeText={(v:string)=>setState(s=>({...s, dob:v}))} />
          <Field label="Height (cm)" value={state.height} keyboardType="numeric" onChangeText={(v:string)=>setState(s=>({...s, height:v}))} />
          <Field label="Weight (kg)" value={state.weight} keyboardType="numeric" onChangeText={(v:string)=>setState(s=>({...s, weight:v}))} />
          <Field label="Goal Weight (kg)" value={state.goal} keyboardType="numeric" onChangeText={(v:string)=>setState(s=>({...s, goal:v}))} />

          <View style={{ flexDirection:"row", justifyContent:"flex-end", gap: 12, marginTop: 8 }}>
            <TouchableOpacity onPress={onClose}><Text style={{ color: c.text.secondary }}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={save}><Text style={{ color: c.text.primary, fontWeight:"700" }}>Save</Text></TouchableOpacity>
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
      <TextInput {...props} style={{ borderWidth: 1, borderColor: c.border, color: c.text.primary, borderRadius: 8, padding: 10 }} />
    </View>
  );
}
