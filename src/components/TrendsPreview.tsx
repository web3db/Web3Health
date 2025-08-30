import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Line, Path } from "react-native-svg";
import { useThemeColors } from "./../theme/useThemeColors";

type Props = {
  title?: string; // e.g., "Steps (7d)"
  metric?: string; // e.g., "steps"
  series: number[]; // e.g., last 7 or 30 values
  deltaPct?: number; // vs previous period (e.g., +12.3)
  onPress?: () => void; // override navigation if you want
  height?: number; // chart height
};

export default function TrendsPreview({
  title = "Steps (7d)",
  metric = "steps",
  series,
  deltaPct,
  onPress,
  height = 64,
}: Props) {
  const c = useThemeColors();
  const router = useRouter();

  // Geometry
  const width = 220;
  const padding = 6;

  const { pathD, min, max } = useMemo(() => {
    if (!series || series.length === 0) {
      return { pathD: "", min: 0, max: 0 };
    }
    const n = series.length;
    const lo = Math.min(...series);
    const hi = Math.max(...series);
    const range = Math.max(1, hi - lo);

    const xScale = (i: number) => {
      if (n === 1) return padding;
      const t = i / (n - 1);
      return padding + t * (width - padding * 2);
    };
    const yScale = (v: number) => {
      // Flip y so higher values go up
      const t = (v - lo) / range;
      const y = height - padding - t * (height - padding * 2);
      return y;
    };

    let d = "";
    series.forEach((v, i) => {
      const x = xScale(i);
      const y = yScale(v);
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });

    return { pathD: d, min: lo, max: hi };
  }, [series, height]);

  const positive = (deltaPct ?? 0) >= 0;

  const handlePress = () => {
    if (onPress) return onPress();
    router.push(`/(tabs)/trends?metric=${encodeURIComponent(metric)}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{
        backgroundColor: c.surface,
        borderColor: c.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <Text
          style={{ color: c.text.primary, fontSize: 16, fontWeight: "700" }}
        >
          {title}
        </Text>
        {typeof deltaPct === "number" && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons
              name={positive ? "trending-up-outline" : "trending-down-outline"}
              size={16}
              color={positive ? c.success : c.danger}
            />
            <Text
              style={{
                color: positive ? c.success : c.danger,
                fontWeight: "700",
              }}
            >
              {positive ? "+" : ""}
              {deltaPct.toFixed(1)}%
            </Text>
          </View>
        )}
      </View>

      {/* Chart */}
      <View style={{ width, height }}>
        <Svg width={width} height={height}>
          {/* baseline grid */}
          <Line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke={c.border}
            strokeWidth={1}
          />
          <Line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke={c.border}
            strokeWidth={1}
            opacity={0.5}
          />

          {/* sparkline */}
          {pathD ? (
            <Path
              d={pathD}
              fill="none"
              stroke={c.primary}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}
        </Svg>
      </View>

      {/* Footer meta */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 10,
        }}
      >
        <Text style={{ color: c.text.secondary, fontSize: 12 }}>
          Min: {min}
        </Text>
        <Text style={{ color: c.text.secondary, fontSize: 12 }}>
          Max: {max}
        </Text>
        <Text style={{ color: c.text.muted, fontSize: 12 }}>
          Tap to view Trends
        </Text>
      </View>
    </Pressable>
  );
}
