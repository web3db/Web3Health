import type { WorkoutType } from "@/src/theme/workoutColors";
import { create } from "zustand";

export type TrendRange = "7d" | "30d" | "90d";
export type TrendMetric = "minutes" | "calories";

export type Workout = {
  id: string;
  type: WorkoutType;
  startISO: string;        // start datetime ISO
  durationMin: number;     // minutes
  calories: number;        // kcal
  distanceKm?: number;
  avgHr?: number;
  notes?: string;
};

type TrendBase = {
  dates: string[];     // 90d ISO dates
  minutes: number[];   // baseline minutes per day
  calories: number[];  // baseline kcal per day
};

type State = {
  workouts: Workout[];
  weeklyGoalMin: number;

  // prebuilt 90d baseline (updated when weeklyGoalMin changes)
  _trendBase: TrendBase;

  // selectors/helpers
  workoutsOnDate: (dateISO: string) => Workout[];
  weekSummary: (anyDateISO?: string) => { minutes: number; sessions: number; calories: number; goalMin: number };
  getTrend: (metric: TrendMetric, range: TrendRange) => { dates: string[]; values: number[] };

  // actions
  addWorkout: (w: Omit<Workout, "id">) => string;
  updateWorkout: (id: string, patch: Partial<Workout>) => void;
  removeWorkout: (id: string) => void;
  setWeeklyGoal: (min: number) => void;

  // NEW: demo helpers
  seedDemoData: (days?: number, seed?: number) => void;
  clearAll: () => void;
};

// ---------- helpers ----------
function isoDateOnly(d: Date) {
  return d.toISOString().slice(0, 10);
}
function todayISO() {
  return isoDateOnly(new Date());
}
function isoNDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(9, 0, 0, 0); // ~9am start for realism
  return d.toISOString();
}
function startOfWeekISO(d = new Date()) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday=0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return isoDateOnly(date);
}
function makeRng(seed = 1337) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s & 0xfffffff) / 0xfffffff;
  };
}
function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}
function buildTrendBase(weeklyGoalMin: number, totalDays = 90): TrendBase {
  const rng = makeRng(98765);
  const dates: string[] = [];
  const minutes: number[] = [];
  const calories: number[] = [];

  // assume ~5 active days/week target
  const dailyTarget = weeklyGoalMin / 5;
  for (let d = totalDays - 1; d >= 0; d--) {
    const startISO = isoNDaysAgo(d);
    const iso = startISO.slice(0, 10);
    const day = new Date(iso).getDay(); // 0=Sun
    const weekly = day === 0 || day === 6 ? 1.15 : day === 1 ? 0.9 : 1.0; // weekends higher, Mondays lower
    const jitter = 1 + (rng() * 0.30 - 0.15); // ±15%
    const mins = Math.max(0, Math.round(dailyTarget * weekly * jitter));

    // rough kcal from minutes (cardio-ish): ~8 kcal/min with jitter
    const kcal = Math.max(0, Math.round(mins * (7.5 + rng() * 2)));

    dates.push(iso);
    minutes.push(mins);
    calories.push(kcal);
  }
  return { dates, minutes, calories };
}
function sum(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0);
}
function dateSliceIndex(dates90: string[], range: TrendRange) {
  const n = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return dates90.length - n;
}
// aggregate real workouts by date
function aggregateWorkouts(workouts: Workout[]) {
  const byDate = new Map<string, { minutes: number; calories: number }>();
  for (const w of workouts) {
    const d = w.startISO.slice(0, 10);
    const prev = byDate.get(d) ?? { minutes: 0, calories: 0 };
    prev.minutes += Math.max(0, w.durationMin || 0);
    prev.calories += Math.max(0, w.calories || 0);
    byDate.set(d, prev);
  }
  return byDate;
}

