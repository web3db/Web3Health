import { useNutritionStore } from "@/src/store/useNutritionStore";
import { nutritionPalette } from "@/src/theme/nutritionColors";
import { useThemeColors } from "@/src/theme/useThemeColors";
import React, { useEffect, useState } from "react";
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

export default React.memo(function EditNutritionGoalsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const c = useThemeColors();
  const goals = useNutritionStore(s => s.goals);
  const setGoals = useNutritionStore(s => s.setGoals);

  const [kcal, setKcal] = useState(String(goals.kcalGoal ?? 2200));
  const [carbPct, setCarbPct] = useState(String(goals.macroSplitPct?.carbs ?? 45));
  const [fatPct, setFatPct] = useState(String(goals.macroSplitPct?.fat ?? 30));
  const [proPct, setProPct] = useState(String(goals.macroSplitPct?.protein ?? 25));
  const [waterMl, setWaterMl] = useState(String(goals.waterGoalMl ?? 2500));

  useEffect(() => {
    if (!visible) return;
    setKcal(String(goals.kcalGoal ?? 2200));
    setCarbPct(String(goals.macroSplitPct?.carbs ?? 45));
    setFatPct(String(goals.macroSplitPct?.fat ?? 30));
    setProPct(String(goals.macroSplitPct?.protein ?? 25));
    setWaterMl(String(goals.waterGoalMl ?? 2500));
  }, [visible]);

  function onSave() {
    const k = Number(kcal), cPct = Number(carbPct), fPct = Number(fatPct), pPct = Number(proPct), w = Number(waterMl);
    if (![k, cPct, fPct, pPct, w].every(Number.isFinite)) { Alert.alert("Invalid", "Please enter numeric values."); return; }
    const sum = cPct + fPct + pPct;
    if (sum < 95 || sum > 105) { Alert.alert("Macro split", "Carbs+Fat+Protein should total ~100% (95–105 allowed)."); return; }
    setGoals({
      kcalGoal: Math.round(Math.min(Math.max(k, 800), 6000)),
      macroSplitPct: { carbs: cPct, fat: fPct, protein: pPct },
      waterGoalMl: Math.round(Math.min(Math.max(w, 500), 8000)),
    });
    onClose();
  }

  const inputStyle = { borderWidth:1, borderColor:c.border, color:c.text.primary, borderRadius:8, padding:10 };

  return (
    <Modal visible={visible} transparent animationType="slide" presentationStyle="overFullScreen" onRequestClose={onClose}>
      <View style={{ flex:1, justifyContent:"flex-end", backgroundColor:"#0006" }} pointerEvents="box-none">
        {/* <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}> */}
          <View style={{ backgroundColor:c.surface, borderColor:c.border, borderWidth:1, borderTopLeftRadius:16, borderTopRightRadius:16, padding:16, maxHeight:"80%" }} onStartShouldSetResponder={() => true}>
            <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <Text style={{ color:c.text.primary, fontWeight:"700", fontSize:16 }}>Nutrition Goals</Text>
              <TouchableOpacity onPress={onClose}><Text style={{ color:c.text.secondary }}>Close</Text></TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag" removeClippedSubviews={false} contentContainerStyle={{ rowGap:10 }}>
              <Field label="Daily calories (kcal)">
                <TextInput value={kcal} onChangeText={setKcal} keyboardType="numeric" autoCorrect={false} blurOnSubmit={false} returnKeyType="done" style={inputStyle} />
              </Field>

              <Text style={{ color:c.text.primary, fontWeight:"700", marginTop:4 }}>Macro split (%)</Text>
              <View style={{ flexDirection:"row", gap:8 }}>
                <Field label="Carbs" style={{ flex:1 }}><TextInput value={carbPct} onChangeText={setCarbPct} keyboardType="numeric" style={inputStyle} /></Field>
                <Field label="Fat"   style={{ flex:1 }}><TextInput value={fatPct}  onChangeText={setFatPct}  keyboardType="numeric" style={inputStyle} /></Field>
                <Field label="Protein" style={{ flex:1 }}><TextInput value={proPct} onChangeText={setProPct} keyboardType="numeric" style={inputStyle} /></Field>
              </View>
              <Text style={{ color:c.text.secondary, fontSize:12 }}>Tip: aim to total ~100% (e.g., 45 / 30 / 25).</Text>

              <Field label="Daily water goal (ml)">
                <TextInput value={waterMl} onChangeText={setWaterMl} keyboardType="numeric" autoCorrect={false} blurOnSubmit={false} returnKeyType="done" style={inputStyle} />
              </Field>

              <TouchableOpacity onPress={onSave} style={{ marginTop:6, paddingVertical:12, borderRadius:12, backgroundColor:nutritionPalette.calories, alignItems:"center" }}>
                <Text style={{ color:c.text.primary, fontWeight:"700" }}>Save</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        {/* </KeyboardAvoidingView> */}
      </View>
    </Modal>
  );
});

function Field({ label, children, style }:{ label:string; children:React.ReactNode; style?:any }) {
  const c = useThemeColors();
  return (
    <View style={[{ marginBottom:4 }, style]}>
      <Text style={{ color:c.text.secondary, marginBottom:4 }}>{label}</Text>
      {children}
    </View>
  );
}
