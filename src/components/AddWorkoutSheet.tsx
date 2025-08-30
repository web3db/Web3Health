import { useWorkoutStore, type Workout } from "@/src/store/useWorkoutStore";
import { useThemeColors } from "@/src/theme/useThemeColors";
import { workoutPalette, type WorkoutType } from "@/src/theme/workoutColors";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// --- FIX: All helper components are moved outside of the main component ---
// This is the most critical change. They are now stable and won't be recreated on every render.

function Field({ label, children, style, colors }: { label: string; children: React.ReactNode; style?: any, colors: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={[{ marginBottom: 4 }, style]}>
      <Text style={{ color: colors.text.secondary, marginBottom: 4 }}>{label}</Text>
      {children}
    </View>
  );
}

function TypeChip({ label, color, active, onPress, colors }: { label: string; color: string; active?: boolean; onPress: () => void; colors: ReturnType<typeof useThemeColors> }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: active ? color : "transparent",
      }}
    >
      <Text style={{ color: active ? colors.text.primary : colors.text.secondary, fontSize: 12 }}>{label}</Text>
    </TouchableOpacity>
  );
}

function Quick({ children, onPress, colors }: { children: React.ReactNode; onPress: () => void; colors: ReturnType<typeof useThemeColors> }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.muted,
        marginRight: 8,
      }}
    >
      <Text style={{ color: colors.text.primary, fontSize: 12 }}>{children}</Text>
    </TouchableOpacity>
  );
}

// --- End of Helper Components ---


type Props = {
  visible: boolean;
  onClose: () => void;
  workoutToEdit?: Workout | null;
  initialType?: WorkoutType;
};

const TYPES: WorkoutType[] = ["run", "walk", "cycle", "strength", "yoga", "hiit", "swim"];

function computeSheetSize() {
  const { width: W, height: H } = Dimensions.get("window");
  const isTablet = W >= 768;
  const width = Math.min(W - 24, isTablet ? 640 : W);
  const maxHeight = Math.min(720, Math.round(H * 0.90));
  return { width, maxHeight };
}

