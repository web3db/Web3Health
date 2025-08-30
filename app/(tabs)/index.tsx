import ActivityRings from "@/src/components/ActivityRings";
import HeartSummary from "@/src/components/HeartSummary";
import NutritionSummary from "@/src/components/NutritionSummary";
import QuickStatCard from "@/src/components/QuickStatCard";
import RecentWorkouts from "@/src/components/RecentWorkouts";
import SleepSummary from "@/src/components/SleepSummary";
import TrendsPreview from "@/src/components/TrendsPreview";
import WeightSummary from "@/src/components/WeightSummary";
import { useHealthStore } from "@/src/store/useHealthStore";
import { useThemeColors } from "@/src/theme/useThemeColors";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DashboardScreen() {
  const c = useThemeColors();
  const router = useRouter();

  // ---- Derive today's data from store or fallback ----
  const {
    ringsToday,
    stepsToday,
    distanceTodayKm,
    activeMinutesToday,
    restingHrToday,
    last7DaysSteps,
    recentWorkouts,
    sleepLastNight,
    nutritionToday,
    heartLast7Days,
    weightSeries,
  } = useDemoOrStore();

  const todaysDate = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // ---- Layout ----
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 32,
          rowGap: 16,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text style={{ color: c.text.secondary, fontSize: 12 }}>
              {todaysDate}
            </Text>
            <Text
              style={{
                color: c.text.primary,
                fontSize: 22,
                fontWeight: "800",
                marginTop: 2,
              }}
            >
              {greeting}
            </Text>
          </View>
          {/* Profile Button */}
          <TouchableOpacity
            onPress={() => router.push("/profile")}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: c.muted,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            <Ionicons
              name="person-outline"
              size={18}
              color={c.text.secondary}
            />
          </TouchableOpacity>
        </View>

        {/* Activity Rings */}
        <View
          style={{
            backgroundColor: c.surface,
            borderColor: c.border,
            borderWidth: 1,
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
          }}
        >
          <ActivityRings
            size={220}
            move={ringsToday.move}
            exercise={ringsToday.exercise}
            stand={ringsToday.stand}
          />
          {/* Goal/Streak chips */}
          <View style={{ flexDirection: "row", columnGap: 8, marginTop: 12 }}>
            <Chip
              label={`Move goal ${Math.round(ringsToday.move.goal)} kcal`}
            />
            <Chip label={`${ringsToday.streakDays}-day streak`} />
          </View>
        </View>

        {/* Quick stats row (2x2 grid on wrap) */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          <QuickStatCard
            icon="walk-outline"
            label="Steps"
            value={formatNumber(stepsToday)}
            subtext="Today"
            style={{ flexBasis: "48%" }}
            onPress={() => router.push("/(tabs)/trends?metric=steps")}
          />
          <QuickStatCard
            icon="map-outline"
            label="Distance"
            value={`${distanceTodayKm.toFixed(2)} km`}
            subtext="Today"
            style={{ flexBasis: "48%" }}
            onPress={() => router.push("/(tabs)/trends?metric=distance")}
          />
          <QuickStatCard
            icon="flame-outline"
            label="Active"
            value={`${activeMinutesToday} min`}
            subtext="Move mins"
            style={{ flexBasis: "48%" }}
            onPress={() => router.push("/(tabs)/trends?metric=active")}
          />
          <QuickStatCard
            icon="heart-outline"
            label="Resting HR"
            value={`${Math.round(restingHrToday)} bpm`}
            subtext="Avg today"
            style={{ flexBasis: "48%" }}
            onPress={() => router.push("/(tabs)/trends?metric=heart")}
          />
        </View>

        {/* Trends Preview */}
        <TrendsPreview
          title="Steps (7d)"
          metric="steps"
          series={last7DaysSteps}
          // Quick delta calc vs previous 7 (fake if none)
          deltaPct={calcDeltaPct(last7DaysSteps)}
        />

        {/* Recent Workouts */}
        <RecentWorkouts workouts={recentWorkouts} />

        {/* Sleep */}
        <SleepSummary
          totalMin={sleepLastNight.totalMin}
          start={sleepLastNight.start}
          end={sleepLastNight.end}
          segments={sleepLastNight.segments}
        />

        {/* Nutrition */}
        <NutritionSummary
          calories={nutritionToday.calories}
          goalCalories={nutritionToday.goalCalories}
          carbs={nutritionToday.carbs}
          fat={nutritionToday.fat}
          protein={nutritionToday.protein}
        />

        {/* Heart */}
        <HeartSummary
          restingAvg={heartLast7Days.restingAvg}
          min={heartLast7Days.min}
          max={heartLast7Days.max}
          series={heartLast7Days.series}
        />

        {/* Weight */}
        <WeightSummary
          latest={weightSeries.latest}
          unit={weightSeries.unit}
          series={weightSeries.series}
          delta7d={weightSeries.delta7d}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- helpers & demo fallbacks ---------------- */

function Chip({ label }: { label: string }) {
  const c = useThemeColors();
  return (
    <View
      style={{
        backgroundColor: c.muted,
        borderColor: c.border,
        borderWidth: 1,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
      }}
    >
      <Text style={{ color: c.text.secondary, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

function formatNumber(n: number) {
  try {
    return new Intl.NumberFormat().format(n);
  } catch {
    return String(n);
  }
}

function calcDeltaPct(series: number[]) {
  if (!series || series.length < 2) return 0;
  const half = Math.floor(series.length / 2);
  const prev = avg(series.slice(0, half));
  const curr = avg(series.slice(half));
  if (prev <= 0) return 0;
  return ((curr - prev) / prev) * 100;
}
function avg(arr: number[]) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Attempts to read from useHealthStore (if shape matches),
 * otherwise returns sensible demo values so the UI renders.
 */
function useDemoOrStore() {
  let store: any = {};
  try {
    store = useHealthStore?.getState?.() ?? {};
  } catch {
    // ignore if hook shape differs; we’re just providing fallbacks
  }

  // Rings
  const ringsToday = store.ringsToday ?? {
    move: { current: 430, goal: 520 },
    exercise: { current: 21, goal: 30 },
    stand: { current: 9, goal: 12 },
    streakDays: store.streakDays ?? 3,
  };

  // Steps / distance / active / HR
  const stepsToday = store.stepsToday ?? 8423;
  const distanceTodayKm = store.distanceTodayKm ?? 6.7;
  const activeMinutesToday = store.activeMinutesToday ?? 46;
  const restingHrToday = store.restingHrToday ?? 61;

  // Series
  const last7DaysSteps = store.last7DaysSteps ?? [
    6120, 7440, 8532, 9103, 7020, 11650, 8423,
  ];

  // Recent workouts
  const recentWorkouts = store.recentWorkouts ?? [
    {
      id: 1,
      type: "run",
      durationMin: 32,
      calories: 285,
      startTime: new Date(),
    },
    {
      id: 2,
      type: "strength",
      durationMin: 45,
      calories: 220,
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 6),
    },
    {
      id: 3,
      type: "walk",
      durationMin: 20,
      calories: 95,
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
  ];

  // Sleep
  const sleepLastNight = store.sleepLastNight ?? {
    totalMin: 423,
    start: new Date(Date.now() - 1000 * 60 * 60 * 7.05),
    end: new Date(),
    segments: [
      { stage: "light", minutes: 210 },
      { stage: "deep", minutes: 95 },
      { stage: "rem", minutes: 92 },
      { stage: "awake", minutes: 26 },
    ],
  };

  // Nutrition
  const nutritionToday = store.nutritionToday ?? {
    calories: 1560,
    goalCalories: 2200,
    carbs: 190,
    fat: 55,
    protein: 92,
  };

  // Heart (7d)
  const heartLast7Days = store.heartLast7Days ?? {
    restingAvg: 61,
    min: 56,
    max: 68,
    series: [62, 61, 60, 63, 59, 60, 61],
  };

  // Weight
  const weightSeries = store.weightSeries ?? {
    latest: 72.4,
    unit: "kg",
    series: [72.8, 72.7, 72.5, 72.6, 72.3, 72.4, 72.4],
    delta7d: -0.4,
  };

  return {
    ringsToday,
    stepsToday,
    distanceTodayKm,
    activeMinutesToday,
    restingHrToday,
    last7DaysSteps,
    recentWorkouts,
    sleepLastNight,
    nutritionToday,
    heartLast7Days,
    weightSeries,
  };
}
