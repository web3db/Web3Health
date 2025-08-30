import { useProfileStore } from "@/src/store/useProfileStore";
import { useThemeColors } from "@/src/theme/useThemeColors";
import React, { useState } from "react";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function EditEmergencySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const c = useThemeColors();
  const { emergency, update } = useProfileStore();
  const [state, setState] = useState({ name: emergency?.name ?? "", phone: emergency?.phone ?? "" });

  const save = () => { update({ emergency: { ...state } }); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex:1, justifyContent:"flex-end", backgroundColor:"#0006" }}>
        <View style={{ backgroundColor: c.surface, borderTopLeftRadius:16, borderTopRightRadius:16, padding: 16, gap: 8, borderColor: c.border, borderWidth: 1 }}>
          <Text style={{ color: c.text.primary, fontWeight:"700", fontSize:16 }}>Emergency Contact</Text>
          <Field label="Name" value={state.name} onChangeText={(v:string)=>setState(s=>({...s, name:v}))} />
          <Field label="Phone" value={state.phone} onChangeText={(v:string)=>setState(s=>({...s, phone:v}))} keyboardType="phone-pad" />
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
      <TextInput {...props} style={{ borderWidth:1, borderColor: c.border, color: c.text.primary, borderRadius:8, padding:10 }} />
    </View>
  );
}
