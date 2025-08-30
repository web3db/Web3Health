import { create } from "zustand";

export type ConnectionStatus = "idle" | "connecting" | "connected" | "error";
export interface ProviderConnection {
  enabled: boolean;
  status: ConnectionStatus;
  lastSync?: string;   // ISO datetime
  errorMsg?: string;   // one-line error cause (optional)
}

type Connections = {
  appleHealth: ProviderConnection;
  healthConnect: ProviderConnection;
  fitbit: ProviderConnection;
  garmin: ProviderConnection;
};
type ConnStatus = "idle" | "connecting" | "connected" | "error";


type ConnectionInfo = {
  enabled: boolean;
  status: ConnStatus;
  lastSync: string | null;
  error?: string | null;
};

export type UnitSystem = "metric" | "imperial";
export type Goal =
  | "lose_weight"
  | "gain_muscle"
  | "improve_sleep"
  | "stay_active";

export interface EmergencyContact {
  name: string;
  phone: string;
}


export interface ProfileState {
  name: string;
  email?: string;
  dob?: string; // ISO
  gender?: "male" | "female" | "other";
  heightCm?: number; // canonical metric
  startWeightKg?: number;
  weightKg?: number;
  goalWeightKg?: number;
  unit: UnitSystem;
  goals: Goal[];
  customGoals: string[];
  notificationsEnabled: boolean;
  themePref: "system" | "light" | "dark";
  medical: {
    restingHrBaseline?: number;
    allergiesNote?: string;
  };
  emergency?: EmergencyContact;

  // Lifetime stats (not today's widgets)
  trackingSinceISO?: string;
  longestStreakDays?: number;

  // Device connections (placeholders)
  // connections: {
  //   appleHealth: boolean;
  //   googleFit: boolean;
  //   fitbit: boolean;
  //   garmin: boolean;
  // };
  connections: Connections;
  // Minimal weight log for mini history list
  weightLog: Array<{ date: string; kg: number }>;

  // Actions
  update: (p: Partial<ProfileState>) => void;
  toggleUnit: () => void;
  addWeightEntry: (kg: number, dateISO?: string) => void;
  clearLocalData: () => void;
  addCustomGoal: (text: string) => "ok" | "exists" | "limit" | "invalid";
  removeCustomGoal: (text: string) => void;
  updateWeightEntry: (dateISO: string, kg: number) => void;
  deleteWeightEntry: (dateISO: string) => void;
  setConnectionEnabled: (k: keyof Connections, enabled: boolean) => void;
  setConnectionStatus: (k: keyof Connections, status: ConnectionStatus, errorMsg?: string) => void;
  setConnectionLastSync: (k: keyof Connections, iso: string) => void;
}

const today = new Date().toISOString().slice(0, 10);
type GoalAddStatus = "ok" | "exists" | "limit" | "invalid";
const defaultProvider = (enabled = false): ProviderConnection => ({
  enabled,
  status: enabled ? "connected" : "idle",
  lastSync: undefined,
  errorMsg: undefined,
});


export const useProfileStore = create<ProfileState>((set, get) => ({
  name: "Ethan Hunt",
  email: "ethan.hunt@mi6.com",
  dob: "1962-07-03",
  gender: "male",
  heightCm: 173,
  startWeightKg: 78.0,
  weightKg: 72.4,
  goalWeightKg: 70.0,
  unit: "metric",
  goals: ["lose_weight", "stay_active"],
  customGoals: ["drink 3L water"],
  notificationsEnabled: true,
  themePref: "system",
  medical: { restingHrBaseline: 61, allergiesNote: "" },
  emergency: { name: "Ben", phone: "+1 555-0100" },
  trackingSinceISO: "2025-01-05",
  longestStreakDays: 14,
connections: {
    appleHealth: defaultProvider(false),   
    healthConnect:   defaultProvider(false),  
    fitbit:      defaultProvider(false),  
    garmin:      defaultProvider(false),  
  },
  weightLog: [
    { date: today, kg: 72.4 },
    { date: "2025-08-15", kg: 72.6 },
    { date: "2025-08-12", kg: 72.9 },
  ],

  update: (p) => set((s) => ({ ...s, ...p })),
  toggleUnit: () =>
    set((s) => ({ unit: s.unit === "metric" ? "imperial" : "metric" })),
  addWeightEntry: (kg, dateISO) =>
    set((s) => ({
      weightKg: kg,
      weightLog: [
        { date: dateISO ?? new Date().toISOString().slice(0, 10), kg },
        ...s.weightLog,
      ],
    })),
  updateWeightEntry: (dateISO, kg) =>
    set((s) => ({
      weightLog: s.weightLog.map((w) =>
        w.date === dateISO ? { ...w, kg } : w
      ),
      // if the edited entry is today, reflect in current weight
      weightKg:
        dateISO === new Date().toISOString().slice(0, 10) ? kg : s.weightKg,
    })),
  deleteWeightEntry: (dateISO) =>
    set((s) => ({
      weightLog: s.weightLog.filter((w) => w.date !== dateISO),
    })),
  clearLocalData: () =>
    set(() => ({
      // keep minimal defaults
      goals: [],
      notificationsEnabled: false,
      weightLog: [],
    })),
  addCustomGoal: (text: string): GoalAddStatus => {
    const normalized = text.trim().replace(/\s+/g, " ");
    if (normalized.length < 2 || normalized.length > 40) return "invalid";

    const s = get();
    const lower = normalized.toLowerCase();

    const existsBuiltIn = s.goals.some(
      (g) => g.replace(/_/g, " ").toLowerCase() === lower
    );
    const existsCustom = s.customGoals.some((g) => g.toLowerCase() === lower);

    if (existsBuiltIn || existsCustom) return "exists";
    if (s.customGoals.length >= 5) return "limit";

    set({ customGoals: [normalized, ...s.customGoals] });
    return "ok";
  },

  removeCustomGoal: (text: string) => {
    const s = get();
    set({ customGoals: s.customGoals.filter((g) => g !== text) });
  },
  setConnectionEnabled: (k, enabled) =>
    set((state) => ({
      connections: {
        ...state.connections,
        [k]: { ...state.connections[k], enabled },
      },
    })),

  setConnectionStatus: (k, status, errorMsg) =>
    set((state) => ({
      connections: {
        ...state.connections,
        [k]: { ...state.connections[k], status, errorMsg },
      },
    })),

  setConnectionLastSync: (k, iso) =>
    set((state) => ({
      connections: {
        ...state.connections,
        [k]: { ...state.connections[k], lastSync: iso },
      },
    })),
}));
