// src/services/integrations/google/healthconnect.ts
import { PermissionsAndroid, Platform } from "react-native";
import {
  initialize,
  openHealthConnectSettings,
  readRecords,
  requestPermission,
  type Permission,
} from "react-native-health-connect";

// ---- Shapes your controller expects ----
type StepRow = { date: string; value: number };
type HrRow = { ts: string; bpm: number };
type SleepStageRow = { start: string; end: string; stage?: string };
type SleepRow = { start: string; end: string; stages?: SleepStageRow[] };
type WorkoutRow = {
  start: string;
  end: string;
  activityType: string;
  calories: number;
  distanceKm?: number;
};

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

// ---- Availability ----
export async function ensureAvailable(): Promise<void> {
  if (Platform.OS !== "android") throw new Error("Health Connect is Android-only.");
  const ok = await initialize();
  if (!ok) throw new Error("Health Connect not available. Install/enable the Health Connect app.");
}

// ---- Runtime permission (Android 10+) ----
async function ensureActivityPermission() {
  if (Platform.OS !== "android") return;
  try {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION);
  } catch {
    /* ignore */
  }
}

// ---- Permissions (typed) ----
export async function requestPermissions(): Promise<void> {
  if (Platform.OS !== "android") return;

  await ensureActivityPermission();

  const wanted: Permission[] = [
    { accessType: "read", recordType: "Steps" },
    { accessType: "read", recordType: "HeartRate" },
    { accessType: "read", recordType: "SleepSession" },
    { accessType: "read", recordType: "ExerciseSession" },
    { accessType: "read", recordType: "ActiveCaloriesBurned" },
    { accessType: "read", recordType: "Weight" },
    { accessType: "read", recordType: "ExerciseSession" },

  ];

  const granted = await requestPermission(wanted);
  if (!granted || granted.length === 0) {
    throw new Error("No Health Connect permissions granted. Please allow access.");
  }
}

// ---- Reads ----

export async function readStepsByDay(startISO: string, endISO: string): Promise<StepRow[]> {
  const res = await readRecords("Steps", {
    timeRangeFilter: { operator: "between", startTime: startISO, endTime: endISO },
  });

  const bucket = new Map<string, number>();
  for (const rec of res.records ?? []) {
    const day = toISODate(new Date(rec.endTime));
    const n = typeof rec.count === "number" ? rec.count : 0;
    bucket.set(day, (bucket.get(day) ?? 0) + n);
  }

  return [...bucket.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, value]) => ({ date, value }));
}

export async function readHeartRateSamples(startISO: string, endISO: string): Promise<HrRow[]> {
  const res = await readRecords("HeartRate", {
    timeRangeFilter: { operator: "between", startTime: startISO, endTime: endISO },
  });

  // HeartRate records have samples[] with { time, beatsPerMinute }
  const rows: HrRow[] = [];
  for (const rec of res.records ?? []) {
    if (Array.isArray(rec.samples)) {
      for (const s of rec.samples) {
        rows.push({ ts: s.time, bpm: Number(s.beatsPerMinute) });
      }
    }
  }

  rows.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
  return rows;
}

export async function readSleepSessions(startISO: string, endISO: string): Promise<SleepRow[]> {
  const res = await readRecords("SleepSession", {
    timeRangeFilter: { operator: "between", startTime: startISO, endTime: endISO },
  });

  const rows: SleepRow[] = [];
  for (const rec of res.records ?? []) {
    const stages: SleepStageRow[] = Array.isArray(rec.stages)
      ? rec.stages.map((st: any) => ({
          start: st.startTime,
          end: st.endTime,
          stage: st.stage,
        }))
      : [];

    rows.push({
      start: rec.startTime,
      end: rec.endTime,
      stages,
    });
  }

  rows.sort((a, b) => (a.start < b.start ? 1 : -1));
  return rows;
}

// Note: ExerciseSession does not carry energy/distance — we default to 0/undefined.
// You can enrich later by summing ActiveCaloriesBurned/Distance within each session window.
export async function readExerciseSessions(startISO: string, endISO: string): Promise<WorkoutRow[]> {
  const res = await readRecords("ExerciseSession", {
    timeRangeFilter: { operator: "between", startTime: startISO, endTime: endISO },
  });

  const rows: WorkoutRow[] = [];
  for (const rec of res.records ?? []) {
    rows.push({
      start: rec.startTime,
      end: rec.endTime,
      activityType: String(rec.exerciseType ?? "unknown"),
      calories: 0,
      distanceKm: undefined,
    });
  }

  rows.sort((a, b) => (a.start < b.start ? 1 : -1));
  return rows;
}

export async function readActiveEnergyByDay(
  startISO: string,
  endISO: string
): Promise<Array<{ date: string; kcal: number }>> {
  const res = await readRecords("ActiveCaloriesBurned", {
    timeRangeFilter: { operator: "between", startTime: startISO, endTime: endISO },
  });

  const bucket = new Map<string, number>();
  for (const rec of res.records ?? []) {
    const day = toISODate(new Date(rec.endTime));
    const kcal =
      typeof rec.energy?.inKilocalories === "number"
        ? Number(rec.energy.inKilocalories)
        : typeof rec.energy?.inCalories === "number"
        ? Number(rec.energy.inCalories)
        : 0;
    bucket.set(day, (bucket.get(day) ?? 0) + kcal);
  }

  return [...bucket.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, kcal]) => ({ date, kcal }));
}

// “Exercise minutes” = total duration of sessions per day
export async function readExerciseMinutesByDay(
  startISO: string,
  endISO: string
): Promise<Array<{ date: string; minutes: number }>> {
  const sessions = await readExerciseSessions(startISO, endISO);
  const bucket = new Map<string, number>();

  for (const s of sessions) {
    const end = new Date(s.end);
    const start = new Date(s.start);
    const minutes = Math.max(0, (end.getTime() - start.getTime()) / 60000);
    const day = toISODate(end);
    bucket.set(day, (bucket.get(day) ?? 0) + minutes);
  }

  return [...bucket.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, minutes]) => ({ date, minutes: Math.round(minutes) }));
}

export async function readWeightSamples(
  startISO: string,
  endISO: string
): Promise<Array<{ ts: string; kg: number }>> {
  const res = await readRecords("Weight", {
    timeRangeFilter: { operator: "between", startTime: startISO, endTime: endISO },
  });

  const rows = (res.records ?? []).map((rec: any) => ({
    ts: rec.time,
    kg:
      typeof rec.weight?.inKilograms === "number"
        ? Number(rec.weight.inKilograms)
        : typeof rec.weight?.inPounds === "number"
        ? Number(rec.weight.inPounds) * 0.45359237
        : NaN,
  }));

  rows.sort((a, b) => (a.ts < b.ts ? 1 : -1));
  return rows.filter((r) => Number.isFinite(r.kg));
}

// Optional deep link if user needs to flip permissions
export async function openHCSettings(): Promise<void> {
  try {
    await openHealthConnectSettings();
  } catch {
    /* ignore */
  }
}
