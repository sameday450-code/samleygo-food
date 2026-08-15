import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import CustomTabBar from '@/components/custom-tab-bar';

const OWNER_TABS = [
  { name: '(index)', label: 'Orders', icon: 'receipt' as const },
  { name: 'menu', label: 'Menu', icon: 'restaurant' as const },
  { name: 'analytics', label: 'Analytics', icon: 'bar-chart' as const },
  { name: 'profile', label: 'Profile', icon: 'person-circle' as const },
];

export default function OwnerLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomTabBar tabs={OWNER_TABS} {...props} />}
      >
        <Tabs.Screen name="(index)" />
        <Tabs.Screen name="menu" />
        <Tabs.Screen name="analytics" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </View>
  );
}
