import { useProfileStore } from "@/src/store/useProfileStore";
import dayjs from "dayjs";
import {
  getActiveEnergyByDay,
  getExerciseMinutesByDay,
  getHeartRateSamples,
  getSleepSamples,
  getStepsByDay,
  getWeightSamples,
  getWorkoutSamples,
  initHealthKit,
} from "./healthkit";

// If you already created metricsBuilder/appleMaps earlier, keep these imports.
// If not yet, we'll add metricsBuilder next.
import { buildDailyMetrics } from "@/src/utils/metricsBuilder";

// Types you already defined
import type { DailyMetrics } from "@/src/data/types";

type OnData = (daily: DailyMetrics[]) => void;

function setStatus(
  status: "idle" | "connecting" | "connected" | "error",
  errorMsg?: string
) {
  const { setConnectionStatus } = useProfileStore.getState();
  setConnectionStatus("appleHealth", status, errorMsg);
}

function setEnabled(enabled: boolean) {
  const { setConnectionEnabled } = useProfileStore.getState();
  setConnectionEnabled("appleHealth", enabled);
}

function setLastSync(iso: string) {
  const { setConnectionLastSync } = useProfileStore.getState();
  setConnectionLastSync("appleHealth", iso);
}

/**
 * Request permissions to Apple Health (HealthKit).
 * Sets profile-store status so the UI can show "connecting".
 */
export async function connectApple(): Promise<void> {
  setStatus("connecting");
  try {
    await initHealthKit();
    // don't mark connected until we successfully sync (next step)
  } catch (e: any) {
    setEnabled(false);
    setStatus("error", normalizeErr(e));
    throw e;
  }
}

/**
 * Fetches last `days` of Apple data, builds DailyMetrics, and returns it.
 * Also updates profile-store lastSync + status.
 * Pass an optional onData callback to store the result in your health data store.
 */
export async function syncApple(days = 90, onData?: OnData): Promise<DailyMetrics[]> {
  try {
    const endISO = dayjs().toISOString();
    const startISO = dayjs().subtract(days, "day").toISOString();

    // Pull everything in parallel
    const [
      steps,
      hr,
      sleep,
      workouts,
      energy,
      exercise,
      // weight is not used in DailyMetrics, but you may want to store elsewhere
      weight,
    ] = await Promise.all([
      getStepsByDay(startISO, endISO),
      getHeartRateSamples(startISO, endISO),
      getSleepSamples(startISO, endISO),
      getWorkoutSamples(startISO, endISO),
      getActiveEnergyByDay(startISO, endISO).catch(() => [] as any[]),
      getExerciseMinutesByDay(startISO, endISO).catch(() => [] as any[]),
      getWeightSamples(startISO, endISO).catch(() => [] as any[]),
    ]);

    // Build unified DailyMetrics[] for charts
    const daily = buildDailyMetrics({
      days,
      steps: steps.map((s) => ({ date: s.date, steps: s.value, source: "apple" as const })),
      hr: hr.map((h) => ({ ts: h.ts, bpm: h.bpm, source: "apple" as const })),
      sleep: sleep.map((s) => ({
        start: s.start,
        end: s.end,
        // we’ll let metricsBuilder map stages properly later (via appleMaps)
        stages: s.stage ? [{ start: s.start, end: s.end, stage: s.stage as any }] : [],
        source: "apple" as const,
      })),
      workouts: workouts.map((w) => ({
        start: w.start,
        end: w.end,
        activityType: w.activityType,
        calories: w.calories,
        distanceKm: w.distance,
        source: "apple" as const,
      })),
      activeEnergy: energy,          // { date, kcal }
      exerciseMinutes: exercise,     // { date, minutes }
    });

    // Hand data back to app (store it wherever you like)
    onData?.(daily);

    // mark as connected + last sync
    setStatus("connected");
    setLastSync(new Date().toISOString());
    return daily;
  } catch (e: any) {
    setEnabled(false);     // revert the toggle
    setStatus("error", normalizeErr(e));
    throw e;
  }
}

/**
 * Convenience helper for the toggle:
 * - If enabling: connect → sync → set enabled
 * - If disabling: just flip enabled off (data removal is up to caller)
 */
export async function toggleAppleIntegration(
  enable: boolean,
  opts?: { days?: number; onData?: OnData }
): Promise<void> {
  if (!enable) {
    setEnabled(false);
    setStatus("idle");
    return;
  }

  setEnabled(true);
  await connectApple();
  await syncApple(opts?.days ?? 90, opts?.onData);
}

function normalizeErr(e: any): string {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  if (e?.message) return String(e.message);
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}
