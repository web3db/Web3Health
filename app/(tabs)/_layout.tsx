import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColors } from "@/src/theme/useThemeColors";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import type { ParamListBase } from "@react-navigation/native";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";

const TabIcon = ({
  name,
  color,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
}) => (
  <View
    style={{
      transform: [{ scale: focused ? 1.08 : 1 }],
      opacity: focused ? 1 : 0.8,
    }}
  >
    <Ionicons name={name} size={24} color={color} />
  </View>
);

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const c = useThemeColors();

  // --- Make the navigation hook type-aware of its Drawer parent ---
  const navigation = useNavigation<DrawerNavigationProp<ParamListBase>>();

  const tint = Colors[colorScheme ?? "light"].tint;
  const inactive = colorScheme === "dark" ? "#9aa0a6" : "#60646c";
  const barBg = colorScheme === "dark" ? "#0b0b0b" : "#ffffff";
  const border = colorScheme === "dark" ? "#1f1f1f" : "#e6e6e6";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.text.primary,
        tabBarInactiveTintColor: c.text.secondary,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: { position: "absolute" },
          default: {
            backgroundColor: c.bg,
            borderTopColor: c.border,
            height: 60,
          },
        }),
        tabBarLabelStyle: { fontSize: 11, marginBottom: 6 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={focused ? c.primary : c.text.secondary} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="trends"
        options={{
          title: "Trends",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="analytics-outline" color={focused ? c.primary : c.text.secondary} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: "Workouts",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="barbell-outline" color={focused ? c.primary : c.text.secondary} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="menu" color={focused ? c.primary : c.text.secondary} focused={focused} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            // Prevent the default action (navigating to the "more" screen)
            e.preventDefault();

            // Dispatch the action to open the drawer
            navigation.dispatch(DrawerActions.openDrawer());
          },
        }}
      />
      <Tabs.Screen
        name="debug" // keep the route file name `debug.tsx`
        options={{
          title: "Health Connect",
          tabBarIcon: ({ color, size, focused }) => (
            // pick any icon family you’re already using; example with Ionicons:
            <Ionicons name={focused ? "heart" : "heart-outline"} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
