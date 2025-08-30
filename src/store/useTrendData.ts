import { useHealthStore } from "@/src/store/useHealthStore";
import { useProfileStore } from "@/src/store/useProfileStore";
import { useMemo } from "react";
export const METRICS = ["steps", "distance", "active", "sleep", "heart", "calories", "weight"] as const;
export type MetricKey = typeof METRICS[number];
type RangeKey = "7d" | "30d" | "90d";
type GroupKey = "daily" | "weekly";

export function humanizeMetric(m: MetricKey) {
  switch (m) {
    case "steps": return "Steps";
    case "distance": return "Distance";
    case "active": return "Active minutes";
    case "sleep": return "Sleep duration";
    case "heart": return "Resting heart rate";
    case "calories": return "Calories";
    case "weight": return "Weight";
  }
}

export interface WorkoutTrendPoint {
  date: string;        // ISO, each day of the displayed week
  minutes: number;
  sessions: number;
  calories: number;
}
export interface WorkoutTrendSummary {
  points: WorkoutTrendPoint[]; // 7 points Mon..Sun
  totals: { minutes: number; sessions: number; calories: number };
  targets: { minutes?: number; sessions?: number; calories?: number };
}


export function formatValue(metric: MetricKey, v: number, unitLabel: string, imperial: boolean) {
  const round = (n: number, d = 0) => Number.isFinite(n) ? Number(n.toFixed(d)) : 0;
  switch (metric) {
    case "steps": return IntlNumber(v) + " " + unitLabel;
    case "distance": return `${round(v, 2)} ${unitLabel}`;
    case "active": return `${round(v)} ${unitLabel}`;
    case "sleep": return `${round(v, 1)} ${unitLabel}`;
    case "heart": return `${round(v)} ${unitLabel}`;
    case "calories": return `${round(v)} ${unitLabel}`;
    case "weight": {
      // Chart stays in kg; if imperial, also show lb in parentheses for clarity (optional)
      const kg = v;
      const base = `${round(kg, 1)} ${unitLabel}`;
      if (imperial) {
        const lb = kg * 2.20462;
        return `${base} (${round(lb, 1)} lb)`;
      }
      return base;
    }
  }
}

export function useTrendData({ metric, range, groupBy }: { metric: MetricKey; range: RangeKey; groupBy: GroupKey; }) {
  // read stores (safe)
  let health: any = {};
  try { health = useHealthStore.getState?.() ?? {}; } catch {}
  let profile: any = {};
  try { profile = useProfileStore.getState?.() ?? {}; } catch {}

  const imperial = profile.unit === "imperial";
  const unitLabel = unitFor(metric, imperial);

  // raw series for window
  const base = getSeries(health, profile, metric, range, imperial);

  // group if needed
  const grouped = groupBy === "weekly" ? groupWeekly(base.values, metric) : base.values;
  const labels = makeLabels(grouped.length, groupBy);

  // stats
  const stats = computeStats(grouped);

  return useMemo(() => ({
    labels,
    values: grouped,
    unitLabel,
    imperial,
    stats
  }), [labels.join("|"), grouped.join("|"), unitLabel, imperial, JSON.stringify(stats)]);
}

/* ---------------- helpers ---------------- */

function unitFor(metric: MetricKey, imperial: boolean) {
  switch (metric) {
    case "steps": return "steps";
    case "distance": return imperial ? "mi" : "km";
    case "active": return "min";
    case "sleep": return "h";
    case "heart": return "bpm";
    case "calories": return "kcal";
    case "weight": return "kg";
  }
}

