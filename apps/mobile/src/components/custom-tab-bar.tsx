import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export type TabItem = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: number;
};

type Props = {
  tabs: TabItem[];
  navigation: any;
  state: any;
};

export default function CustomTabBar({ tabs, navigation, state }: Props) {
  const insets = useSafeAreaInsets();

  // Get the current route name from state
  // state.index gives us which tab is active
  // state.routes[state.index]?.name gives us the route name
  const currentRouteName = state?.routes?.[state.index]?.name ?? '';

  // Match current route to our tab list
  const activeTabIndex = state?.index ?? 0;
  const activeTab = tabs[activeTabIndex]?.name ?? tabs[0].name;

  function handleTabPress(tabIndex: number) {
    const tabName = tabs[tabIndex]?.name;
    if (!tabName) return;

    // Use the index-based navigation which is most reliable
    if (tabIndex !== state?.index) {
      navigation.navigate(tabName);
    }
  }

  return (
    <View style={[styles.container, { bottom: insets.bottom + 8 }]}>
      <View style={styles.pill}>
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.name;
          const badgeCount = tab.badge ?? 0;
          const showBadge = badgeCount > 0;
          return (
            <Pressable
              key={tab.name}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => handleTabPress(index)}
            >
              {isActive && <View style={styles.activeIndicator} />}
              <View style={styles.iconWrapper}>
                <Ionicons
                  name={(isActive ? tab.icon : `${tab.icon}-outline`) as keyof typeof Ionicons.glyphMap}
                  size={22}
                  color={isActive ? Brand.orange : '#9CA3AF'}
                  style={styles.icon}
                />
                {showBadge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[styles.label, isActive && styles.labelActive]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 100,
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 20,
    position: 'relative',
  },
  tabActive: {},
  activeIndicator: {
    position: 'absolute',
    top: -2,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: Brand.orange,
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: 2,
  },
  icon: {},
  badge: {
    position: 'absolute',
    top: -6,
    right: -12,
    backgroundColor: Brand.red,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: Brand.orange,
    fontWeight: '600',
  },
});
