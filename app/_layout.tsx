import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import Ionicons from '@expo/vector-icons/Ionicons';
import { Drawer } from 'expo-router/drawer';

import { ThemeControllerProvider, useThemeController } from '@/src/theme/ThemeController';
import { useThemeColors } from '@/src/theme/useThemeColors';
import { useHealthStore } from '../src/store/useHealthStore';

function AppShell() {
  // We pull from ThemeController, not system directly
  const { resolvedScheme } = useThemeController();
  const c = useThemeColors();

  const seedIfEmpty = useHealthStore(s => s.seedIfEmpty);
  useEffect(() => { seedIfEmpty(30); }, []);

  const [loaded] = useFonts({ SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf') });
  if (!loaded) return null;

  const isDark = resolvedScheme === 'dark';

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Drawer
        screenOptions={{
          headerShown: false,
          drawerType: 'front',
          drawerPosition: 'right',
          drawerStyle: { backgroundColor: c.surface, width: 300 },
          drawerActiveTintColor: c.text.primary,
          drawerInactiveTintColor: c.text.secondary,
        }}
      >
        <Drawer.Screen name="(tabs)" options={{ drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="+not-found" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen
          name="profile"
          options={{
            title: 'My Profile',
            drawerIcon: ({ color, size }) => <Ionicons name="person-circle-outline" color={color} size={size ?? 20} />,
          }}
        />
        <Drawer.Screen
          name="sleep"
          options={{
            title: 'Sleep',
            drawerIcon: ({ color, size }) => <Ionicons name="moon-outline" color={color} size={size ?? 20} />,
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            title: 'Settings',
            drawerIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size ?? 20} />,
          }}
        />
        <Drawer.Screen
          name="nutrition"
          options={{
            title: 'Nutrition',
            drawerIcon: ({ color, size }) => <Ionicons name="restaurant-outline" color={color} size={size ?? 20} />,
          }}
        />
        {/* Hide +not-found from drawer if needed */}
      
      </Drawer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeControllerProvider>
      <AppShell />
    </ThemeControllerProvider>
  );
}