function getSeries(health: any, profile: any, metric: MetricKey, range: RangeKey, imperial: boolean) {
  const len = range === "7d" ? 7 : range === "30d" ? 30 : 90;

  // If your store already has trends.* use them. Otherwise synthesize from what you have.
  const trends = health.trends ?? {};

  const pick = (obj: any, key: string) => obj?.[key] as number[] | undefined;

  // distance conversion helper (km -> mi if needed)
  const dist = (arr: number[]) => imperial ? arr.map(km => km * 0.621371) : arr;

  switch (metric) {
    case "steps": {
      const fromStore =
        pick(trends.steps, range) ??
        (range === "7d" ? health.last7DaysSteps : undefined);
      const values = ensureLength(fromStore, len, 6000, 4000, 12000);
      return { values };
    }
    case "distance": {
      const fromStore = pick(trends.distance, range);
      // derive from steps if missing (rough 1 step ≈ 0.00075 km)
      const fallbackSteps = ensureLength(health.last7DaysSteps, len, 8000, 4000, 12000);
      const derivedKm = (fromStore ?? fallbackSteps.map(s => s * 0.00075));
      return { values: dist(ensureLength(derivedKm, len, 5.2, 2.5, 10)) };
    }
    case "active": {
      const fromStore = pick(trends.active, range);
      const base = fromStore ?? ensureLength(undefined, len, 45, 20, 80);
      return { values: base };
    }
    case "sleep": {
      const fromStore = pick(trends.sleep, range);
      const base = fromStore ?? ensureLength(undefined, len, 7.2, 5.0, 9.0);
      // convert minutes->hours if your store uses minutes; here assume hours
      return { values: base };
    }
    case "heart": {
      const fromStore =
        pick(trends.heart, range) ??
        (range === "7d" ? health.heartLast7Days?.series : undefined);
      const base = ensureLength(fromStore, len, 61, 56, 68);
      return { values: base };
    }
    case "calories": {
      const fromStore = pick(trends.calories, range);
      const base = fromStore ?? ensureLength(undefined, len, 2100, 1500, 2800);
      return { values: base };
    }
    case "weight": {
      // Use profile.weightLog (kg) → map into a day series (last N days); fill gaps with last known
      const logs: Array<{ date: string; kg: number }> = profile.weightLog ?? [];
      const series = seriesFromLogs(logs, len, profile.weightKg ?? 72.5);
      return { values: series };
    }
  }
}

function ensureLength(src: number[] | undefined, len: number, center: number, min: number, max: number) {
  if (Array.isArray(src) && src.length >= len) return src.slice(-len);
  // synthesize gentle-var series around center
  const out: number[] = [];
  for (let i = 0; i < len; i++) {
    const jitter = Math.sin((i / len) * Math.PI * 2) * 0.15; // -0.15..0.15
    const noise = (Math.random() - 0.5) * 0.1;               // -0.05..0.05
    const v = clamp(center * (1 + jitter + noise), min, max);
    out.push(Number(v.toFixed(2)));
  }
  return out;
}

function seriesFromLogs(logs: Array<{ date: string; kg: number }>, len: number, fallbackKg: number) {
  // Build last N days timeline from today backwards; fill with last known value
  const days: number[] = [];
  const map = new Map<string, number>();
  logs.forEach((l) => map.set(l.date, l.kg));
  const today = new Date();
  let last = fallbackKg;

  for (let i = len - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const v = map.get(iso);
    if (typeof v === "number") last = v;
    days.push(Number(last.toFixed(1)));
  }
  return days;
}

function makeLabels(n: number, groupBy: "daily" | "weekly") {
  const labels: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    if (groupBy === "weekly") {
      d.setDate(today.getDate() - i * 7);
      labels.push(d.toLocaleDateString(undefined, { month: "short", day: "numeric" }));
    } else {
      d.setDate(today.getDate() - i);
      labels.push(d.toLocaleDateString(undefined, { month: "short", day: "numeric" }));
    }
  }
  return labels;
}

function groupWeekly(values: number[], metric: MetricKey) {
  // sum-type vs avg-type metrics
  const isSum = ["steps", "distance", "active", "calories"].includes(metric);
  const chunk = 7;
  const res: number[] = [];
  for (let i = 0; i < values.length; i += chunk) {
    const slice = values.slice(i, i + chunk);
    if (!slice.length) continue;
    const s = slice.reduce((a, b) => a + b, 0);
    res.push(Number((isSum ? s : s / slice.length).toFixed(2)));
  }
  return res;
}

function computeStats(values: number[]) {
  if (!values.length) return { avg: 0, min: { v: 0, i: 0 }, max: { v: 0, i: 0 }, deltaPct: 0 };
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  let minV = values[0], minI = 0, maxV = values[0], maxI = 0;
  values.forEach((v, i) => {
    if (v < minV) { minV = v; minI = i; }
    if (v > maxV) { maxV = v; maxI = i; }
  });
  // Split window in half for a simple Δ vs prev window
  const half = Math.max(1, Math.floor(values.length / 2));
  const prevAvg = values.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const currAvg = values.slice(-half).reduce((a, b) => a + b, 0) / half;
  const deltaPct = prevAvg > 0 ? ((currAvg - prevAvg) / prevAvg) * 100 : 0;

  return {
    avg,
    min: { v: minV, i: minI },
    max: { v: maxV, i: maxI },
    deltaPct
  };
}

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }
function IntlNumber(n: number) { try { return new Intl.NumberFormat().format(Math.round(n)); } catch { return String(Math.round(n)); } }
