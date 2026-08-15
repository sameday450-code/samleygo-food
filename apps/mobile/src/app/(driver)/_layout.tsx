import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import CustomTabBar from '@/components/custom-tab-bar';

const DRIVER_TABS = [
  { name: 'index', label: 'Home', icon: 'home' as const },
  { name: 'active', label: 'Active', icon: 'car' as const },
  { name: 'history', label: 'History', icon: 'time' as const },
  { name: 'profile', label: 'Profile', icon: 'person-circle' as const },
];

export default function DriverLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomTabBar tabs={DRIVER_TABS} {...props} />}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="active" />
        <Tabs.Screen name="history" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </View>
  );
}
