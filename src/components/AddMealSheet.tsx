import { useNutritionStore } from "@/src/store/useNutritionStore";
import { nutritionPalette } from "@/src/theme/nutritionColors";
import { useThemeColors } from "@/src/theme/useThemeColors";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

function clampNum(val: string, lo: number, hi: number) {
  const n = Number(val);
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

export default React.memo(function AddMealSheet({ visible, onClose, mealId }: { visible: boolean; onClose: () => void; mealId: string }) {
  const c = useThemeColors();
  // subscribe to the action ONLY
  const addFoodToMeal = useNutritionStore(s => s.addFoodToMeal);

  // string state for all fields
  const [name, setName] = useState("Custom item");
  const [kcal, setKcal] = useState("200");
  const [carbs, setCarbs] = useState("0");
  const [fat, setFat] = useState("0");
  const [protein, setProtein] = useState("0");
  const [qty, setQty] = useState("1");

  useEffect(() => {
    if (!visible) return;
    setName("Custom item"); setKcal("200"); setCarbs("0"); setFat("0"); setProtein("0"); setQty("1");
  }, [visible]);

  const valid = useMemo(() => {
    const k = Number(kcal), q = Number(qty);
    return name.trim().length > 0 && Number.isFinite(k) && k > 0 && Number.isFinite(q) && q > 0;
  }, [name, kcal, qty]);

  function addCustom() {
    if (!valid) return;
    addFoodToMeal(mealId, {
      item: { id:`i_${Date.now()}`, name:name.trim(),
        kcal:clampNum(kcal,0,5000), carbs:clampNum(carbs,0,300), fat:clampNum(fat,0,200), protein:clampNum(protein,0,200) },
      quantity: clampNum(qty, 0.1, 20),
    });
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" presentationStyle="overFullScreen" onRequestClose={onClose}>
      <View style={{ flex:1, justifyContent:"flex-end", backgroundColor:"#0006" }} pointerEvents="box-none">
        {/* <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}> */}
          <View
            style={{ backgroundColor:c.surface, borderColor:c.border, borderWidth:1, borderTopLeftRadius:16, borderTopRightRadius:16, padding:16, maxHeight:"80%" }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <Text style={{ color:c.text.primary, fontWeight:"700", fontSize:16 }}>Add food</Text>
              <TouchableOpacity onPress={onClose}><Text style={{ color:c.text.secondary }}>Close</Text></TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag" removeClippedSubviews={false}>
              <Field label="Name"><TextInput value={name} onChangeText={setName} autoCapitalize="words" autoCorrect={false} blurOnSubmit={false} returnKeyType="done" style={input(c)} /></Field>
              <Field label="Quantity"><TextInput value={qty} onChangeText={setQty} keyboardType="decimal-pad" autoCorrect={false} blurOnSubmit={false} returnKeyType="done" style={input(c)} /></Field>
              <Field label="Calories (kcal)"><TextInput value={kcal} onChangeText={setKcal} keyboardType="numeric" autoCorrect={false} blurOnSubmit={false} returnKeyType="done" style={input(c)} /></Field>
              <View style={{ flexDirection:"row", gap:8 }}>
                <Field label="Carbs (g)" style={{ flex:1 }}><TextInput value={carbs} onChangeText={setCarbs} keyboardType="numeric" autoCorrect={false} blurOnSubmit={false} returnKeyType="done" style={input(c)} /></Field>
                <Field label="Fat (g)"   style={{ flex:1 }}><TextInput value={fat}   onChangeText={setFat}   keyboardType="numeric" autoCorrect={false} blurOnSubmit={false} returnKeyType="done" style={input(c)} /></Field>
                <Field label="Protein (g)" style={{ flex:1 }}><TextInput value={protein} onChangeText={setProtein} keyboardType="numeric" autoCorrect={false} blurOnSubmit={false} returnKeyType="done" style={input(c)} /></Field>
              </View>

              <TouchableOpacity disabled={!valid} onPress={addCustom}
                style={{ marginTop:12, paddingVertical:12, borderRadius:12, backgroundColor: valid ? nutritionPalette.calories : c.muted, alignItems:"center" }}>
                <Text style={{ color:c.text.primary, fontWeight:"700" }}>Add to meal</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        {/* </KeyboardAvoidingView> */}
      </View>
    </Modal>
  );
});

function Field({ label, children, style }:{ label:string; children:React.ReactNode; style?: any }) {
  const c = useThemeColors();
  return (
    <View style={[{ marginBottom:8 }, style]}>
      <Text style={{ color:c.text.secondary, marginBottom:4 }}>{label}</Text>
      {children}
    </View>
  );
}
function input(c:any){ return { borderWidth:1, borderColor:c.border, color:c.text.primary, borderRadius:8, padding:10 }; }
