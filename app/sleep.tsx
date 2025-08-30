import Hypnogram from "@/src/components/Hypnogram";
import StageDistribution from "@/src/components/StageDistribution";
import { useHealthStore } from "@/src/store/useHealthStore";
import { rgba, sleepStagePalette } from "@/src/theme/sleepColors";
import { useThemeColors } from "@/src/theme/useThemeColors";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
type RangeKey = "7d" | "30d";
type Stage = "awake" | "light" | "deep" | "rem";

export default function SleepScreen() {
  const c = useThemeColors();
  const [range, setRange] = useState<RangeKey>("7d");

  const data = useSleepData(range);
  const last = data.lastNight;
  const [barFocus, setBarFocus] = useState<number | null>(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32, rowGap: 16 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <Text
            style={{ color: c.text.primary, fontSize: 22, fontWeight: "800" }}
          >
            Sleep
          </Text>
          <Text style={{ color: c.text.secondary }}>
            {range.toUpperCase()} overview
          </Text>
        </View>

        {/* Last night summary */}
        <View
          style={{
            backgroundColor: c.surface,
            borderColor: c.border,
            borderWidth: 1,
            borderRadius: 16,
            padding: 12,
            rowGap: 8,
          }}
        >
          <Text style={{ color: c.text.primary, fontWeight: "700" }}>
            Last night
          </Text>
          <Text
            style={{ color: c.text.primary, fontSize: 28, fontWeight: "800" }}
          >
            {formatHours(last.totalMin)} h
          </Text>
          <Text style={{ color: c.text.secondary }}>
            {fmtTime(last.start)} → {fmtTime(last.end)}
          </Text>

          {/* Hypnogram */}
          <Hypnogram
            segments={last.segments}
            height={46}
            borderColor={c.border}
            colors={{
              awake: rgba(sleepStagePalette.awake, 0.95),
              light: rgba(sleepStagePalette.light, 0.95),
              deep: rgba(sleepStagePalette.deep, 0.95),
              rem: rgba(sleepStagePalette.rem, 0.95),
            }}
          />
          {/* Legend outside the chart */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Legend label="Deep" color={sleepStagePalette.deep} />
            <Legend label="REM" color={sleepStagePalette.rem} />
            <Legend label="Light" color={sleepStagePalette.light} />
            <Legend label="Awake" color={sleepStagePalette.awake} />
          </View>
        </View>

        {/* Range chips */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Chip
            label="7d"
            active={range === "7d"}
            onPress={() => setRange("7d")}
          />
          <Chip
            label="30d"
            active={range === "30d"}
            onPress={() => setRange("30d")}
          />
        </View>

        {/* Averages & trend (simple cards + tiny bars) */}
        <View
          style={{
            backgroundColor: c.surface,
            borderColor: c.border,
            borderWidth: 1,
            borderRadius: 16,
            padding: 12,
            rowGap: 10,
          }}
        >
          <Text style={{ color: c.text.primary, fontWeight: "700" }}>
            Averages
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            <Stat
              label="Avg duration"
              value={`${data.avgHours.toFixed(1)} h`}
            />
            <Stat
              label="Min / Max"
              value={`${data.minHours.toFixed(1)}–${data.maxHours.toFixed(
                1
              )} h`}
            />
            <Stat
              label="Bedtime consistency"
              value={`±${data.stdDevMinutes.toFixed(0)} min`}
            />
          </View>

          {/* Tiny bars (last N nights durations) */}
          <View style={{ marginTop: 6 }}>
            <MiniBars
              values={data.seriesHours}
              border={c.border}
              fill={rgba(sleepStagePalette.deep, 0.5)} // deep blue at ~50% opacity
              onBarPress={setBarFocus}
            />
            {barFocus != null && (
              <Text
                style={{ color: c.text.primary, fontSize: 12, marginTop: 4 }}
              >
                Night {barFocus + 1}: {data.seriesHours[barFocus].toFixed(1)} h
              </Text>
            )}
            <Text
              style={{ color: c.text.secondary, fontSize: 12, marginTop: 6 }}
              accessibilityLabel="Mini sleep chart: each bar is a night's total hours, oldest to newest."
            >
              Last {data.seriesHours.length} nights — each bar = nightly sleep
              hours 
            </Text>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ color: c.text.secondary, fontSize: 12 }}>
                oldest
              </Text>
              <Text style={{ color: c.text.secondary, fontSize: 12 }}>
                newest
              </Text>
            </View>
          </View>
        </View>

        {/* Stage distribution (percent) */}
        <StageDistribution
          title="Stage distribution (last night)"
          segments={last.segments}
        />

        {/* Tips (static copy for now) */}
        <View
          style={{
            backgroundColor: c.surface,
            borderColor: c.border,
            borderWidth: 1,
            borderRadius: 16,
            padding: 12,
            rowGap: 6,
          }}
        >
          <Text style={{ color: c.text.primary, fontWeight: "700" }}>
            Sleep tips
          </Text>
          <Text style={{ color: c.text.secondary }}>
            Keep a consistent bedtime, avoid late caffeine, and dim screens 1
            hour before bed.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  function Chip({
    label,
    active,
    onPress,
  }: {
    label: string;
    active?: boolean;
    onPress: () => void;
  }) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={{
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: active ? c.muted : "transparent",
        }}
      >
        <Text
          style={{
            color: active ? c.text.primary : c.text.secondary,
            fontSize: 12,
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  }
  function Stat({ label, value }: { label: string; value: string }) {
    return (
      <View
        style={{
          flexBasis: "48%",
          backgroundColor: c.surface,
          borderColor: c.border,
          borderWidth: 1,
          borderRadius: 12,
          padding: 12,
        }}
      >
        <Text style={{ color: c.text.secondary, fontSize: 12 }}>{label}</Text>
        <Text
          style={{ color: c.text.primary, fontWeight: "700", marginTop: 4 }}
        >
          {value}
        </Text>
      </View>
    );
  }
  function Legend({ label, color }: { label: string; color: string }) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 2,
            backgroundColor: color,
            borderWidth: 1,
            borderColor: c.border,
          }}
        />
        <Text style={{ color: c.text.secondary, fontSize: 12 }}>{label}</Text>
      </View>
    );
  }
}

