import { create } from 'zustand';
import type { DailyMetrics } from '../data/types';

type State = {
  metricsByDate: Record<string, DailyMetrics>;
  dates: string[];
  daily: DailyMetrics[];
};

type Actions = {
  seedIfEmpty: (days?: number) => void;
  reset: () => void;
  lastNDays: (n: number) => DailyMetrics[];
  today: () => DailyMetrics | undefined;

  setDaily: (rows: DailyMetrics[]) => void;
  mergeDaily: (rows: DailyMetrics[]) => void;
  clearDaily: () => void;
};

function toIndex(rows: DailyMetrics[]) {
  // ensure unique by date and sorted ascending
  const map = new Map<string, DailyMetrics>();
  for (const r of rows) map.set(r.date, r);
  const dates = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
  const metricsByDate: Record<string, DailyMetrics> = {};
  for (const d of dates) metricsByDate[d] = map.get(d)!;
  const daily = dates.map((d) => metricsByDate[d]);
  return { metricsByDate, dates, daily };
}

export const useHealthStore = create<State & Actions>((set, get) => ({
  metricsByDate: {},
  dates: [],
  daily: [],
  seedIfEmpty: (days = 30) => {
    if (get().dates.length) return;
    const { generateSeries } = require('../data/seed');
    const { metricsByDate, dates } = generateSeries(days);
    set({ metricsByDate, dates });
  },
  reset: () => set({ metricsByDate: {}, dates: [] }),
  lastNDays: (n) => {
    const { dates, metricsByDate } = get();
    return dates.slice(-n).map(d => metricsByDate[d]);
  },
  today: () => {
    const { dates, metricsByDate } = get();
    const d = dates[dates.length - 1];
    return d ? metricsByDate[d] : undefined;
  },
  setDaily: (rows) => {
    const indexed = toIndex(rows);
    set(indexed);
  },

  mergeDaily: (rows) => {
    const { daily } = get();
    const indexed = toIndex([...daily, ...rows]);
    set(indexed);
  },

  clearDaily: () => set({ daily: [], metricsByDate: {}, dates: [] }),
}));
