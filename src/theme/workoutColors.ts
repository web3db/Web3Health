export const workoutPalette = {
  run: "#6FA8FF",
  walk: "#7ED8A0",
  cycle: "#45C7C7",
  strength: "#A58BFF",
  yoga: "#F0C36F",
  hiit: "#FF7A7A",
  swim: "#5670FF",
} as const;

export type WorkoutType = keyof typeof workoutPalette;

export function rgba(hex: string, a = 1) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
