import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/lib/axios';
import { Order, RestaurantType } from '@food-delivery/types';
import { Brand } from '@/constants/theme';

type RestaurantOrder = Order & { items: { id: string }[] };

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: '#3B82F6',
  PREPARING: '#8B5CF6',
  READY: '#06B6D4',
  PICKED_UP: '#FF6B35',
  DELIVERED: '#22C55E',
  CANCELLED: '#EF4444',
};

const STATUS_BG: Record<string, string> = {
  CONFIRMED: '#DBEAFE',
  PREPARING: '#EDE9FE',
  READY: '#CFFAFE',
  PICKED_UP: '#FFF3ED',
  DELIVERED: '#DCFCE7',
  CANCELLED: '#FEE2E2',
};

export default function OwnerAnalyticsScreen() {
  const { data: restaurant, isLoading: restaurantLoading } =
    useQuery<RestaurantType | null>({
      queryKey: ['my-restaurant'],
      queryFn: () =>
        api.get<RestaurantType | null>('/restaurants/mine').then((r) => r.data),
    });

  const { data: allOrders = [], isLoading: ordersLoading } = useQuery<
    RestaurantOrder[]
  >({
    queryKey: ['restaurant-orders'],
    queryFn: () =>
      api.get<RestaurantOrder[]>('/orders/restaurant').then((r) => r.data),
    enabled: !!restaurant,
  });

  const todayOrders = useMemo(() => {
    const today = new Date().toDateString();
    return allOrders.filter(
      (o) => new Date(o.createdAt).toDateString() === today,
    );
  }, [allOrders]);

  const totalRevenue = todayOrders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + Number(o.totalAmount), 0)
    .toFixed(2);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    todayOrders.forEach((o) => {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    });
    return counts;
  }, [todayOrders]);

  const isLoading = restaurantLoading || ordersLoading;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Brand.orange} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      <FlatList
        data={todayOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Stats Cards */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, styles.statCardPrimary]}>
                <View style={styles.statIconContainer}>
                  <Text style={styles.statIcon}>📦</Text>
                </View>
                <Text style={styles.statValue}>{todayOrders.length}</Text>
                <Text style={styles.statLabel}>Orders Today</Text>
              </View>

              <View style={[styles.statCard, styles.statCardAccent]}>
                <View style={styles.statIconContainerAccent}>
                  <Text style={styles.statIcon}>💰</Text>
                </View>
                <Text style={styles.statValueAccent}>${totalRevenue}</Text>
                <Text style={styles.statLabel}>Revenue</Text>
              </View>
            </View>

            {/* Status Breakdown */}
            {Object.keys(statusCounts).length > 0 && (
              <View style={styles.statusCard}>
                <Text style={styles.statusCardTitle}>Order Status</Text>
                {Object.entries(statusCounts).map(([status, count]) => (
                  <View key={status} style={styles.statusRow}>
                    <View style={styles.statusLeft}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              STATUS_COLORS[status] ?? '#6B7280',
                          },
                        ]}
                      />
                      <Text style={styles.statusLabel}>
                        {status.replace('_', ' ')}
                      </Text>
                    </View>
                    <View style={styles.statusRight}>
                      <Text style={styles.statusCount}>{count}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Orders List Header */}
            {todayOrders.length > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Today's Orders</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {todayOrders.length}
                  </Text>
                </View>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>📊</Text>
            </View>
            <Text style={styles.emptyTitle}>No orders today</Text>
            <Text style={styles.emptySubtitle}>
              Your daily analytics will appear here once you receive orders.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const statusColor = STATUS_COLORS[item.status] ?? '#6B7280';
          const statusBg = STATUS_BG[item.status] ?? '#F3F4F6';

          return (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>
                  #{item.id.slice(0, 8).toUpperCase()}
                </Text>
                <View
                  style={[styles.statusBadge, { backgroundColor: statusBg }]}
                >
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {item.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <View style={styles.orderDetails}>
                <Text style={styles.orderItems}>
                  {item.items.length} item{item.items.length !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.orderTotal}>
                  ${Number(item.totalAmount).toFixed(2)}
                </Text>
              </View>
            </View>
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
    padding: 24,
  },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.3,
  },
  date: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },

  // List Content
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 16,
  },
  statCardPrimary: {
    // default white card
  },
  statCardAccent: {
    backgroundColor: '#FFF3ED',
    borderColor: '#FED7AA',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statIconContainerAccent: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 18,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 2,
  },
  statValueAccent: {
    fontSize: 28,
    fontWeight: '800',
    color: Brand.orange,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Status Card
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 16,
    marginBottom: 20,
  },
  statusCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLabel: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  statusRight: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  countBadge: {
    backgroundColor: Brand.orange,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Order Card
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 14,
    marginBottom: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItems: {
    fontSize: 13,
    color: '#6B7280',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.orange,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
    paddingBottom: 32,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
});
