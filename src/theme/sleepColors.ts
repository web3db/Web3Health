export type SleepStage = "awake" | "light" | "deep" | "rem";

export const sleepStagePalette: Record<SleepStage, string> = {
  deep:  "#6FA8FF", // deep blue
  rem:   "#A58BFF", // violet
  light: "#7ED8A0", // soft green
  awake: "#F0C36F", // amber
};

export const sleepStageLabel: Record<SleepStage, string> = {
  deep:  "Deep",
  rem:   "REM",
  light: "Light",
  awake: "Awake",
};

// Optional helper if you ever want transparent fills
export function rgba(hex: string, a = 1) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}