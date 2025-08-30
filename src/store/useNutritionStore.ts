import { create } from "zustand";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

// NEW: trend typings
export type TrendRange = "7d" | "30d" | "90d";
export type TrendMetric = "calories" | "carbs" | "fat" | "protein" | "water";

export interface FoodItem {
  id: string; name: string;
  kcal: number; carbs: number; fat: number; protein: number; // grams
  servingUnit?: string;
}
export interface FoodEntry {
  id: string;
  item: FoodItem;
  quantity: number;
  note?: string;
  timeISO?: string;
}
export interface Meal {
  id: string;
  dateISO: string; // YYYY-MM-DD
  type: MealType;
  entries: FoodEntry[];
}
export interface NutritionGoals {
  kcalGoal: number;
  macroSplitPct: { carbs: number; fat: number; protein: number };
  waterGoalMl: number;
}

// NEW: shape for trends
export interface NutritionTrends {
  dates: Record<TrendRange, string[]>; // ISO dates
  calories: Record<TrendRange, number[]>;
  carbs:    Record<TrendRange, number[]>;
  fat:      Record<TrendRange, number[]>;
  protein:  Record<TrendRange, number[]>;
  water:    Record<TrendRange, number[]>;
}

export interface NutritionState {
  meals: Meal[];
  goals: NutritionGoals;
  waterByDate: Record<string, number>;
  trends: NutritionTrends;

  dayTotals: (dateISO: string) => { kcal: number; carbs: number; fat: number; protein: number };
  findMeal: (dateISO: string, type: MealType) => Meal | undefined;
  addMeal: (dateISO: string, type: MealType) => string;
  addFoodToMeal: (mealId: string, entry: Omit<FoodEntry, "id">) => void;
  updateEntry: (mealId: string, entryId: string, patch: Partial<FoodEntry>) => void;
  removeEntry: (mealId: string, entryId: string) => void;
  setGoals: (g: Partial<NutritionGoals>) => void;
  addWater: (dateISO: string, ml: number) => void;
  clearNutritionHistory: () => void;

  // OPTIONAL helper to read trend slices
  getTrend: (metric: TrendMetric, range: TrendRange) => { dates: string[]; values: number[] };
}

// ---------- demo helpers (NEW) ----------
const defaultGoals: NutritionGoals = {
  kcalGoal: 2200,
  macroSplitPct: { carbs: 45, fat: 30, protein: 25 },
  waterGoalMl: 2500,
};

function todayISO(){ return new Date().toISOString().slice(0,10); }
function isoNDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0,10);
}

// simple seeded RNG so trends look stable each reload
function makeRng(seed = 42) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s & 0xfffffff) / 0xfffffff;
  };
}

function buildNutritionTrends(goals: NutritionGoals, totalDays = 90): NutritionTrends {
  const rng = makeRng(12345);
  const dates90: string[] = [];
  const cal90: number[] = [];
  const carbs90: number[] = [];
  const fat90: number[] = [];
  const prot90: number[] = [];
  const water90: number[] = [];

  const { kcalGoal, macroSplitPct, waterGoalMl } = goals;
  const cPct = macroSplitPct.carbs / 100;
  const fPct = macroSplitPct.fat / 100;
  const pPct = macroSplitPct.protein / 100;

  for (let d = totalDays - 1; d >= 0; d--) {
    const iso = isoNDaysAgo(d);
    const day = new Date(iso).getDay(); // 0=Sun

    // weekly seasonality: weekend +8%, midweek -4%
    const weekly = day === 0 || day === 6 ? 1.08 : day === 3 ? 0.96 : 1.0;
    // slow drift ±3%
    const drift = 1 + (d - totalDays/2) * 0.0003;
    // random jitter ±6%
    const jitter = 1 + (rng() * 0.12 - 0.06);

    const kcal = Math.round(kcalGoal * weekly * drift * jitter);

    // derive macros from kcal split + tiny noise
    const carbsKcal = kcal * cPct * (1 + (rng() * 0.06 - 0.03));
    const fatKcal   = kcal * fPct * (1 + (rng() * 0.06 - 0.03));
    const protKcal  = kcal * pPct * (1 + (rng() * 0.06 - 0.03));

    const carbsG = Math.max(0, Math.round(carbsKcal / 4));
    const fatG   = Math.max(0, Math.round(fatKcal   / 9));
    const protG  = Math.max(0, Math.round(protKcal  / 4));

    // water: around goal ±12%, weekend slightly lower (-5%)
    const water = Math.round(waterGoalMl * (1 + (rng() * 0.24 - 0.12)) * (day === 0 || day === 6 ? 0.95 : 1));

    dates90.push(iso);
    cal90.push(kcal);
    carbs90.push(carbsG);
    fat90.push(fatG);
    prot90.push(protG);
    water90.push(water);
  }

  const slice = (arr: number[], n: number) => arr.slice(-n);
  const sliceD = (arr: string[], n: number) => arr.slice(-n);

  return {
    dates:   { "7d": sliceD(dates90,7), "30d": sliceD(dates90,30), "90d": dates90 },
    calories:{ "7d": slice(cal90,7),    "30d": slice(cal90,30),    "90d": cal90 },
    carbs:   { "7d": slice(carbs90,7),  "30d": slice(carbs90,30),  "90d": carbs90 },
    fat:     { "7d": slice(fat90,7),    "30d": slice(fat90,30),    "90d": fat90 },
    protein: { "7d": slice(prot90,7),   "30d": slice(prot90,30),   "90d": prot90 },
    water:   { "7d": slice(water90,7),  "30d": slice(water90,30),  "90d": water90 },
  };
}
// ---------- end helpers ----------

