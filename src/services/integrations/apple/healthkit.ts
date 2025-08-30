import AppleHealthKit, { HealthKitPermissions, HealthValue } from "react-native-health";


const HK = AppleHealthKit as any;
const P = HK?.Constants?.Permissions ?? {};
const Units = HK?.Constants?.Units ?? {};
const UNIT_BPM = Units.bpm ?? "bpm";
const UNIT_KG = Units.kilogram ?? Units.kg ?? "kg";
const UNIT_KCAL = Units.kilocalorie ?? Units.kcal ?? "kcal";

// ---- permissions ----
const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      P.Steps,
      P.HeartRate,
      P.SleepAnalysis,
      P.Workout,
      P.Weight,
      P.ActiveEnergyBurned,
      P.AppleExerciseTime,
    ].filter(Boolean),
    write: [P.Workout].filter(Boolean),
  },
};


function handle<T>(
  resolve: (v: T) => void,
  reject: (e: Error) => void,
  mapper: (r: any) => T
) {
  return (err: any, results: any) => {
    if (err) {
      const msg =
        (typeof err === "string" && err) ||
        err?.message ||
        JSON.stringify(err);
      reject(new Error(msg));
      return;
    }
    resolve(mapper(results));
  };
}

// ---------- init ----------
export async function initHealthKit(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    HK.initHealthKit(
      permissions,
      (err: any) => (err ? reject(new Error(err?.message ?? String(err))) : resolve())
    );
  });
}

// ---------- steps (daily) ----------
export async function getStepsByDay(startISO: string, endISO: string) {
  return new Promise<{ date: string; value: number }[]>((resolve, reject) => {
    HK.getDailyStepCountSamples(
      { startDate: startISO, endDate: endISO },
      handle(resolve, reject, (results: any[]) =>
        (results ?? []).map((r) => ({
          date: String(r.startDate).slice(0, 10),
          value: Number(r.value ?? 0),
        }))
      )
    );
  });
}

// ---------- heart rate (samples) ----------
export async function getHeartRateSamples(startISO: string, endISO: string) {
  return new Promise<{ ts: string; bpm: number }[]>((resolve, reject) => {
    HK.getHeartRateSamples(
      { startDate: startISO, endDate: endISO, unit: UNIT_BPM as any },
      handle(resolve, reject, (results: Array<HealthValue & { value: number }>) =>
        (results ?? []).map((v) => ({ ts: String(v.startDate), bpm: Number(v.value ?? 0) }))
      )
    );
  });
}

// ---------- sleep (raw samples; stage in value) ----------
export async function getSleepSamples(startISO: string, endISO: string) {
  return new Promise<{ start: string; end: string; stage?: string }[]>((resolve, reject) => {
    HK.getSleepSamples(
      { startDate: startISO, endDate: endISO },
      handle(resolve, reject, (results: any[]) =>
        (results ?? []).map((s) => ({
          start: String(s.startDate),
          end: String(s.endDate),
          stage: s.value, // INBED / ASLEEPCORE / ASLEEPDEEP / ASLEEPREM
        }))
      )
    );
  });
}

// ---------- workouts ----------
export async function getWorkoutSamples(startISO: string, endISO: string) {
  return new Promise<
    { start: string; end: string; activityType: string; calories?: number; distance?: number }[]
  >((resolve, reject) => {
    const fn = HK.getAnchoredWorkouts ?? HK.getWorkouts; // prefer anchored
    if (!fn) return resolve([]);
    fn(
      { startDate: startISO, endDate: endISO },
      handle(resolve, reject, (results: { data?: any[]; workouts?: any[] }) => {
        const arr = results?.data ?? results?.workouts ?? [];
        return arr.map((w: any) => ({
          start: String(w.startDate),
          end: String(w.endDate),
          activityType: String(w.workoutActivityType ?? w.activityType ?? ""),
          calories: w.totalEnergyBurned?.quantity ?? w.totalEnergyBurned,
          distance: w.totalDistance?.quantity ?? w.totalDistance,
        }));
      })
    );
  });
}

// ---------- weight (samples) ----------
export async function getWeightSamples(startISO: string, endISO: string) {
  return new Promise<{ ts: string; kg: number }[]>((resolve, reject) => {
    HK.getWeightSamples(
      { startDate: startISO, endDate: endISO, unit: UNIT_KG as any },
      handle(resolve, reject, (results: any[]) =>
        (results ?? []).map((r) => ({ ts: String(r.startDate), kg: Number(r.value ?? 0) }))
      )
    );
  });
}

// ---------- active energy ----------
export async function getActiveEnergyByDay(startISO: string, endISO: string) {
  return new Promise<{ date: string; kcal: number }[]>((resolve, reject) => {
    const fn = HK.getActiveEnergyBurned ?? HK.getDailyActiveEnergyBurnedSamples;
    if (!fn) return resolve([]);
    fn(
      { startDate: startISO, endDate: endISO, unit: UNIT_KCAL as any },
      handle(resolve, reject, (results: Array<HealthValue & { value: number }>) => {
        // If we already got daily buckets, map directly; otherwise sum by day.
        if (Array.isArray(results) && results.length && "startDate" in results[0] && "value" in results[0]) {
          const byDay: Record<string, number> = {};
          for (const s of results ?? []) {
            const day = String((s as any).startDate).slice(0, 10);
            byDay[day] = (byDay[day] ?? 0) + Number((s as any).value ?? 0);
          }
          return Object.entries(byDay).map(([date, kcal]) => ({ date, kcal }));
        }
        // Some libs already return { startDate, value } daily; just normalize
        const arr: any[] = (results as any) ?? [];
        return arr.map((r) => ({
          date: String(r.startDate).slice(0, 10),
          kcal: Number(r.value ?? 0),
        }));
      })
    );
  });
}

// ---------- exercise minutes (Apple ring) ----------
export async function getExerciseMinutesByDay(startISO: string, endISO: string) {
  return new Promise<{ date: string; minutes: number }[]>((resolve, reject) => {
    const fn = HK.getAppleExerciseTime;
    if (!fn) return resolve([]);
    fn(
      { startDate: startISO, endDate: endISO, period: 1 },
      handle(resolve, reject, (results: any[]) =>
        (results ?? []).map((r) => ({
          date: String(r.startDate).slice(0, 10),
          minutes: Number(r.value ?? 0),
        }))
      )
    );
  });
}
