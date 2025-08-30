// src/integrations/google/controller.ts
import type { DailyMetrics } from "@/src/data/types";
import { useProfileStore } from "@/src/store/useProfileStore";
import { buildDailyMetrics } from "@/src/utils/metricsBuilder";
import dayjs from "dayjs";
import { Platform } from "react-native";

import {
  ensureAvailable,
  readActiveEnergyByDay,
  readExerciseMinutesByDay,
  readExerciseSessions,
  readHeartRateSamples,
  readSleepSessions,
  readStepsByDay,
  readWeightSamples,
  requestPermissions,
} from "./healthconnect";

type OnData = (daily: DailyMetrics[]) => void;
type StepRow = { date: string; value: number };
type HrRow = { ts: string; bpm: number };
type SleepStageRow = { start: string; end: string; stage?: string };
type SleepRow = { start: string; end: string; stages?: SleepStageRow[] };
type WorkoutRow = { start: string; end: string; activityType: string; calories: number; distanceKm?: number };


function setEnabled(enabled: boolean) {
  const { setConnectionEnabled } = useProfileStore.getState();
  setConnectionEnabled("healthConnect", enabled);
}

function setStatus(
  status: "idle" | "connecting" | "connected" | "error",
  errorMsg?: string
) {
  const { setConnectionStatus } = useProfileStore.getState();
  setConnectionStatus("healthConnect", status, errorMsg);
}

function setLastSync(iso: string) {
  const { setConnectionLastSync } = useProfileStore.getState();
  setConnectionLastSync("healthConnect", iso);
}

// One-time connect + permission flow
export async function connectHealthConnect(): Promise<void> {
  if (Platform.OS !== "android") {
    throw new Error("Health Connect is Android-only.");
  }
  setStatus("connecting");
  await ensureAvailable();
  await requestPermissions();
}


export async function syncHealthConnect(
  days = 90,
  onData?: OnData
): Promise<DailyMetrics[]> {
  if (Platform.OS !== "android") {
    throw new Error("Health Connect is Android-only.");
  }

  const endISO = dayjs().toISOString();
  const startISO = dayjs().subtract(days, "day").toISOString();

  try {
    const [
      steps,
      hr,
      sleep,
      workouts,
      energy,
      exercise,
      weight, // kept for future use
    ] = await Promise.all([
      readStepsByDay(startISO, endISO),
      readHeartRateSamples(startISO, endISO),
      readSleepSessions(startISO, endISO),
      readExerciseSessions(startISO, endISO),
      readActiveEnergyByDay(startISO, endISO).catch(() => [] as any),
      readExerciseMinutesByDay(startISO, endISO).catch(() => [] as any),
      readWeightSamples(startISO, endISO).catch(() => [] as any),
    ]);

    const daily = buildDailyMetrics({
      days,
      steps: (steps as StepRow[]).map((s: StepRow) => ({
        date: s.date,
        steps: s.value,
        source: "google" as const,
      })),
      hr: (hr as HrRow[]).map((h: HrRow) => ({
        ts: h.ts,
        bpm: h.bpm,
        source: "google" as const,
      })),
      sleep: (sleep as SleepRow[]).map((s: SleepRow) => ({
        start: s.start,
        end: s.end,
        stages: (s.stages ?? []).map((st: SleepStageRow) => ({
          start: st.start,
          end: st.end,
          stage: (String(st.stage ?? "")
            .toUpperCase()
            .includes("REM")
              ? "rem"
              : String(st.stage ?? "")
                  .toUpperCase()
                  .includes("DEEP")
              ? "deep"
              : String(st.stage ?? "")
                  .toUpperCase()
                  .includes("AWAKE")
              ? "awake"
              : "core") as any,
        })),
        source: "google" as const,
      })),
      workouts: (workouts as WorkoutRow[]).map((w: WorkoutRow) => ({
        start: w.start,
        end: w.end,
        activityType: w.activityType,
        calories: w.calories,
        distanceKm: w.distanceKm ?? 0, // ensure number
        source: "google" as const,
      })),
      activeEnergy: energy,      // { date, kcal }[]
      exerciseMinutes: exercise, // { date, minutes }[]
    });

    onData?.(daily);
    setStatus("connected");
    setLastSync(new Date().toISOString());
    return daily;
  } catch (e: any) {
    setEnabled(false);
    setStatus("error", e?.message ?? String(e) ?? "Health Connect sync failed.");
    throw e;
  }
}

export async function toggleHealthConnectIntegration(
  enable: boolean,
  opts?: { days?: number; onData?: OnData }
) {
  if (!enable) {
    setEnabled(false);
    setStatus("idle");
    return;
  }

  setEnabled(true);
  await connectHealthConnect();
  await syncHealthConnect(opts?.days ?? 90, opts?.onData);
}