const initialTrends = buildNutritionTrends(defaultGoals);

export const useNutritionStore = create<NutritionState>((set, get) => ({
  // demo seed
  meals: [{
    id: "m1",
    dateISO: todayISO(),
    type: "Breakfast",
  } as any].map(m => ({ ...m, type: "breakfast", entries: [
    { id: "e1", quantity: 1, item: { id:"i1", name:"Oatmeal", kcal:300, carbs:54, fat:5, protein:10 } },
    { id: "e2", quantity: 1, item: { id:"i2", name:"Coffee (black)", kcal:5, carbs:0, fat:0, protein:0 } },
  ]})),

  goals: defaultGoals,
  waterByDate: { [todayISO()]: 750 },
  trends: initialTrends,

  dayTotals: (dateISO) => {
    const meals = get().meals.filter(m => m.dateISO === dateISO);
    const sum = { kcal: 0, carbs: 0, fat: 0, protein: 0 };
    for (const m of meals) for (const e of m.entries) {
      sum.kcal    += e.item.kcal    * e.quantity;
      sum.carbs   += e.item.carbs   * e.quantity;
      sum.fat     += e.item.fat     * e.quantity;
      sum.protein += e.item.protein * e.quantity;
    }
    return sum;
  },
  findMeal: (dateISO, type) => get().meals.find(m => m.dateISO === dateISO && m.type === type),

  addMeal: (dateISO, type) => {
    const id = `m_${Date.now()}`;
    set(s => ({ meals: [{ id, dateISO, type, entries: [] }, ...s.meals] }));
    return id;
  },
  addFoodToMeal: (mealId, entry) => set(s => ({
    meals: s.meals.map(m => m.id === mealId ? { ...m, entries: [{ id: `e_${Date.now()}`, ...entry }, ...m.entries] } : m)
  })),
  updateEntry: (mealId, entryId, patch) => set(s => ({
    meals: s.meals.map(m => m.id !== mealId ? m : {
      ...m, entries: m.entries.map(e => e.id === entryId ? { ...e, ...patch } : e)
    })
  })),
  removeEntry: (mealId, entryId) => set(s => ({
    meals: s.meals.map(m => m.id !== mealId ? m : {
      ...m, entries: m.entries.filter(e => e.id !== entryId)
    })
  })),
  setGoals: (g) => set(s => {
    const nextGoals = { ...s.goals, ...g };
    // regenerate demo trends when goals meaningfully change
    const nextTrends = buildNutritionTrends(nextGoals);
    return { goals: nextGoals, trends: nextTrends };
  }),
  addWater: (dateISO, ml) => set(s => ({ waterByDate: { ...s.waterByDate, [dateISO]: (s.waterByDate[dateISO] ?? 0) + ml } })),
  clearNutritionHistory: () => set({ meals: [], waterByDate: {} }),

  // helper to read trend slices (labels = ISO -> "M/D")
  getTrend: (metric, range) => {
    const t = get().trends;
    const dates = t.dates[range];
    const map: Record<TrendMetric, number[]> = {
      calories: t.calories[range],
      carbs: t.carbs[range],
      fat: t.fat[range],
      protein: t.protein[range],
      water: t.water[range],
    };
    return { dates, values: map[metric] };
  },
}));
