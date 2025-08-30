export type MacroKey = "carbs" | "fat" | "protein";
export type NutritionKey = MacroKey | "calories" | "water";

export const nutritionPalette: Record<NutritionKey, string> = {
  carbs:    "#6FA8FF", // blue
  fat:      "#F0C36F", // amber
  protein:  "#7ED8A0", // green
  calories: "#A58BFF", // violet (kcal)
  water:    "#6FA8FF",
};

export const nutritionLabels: Record<NutritionKey, string> = {
  carbs: "Carbs", fat: "Fat", protein: "Protein", calories: "Calories", water: "Water",
};

export const macroOrder: MacroKey[] = ["carbs", "protein", "fat"];

export function rgba(hex: string, a = 1) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
