import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { useThemeColors } from './../theme/useThemeColors';

type Props = {
  title?: string;           // e.g., "Weight (7d)"
  latest: number;           // e.g., 72.4
  unit?: 'kg' | 'lb';
  series?: number[];        // tiny sparkline
  delta7d?: number;         // signed difference from 7d ago (same unit)
  onPressDetails?: () => void;
  height?: number;
};

export default function WeightSummary({
  title = 'Weight (7d)',
  latest,
  unit = 'kg',
  series = [],
  delta7d,
  onPressDetails,
  height = 56,
}: Props) {
  const c = useThemeColors();
  const router = useRouter();

  const width = 220;
  const padding = 6;

  const { pathD } = useMemo(() => {
    if (!series.length) return { pathD: '' };
    const lo = Math.min(...series);
    const hi = Math.max(...series);
    const range = Math.max(1, hi - lo);
    const n = series.length;

    const x = (i: number) =>
      padding + (n === 1 ? 0 : (i / (n - 1)) * (width - padding * 2));
    const y = (v: number) =>
      height - padding - ((v - lo) / range) * (height - padding * 2);

    const d = series.reduce((acc, v, i) => (i ? `${acc} L ${x(i)} ${y(v)}` : `M ${x(0)} ${y(v)}`), '');
    return { pathD: d };
  }, [series, height]);

  const positive = typeof delta7d === 'number' && delta7d >= 0;
  const trendIcon: keyof typeof Ionicons.glyphMap =
    positive ? 'trending-up-outline' : 'trending-down-outline';

  const handlePress = () => {
    if (onPressDetails) return onPressDetails();
    router.push('/(tabs)/trends?metric=weight');
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
          <Ionicons name="scale-outline" size={18} color={c.text.secondary} />
          <Text style={{ color: c.text.primary, fontSize: 16, fontWeight: '700' }}>{title}</Text>
        </View>
        <Text style={{ color: c.primary, fontWeight: '600' }}>Details</Text>
      </View>

      {/* Numbers */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <Text style={{ color: c.text.primary, fontSize: 24, fontWeight: '800' }}>
          {latest.toFixed(1)}
        </Text>
        <Text style={{ color: c.text.secondary, fontSize: 14 }}>{unit}</Text>
      </View>

      {/* Delta */}
      {typeof delta7d === 'number' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Ionicons
            name={trendIcon}
            size={16}
            color={positive ? c.danger : c.success /* if going up show red; down show green */}
          />
          <Text style={{ color: positive ? c.danger : c.success, fontWeight: '700', fontSize: 13 }}>
            {positive ? '+' : ''}{delta7d.toFixed(1)} {unit} vs 7d
          </Text>
        </View>
      )}

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
