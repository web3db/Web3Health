import { useProfileStore, type Goal } from "@/src/store/useProfileStore";
import { useThemeColors } from "@/src/theme/useThemeColors";
import React, { useEffect, useState } from "react";
import { Alert, Modal, Pressable, Text, TextInput, TouchableOpacity, View } from "react-native";

const AVAILABLE_GOALS: Goal[] = ["lose_weight", "gain_muscle", "improve_sleep", "stay_active"];

export default function EditGoalsSheet({
  visible, onClose
}: { visible: boolean; onClose: () => void }) {
  const c = useThemeColors();
  const { goals, customGoals, update, addCustomGoal, removeCustomGoal } = useProfileStore();

  // Local copy for built-in toggles
  const [selBuilt, setSelBuilt] = useState<Set<Goal>>(new Set(goals));
  // Local input for custom
  const [customInput, setCustomInput] = useState("");

  useEffect(() => {
    if (visible) setSelBuilt(new Set(goals));
  }, [visible, goals]);

  const toggleBuilt = (g: Goal) => {
    const next = new Set(selBuilt);
    next.has(g) ? next.delete(g) : next.add(g);
    setSelBuilt(next);
  };

  const onAddCustom = () => {
    const status = addCustomGoal(customInput);
    if (status !== "ok") {
      const msg = status === "exists" ? "Goal already exists."
              : status === "limit" ? "You can add up to 5 custom goals."
              : "Enter 2–40 characters.";
      Alert.alert("Can't add goal", msg);
      return;
    }
    setCustomInput("");
  };

  const onRemoveCustom = (g: string) => removeCustomGoal(g);

  const save = () => {
    update({ goals: Array.from(selBuilt) });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex:1, justifyContent:"flex-end", backgroundColor:"#0006" }}>
        <View style={{ backgroundColor:c.surface, borderColor:c.border, borderWidth:1,
                       borderTopLeftRadius:16, borderTopRightRadius:16, padding:16, gap:12 }}>
          <Text style={{ color:c.text.primary, fontWeight:"700", fontSize:16 }}>Edit Goals</Text>

          {/* Built-in multi-select */}
          <Text style={{ color:c.text.secondary, marginTop:4 }}>Suggested</Text>
          <View style={{ flexDirection:"row", flexWrap:"wrap", gap:8 }}>
            {AVAILABLE_GOALS.map((g) => (
              <Pressable
                key={g}
                onPress={() => toggleBuilt(g)}
                style={{
                  paddingVertical:6, paddingHorizontal:10, borderRadius:999,
                  borderWidth:1, borderColor: c.border,
                  backgroundColor: selBuilt.has(g) ? c.muted : "transparent"
                }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selBuilt.has(g) }}
              >
                <Text style={{ color: c.text.primary }}>{g.replace("_"," ")}</Text>
              </Pressable>
            ))}
          </View>

          {/* Custom input + list */}
          <Text style={{ color:c.text.secondary, marginTop:8 }}>Custom goals</Text>
          <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
            <TextInput
              placeholder="e.g., run 5k, 10k steps, yoga daily"
              placeholderTextColor={c.text.secondary}
              value={customInput}
              onChangeText={setCustomInput}
              onSubmitEditing={onAddCustom}
              style={{ flex:1, borderWidth:1, borderColor:c.border, color:c.text.primary, borderRadius:8, padding:10 }}
              maxLength={40}
            />
            <TouchableOpacity onPress={onAddCustom}>
              <Text style={{ color:c.text.primary, fontWeight:"700" }}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection:"row", flexWrap:"wrap", gap:8 }}>
            {customGoals.map((g) => (
              <RemovablePill key={g} label={g} onRemove={() => onRemoveCustom(g)} />
            ))}
          </View>

          {/* Actions */}
          <View style={{ flexDirection:"row", justifyContent:"flex-end", gap:12 }}>
            <TouchableOpacity onPress={onClose}><Text style={{ color:c.text.secondary }}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={save}><Text style={{ color:c.text.primary, fontWeight:"700" }}>Save</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function RemovablePill({ label, onRemove }: { label: string; onRemove: () => void }) {
  const c = useThemeColors();
  return (
    <View style={{
      flexDirection:"row", alignItems:"center",
      paddingVertical:6, paddingHorizontal:10,
      borderRadius:999, borderWidth:1, borderColor:c.border, backgroundColor:c.muted
    }}>
      <Text style={{ color:c.text.primary, marginRight:8 }}>{label}</Text>
      <Text onPress={onRemove} accessibilityRole="button" style={{ color:c.text.secondary }}>✕</Text>
    </View>
  );
}
