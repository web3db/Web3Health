import { macroOrder, nutritionPalette, type MacroKey } from "@/src/theme/nutritionColors";
import { useThemeColors } from "@/src/theme/useThemeColors";
import React from "react";
import { View } from "react-native";

export default React.memo(function MacroBar({ grams }: { grams: Record<MacroKey, number> }) {
  const c = useThemeColors();
  const sum = Math.max(1, grams.carbs + grams.fat + grams.protein);
  return (
    <View style={{ height: 14, borderRadius: 8, overflow:"hidden", backgroundColor:c.muted, borderColor:c.border, borderWidth:1 }}>
      <View style={{ flexDirection:"row", height:"100%" }}>
        {macroOrder.map(k => (
          <View key={k} style={{ width:`${(grams[k]/sum)*100}%`, backgroundColor:nutritionPalette[k] }} />
        ))}
      </View>
    </View>
  );
});
