import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useThemeColors } from './../theme/useThemeColors';

type Workout = {
  id: string | number;
  type: 'run' | 'walk' | 'cycle' | 'strength' | 'yoga' | 'swim' | string;
  durationMin: number;
  calories?: number;
  startTime?: string | number | Date;
};

type Props = {
  workouts: Workout[];
  title?: string;
  onSeeAll?: () => void;
};

export default function RecentWorkouts({ workouts, title = 'Recent Workouts', onSeeAll }: Props) {
  const c = useThemeColors();
  const router = useRouter();

  const handleSeeAll = () => {
    if (onSeeAll) return onSeeAll();
    router.navigate('/(tabs)/workouts');
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
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ color: c.text.primary, fontSize: 16, fontWeight: '700' }}>{title}</Text>
        <Pressable onPress={handleSeeAll} hitSlop={10} style={{ paddingVertical: 4, paddingHorizontal: 6 }}>
          <Text style={{ color: c.primary, fontWeight: '600' }}>See all</Text>
        </Pressable>
      </View>

      {/* List (up to 3) */}
      <View style={{ gap: 10 }}>
        {workouts.slice(0, 3).map((w) => (
          <Row key={w.id} w={w} />
        ))}
        {workouts.length === 0 && (
          <Text style={{ color: c.text.secondary, fontSize: 14 }}>No workouts yet</Text>
        )}
      </View>
    </View>
  );
}

function Row({ w }: { w: Workout }) {
  const c = useThemeColors();

  const iconName = getIcon(w.type);
  const when = formatWhen(w.startTime);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 6,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: c.muted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={iconName} size={18} color={c.text.secondary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text.primary, fontSize: 14, fontWeight: '600' }}>
          {labelFromType(w.type)}
        </Text>
        <Text style={{ color: c.text.secondary, fontSize: 12 }}>
          {w.durationMin} min{typeof w.calories === 'number' ? ` · ${Math.round(w.calories)} kcal` : ''}{when ? ` · ${when}` : ''}
        </Text>
      </View>
    </View>
  );
}

function getIcon(type: Workout['type']): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'run':
      return 'fitness-outline';
    case 'walk':
      return 'walk-outline';
    case 'cycle':
      return 'bicycle-outline';
    case 'strength':
      return 'barbell-outline';
    case 'yoga':
      return 'leaf-outline';
    case 'swim':
      return 'water-outline';
    default:
      return 'stats-chart-outline';
  }
}

function labelFromType(type: Workout['type']): string {
  return ({
    run: 'Run',
    walk: 'Walk',
    cycle: 'Cycling',
    strength: 'Strength',
    yoga: 'Yoga',
    swim: 'Swim',
  } as Record<string, string>)[type] ?? 'Workout';
}

function formatWhen(start?: string | number | Date) {
  if (!start) return '';
  try {
    const d = new Date(start);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
      // show time
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}
