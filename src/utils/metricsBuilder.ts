import type {
  DailyMetrics,
  DayKey,
  HeartRateSample,
  SleepSession,
  StepDay,
  WorkoutSession,
} from "@/src/data/types";
import dayjs from "dayjs";
import { mapHKWorkoutType, mapSleepStage } from "./appleMaps";

type Inputs = {
  days: number;
  steps: StepDay[]; // { date: 'YYYY-MM-DD', steps }
  hr: HeartRateSample[]; // { ts, bpm }
  sleep: SleepSession[]; // sessions with optional stages
  workouts: WorkoutSession[];
  activeEnergy?: { date: string; kcal: number }[];
  exerciseMinutes?: { date: string; minutes: number }[];
};
type DataSource = "apple" | "google";


export function buildDailyMetrics(input: Inputs): DailyMetrics[] {
  const end = dayjs();
  const start = end.subtract(input.days, "day");
  const keys: DayKey[] = [];
  for (let d = 0; d <= input.days; d++) keys.push(start.add(d, "day").format("YYYY-MM-DD"));

  // initialize defaults
  const byKey: Record<DayKey, DailyMetrics> = {};
  for (const k of keys) {
    byKey[k] = {
      date: k,
      steps: 0,
      calories: 0,
      activeMin: 0,
      hr: { avg: 0, rest: 0, series: [] },
      sleep: { totalMin: 0, stages: { light: 0, deep: 0, rem: 0 } },
      workouts: [],
    };
  }

  // Steps
  for (const s of input.steps) {
    if (byKey[s.date]) byKey[s.date].steps = (byKey[s.date].steps ?? 0) + s.steps;
  }

  // Heart rate (avg, proxy "rest", and a downsampled series for charts)
  const hrByDay: Record<DayKey, number[]> = {};
  for (const h of input.hr) {
    const k = (h.ts ?? "").slice(0, 10) as DayKey;
    if (!byKey[k]) continue;
    (hrByDay[k] ||= []).push(h.bpm);
  }
  for (const k of keys) {
    const arr = hrByDay[k] || [];
    if (!arr.length) continue;
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    const sorted = [...arr].sort((a, b) => a - b);
    const rest = sorted[Math.max(0, Math.floor(sorted.length * 0.1))] ?? sorted[0] ?? 0; // ~10th percentile
    const target = 96; // ~15-min buckets
    const step = Math.max(1, Math.floor(arr.length / target));
    const series = arr.filter((_, i) => i % step === 0);
    byKey[k].hr = { avg: round1(avg), rest: Math.round(rest), series };
  }

  // Sleep (sum total + stage mins). Bucket by session start date.
  for (const s of input.sleep) {
    const k = (s.start ?? "").slice(0, 10) as DayKey;
    if (!byKey[k]) continue;
    const total = minutesBetween(s.start, s.end);
    byKey[k].sleep.totalMin += total;

    for (const seg of s.stages ?? []) {
      const mins = minutesBetween(seg.start, seg.end);
      const st = mapSleepStage(seg.stage);
      if (st === "light") byKey[k].sleep.stages.light += mins;
      else if (st === "deep") byKey[k].sleep.stages.deep += mins;
      else if (st === "rem") byKey[k].sleep.stages.rem += mins;
      // "awake" is not displayed in your type; we ignore it here
    }
  }

  // Workouts (normalize into your enum and accumulate kcal/min)
  for (const w of input.workouts) {
    const k = (w.start ?? "").slice(0, 10) as DayKey;
    if (!byKey[k]) continue;
    const type = mapHKWorkoutType(w.activityType);
    const min = minutesBetween(w.start, w.end);
    const kcal = w.calories ?? 0;
    if (type) byKey[k].workouts.push({ id: makeId(w), type, min, kcal });
    byKey[k].calories += kcal;
    byKey[k].activeMin += min; // fallback if ExerciseTime is missing
  }

  // Active energy (if provided) — take the better value for the day
  for (const a of input.activeEnergy ?? []) {
    if (byKey[a.date]) {
      byKey[a.date].calories = Math.max(byKey[a.date].calories, a.kcal);
    }
  }

  // Exercise minutes (if provided) — override fallback from workouts
  for (const e of input.exerciseMinutes ?? []) {
    if (byKey[e.date]) {
      byKey[e.date].activeMin = Math.max(byKey[e.date].activeMin, e.minutes);
    }
  }

  // final rounding where helpful
  return keys.map((k) => ({
    ...byKey[k],
    activeMin: Math.round(byKey[k].activeMin),
    sleep: {
      totalMin: Math.round(byKey[k].sleep.totalMin),
      stages: {
        light: Math.round(byKey[k].sleep.stages.light),
        deep: Math.round(byKey[k].sleep.stages.deep),
        rem: Math.round(byKey[k].sleep.stages.rem),
      },
    },
  }));
}

function minutesBetween(a?: string, b?: string): number {
  if (!a || !b) return 0;
  return Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 60000);
}
function round1(n: number) {
  return Math.round(n * 10) / 10;
}
function makeId(w: WorkoutSession) {
  return `${w.start}-${w.end}-${w.activityType}`;
}
