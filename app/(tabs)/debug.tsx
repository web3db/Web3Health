// app/(tabs)/debug.tsx
import { useProfileStore } from "@/src/store/useProfileStore";
import { useThemeColors } from "@/src/theme/useThemeColors";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Controller (connect + sync)
import {
    syncHealthConnect,
    toggleHealthConnectIntegration
} from "@/src/services/integrations/google/controller";

// Low-level reads (used for raw panes + permission probing)
import {
    ensureAvailable,
    readActiveEnergyByDay,
    readExerciseMinutesByDay,
    readExerciseSessions,
    readHeartRateSamples,
    readSleepSessions,
    readStepsByDay,
    readWeightSamples,
    requestPermissions,
} from "@/src/services/integrations/google/healthconnect";

type StepRow = { date: string; value: number };
type HrRow = { ts: string; bpm: number };
type SleepStageRow = { start: string; end: string; stage?: string };
type SleepRow = { start: string; end: string; stages?: SleepStageRow[] };
type WorkoutRow = { start: string; end: string; activityType: string; calories: number; distanceKm?: number };

const WINDOWS = [7, 30, 90] as const;
const PAGE_SIZE = 20;
const MAX_RAW = 50;

type PermResult = "unknown" | "granted" | "denied";

type MetricKey =
  | "steps"
  | "sleep"
  | "hr"
  | "activeEnergy"
  | "exerciseMinutes"
  | "workouts"
  | "weight";

