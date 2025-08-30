export type WorkoutType = 'Run' | 'Walk' | 'Cycle' | 'Strength';

export type DailyMetrics = {
  date: string;
  steps: number;
  calories: number;
  activeMin: number;
  hr: { avg: number; rest: number; series: number[] };
  sleep: { totalMin: number; stages: { light: number; deep: number; rem: number } };
  workouts: { id: string; type: WorkoutType; min: number; kcal: number }[];
};

//primitives for Apple imports 
export type DataSource = "apple" | "google";
export type DayKey = string; // 'YYYY-MM-DD'

export interface StepDay {
  date: DayKey;
  steps: number;
  source: DataSource;
}

export interface HeartRateSample {
  ts: string; // ISO timestamp
  bpm: number;
  source: DataSource;
}

export interface SleepSession {
  start: string; // ISO
  end: string;   // ISO
  stages?: Array<{ start: string; end: string; stage: "awake" | "core" | "deep" | "rem" }>;
  source: DataSource;
}

export interface WorkoutSession {
  start: string;       // ISO
  end: string;         // ISO
  activityType: string; // raw HK identifier; mapped to WorkoutType later
  calories?: number;    // kcal
  distanceKm?: number;
  source: DataSource;
}

export interface WeightSample {
  ts: string; // ISO
  kg: number;
  source: DataSource;
}
