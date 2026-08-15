import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/axios';
import { Order } from '@food-delivery/types';
import { Brand } from '@/constants/theme';

type OrderWithRestaurant = Order & {
  restaurant: { id: string; name: string };
  items: { id: string }[];
};

const STATUS_META: Record<
  string,
  { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  PENDING: { color: '#D97706', bg: '#FEF3C7', icon: 'time-outline' },
  CONFIRMED: { color: '#2563EB', bg: '#DBEAFE', icon: 'checkmark-circle-outline' },
  PREPARING: { color: '#7C3AED', bg: '#EDE9FE', icon: 'flame-outline' },
  READY: { color: '#0891B2', bg: '#CFFAFE', icon: 'bag-check-outline' },
  PICKED_UP: { color: '#EA580C', bg: '#FFF3ED', icon: 'bicycle-outline' },
  DELIVERED: { color: '#16A34A', bg: '#DCFCE7', icon: 'checkmark-done-circle-outline' },
  CANCELLED: { color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle-outline' },
};

type FilterKey = 'active' | 'completed';

export default function CustomerOrdersScreen() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterKey>('active');

  const {
    data: orders = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<OrderWithRestaurant[]>({
    queryKey: ['my-orders'],
    queryFn: () =>
      api.get<OrderWithRestaurant[]>('/orders/mine').then((r) => r.data),
  });

  const { activeOrders, completedOrders } = useMemo(() => {
    const active = orders.filter((o) =>
      ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP'].includes(o.status),
    );
    const completed = orders.filter((o) =>
      ['DELIVERED', 'CANCELLED'].includes(o.status),
    );
    return { activeOrders: active, completedOrders: completed };
  }, [orders]);

  const displayedOrders = filter === 'active' ? activeOrders : completedOrders;

  // ─── Loading ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Brand.orange} />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Empty State ──────────────────────────────────────────────
  if (orders.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="receipt-outline" size={56} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>
            Your order history will appear here{'\n'}once you place your first order.
          </Text>
          <Pressable
            style={styles.emptyButton}
            onPress={() => router.push('/(customer)/(tabs)/(home)')}
          >
            <Ionicons name="search" size={18} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Start Ordering</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>

        {/* Summary Row */}
        <View style={styles.summaryRow}>
          {activeOrders.length > 0 && (
            <View style={styles.summaryCard}>
              <View style={[styles.summaryDot, { backgroundColor: Brand.orange }]} />
              <Text style={styles.summaryValue}>{activeOrders.length}</Text>
              <Text style={styles.summaryLabel}>Active</Text>
            </View>
          )}
          {completedOrders.length > 0 && (
            <View style={styles.summaryCard}>
              <View style={[styles.summaryDot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.summaryValue}>{completedOrders.length}</Text>
              <Text style={styles.summaryLabel}>Completed</Text>
            </View>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          <Pressable
            style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
            onPress={() => setFilter('active')}
          >
            <Ionicons
              name="pulse"
              size={14}
              color={filter === 'active' ? '#FFFFFF' : '#6B7280'}
            />
            <Text
              style={[styles.filterText, filter === 'active' && styles.filterTextActive]}
            >
              Active ({activeOrders.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterTab, filter === 'completed' && styles.filterTabActive]}
            onPress={() => setFilter('completed')}
          >
            <Ionicons
              name="checkmark-done"
              size={14}
              color={filter === 'completed' ? '#FFFFFF' : '#6B7280'}
            />
            <Text
              style={[
                styles.filterText,
                filter === 'completed' && styles.filterTextActive,
              ]}
            >
              Completed ({completedOrders.length})
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Orders List */}
      <FlatList
        data={displayedOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Brand.orange}
            colors={[Brand.orange]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Ionicons
              name={filter === 'active' ? 'bicycle-outline' : 'clipboard-outline'}
              size={40}
              color="#D1D5DB"
            />
            <Text style={styles.emptyListText}>
              {filter === 'active' ? 'No active orders' : 'No completed orders'}
            </Text>
            <Text style={styles.emptyListSubtext}>
              {filter === 'active'
                ? 'Your current orders will appear here'
                : 'Past orders will show up here'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const meta = STATUS_META[item.status] ?? {
            color: '#6B7280',
            bg: '#F3F4F6',
            icon: 'help-circle-outline' as const,
          };
          const date = new Date(item.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          const time = new Date(item.createdAt).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          });

          return (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/(customer)/order/${item.id}`)}
            >
              {/* Top Row: Restaurant + Status */}
              <View style={styles.cardTop}>
                <View style={styles.restaurantRow}>
                  <View style={styles.restaurantIcon}>
                    <Ionicons name="storefront" size={16} color={Brand.orange} />
                  </View>
                  <Text style={styles.restaurantName} numberOfLines={1}>
                    {item.restaurant.name}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                  <Ionicons name={meta.icon} size={12} color={meta.color} />
                  <Text style={[styles.statusText, { color: meta.color }]}>
                    {item.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.cardDivider} />

              {/* Bottom Row: Date + Items + Total */}
              <View style={styles.cardBottom}>
                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={13} color="#9CA3AF" />
                    <Text style={styles.metaText}>{date}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={13} color="#9CA3AF" />
                    <Text style={styles.metaText}>{time}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="bag-outline" size={13} color="#9CA3AF" />
                    <Text style={styles.metaText}>
                      {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.total}>${Number(item.totalAmount).toFixed(2)}</Text>
              </View>

              {/* Chevron */}
              <View style={styles.cardChevron}>
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F8',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Header ────────────────────────────────────────────────────
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.3,
    marginBottom: 12,
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // Filter Tabs
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: Brand.orange,
    shadowColor: Brand.orange,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // ─── List ──────────────────────────────────────────────────────
  list: {
    padding: 16,
    paddingBottom: 100,
    gap: 10,
  },
  emptyList: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyListText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptyListSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
  },

  // ─── Order Card ────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  restaurantIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },

  // Divider
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 10,
  },

  // Bottom
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  total: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  cardChevron: {
    position: 'absolute',
    right: 14,
    top: '50%',
    marginTop: -8,
  },

  // ─── Empty State ───────────────────────────────────────────────
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  emptyButton: {
    flexDirection: 'row',
    backgroundColor: Brand.orange,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    gap: 8,
    shadowColor: Brand.orange,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