export default React.memo(function AddWorkoutSheet({ visible, onClose, workoutToEdit, initialType }: Props) {
  const c = useThemeColors();
  const addWorkout = useWorkoutStore((s) => s.addWorkout);
  const updateWorkout = useWorkoutStore((s) => s.updateWorkout);

  const sizeRef = useRef(computeSheetSize());
  useEffect(() => {
    if (visible) sizeRef.current = computeSheetSize();
  }, [visible]);

  const [type, setType] = useState<WorkoutType>("run");
  const [dateStr, setDateStr] = useState<string>("");
  const [timeStr, setTimeStr] = useState<string>("");
  const [duration, setDuration] = useState<string>("30");
  const [calories, setCalories] = useState<string>("240");
  const [distance, setDistance] = useState<string>("");
  const [avgHr, setAvgHr] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (!visible) return;
    const now = new Date();
    const pad2 = (n: number) => String(n).padStart(2, "0");

    if (workoutToEdit) {
      const d = new Date(workoutToEdit.startISO);
      setType(workoutToEdit.type);
      setDateStr(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`);
      setTimeStr(`${pad2(d.getHours())}:${pad2(d.getMinutes())}`);
      setDuration(String(workoutToEdit.durationMin ?? 30));
      setCalories(String(workoutToEdit.calories ?? 0));
      setDistance(workoutToEdit.distanceKm != null ? String(workoutToEdit.distanceKm) : "");
      setAvgHr(workoutToEdit.avgHr != null ? String(workoutToEdit.avgHr) : "");
      setNotes(workoutToEdit.notes ?? "");
    } else {
      setType(initialType ?? "run");
      setDateStr(`${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`);
      setTimeStr(`${pad2(now.getHours())}:${pad2(now.getMinutes())}`);
      setDuration("30");
      setCalories("240");
      setDistance("");
      setAvgHr("");
      setNotes("");
    }
  }, [visible, workoutToEdit?.id, initialType]);

  const applyPreset = (p: { type: WorkoutType; minutes: number; kcal?: number; distanceKm?: number }) => {
    setType(p.type);
    setDuration(String(p.minutes));
    if (p.kcal != null) setCalories(String(p.kcal));
    if (p.distanceKm != null) setDistance(String(p.distanceKm));
  };

  const canSave = useMemo(() => {
    const dur = Number(duration);
    const kc = Number(calories);
    return TYPES.includes(type) && Number.isFinite(dur) && dur > 0 && Number.isFinite(kc) && kc >= 0;
  }, [type, duration, calories]);

  const onSave = () => {
    if (!canSave) return;
    const toISO = (dateS: string, timeS: string) => {
      try {
        const [y, m, d] = dateS.split("-").map(Number);
        const [hh, mm] = timeS.split(":").map(Number);
        return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0).toISOString();
      } catch {
        return new Date().toISOString();
      }
    };
    const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

    const patch: Omit<Workout, "id"> = {
      type,
      startISO: toISO(dateStr, timeStr),
      durationMin: clamp(Math.round(Number(duration)), 1, 24 * 60),
      calories: clamp(Math.round(Number(calories)), 0, 100000),
      distanceKm: Number.isFinite(Number(distance)) && Number(distance) > 0 ? Number(distance) : undefined,
      avgHr: Number.isFinite(Number(avgHr)) && Number(avgHr) > 0 ? Number(avgHr) : undefined,
      notes: notes.trim() || undefined,
    };

    if (workoutToEdit) updateWorkout(workoutToEdit.id, patch);
    else addWorkout(patch);

    onClose();
  };

  const inputStyle = useMemo(() => ({
    borderWidth: 1,
    borderColor: c.border,
    color: c.text.primary,
    borderRadius: 8,
    padding: 10,
  }), [c.border, c.text.primary]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "#0006" }} pointerEvents="box-none">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View
            style={{
              alignSelf: "center",
              width: sizeRef.current.width,
              maxHeight: sizeRef.current.maxHeight,
              backgroundColor: c.surface,
              borderColor: c.border,
              borderWidth: 1,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 16,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ color: c.text.primary, fontWeight: "700", fontSize: 16 }}>
                {workoutToEdit ? "Edit workout" : "Add workout"}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ color: c.text.secondary }}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="always"
              contentContainerStyle={{ rowGap: 10 }}
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                <Quick colors={c} onPress={() => applyPreset({ type: "run", minutes: 30, kcal: 260, distanceKm: 5 })}>Run 30m</Quick>
                <Quick colors={c} onPress={() => applyPreset({ type: "walk", minutes: 20, kcal: 90, distanceKm: 1.7 })}>Walk 20m</Quick>
                <Quick colors={c} onPress={() => applyPreset({ type: "cycle", minutes: 45, kcal: 420, distanceKm: 18 })}>Cycle 45m</Quick>
                <Quick colors={c} onPress={() => applyPreset({ type: "strength", minutes: 40, kcal: 220 })}>Strength 40m</Quick>
                <Quick colors={c} onPress={() => applyPreset({ type: "yoga", minutes: 30, kcal: 120 })}>Yoga 30m</Quick>
                <Quick colors={c} onPress={() => applyPreset({ type: "hiit", minutes: 20, kcal: 240 })}>HIIT 20m</Quick>
              </ScrollView>

              <Text style={{ color: c.text.secondary, marginBottom: 4 }}>Type</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {TYPES.map((t) => (
                  <TypeChip key={t} label={t} color={workoutPalette[t]} active={type === t} onPress={() => setType(t)} colors={c} />
                ))}
              </View>

              <View style={{ flexDirection: "row", gap: 8 }}>
                <Field label="Date (YYYY-MM-DD)" style={{ flex: 1 }} colors={c}>
                  <TextInput value={dateStr} onChangeText={setDateStr} style={inputStyle} />
                </Field>
                <Field label="Time (HH:MM)" style={{ flex: 1 }} colors={c}>
                  <TextInput value={timeStr} onChangeText={setTimeStr} style={inputStyle} />
                </Field>
              </View>

              <View style={{ flexDirection: "row", gap: 8 }}>
                <Field label="Duration (min)" style={{ flex: 1 }} colors={c}>
                  <TextInput value={duration} onChangeText={setDuration} keyboardType="numeric" style={inputStyle} />
                </Field>
                <Field label="Calories (kcal)" style={{ flex: 1 }} colors={c}>
                  <TextInput value={calories} onChangeText={setCalories} keyboardType="numeric" style={inputStyle} />
                </Field>
              </View>

              <View style={{ flexDirection: "row", gap: 8 }}>
                <Field label="Distance (km)" style={{ flex: 1 }} colors={c}>
                  <TextInput value={distance} onChangeText={setDistance} keyboardType="numeric" style={inputStyle} />
                </Field>
                <Field label="Avg HR (bpm)" style={{ flex: 1 }} colors={c}>
                  <TextInput value={avgHr} onChangeText={setAvgHr} keyboardType="numeric" style={inputStyle} />
                </Field>
              </View>

              <Field label="Notes" colors={c}>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  style={[inputStyle, { minHeight: 80, textAlignVertical: "top" }]}
                />
              </Field>

              <TouchableOpacity
                disabled={!canSave}
                onPress={onSave}
                style={{
                  marginTop: 6,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: canSave ? (workoutPalette[type] ?? c.muted) : c.muted,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: c.text.primary, fontWeight: "700" }}>
                  {workoutToEdit ? "Save changes" : "Add workout"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
});