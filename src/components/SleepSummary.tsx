import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useThemeColors } from "./../theme/useThemeColors";
// import { sleepStagePalette } from "./../theme/sleepColors";
// type SleepStage = 'awake' | 'light' | 'deep' | 'rem';
import {
  sleepStageLabel,
  sleepStagePalette,
  type SleepStage,
} from "./../theme/sleepColors";
type StageSegment = {
  stage: SleepStage;
  minutes: number;
};

type Props = {
  title?: string;
  totalMin: number; // total sleep minutes (e.g., 423)
  start?: string | number | Date; // bedtime
  end?: string | number | Date; // wake time
  segments?: StageSegment[]; // optional stage breakdown
  onPressDetails?: () => void; // override navigation
};

export default function SleepSummary({
  title = "Sleep (last night)",
  totalMin,
  start,
  end,
  segments,
  onPressDetails,
}: Props) {
  const c = useThemeColors();
  const router = useRouter();

  const timeRange = useMemo(() => {
    const fmt = (d?: string | number | Date) => {
      if (!d) return "";
      try {
        return new Date(d).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return "";
      }
    };
    const s = fmt(start);
    const e = fmt(end);
    return s && e ? `${s} – ${e}` : "";
  }, [start, end]);

  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;

  // total for bar calc
  const totalForBar =
    segments?.reduce((acc, s) => acc + s.minutes, 0) || totalMin || 1;

  // const colorForStage = (stage: SleepStage) => {
  //   switch (stage) {
  //     case "deep":
  //       return "#6FA8FF"; // deep blue
  //     case "rem":
  //       return "#A58BFF"; // violet
  //     case "light":
  //       return "#7ED8A0"; // soft green
  //     case "awake":
  //       return "#F0C36F"; // amber
  //     default:
  //       return c.muted;
  //   }
  // };

  const handleDetails = () => {
    if (onPressDetails) return onPressDetails();
    router.push("/sleep");
  };

 return (
    <View
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
          <Ionicons name="moon-outline" size={18} color={c.text.secondary} />
          <Text style={{ color: c.text.primary, fontSize: 16, fontWeight: '700' }}>{title}</Text>
        </View>
        <Pressable onPress={handleDetails} hitSlop={10} style={{ paddingVertical: 4, paddingHorizontal: 6 }}>
          <Text style={{ color: c.primary, fontWeight: '600' }}>Details</Text>
        </Pressable>
      </View>

      {/* Primary numbers */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
        <Text style={{ color: c.text.primary, fontSize: 24, fontWeight: '800' }}>{hours}h</Text>
        <Text style={{ color: c.text.primary, fontSize: 18, fontWeight: '700' }}>{mins}m</Text>
      </View>
      {!!timeRange && <Text style={{ color: c.text.secondary, fontSize: 12, marginBottom: 10 }}>{timeRange}</Text>}

      {/* Stage bar */}
      <View
        style={{
          height: 12,
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: c.muted,
          borderColor: c.border,
          borderWidth: 1,
        }}
      >
        <View style={{ flexDirection: 'row', width: '100%', height: '100%' }}>
          {(segments && segments.length > 0 ? segments : [{ stage: 'light' as SleepStage, minutes: totalMin }]).map((seg, idx) => {
            const pct = Math.max(0, Math.min(1, seg.minutes / totalForBar));
            const fill = sleepStagePalette[seg.stage] ?? c.muted;
            return (
              <View
                key={idx}
                style={{ width: `${pct * 100}%`, backgroundColor: fill, height: '100%' }}
              />
            );
          })}
        </View>
      </View>

      {/* Legend */}
      {segments && segments.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
          {segments.map((seg, i) => {
            const fill = sleepStagePalette[seg.stage] ?? c.muted;
            return (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: fill }} />
                <Text style={{ color: c.text.secondary, fontSize: 12 }}>
                  {sleepStageLabel[seg.stage]} · {Math.round(seg.minutes)}m
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// function labelForStage(s: SleepStage) {
//   switch (s) {
//     case "deep":
//       return "Deep";
//     case "rem":
//       return "REM";
//     case "light":
//       return "Light";
//     case "awake":
//       return "Awake";
//     default:
//       return "Stage";
//   }
// }
