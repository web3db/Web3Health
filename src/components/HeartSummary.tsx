import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { useThemeColors } from './../theme/useThemeColors';

type Props = {
  title?: string;             // e.g., "Heart (7d)"
  restingAvg: number;         // e.g., 61
  min: number;                // e.g., 56
  max: number;                // e.g., 68
  series?: number[];          // small line chart (optional)
  onPressDetails?: () => void;
  height?: number;            // chart height
};

export default function HeartSummary({
  title = 'Heart (7d)',
  restingAvg,
  min,
  max,
  series = [],
  onPressDetails,
  height = 56,
}: Props) {
  const c = useThemeColors();
  const router = useRouter();

  const width = 220;
  const padding = 6;

  const pathD = useMemo(() => {
    if (!series.length) return '';
    const lo = Math.min(...series);
    const hi = Math.max(...series);
    const range = Math.max(1, hi - lo);
    const n = series.length;

    const x = (i: number) =>
      padding + (n === 1 ? 0 : (i / (n - 1)) * (width - padding * 2));
    const y = (v: number) =>
      height - padding - ((v - lo) / range) * (height - padding * 2);

    return series.reduce((d, v, i) => (i ? `${d} L ${x(i)} ${y(v)}` : `M ${x(0)} ${y(v)}`), '');
  }, [series, height]);

  const handlePress = () => {
    if (onPressDetails) return onPressDetails();
    router.push('/(tabs)/trends?metric=heart');
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
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="heart-outline" size={18} color={c.text.secondary} />
          <Text style={{ color: c.text.primary, fontSize: 16, fontWeight: '700' }}>{title}</Text>
        </View>
        <Text style={{ color: c.primary, fontWeight: '600' }}>Details</Text>
      </View>

      {/* Numbers */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <Text style={{ color: c.text.primary, fontSize: 24, fontWeight: '800' }}>{Math.round(restingAvg)}</Text>
        <Text style={{ color: c.text.secondary, fontSize: 14 }}>bpm (avg)</Text>
      </View>
      <Text style={{ color: c.text.secondary, fontSize: 12, marginBottom: 10 }}>
        Min {Math.round(min)} · Max {Math.round(max)} bpm
      </Text>

      {/* Tiny sparkline */}
      {!!series.length && (
        <View style={{ width, height }}>
          <Svg width={width} height={height}>
            <Line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={c.border} strokeWidth={1} />
            <Line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke={c.border} strokeWidth={1} opacity={0.5} />
            <Path d={pathD} fill="none" stroke={c.primary} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          </Svg>
        </View>
      )}
    </Pressable>
  );
}