export default function HealthConnectScreen() {
  const c = useThemeColors();
  const isAndroid = Platform.OS === "android";

type ProviderConn = { enabled?: boolean; status?: "idle" | "connecting" | "connected" | "error"; lastSync?: string };
const hc = useProfileStore((s: any) => s?.connections?.healthConnect) as ProviderConn | undefined;

const status: "idle" | "connecting" | "connected" | "error" = hc?.status ?? "idle";
const enabled: boolean = !!hc?.enabled;
const lastSyncISO: string | undefined = hc?.lastSync;


  // UI state
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(7);
  const [loading, setLoading] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);

  // Permission state per metric
  const [perms, setPerms] = useState<Record<MetricKey, PermResult>>({
    steps: "unknown",
    sleep: "unknown",
    hr: "unknown",
    activeEnergy: "unknown",
    exerciseMinutes: "unknown",
    workouts: "unknown",
    weight: "unknown",
  });

  // Raw data (we only expand Steps & Sleep by default if data exists; others collapsed)
  const [rawSteps, setRawSteps] = useState<StepRow[]>([]);
  const [rawSleep, setRawSleep] = useState<SleepRow[]>([]);
  const [rawHr, setRawHr] = useState<HrRow[]>([]);
  const [rawEnergy, setRawEnergy] = useState<{ date: string; kcal: number }[]>([]);
  const [rawExerciseMin, setRawExerciseMin] = useState<{ date: string; minutes: number }[]>([]);
  const [rawWorkouts, setRawWorkouts] = useState<WorkoutRow[]>([]);
  const [rawWeight, setRawWeight] = useState<{ ts: string; kg: number }[]>([]);

  // Collapsible state
  // Default: Steps & Sleep auto-expand if they have data; others start collapsed in v1
  const [open, setOpen] = useState<Record<MetricKey, boolean>>({
    steps: false,
    sleep: false,
    hr: false,
    activeEnergy: false,
    exerciseMinutes: false,
    workouts: false,
    weight: false,
  });

  // Pagination cursors
  const [page, setPage] = useState<Record<MetricKey, number>>({
    steps: 1,
    sleep: 1,
    hr: 1,
    activeEnergy: 1,
    exerciseMinutes: 1,
    workouts: 1,
    weight: 1,
  });

  const lastSyncDisplay = useMemo(() => {
    const iso = lastSyncISO;
    return iso ? new Date(iso).toLocaleString() : "—";
  }, [lastSyncISO]);

  // Helpers
  const timeRange = useMemo(() => {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    return { startISO: start.toISOString(), endISO: end.toISOString() };
  }, [days]);

  function chipStyle(active: boolean) {
    return {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: active ? c.primary : c.muted,
    } as const;
  }

  const setPerm = (k: MetricKey, val: PermResult) =>
    setPerms((p) => ({ ...p, [k]: val }));

  const setOpenAuto = useCallback((k: MetricKey, hasData: boolean) => {
    setOpen((o) => ({ ...o, [k]: hasData && (k === "steps" || k === "sleep") ? true : o[k] }));
  }, []);

  // Permission probe by attempting a tiny read per metric (safe & cheap)
  const probePermissions = useCallback(async () => {
    const now = new Date();
    const aMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();
    const nowISO = now.toISOString();

    // For day-bucketed reads, a tiny window might be empty but still "permitted".
    // We treat "no throw" as "granted".
    const probes: Array<[MetricKey, () => Promise<any>]> = [
      ["steps", () => readStepsByDay(aMinuteAgo, nowISO)],
      ["sleep", () => readSleepSessions(aMinuteAgo, nowISO)],
      ["hr", () => readHeartRateSamples(aMinuteAgo, nowISO)],
      ["activeEnergy", () => readActiveEnergyByDay(aMinuteAgo, nowISO)],
      ["exerciseMinutes", () => readExerciseMinutesByDay(aMinuteAgo, nowISO)],
      ["workouts", () => readExerciseSessions(aMinuteAgo, nowISO)],
      ["weight", () => readWeightSamples(aMinuteAgo, nowISO)],
    ];

    await Promise.all(
      probes.map(async ([key, fn]) => {
        try {
          await fn();
          setPerm(key, "granted");
        } catch {
          setPerm(key, "denied");
        }
      })
    );
  }, []);

  // Load raw data for panes (limited + paginated)
  const fetchRaw = useCallback(async () => {
    setScreenError(null);
    setLoading(true);
    try {
      const { startISO, endISO } = timeRange;

      const [
        steps,
        sleep,
        hr,
        energy,
        exMin,
        workouts,
        weight,
      ] = await Promise.all([
        readStepsByDay(startISO, endISO).catch(() => [] as StepRow[]),
        readSleepSessions(startISO, endISO).catch(() => [] as SleepRow[]),
        readHeartRateSamples(startISO, endISO).catch(() => [] as HrRow[]),
        readActiveEnergyByDay(startISO, endISO).catch(() => [] as { date: string; kcal: number }[]),
        readExerciseMinutesByDay(startISO, endISO).catch(() => [] as { date: string; minutes: number }[]),
        readExerciseSessions(startISO, endISO).catch(() => [] as WorkoutRow[]),
        readWeightSamples(startISO, endISO).catch(() => [] as { ts: string; kg: number }[]),
      ]);

      setRawSteps(steps.slice(0, MAX_RAW));
      setRawSleep(sleep.slice(0, MAX_RAW));
      setRawHr(hr.slice(0, MAX_RAW));
      setRawEnergy(energy.slice(0, MAX_RAW));
      setRawExerciseMin(exMin.slice(0, MAX_RAW));
      setRawWorkouts(workouts.slice(0, MAX_RAW));
      setRawWeight(weight.slice(0, MAX_RAW));

      // Auto-expand Steps & Sleep if they have data
      setOpenAuto("steps", steps.length > 0);
      setOpenAuto("sleep", sleep.length > 0);

      // Reset pagination
      setPage({
        steps: 1,
        sleep: 1,
        hr: 1,
        activeEnergy: 1,
        exerciseMinutes: 1,
        workouts: 1,
        weight: 1,
      });
    } catch (e: any) {
      setScreenError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [timeRange, setOpenAuto]);

  // Initial availability + perm probe on mount (Android only)
  useEffect(() => {
    if (!isAndroid) return;
    (async () => {
      try {
        await ensureAvailable();
      } catch (e) {
        // If unavailable, the connection card will still allow user to try enable (which will throw nicely)
      }
      probePermissions();
      fetchRaw();
    })();
  }, [isAndroid, probePermissions, fetchRaw]);

  const onToggle = useCallback(async () => {
    try {
      setScreenError(null);
      await toggleHealthConnectIntegration(!enabled, { days });
      // After toggling on, refresh both permissions + raw data
      probePermissions();
      fetchRaw();
    } catch (e: any) {
      setScreenError(e?.message ?? String(e));
    }
  }, [enabled, days, probePermissions, fetchRaw]);

  const onSyncNow = useCallback(async () => {
    try {
      setScreenError(null);
      setLoading(true);
      await syncHealthConnect(days);
      await fetchRaw();
    } catch (e: any) {
      setScreenError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [days, fetchRaw]);

  const requestPerms = useCallback(async () => {
    try {
      setScreenError(null);
      await requestPermissions(); // system sheet
      probePermissions();
    } catch (e: any) {
      setScreenError(e?.message ?? String(e));
    }
  }, [probePermissions]);

  // Window chip
  const WindowChip = ({ w }: { w: (typeof WINDOWS)[number] }) => (
    <Pressable
      onPress={() => setDays(w)}
      style={[chipStyle(days === w), { marginRight: 8 }]}
    >
      <Text style={{ color: c.text.primary, fontWeight: "700" }}>{w}d</Text>
    </Pressable>
  );

  // Section header
  function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
    return (
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Text style={{ color: c.text.primary, fontWeight: "800", fontSize: 16 }}>{title}</Text>
        {right}
      </View>
    );
  }

  // Collapsible Card
  function CollapsibleCard({
    metric,
    title,
    count,
    children,
    defaultCollapsed,
  }: {
    metric: MetricKey;
    title: string;
    count: number;
    children: React.ReactNode;
    defaultCollapsed?: boolean;
  }) {
    const isOpen = open[metric];
    return (
      <View style={{ marginTop: 12, backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 16 }}>
        <Pressable
          onPress={() => setOpen((o) => ({ ...o, [metric]: !o[metric] }))}
          style={{ paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
        >
          <Text style={{ color: c.text.primary, fontWeight: "700" }}>{title}</Text>
          <Text style={{ color: c.text.secondary, fontSize: 12 }}>{count} {isOpen ? "▲" : "▼"}</Text>
        </Pressable>
        {isOpen ? <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>{children}</View> : null}
      </View>
    );
  }

  // Row renderer helpers with pagination
  function PagedList<T>({ data, metric, render }: { data: T[]; metric: MetricKey; render: (row: T, idx: number) => React.ReactNode }) {
    const p = page[metric];
    const slice = data.slice(0, Math.min(MAX_RAW, p * PAGE_SIZE));
    const canLoadMore = slice.length < Math.min(MAX_RAW, data.length);
    return (
      <View>
        {slice.map((row, i) => (
          <View key={i} style={{ paddingVertical: 6, borderBottomWidth: i === slice.length - 1 ? 0 : 1, borderBottomColor: c.border }}>
            {render(row, i)}
          </View>
        ))}
        {canLoadMore ? (
          <Pressable
            onPress={() => setPage((pg) => ({ ...pg, [metric]: pg[metric] + 1 }))}
            style={{ marginTop: 8, alignSelf: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: c.border, backgroundColor: c.muted }}
          >
            <Text style={{ color: c.text.primary }}>Load more</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (!isAndroid) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ color: c.text.primary, fontSize: 20, fontWeight: "700" }}>Health Connect</Text>
          <Text style={{ marginTop: 8, textAlign: "center", color: c.text.secondary }}>
            This screen is Android-only and uses Health Connect.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRaw} tintColor={c.primary as any} />}
      >
        {/* Connection card */}
        <View style={{ marginBottom: 12, padding: 16, borderRadius: 16, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }}>
          <SectionHeader
            title="Health Connect"
            right={
              <View style={{ flexDirection: "row", gap: 6 }}>
                {/* Status chip */}
                <View style={{
                  paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: c.border,
                  backgroundColor:
                    status === "connected" ? c.success :
                    status === "connecting" ? c.warning :
                    status === "error" ? c.danger : c.muted,
                }}>
                  <Text style={{ color: c.text.primary, fontWeight: "700", fontSize: 12 }}>
                    {enabled ? status : "disabled"}
                  </Text>
                </View>
              </View>
            }
          />

          <Text style={{ color: c.text.secondary, marginTop: 4 }}>
            Last synced: <Text style={{ color: c.text.primary }}>{lastSyncDisplay}</Text>
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            <Pressable onPress={onToggle} style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: c.border, backgroundColor: c.muted }}>
              <Text style={{ color: c.text.primary, fontWeight: "700" }}>{enabled ? "Disable" : "Enable"}</Text>
            </Pressable>
            <Pressable onPress={requestPerms} style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: c.border, backgroundColor: c.muted }}>
              <Text style={{ color: c.text.primary, fontWeight: "700" }}>Request permissions</Text>
            </Pressable>
            <Pressable onPress={onSyncNow} style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: c.border, backgroundColor: c.muted }}>
              <Text style={{ color: c.text.primary, fontWeight: "700" }}>Sync now</Text>
            </Pressable>
          </View>

          {/* Window selector */}
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
            <Text style={{ color: c.text.secondary, marginRight: 8 }}>Window:</Text>
            {WINDOWS.map((w) => <WindowChip key={w} w={w} />)}
          </View>

          {screenError ? (
            <Text style={{ marginTop: 8, color: c.text.secondary, fontSize: 12 }}>
              Issue: {screenError}
            </Text>
          ) : null}
        </View>

        {/* Permissions overview */}
        <View style={{ padding: 16, borderRadius: 16, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }}>
          <SectionHeader title="Permissions" />
          {(
            [
              ["Steps", "steps"],
              ["Sleep", "sleep"],
              ["Heart Rate", "hr"],
              ["Active Energy", "activeEnergy"],
              ["Exercise Minutes", "exerciseMinutes"],
              ["Workouts", "workouts"],
              ["Weight", "weight"],
            ] as Array<[string, MetricKey]>
          ).map(([label, key]) => (
            <View key={key} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border }}>
              <Text style={{ color: c.text.primary }}>{label}</Text>
              <Text
                style={{
                  color:
                    perms[key] === "granted" ? c.success :
                    perms[key] === "denied" ? c.danger :
                    c.text.secondary,
                  fontWeight: "700",
                }}
              >
                {perms[key]}
              </Text>
            </View>
          ))}
          <Text style={{ color: c.text.secondary, fontSize: 12, marginTop: 8 }}>
            Tip: if any show <Text style={{ color: c.danger, fontWeight: "700" }}>denied</Text>, tap <Text style={{ color: c.text.primary, fontWeight: "700" }}>Request permissions</Text>.
          </Text>
        </View>

        {/* Data sections — Steps & Sleep expanded if they have data; others default collapsed */}
        <CollapsibleCard metric="steps" title="Steps (raw)" count={rawSteps.length}>
          <PagedList
            metric="steps"
            data={rawSteps}
            render={(r: StepRow) => (
              <Text style={{ color: c.text.primary }}>
                {r.date}: <Text style={{ fontWeight: "700" }}>{r.value.toLocaleString()}</Text>
              </Text>
            )}
          />
        </CollapsibleCard>

        <CollapsibleCard metric="sleep" title="Sleep sessions (raw)" count={rawSleep.length}>
          <PagedList
            metric="sleep"
            data={rawSleep}
            render={(r: SleepRow) => (
              <View>
                <Text style={{ color: c.text.primary, fontWeight: "700" }}>
                  {new Date(r.start).toLocaleString()} → {new Date(r.end).toLocaleString()}
                </Text>
                {!!r.stages?.length && (
                  <Text style={{ color: c.text.secondary, marginTop: 2 }}>
                    Stages: {r.stages.map(s => s.stage ?? "core").join(", ")}
                  </Text>
                )}
              </View>
            )}
          />
        </CollapsibleCard>

        {/* Collapsed-by-default v1 sections */}
        <CollapsibleCard metric="hr" title="Heart rate (raw)" count={rawHr.length}>
          <PagedList
            metric="hr"
            data={rawHr}
            render={(r: HrRow) => (
              <Text style={{ color: c.text.primary }}>{new Date(r.ts).toLocaleString()} · {Math.round(r.bpm)} bpm</Text>
            )}
          />
        </CollapsibleCard>

        <CollapsibleCard metric="activeEnergy" title="Active energy (raw)" count={rawEnergy.length}>
          <PagedList
            metric="activeEnergy"
            data={rawEnergy}
            render={(r) => (
              <Text style={{ color: c.text.primary }}>{r.date} · {Math.round(r.kcal)} kcal</Text>
            )}
          />
        </CollapsibleCard>

        <CollapsibleCard metric="exerciseMinutes" title="Exercise minutes (raw)" count={rawExerciseMin.length}>
          <PagedList
            metric="exerciseMinutes"
            data={rawExerciseMin}
            render={(r) => (
              <Text style={{ color: c.text.primary }}>{r.date} · {r.minutes} min</Text>
            )}
          />
        </CollapsibleCard>

        <CollapsibleCard metric="workouts" title="Workouts (raw)" count={rawWorkouts.length}>
          <PagedList
            metric="workouts"
            data={rawWorkouts}
            render={(w: WorkoutRow) => (
              <Text style={{ color: c.text.primary }}>
                {w.activityType} · {new Date(w.start).toLocaleString()} → {new Date(w.end).toLocaleString()} · {Math.round(w.calories)} kcal{typeof w.distanceKm === "number" ? ` · ${w.distanceKm.toFixed(2)} km` : ""}
              </Text>
            )}
          />
        </CollapsibleCard>

        <CollapsibleCard metric="weight" title="Weight (raw)" count={rawWeight.length}>
          <PagedList
            metric="weight"
            data={rawWeight}
            render={(r) => (
              <Text style={{ color: c.text.primary }}>{new Date(r.ts).toLocaleString()} · {Number(r.kg).toFixed(1)} kg</Text>
            )}
          />
        </CollapsibleCard>
      </ScrollView>

      {loading ? (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 12, alignItems: "center" }}>
          <ActivityIndicator />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
