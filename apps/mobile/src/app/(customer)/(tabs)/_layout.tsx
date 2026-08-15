import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import CustomTabBar from '@/components/custom-tab-bar';
import { useCartStore } from '@/store/cart-store';

export default function CustomerLayout() {
  const itemCount = useCartStore((s) => s.totalItems());

  const CUSTOMER_TABS = [
    { name: '(home)', label: 'Home', icon: 'home' as const },
    { name: 'search', label: 'Search', icon: 'search' as const },
    { name: 'cart', label: 'Cart', icon: 'cart' as const, badge: itemCount },
    { name: 'orders', label: 'Orders', icon: 'receipt' as const },
    { name: 'profile', label: 'Profile', icon: 'person-circle' as const },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomTabBar tabs={CUSTOMER_TABS} {...props} />}
      >
        <Tabs.Screen name="(home)" />
        <Tabs.Screen name="search" />
        <Tabs.Screen name="cart" />
        <Tabs.Screen name="orders" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </View>
  );
}
