import { useNutritionStore } from "@/src/store/useNutritionStore";
import { nutritionPalette } from "@/src/theme/nutritionColors";
import { useThemeColors } from "@/src/theme/useThemeColors";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default React.memo(function WaterRow({ dateISO }: { dateISO: string }) {
  const c = useThemeColors();
  const water = useNutritionStore(s => s.waterByDate[dateISO] ?? 0);
  const goal  = useNutritionStore(s => s.goals.waterGoalMl);
  const addWater = useNutritionStore(s => s.addWater);

  const pct = Math.min(1, water / Math.max(1, goal));
  return (
    <View style={{ backgroundColor:c.surface, borderColor:c.border, borderWidth:1, borderRadius:16, padding:12, rowGap:8 }}>
      <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
        <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
          <View style={{ width:10, height:10, borderRadius:2, backgroundColor:nutritionPalette.water }} />
          <Text style={{ color:c.text.primary, fontWeight:"700" }}>Hydration</Text>
        </View>
        <Text style={{ color:c.text.secondary }}>{water} ml / {goal} ml</Text>
      </View>
      <View style={{ height:10, borderRadius:6, overflow:"hidden", backgroundColor:c.muted, borderColor:c.border, borderWidth:1 }}>
        <View style={{ width:`${pct*100}%`, height:"100%", backgroundColor:nutritionPalette.water }} />
      </View>
      <View style={{ flexDirection:"row", gap:8 }}>
        <Pill onPress={()=>addWater(dateISO, 250)}>+250</Pill>
        <Pill onPress={()=>addWater(dateISO, 500)}>+500</Pill>
      </View>
    </View>
  );
  function Pill({ children, onPress }:{ children:React.ReactNode; onPress:()=>void }) {
    const c = useThemeColors();
    return (
      <TouchableOpacity onPress={onPress}
        style={{ paddingVertical:6, paddingHorizontal:10, borderRadius:999, borderWidth:1, borderColor:c.border, backgroundColor:c.muted }}>
        <Text style={{ color:c.text.primary, fontSize:12 }}>{children}</Text>
      </TouchableOpacity>
    );
  }
});
