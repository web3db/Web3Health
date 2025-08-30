import AddMealSheet from "@/src/components/AddMealSheet";
import EditGoalsSheet from "@/src/components/EditNutritionGoalsSheet";
import MacroBar from "@/src/components/MacroBar";
import MealSection from "@/src/components/MealSection";
import TrendChart from "@/src/components/TrendChart";
import WaterRow from "@/src/components/WaterRow";
import { MealType, useNutritionStore } from "@/src/store/useNutritionStore";
import {
    macroOrder,
    nutritionLabels,
    nutritionPalette,
    rgba,
} from "@/src/theme/nutritionColors";
import { useThemeColors } from "@/src/theme/useThemeColors";
import React, { useMemo, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Optional sharing for CSV (guarded)
let FileSystem: any, Sharing: any;
try {
  FileSystem = require("expo-file-system");
  Sharing = require("expo-sharing");
} catch {}

export default function NutritionScreen() {
  const c = useThemeColors();
  const today = new Date().toISOString().slice(0, 10);
  const [dateISO] = useState(today);

  // Subscribe to specific store slices to avoid heavy rerenders:
  const goals = useNutritionStore((s) => s.goals);
  const dayTotals = useNutritionStore((s) => s.dayTotals);
  const meals = useNutritionStore((s) => s.meals);
  const addMeal = useNutritionStore((s) => s.addMeal);
  const trends = useNutritionStore((s) => s.trends);

  const totals = dayTotals(dateISO);
  const kcalRemaining = Math.max(0, (goals.kcalGoal ?? 0) - totals.kcal);
  const byType = (t: MealType) =>
    meals.find((m) => m.dateISO === dateISO && m.type === t);

  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const getTrend = useNutritionStore((s) => s.getTrend);
  const trendData = getTrend("calories", range);
  const trend = useMemo(() => {
    const arr = trends?.calories?.[range] ?? [];
    return { labels: arr.map((_, i) => `D${i + 1}`), values: arr };
  }, [trends, range]);
  const labels = useMemo(
    () =>
      trendData.dates.map((d) => {
        const dt = new Date(d);
        return `${dt.getMonth() + 1}/${dt.getDate()}`;
      }),
    [trendData.dates]
  );

  // stable modal state (no dynamic keys)
  const [addOpen, setAddOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [currentMealId, setCurrentMealId] = useState<string>("");

  function openAdd(type: MealType) {
    const existing = byType(type);
    const id = existing ? existing.id : addMeal(dateISO, type);
    setCurrentMealId(id);
    setAddOpen(true);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ padding: 16, paddingBottom: 32, rowGap: 16 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <Text
            style={{ color: c.text.primary, fontSize: 22, fontWeight: "800" }}
          >
            Nutrition
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity onPress={doExportCSV}>
              <Text style={{ color: c.text.secondary }}>Export CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setGoalsOpen(true)}>
              <Text style={{ color: c.text.secondary }}>Edit goals</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Goal vs Intake */}
        <Card>
          <Text style={{ color: c.text.primary, fontWeight: "700" }}>
            Calories
          </Text>
          <ProgressBar
            value={totals.kcal}
            goal={goals.kcalGoal}
            color={nutritionPalette.calories}
          />
          <Row>
            <Text style={{ color: c.text.secondary }}>
              Consumed: {totals.kcal} kcal
            </Text>
            <Text style={{ color: c.text.secondary }}>
              Remaining: {kcalRemaining} kcal
            </Text>
          </Row>
        </Card>

        {/* Macros */}
        <Card>
          <Text style={{ color: c.text.primary, fontWeight: "700" }}>
            Macros
          </Text>
          <MacroBar
            grams={{
              carbs: totals.carbs,
              protein: totals.protein,
              fat: totals.fat,
            }}
          />
          {macroOrder.map((k) => {
            const grams: Record<"carbs" | "fat" | "protein", number> = {
              carbs: totals.carbs,
              fat: totals.fat,
              protein: totals.protein,
            };
            const pctCal = Math.round(
              (macroKcal(k, grams[k]) / Math.max(1, goals.kcalGoal)) * 100
            );
            return (
              <Row key={k}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Dot color={nutritionPalette[k]} />
                  <Text style={{ color: c.text.primary }}>
                    {nutritionLabels[k]}
                  </Text>
                </View>
                <Text style={{ color: c.text.secondary }}>
                  {Math.round(grams[k])} g • {pctCal}%
                </Text>
              </Row>
            );
          })}
        </Card>

        {/* Meals */}
        <MealSection
          title="Breakfast"
          meal={byType("breakfast")}
          onAdd={() => openAdd("breakfast")}
        />
        <MealSection
          title="Lunch"
          meal={byType("lunch")}
          onAdd={() => openAdd("lunch")}
        />
        <MealSection
          title="Dinner"
          meal={byType("dinner")}
          onAdd={() => openAdd("dinner")}
        />
        <MealSection
          title="Snacks"
          meal={byType("snack")}
          onAdd={() => openAdd("snack")}
        />

        {/* Hydration */}
        <WaterRow dateISO={dateISO} />

        {/* Trend (comment out if you don’t have TrendChart) */}
        <Card>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text style={{ color: c.text.primary, fontWeight: "700" }}>
              Calories trend
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Chip
                label="7d"
                active={range === "7d"}
                onPress={() => setRange("7d")}
              />
              <Chip
                label="30d"
                active={range === "30d"}
                onPress={() => setRange("30d")}
              />
              <Chip
                label="90d"
                active={range === "90d"}
                onPress={() => setRange("90d")}
              />
            </View>
          </View>
          <TrendChart
            labels={labels}
            values={trendData.values}
            strokeColor={nutritionPalette.calories}
            gridColor={c.border}
            areaFill={rgba(nutritionPalette.calories, 0.18)}
          />
        </Card>
      </ScrollView>

      {/* Stable modals: no dynamic keys, mounted at root */}
      <AddMealSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        mealId={currentMealId}
      />
      <EditGoalsSheet visible={goalsOpen} onClose={() => setGoalsOpen(false)} />
    </SafeAreaView>
  );

  function Card({ children }: { children: React.ReactNode }) {
    return (
      <View
        style={{
          backgroundColor: c.surface,
          borderColor: c.border,
          borderWidth: 1,
          borderRadius: 16,
          padding: 12,
          rowGap: 8,
        }}
      >
        {children}
      </View>
    );
  }
  function Row({ children }: { children: React.ReactNode }) {
    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {children}
      </View>
    );
  }
  function Dot({ color }: { color: string }) {
    return (
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 2,
          backgroundColor: color,
          borderColor: c.border,
          borderWidth: 1,
        }}
      />
    );
  }
  function Chip({
    label,
    active,
    onPress,
  }: {
    label: string;
    active?: boolean;
    onPress: () => void;
  }) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={{
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: active ? c.muted : "transparent",
        }}
      >
        <Text
          style={{
            color: active ? c.text.primary : c.text.secondary,
            fontSize: 12,
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  }
  function ProgressBar({
    value,
    goal,
    color,
  }: {
    value: number;
    goal: number;
    color: string;
  }) {
    const pct = Math.min(1, value / Math.max(1, goal || 1));
    return (
      <View
        style={{
          height: 12,
          borderRadius: 8,
          overflow: "hidden",
          backgroundColor: c.muted,
          borderColor: c.border,
          borderWidth: 1,
        }}
      >
        <View
          style={{
            width: `${pct * 100}%`,
            height: "100%",
            backgroundColor: color,
          }}
        />
      </View>
    );
  }
  async function doExportCSV() {
    try {
      const rows = [
        [
          "date",
          "meal",
          "item",
          "qty",
          "kcal",
          "carbs_g",
          "fat_g",
          "protein_g",
        ],
      ];
      useNutritionStore
        .getState()
        .meals.filter((m) => m.dateISO === dateISO)
        .forEach((m) =>
          m.entries.forEach((e) =>
            rows.push([
              m.dateISO,
              m.type,
              e.item.name,
              String(e.quantity),
              String(e.item.kcal * e.quantity),
              String(e.item.carbs * e.quantity),
              String(e.item.fat * e.quantity),
              String(e.item.protein * e.quantity),
            ])
          )
        );
      const csv = rows.map((r) => r.map(escapeCSV).join(",")).join("\n");
      if (!FileSystem || !Sharing) {
        Alert.alert("Export", "CSV printed to console.");
        console.log(csv);
        return;
      }
      const path = FileSystem.cacheDirectory + `nutrition_${dateISO}.csv`;
      await FileSystem.writeAsStringAsync(path, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      if (await Sharing.isAvailableAsync())
        await Sharing.shareAsync(path, { mimeType: "text/csv" });
      else Alert.alert("Export", "Sharing not available.");
    } catch (e: any) {
      Alert.alert("Export failed", String(e?.message ?? e));
    }
  }
  function escapeCSV(s: string) {
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }
}

function macroKcal(k: "carbs" | "fat" | "protein", g: number) {
  return (k === "fat" ? 9 : 4) * g;
}
