import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useThemeColors } from './../theme/useThemeColors';
type Props = {
  title?: string;
  calories: number;        // e.g., 1560
  goalCalories?: number;   // e.g., 2200
  carbs?: number;          // grams
  fat?: number;            // grams
  protein?: number;        // grams
  onPressDetails?: () => void;
};

export default function NutritionSummary({
  title = 'Nutrition (today)',
  calories,
  goalCalories = 2000,
  carbs = 0,
  fat = 0,
  protein = 0,
  onPressDetails,
}: Props) {
  const c = useThemeColors();
  const Container: any = onPressDetails ? Pressable : View;
  const pct = Math.max(0, Math.min(1, calories / Math.max(1, goalCalories)));
  const kcalLeft = Math.max(0, goalCalories - calories);
  const router = useRouter();
  const totals = useMemo(() => {
    const total = Math.max(1, carbs + fat + protein);
    return {
      carbsPct: carbs / total,
      fatPct: fat / total,
      proteinPct: protein / total,
    };
  }, [carbs, fat, protein]);

  const macroColor = {
    carbs: '#6FA8FF',    // blue
    fat: '#F5C04E',      // amber
    protein: '#7ED8A0',  // green
  };
  const handlePress = () => {
    if (onPressDetails) return onPressDetails();
    router.push('/nutrition');
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{
        backgroundColor: c.surface,
        borderColor: c.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="fast-food-outline" size={18} color={c.text.secondary} />
          <Text style={{ color: c.text.primary, fontSize: 16, fontWeight: '700' }}>{title}</Text>
        </View>
        <Text style={{ color: c.primary, fontWeight: '600' }}>Details</Text>
      </View>

      {/* Calories row */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <Text style={{ color: c.text.primary, fontSize: 24, fontWeight: '800' }}>{Math.round(calories)}</Text>
        <Text style={{ color: c.text.secondary, fontSize: 14 }}>/ {Math.round(goalCalories)} kcal</Text>
      </View>
      <Text style={{ color: c.text.muted, fontSize: 12, marginBottom: 10 }}>
        {kcalLeft > 0 ? `${Math.round(kcalLeft)} kcal remaining` : 'Goal reached'}
      </Text>

      {/* Calories progress */}
      <View
        style={{
          height: 10,
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: c.muted,
          borderColor: c.border,
          borderWidth: 1,
          marginBottom: 10,
        }}
      >
        <View style={{ width: `${pct * 100}%`, backgroundColor: c.primary, height: '100%' }} />
      </View>

      {/* Macro split */}
      <View style={{ height: 10, borderRadius: 8, overflow: 'hidden', backgroundColor: c.muted, borderColor: c.border, borderWidth: 1 }}>
        <View style={{ flexDirection: 'row', width: '100%', height: '100%' }}>
          <View style={{ width: `${totals.carbsPct * 100}%`, backgroundColor: macroColor.carbs }} />
          <View style={{ width: `${totals.fatPct * 100}%`, backgroundColor: macroColor.fat }} />
          <View style={{ width: `${totals.proteinPct * 100}%`, backgroundColor: macroColor.protein }} />
        </View>
      </View>

      {/* Macro legend */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 }}>
        <Legend label="Carbs" grams={carbs} color={macroColor.carbs} />
        <Legend label="Fat" grams={fat} color={macroColor.fat} />
        <Legend label="Protein" grams={protein} color={macroColor.protein} />
      </View>
    </Pressable>
  );
}

function Legend({ label, grams, color }: { label: string; grams: number; color: string }) {
  const c = useThemeColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ color: c.text.secondary, fontSize: 12 }}>
        {label} · {Math.round(grams)}g
      </Text>
    </View>
  );
}
