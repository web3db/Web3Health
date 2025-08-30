import type { DailyMetrics, WorkoutType } from './types';
import dayjs from 'dayjs';

const rnd = (min: number, max: number) => Math.floor(min + Math.random() * (max - min + 1));

export function generateSeries(days = 30): { metricsByDate: Record<string, DailyMetrics>, dates: string[] } {
  const metricsByDate: Record<string, DailyMetrics> = {};
  const dates: string[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    const steps = rnd(2500, 12000);
    const activeMin = rnd(10, 90);
    const calories = rnd(1600, 3200);
    const hrSeries = Array.from({ length: 24 }, () => rnd(55, 130));
    const hr = { avg: Math.round(hrSeries.reduce((a, b) => a + b, 0) / hrSeries.length), rest: rnd(50, 70), series: hrSeries };
    const sleepLight = rnd(120, 240), sleepDeep = rnd(40, 120), sleepRem = rnd(60, 140);
    const sleep = { totalMin: sleepLight + sleepDeep + sleepRem, stages: { light: sleepLight, deep: sleepDeep, rem: sleepRem } };
    const workoutTypes: WorkoutType[] = ['Run', 'Walk', 'Cycle', 'Strength'];
    const workouts = Array.from({ length: rnd(0, 2) }).map((_, idx) => ({
      id: `${date}-${idx}`, type: workoutTypes[rnd(0, workoutTypes.length - 1)],
      min: rnd(15, 60), kcal: rnd(80, 500),
    }));
    metricsByDate[date] = { date, steps, calories, activeMin, hr, sleep, workouts };
    dates.push(date);
  }
  return { metricsByDate, dates };
}
