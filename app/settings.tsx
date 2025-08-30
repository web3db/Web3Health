// app/settings.tsx
import { useThemeController } from '@/src/theme/ThemeController';
import { useThemeColors } from '@/src/theme/useThemeColors';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const c = useThemeColors();
  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderColor: c.border,
        borderWidth: 1,
        borderRadius: 16,
        marginBottom: 16,
      }}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
        <Text style={{ color: c.text.primary, fontSize: 14, fontWeight: '700' }}>{title}</Text>
      </View>
      <View style={{ padding: 8 }}>{children}</View>
    </View>
  );
}

function Row({
  label,
  description,
  selected,
  onPress,
}: {
  label: string;
  description?: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ color: c.text.primary, fontSize: 16, fontWeight: '600' }}>{label}</Text>
        {!!description && (
          <Text style={{ color: c.text.secondary, fontSize: 12, marginTop: 4 }}>{description}</Text>
        )}
      </View>
      <Ionicons
        name={selected ? 'radio-button-on-outline' : 'radio-button-off-outline'}
        size={20}
        color={selected ? c.primary : c.text.secondary}
      />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const c = useThemeColors();
  const { appearanceOverride, setAppearanceOverride } = useThemeController();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ padding: 16 }}>
        {/* Appearance */}
        <Section title="Appearance">
          <Row
            label="Use System"
            description="Match the device light/dark setting"
            selected={appearanceOverride === 'system'}
            onPress={() => setAppearanceOverride('system')}
          />
          <Divider />
          <Row
            label="Light"
            selected={appearanceOverride === 'light'}
            onPress={() => setAppearanceOverride('light')}
          />
          <Divider />
          <Row
            label="Dark"
            selected={appearanceOverride === 'dark'}
            onPress={() => setAppearanceOverride('dark')}
          />
        </Section>

        {/* Units (placeholder) */}
        <Section title="Units">
          <Row
            label="Distance"
            description="Kilometers"
            selected
          />
          <Divider />
          <Row
            label="Weight"
            description="Kilograms"
            selected
          />
        </Section>

        {/* Notifications (placeholder) */}
        <Section title="Notifications">
          <Row
            label="Daily reminders"
            description="Motivational reminders to close rings"
            selected
          />
        </Section>
      </View>
    </SafeAreaView>
  );
}

function Divider() {
  const c = useThemeColors();
  return <View style={{ height: 1, backgroundColor: c.border, opacity: 0.7, marginHorizontal: 16 }} />;
}