// ------ DEMO DATA GENERATOR (NEW) ------
// Chooses a valid WorkoutType. Keep the labels conservative to match your theme keys.
const DEMO_TYPES = ["run", "strength", "walk", "cycle", "yoga"] as unknown as WorkoutType[];

// Heuristics per type for realistic ranges
const TYPE_PROFILE: Record<string, { minDur: number; maxDur: number; kcalPerMin: [number, number]; distPerMin?: number; hr?: [number, number] }> = {
  run:      { minDur: 20, maxDur: 55, kcalPerMin: [9, 12], distPerMin: 0.12, hr: [135, 170] },
  walk:     { minDur: 20, maxDur: 45, kcalPerMin: [3.5, 6], distPerMin: 0.07, hr: [95, 120] },
  cycle:    { minDur: 30, maxDur: 75, kcalPerMin: [8, 11], distPerMin: 0.4, hr: [120, 160] },
  strength: { minDur: 30, maxDur: 60, kcalPerMin: [5.5, 8], hr: [110, 150] },
  yoga:     { minDur: 25, maxDur: 55, kcalPerMin: [4, 6], hr: [90, 115] },
};

function pick<T>(arr: T[], rnd: () => number) {
  return arr[Math.floor(rnd() * arr.length)];
}

function generateDemoWorkouts(days: number, weeklyGoalMin: number, seed = 4242): Workout[] {
  const rng = makeRng(seed);
  const out: Workout[] = [];

  // aim for ~5 active days/week, some weeks 4–6
  const targetActiveDays = 5;

  for (let i = 0; i < days; i++) {
    const startISO = isoNDaysAgo(i); // includes time
    const dayNum = new Date(startISO).getDay(); // 0=Sun

    // probability of working out today (slightly higher on weekends)
    const baseP = dayNum === 0 || dayNum === 6 ? 0.75 : 0.65;
    const doWorkout = rng() < baseP;

    if (!doWorkout) continue;

    // choose a type—bias weekends to longer cardio
    const types = (dayNum === 0 || dayNum === 6) ? ["run", "cycle", "walk", "strength", "yoga"] : ["strength", "run", "walk", "yoga", "cycle"];
    const type = pick(types, rng) as unknown as WorkoutType;
    const p = TYPE_PROFILE[type as unknown as string] ?? TYPE_PROFILE.run;

    // minutes guided by weeklyGoalMin spread across ~5 days
    const baselineMin = clamp(Math.round((weeklyGoalMin / targetActiveDays) * (0.85 + rng() * 0.35)), p.minDur, p.maxDur);
    const durationMin = clamp(Math.round(baselineMin * (0.9 + rng() * 0.3)), p.minDur, p.maxDur);

    const kcalPerMin = p.kcalPerMin[0] + rng() * (p.kcalPerMin[1] - p.kcalPerMin[0]);
    const calories = Math.round(durationMin * kcalPerMin);

    const distanceKm = p.distPerMin ? +(durationMin * p.distPerMin * (0.9 + rng() * 0.2)).toFixed(2) : undefined;
    const avgHr = p.hr ? Math.round(p.hr[0] + rng() * (p.hr[1] - p.hr[0])) : undefined;

    out.push({
      id: `demo_${startISO.slice(0, 10)}_${i}`,
      type,
      startISO,
      durationMin,
      calories,
      distanceKm,
      avgHr,
      notes: rng() < 0.1 ? "Felt great" : rng() < 0.1 ? "Tired today" : undefined,
    });
  }

  // make newest first
  out.sort((a, b) => (a.startISO > b.startISO ? -1 : 1));
  return out as Workout[];
}

// ---------- store ----------
const INITIAL_GOAL = 150;
const AUTO_SEED_ON_INIT = true;

