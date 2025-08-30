import { Meal, useNutritionStore } from "@/src/store/useNutritionStore";
import { useThemeColors } from "@/src/theme/useThemeColors";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default React.memo(function MealSection({ title, meal, onAdd }: { title: string; meal?: Meal; onAdd: () => void; }) {
  const c = useThemeColors();
  const updateEntry = useNutritionStore(s => s.updateEntry);
  const removeEntry = useNutritionStore(s => s.removeEntry);

  return (
    <View style={{ backgroundColor:c.surface, borderColor:c.border, borderWidth:1, borderRadius:16, padding:12, rowGap:8 }}>
      <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
        <Text style={{ color:c.text.primary, fontWeight:"700" }}>{title}</Text>
        <TouchableOpacity onPress={onAdd}><Text style={{ color:c.text.secondary }}>Add food</Text></TouchableOpacity>
      </View>
      {meal?.entries?.length ? meal.entries.map(e => {
        const kcal = e.item.kcal * e.quantity;
        return (
          <View key={e.id} style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingVertical:6 }}>
            <View style={{ flex:1 }}>
              <Text style={{ color:c.text.primary, fontWeight:"600" }}>{e.item.name}</Text>
              <Text style={{ color:c.text.secondary, fontSize:12 }}>
                {e.item.carbs*e.quantity}C · {e.item.fat*e.quantity}F · {e.item.protein*e.quantity}P
              </Text>
            </View>
            <View style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
              <QtyBtn label="−" onPress={() => updateEntry(meal.id, e.id, { quantity: Math.max(0.5, Number((e.quantity - 1).toFixed(2))) })} />
              <Text style={{ color:c.text.primary, minWidth:32, textAlign:"center" }}>×{e.quantity}</Text>
              <QtyBtn label="+" onPress={() => updateEntry(meal.id, e.id, { quantity: Math.min(20, Number((e.quantity + 1).toFixed(2))) })} />
            </View>
            <Text style={{ color:c.text.secondary, width:80, textAlign:"right" }}>{kcal} kcal</Text>
            <TouchableOpacity onPress={() => removeEntry(meal.id, e.id)} style={{ marginLeft:8 }}>
              <Text style={{ color:c.text.secondary, fontSize:12 }}>Remove</Text>
            </TouchableOpacity>
          </View>
        );
      }) : <Text style={{ color:c.text.secondary }}>No items yet</Text>}
    </View>
  );

  function QtyBtn({ label, onPress }:{ label:string; onPress:()=>void }) {
    return (
      <TouchableOpacity onPress={onPress}
        style={{ width:28, height:28, borderRadius:6, alignItems:"center", justifyContent:"center", borderWidth:1, borderColor:c.border, backgroundColor:c.muted }}>
        <Text style={{ color:c.text.primary, fontWeight:"700" }}>{label}</Text>
      </TouchableOpacity>
    );
  }
});
