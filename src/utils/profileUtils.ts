import type { UnitSystem } from "@/src/store/useProfileStore";

export const kgToLb = (kg?: number) => kg == null ? undefined : kg * 2.20462;
export const cmToFeetInches = (cm?: number) => {
  if (!cm && cm !== 0) return { ft: undefined, inches: undefined };
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inches = Math.round(totalIn - ft * 12);
  return { ft, inches };
};

export const weightLabel = (kg?: number, unit: UnitSystem = "metric") => {
  if (kg == null) return "—";
  return unit === "metric" ? `${kg.toFixed(1)} kg` : `${kgToLb(kg)!.toFixed(1)} lb`;
};
export const heightLabel = (cm?: number, unit: UnitSystem = "metric") => {
  if (!cm && cm !== 0) return "—";
  if (unit === "metric") return `${cm} cm`;
  const { ft, inches } = cmToFeetInches(cm);
  return `${ft}' ${inches}"`;
};
export const ageFromDob = (dob?: string) => {
  if (!dob) return "—";
  const d = new Date(dob); const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000*60*60*24*365.25));
};
export const bmi = (kg?: number, cm?: number) => {
  if (!kg || !cm) return undefined;
  const m = cm / 100;
  return kg / (m * m);
};
export const prettyDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  try { return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
  catch { return iso; }
};
