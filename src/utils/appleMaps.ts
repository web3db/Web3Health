import type { WorkoutType } from "@/src/data/types";

/** Map HealthKit workout identifiers to your 4-type enum */
export function mapHKWorkoutType(t: string): WorkoutType | null {
  const x = (t || "").toLowerCase();
  if (x.includes("run")) return "Run";
  if (x.includes("walk") || x.includes("hike")) return "Walk";
  if (x.includes("cycle") || x.includes("bike")) return "Cycle";
  if (x.includes("strength") || x.includes("functional") || x.includes("traditionalstrengthtraining"))
    return "Strength";
  return null;
}

/** Map HealthKit sleep values to your stage buckets */
export function mapSleepStage(hkValue?: string): "light" | "deep" | "rem" | "awake" {
  switch (hkValue) {
    case "ASLEEPCORE":
      return "light";
    case "ASLEEPDEEP":
      return "deep";
    case "ASLEEPREM":
      return "rem";
    case "INBED":
      return "awake";
    default:
      return "light";
  }
}
