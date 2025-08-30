import RawLogsSheet from "@/src/components/RawLogsSheet";
import TrendChart from "@/src/components/TrendChart";
import { METRICS, formatValue, humanizeMetric, useTrendData, type MetricKey } from "@/src/store/useTrendData";
import { useThemeColors } from "@/src/theme/useThemeColors";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RangeKey = "7d" | "30d" | "90d";
type GroupKey = "daily" | "weekly";
function isMetricKey(x: unknown): x is MetricKey {
  return typeof x === "string" && (METRICS as readonly string[]).includes(x);
}

export default function TrendsScreen() {
  const c = useThemeColors();
  const { metric: routeMetric } = useLocalSearchParams();
  const metric: MetricKey = isMetricKey(routeMetric) ? routeMetric : "steps";

  const [range, setRange] = useState<RangeKey>("7d");
  const [groupBy, setGroupBy] = useState<GroupKey>("daily");
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [logsOpen, setLogsOpen] = useState(false);

  const data = useTrendData({ metric, range, groupBy });
  const title = humanizeMetric(metric);

  const focusLabel = useMemo(() => {
    if (focusIndex == null) return null;
    return {
      date: data.labels[focusIndex],
      value: formatValue(metric, data.values[focusIndex], data.unitLabel, data.imperial),
    };
  }, [focusIndex, data, metric]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, rowGap: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
          <Text style={{ color: c.text.primary, fontSize: 22, fontWeight: "800" }}>{title}</Text>
          <Text style={{ color: c.text.secondary }}>{data.unitLabel}</Text>
        </View>

        {/* Controls */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <RowChips>
            <Chip label="7d" active={range === "7d"} onPress={() => setRange("7d")} />
            <Chip label="30d" active={range === "30d"} onPress={() => setRange("30d")} />
            <Chip label="90d" active={range === "90d"} onPress={() => setRange("90d")} />
          </RowChips>
          <RowChips>
            <Chip label="Daily" active={groupBy === "daily"} onPress={() => setGroupBy("daily")} />
            <Chip label="Weekly" active={groupBy === "weekly"} onPress={() => setGroupBy("weekly")} />
          </RowChips>
        </View>

        {/* Chart card */}
        <View
          style={{
            backgroundColor: c.surface,
            borderColor: c.border,
            borderWidth: 1,
            borderRadius: 16,
            padding: 12,
          }}
          accessible
          accessibilityLabel={`${title} trend, ${range}, ${groupBy}`}
        >
          <TrendChart
            labels={data.labels}
            values={data.values}
            onFocusIndex={setFocusIndex}
            strokeColor={c.text.primary}
            gridColor={c.border}
            areaFill={c.text.primary + "22"}
          />
          {/* Tooltip (outside chart visuals) */}
          {focusLabel && (
            <View style={{ marginTop: 10, flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: c.text.secondary }}>{focusLabel.date}</Text>
              <Text style={{ color: c.text.primary, fontWeight: "700" }}>{focusLabel.value}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          <StatCard label="Average" value={formatValue(metric, data.stats.avg, data.unitLabel, data.imperial)} />
          <StatCard label="Min" value={`${formatValue(metric, data.stats.min.v, data.unitLabel, data.imperial)} • ${data.labels[data.stats.min.i]}`} />
          <StatCard label="Max" value={`${formatValue(metric, data.stats.max.v, data.unitLabel, data.imperial)} • ${data.labels[data.stats.max.i]}`} />
        </View>

        {/* Delta vs prev (split-half delta) */}
        <View style={{ alignSelf: "flex-start", backgroundColor: c.muted, borderColor: c.border, borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 }}>
          <Text style={{ color: c.text.secondary, fontSize: 12 }}>
            Δ vs prev window: {formatPct(data.stats.deltaPct)}
          </Text>
        </View>

        {/* Actions */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <ActionButton label="Raw logs" onPress={() => setLogsOpen(true)} />
          {/* future: <ActionButton label="Compare period" onPress={() => {}} /> */}
        </View>
      </ScrollView>

      <Modal visible={logsOpen} transparent animationType="slide" onRequestClose={() => setLogsOpen(false)}>
        <RawLogsSheet
          title={`${title} — ${range} ${groupBy}`}
          labels={data.labels}
          values={data.values}
          unitLabel={data.unitLabel}
          format={(v) => formatValue(metric, v, data.unitLabel, data.imperial)}
          onClose={() => setLogsOpen(false)}
        />
      </Modal>
    </SafeAreaView>
  );

  function RowChips({ children }: { children: React.ReactNode }) {
    return <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>{children}</View>;
  }
  function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
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
        <Text style={{ color: active ? c.text.primary : c.text.secondary, fontSize: 12 }}>{label}</Text>
      </TouchableOpacity>
    );
  }
  function StatCard({ label, value }: { label: string; value: string }) {
    return (
      <View style={{ flexBasis: "48%", backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 12, padding: 12 }}>
        <Text style={{ color: c.text.secondary, fontSize: 12 }}>{label}</Text>
        <Text style={{ color: c.text.primary, fontWeight: "700", marginTop: 4 }}>{value}</Text>
      </View>
    );
  }
  function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={{ flex: 1, backgroundColor: c.muted, borderColor: c.border, borderWidth: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" }}
      >
        <Text style={{ color: c.text.primary, fontWeight: "600" }}>{label}</Text>
      </TouchableOpacity>
    );
  }
}

function formatPct(p: number) {
  if (!isFinite(p)) return "0%";
  const sign = p > 0 ? "+" : "";
  return `${sign}${p.toFixed(1)}%`;
}
