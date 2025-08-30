import { useWorkoutStore } from "@/src/store/useWorkoutStore";
import { useThemeColors } from "@/src/theme/useThemeColors";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

type Props = { visible: boolean; onClose: () => void };

export default React.memo(function EditWorkoutGoalSheet({ visible, onClose }: Props) {
  const c = useThemeColors();
  const weeklyGoalMin = useWorkoutStore((s) => s.weeklyGoalMin);
  const setWeeklyGoal  = useWorkoutStore((s) => s.setWeeklyGoal);
  

  const { width: W, height: H } = useWindowDimensions();
  const isTablet = W >= 768;
  const sheetHeight = Math.round(Math.min(560, Math.max(H * 0.5, H * 0.72)));
  const sheetWidth  = Math.min(W - 24, isTablet ? 520 : W);

  const [goal, setGoal] = useState<string>(String(weeklyGoalMin || 150));

  useEffect(() => {
    if (!visible) return;
    setGoal(String(weeklyGoalMin || 150));
  }, [visible, weeklyGoalMin]);

  function onSave() {
    const g = Number(goal);
    if (!Number.isFinite(g) || g < 0) {
      Alert.alert("Invalid goal", "Enter minutes per week (e.g., 150).");
      return;
    }
    setWeeklyGoal(Math.round(g));
    onClose();
  }

  const inputStyle = { borderWidth: 1, borderColor: c.border, color: c.text.primary, borderRadius: 8, padding: 10 };

  return (
    <Modal visible={visible} transparent animationType="slide" presentationStyle="overFullScreen" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "#0006" }} pointerEvents="box-none">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View
            style={{
              alignSelf: "center",
              width: sheetWidth,
              maxHeight: sheetHeight,
              backgroundColor: c.surface,
              borderColor: c.border,
              borderWidth: 1,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 16,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ color: c.text.primary, fontWeight: "700", fontSize: 16 }}>Weekly workout goal</Text>
              <TouchableOpacity onPress={onClose}><Text style={{ color: c.text.secondary }}>Close</Text></TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag" removeClippedSubviews={false} contentContainerStyle={{ rowGap: 10 }}>
              <Text style={{ color: c.text.secondary }}>
                Set your weekly target for active minutes. Many guidelines recommend <Text style={{ color: c.text.primary, fontWeight: "700" }}>150 min</Text> of moderate activity.
              </Text>

              <View>
                <Text style={{ color: c.text.secondary, marginBottom: 4 }}>Minutes per week</Text>
                <TextInput value={goal} onChangeText={setGoal} keyboardType="numeric" autoCorrect={false} blurOnSubmit={false} returnKeyType="done" style={inputStyle} />
              </View>

              <TouchableOpacity onPress={() => setGoal("150")} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: c.border, backgroundColor: c.muted, alignSelf: "flex-start" }}>
                <Text style={{ color: c.text.primary, fontSize: 12 }}>Use 150</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onSave} style={{ marginTop: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: c.primary, alignItems: "center" }}>
                <Text style={{ color: c.text.primary , fontWeight: "700" }}>Save</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
});