/* ---------------- helpers & data hook ---------------- */

function useSleepData(range: "7d" | "30d") {
  let s: any = {};
  try {
    s = useHealthStore?.getState?.() ?? {};
  } catch {}
  // last night (from store or fallback)
  const lastNight = s.sleepLastNight ?? {
    totalMin: 423,
    start: new Date(Date.now() - 1000 * 60 * 60 * 7.05),
    end: new Date(),
    segments: [
      { stage: "light", minutes: 210 },
      { stage: "deep", minutes: 95 },
      { stage: "rem", minutes: 92 },
      { stage: "awake", minutes: 26 },
    ],
  };

  // build N-night series (hours) — prefer store trends if available
  const len = range === "7d" ? 7 : 30;
  const fromTrends: number[] | undefined = s.trends?.sleep?.[range];
  const seriesHours: number[] = fromTrends?.length
    ? fromTrends.slice(-len)
    : synthHours(len, 7.3, 5.0, 9.0);

  // averages/min/max
  const sum = seriesHours.reduce((a, b) => a + b, 0);
  const avgHours = sum / seriesHours.length;
  let minHours = seriesHours[0],
    maxHours = seriesHours[0];
  seriesHours.forEach((h) => {
    if (h < minHours) minHours = h;
    if (h > maxHours) maxHours = h;
  });

  // bedtime consistency: derive bedtimes for last N nights (fake around 23:00 if not available)
  const bedtimes = synthBedtimes(len, lastNight.start);
  const stdDevMinutes = stdevMinutes(bedtimes);

  return {
    lastNight,
    seriesHours,
    avgHours,
    minHours,
    maxHours,
    stdDevMinutes,
  };
}

function formatHours(min: number) {
  const h = min / 60;
  return h.toFixed(1);
}
function fmtTime(d: Date) {
  try {
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return new Date(d).toISOString().slice(11, 16);
  }
}
function synthHours(n: number, center: number, min: number, max: number) {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const jitter =
      Math.sin((i / n) * Math.PI * 2) * 0.25 + (Math.random() - 0.5) * 0.2;
    const v = clamp(center * (1 + jitter * 0.15), min, max);
    out.push(Number(v.toFixed(2)));
  }
  return out;
}
function synthBedtimes(n: number, lastStart: Date) {
  // Create Date objects around ~23:00 with ±45min variance
  const arr: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(lastStart);
    d.setDate(d.getDate() - i);
    d.setHours(23, 0, 0, 0);
    const variance = Math.round((Math.random() - 0.5) * 90); // ±45 min
    d.setMinutes(d.getMinutes() + variance);
    arr.push(d);
  }
  return arr;
}
function stdevMinutes(dates: Date[]) {
  const minutes = dates.map((d) => d.getHours() * 60 + d.getMinutes());
  const mean = minutes.reduce((a, b) => a + b, 0) / minutes.length;
  const variance =
    minutes.reduce((a, b) => a + (b - mean) ** 2, 0) / minutes.length;
  return Math.sqrt(variance);
}
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/* Tiny bars (no text inside) */
function MiniBars({
  values, border, fill, onBarPress,
}: {
  values: number[]; border: string; fill: string;
  onBarPress?: (index: number) => void;
}) {
  const max = Math.max(...values, 1);
  return (
    <View style={{ height: 66, flexDirection: "row", alignItems: "flex-end", gap: 4 }}>
      {values.map((v, i) => {
        const hPct = v / max;
        return (
          <TouchableOpacity
            key={i}
            activeOpacity={0.7}
            onPress={() => onBarPress?.(i)}
            accessibilityRole="button"
            accessibilityLabel={`Night ${i + 1}, ${v.toFixed(1)} hours`}
            style={{
              flex: 1,
              height: 60 * hPct + 6,
              backgroundColor: fill,
              borderColor: border,
              borderWidth: 1,
              borderRadius: 6,
            }}
          />
        );
      })}
    </View>
  );
}
