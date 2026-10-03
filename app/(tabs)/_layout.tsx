import { AppIcon as Ionicons } from '@/components/ui/app-icon';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { AppColors } from '@/constants/app-ui';
import { Fonts } from '@/constants/theme';
import { useTabBarMetrics } from '@/hooks/use-tab-bar-metrics';

export default function TabLayout() {
  const { resolvedTabBarStyle } = useTabBarMetrics();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: AppColors.accent,
        tabBarInactiveTintColor: AppColors.muted,
        tabBarButton: HapticTab,
        tabBarStyle: resolvedTabBarStyle,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}>
      <Tabs.Screen
        name="roster"
        options={{
          title: 'Roster',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Break',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'hourglass' : 'hourglass-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="holidays"
        options={{
          title: 'Holidays',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'sunny' : 'sunny-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'options' : 'options-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontFamily: Fonts.rounded,
    fontSize: 12,
    marginTop: 2,
  },
  tabItem: {
    paddingVertical: 2,
  },
});