export const useWorkoutStore = create<State>((set, get) => {
  // initial tiny sample to keep UI happy before seeding
  const initialWorkouts: Workout[] = [
    { id: "w1", type: "run" as WorkoutType,      startISO: new Date().toISOString(),                        durationMin: 32, calories: 285, distanceKm: 5.2 },
    { id: "w2", type: "strength" as WorkoutType, startISO: new Date(Date.now() - 2 * 3600e3).toISOString(), durationMin: 45, calories: 220 },
    { id: "w3", type: "walk" as WorkoutType,     startISO: new Date(Date.now() - 24 * 3600e3).toISOString(), durationMin: 28, calories: 120, distanceKm: 2.3 },
  ];

  const base = buildTrendBase(INITIAL_GOAL);

  // Auto-seed once if desired
  const seeded = AUTO_SEED_ON_INIT
    ? [...generateDemoWorkouts(90, INITIAL_GOAL), ...initialWorkouts]
    : initialWorkouts;

  return {
    workouts: seeded,
    weeklyGoalMin: INITIAL_GOAL,
    _trendBase: base,

    workoutsOnDate: (dateISO) =>
      get()
        .workouts.filter(w => w.startISO.slice(0, 10) === dateISO)
        .sort((a, b) => (a.startISO > b.startISO ? -1 : 1)),

    weekSummary: (anyDateISO) => {
      const ref = anyDateISO ? new Date(anyDateISO) : new Date();
      const startISO = startOfWeekISO(ref);
      const start = new Date(startISO);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);

      const ws = get().workouts.filter(w => {
        const d = new Date(w.startISO);
        return d >= start && d < end;
      });
      const minutes = sum(ws.map(w => w.durationMin || 0));
      const calories = sum(ws.map(w => w.calories || 0));
      return { minutes, sessions: ws.length, calories, goalMin: get().weeklyGoalMin };
    },

    getTrend: (metric, range) => {
      const base = get()._trendBase;
      const startIdx = Math.max(0, dateSliceIndex(base.dates, range));
      const dates = base.dates.slice(startIdx);
      const baseVals = (metric === "minutes" ? base.minutes : base.calories).slice(startIdx);

      // overlay real workouts (use max of baseline vs actual, so charts look real even with few logs)
      const byDate = aggregateWorkouts(get().workouts);
      const actualVals = dates.map(d => {
        const x = byDate.get(d);
        return metric === "minutes" ? (x?.minutes ?? 0) : (x?.calories ?? 0);
      });

      const values = baseVals.map((b, i) => Math.max(b, actualVals[i]));
      return { dates, values };
    },

    addWorkout: (w) => {
      const id = `w_${Date.now()}`;
      set(s => ({ workouts: [{ id, ...w }, ...s.workouts] }));
      return id;
    },

    updateWorkout: (id, patch) => set(s => ({
      workouts: s.workouts.map(x => (x.id === id ? { ...x, ...patch } : x)),
    })),

    removeWorkout: (id) => set(s => ({
      workouts: s.workouts.filter(x => x.id !== id),
    })),

    setWeeklyGoal: (min) =>
      set(s => {
        const next = Math.max(0, Math.round(min));
        return {
          weeklyGoalMin: next,
          _trendBase: buildTrendBase(next),
        };
      }),

    // NEW: generate & merge demo data
    seedDemoData: (days = 90, seed = 4242) => {
      const next = generateDemoWorkouts(days, get().weeklyGoalMin, seed);
      set(s => {
        // merge, de-dup by (date+type+duration)
        const key = (w: Workout) => `${w.startISO.slice(0,10)}_${w.type}_${w.durationMin}_${w.calories}`;
        const map = new Map<string, Workout>();
        [...next, ...s.workouts].forEach(w => map.set(key(w), w));
        const merged = Array.from(map.values()).sort((a, b) => (a.startISO > b.startISO ? -1 : 1));
        return { workouts: merged };
      });
    },

    // NEW: clear everything (dev helper)
    clearAll: () => set({ workouts: [], weeklyGoalMin: 0, _trendBase: buildTrendBase(0) }),
  };
});
