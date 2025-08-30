import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, Text, View, ViewStyle } from 'react-native';
import { useThemeColors } from "./../theme/useThemeColors";

type Props = {
  icon?: keyof typeof Ionicons.glyphMap; // optional Ionicon name
  iconRight?: boolean;                   // place icon on the right
  label: string;                         // "Steps"
  value: string | number;                // "8,423"
  subtext?: string;                      // "Today"
  onPress?: () => void;
  style?: ViewStyle;
};

export default function QuickStatCard({
  icon,
  iconRight,
  label,
  value,
  subtext,
  onPress,
  style,
}: Props) {
  const c = useThemeColors();
  const Container: any = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      style={[
        {
          backgroundColor: c.surface,
          borderColor: c.border,
          borderWidth: 1,
          borderRadius: 16,
          padding: 14,
          flex: 1,
          minWidth: 140,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: iconRight ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {icon ? (
          <Ionicons
            name={icon}
            size={20}
            color={c.text.secondary}
            style={{ marginHorizontal: 4 }}
          />
        ) : <View />}

        <View style={{ alignItems: iconRight ? 'flex-start' : 'flex-end', flexShrink: 1 }}>
          <Text style={{ color: c.text.secondary, fontSize: 12 }}>{label}</Text>
          <Text style={{ color: c.text.primary, fontSize: 20, fontWeight: '700' }} numberOfLines={1}>
            {value}
          </Text>
          {!!subtext && (
            <Text style={{ color: c.text.muted, fontSize: 12 }} numberOfLines={1}>
              {subtext}
            </Text>
          )}
        </View>
      </View>
    </Container>
  );
}
