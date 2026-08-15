import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { api } from '@/lib/axios';
import { RestaurantType, Order } from '@food-delivery/types';
import { useRestaurantSocket } from '@/hooks/use-order-socket';
import { Brand, Spacing, Radius } from '@/constants/theme';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',
  CONFIRMED: '#3B82F6',
  PREPARING: '#8B5CF6',
  READY: '#06B6D4',
  PICKED_UP: '#FF6B35',
  DELIVERED: '#22C55E',
  CANCELLED: '#EF4444',
};

const STATUS_BG: Record<string, string> = {
  PENDING: '#FEF3C7',
  CONFIRMED: '#DBEAFE',
  PREPARING: '#EDE9FE',
  READY: '#CFFAFE',
  PICKED_UP: '#FFF3ED',
  DELIVERED: '#DCFCE7',
  CANCELLED: '#FEE2E2',
};

const TAB_BAR_OFFSET = 88;

export default function OwnerHomeScreen() {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const {
    data: restaurant,
    isLoading,
    isFetching,
  } = useQuery<RestaurantType | null>({
    queryKey: ['my-restaurant'],
    queryFn: () =>
      api
        .get<RestaurantType | null>('/restaurants/mine')
        .then((res) => res.data),
  });

  const restaurantUpdate = useRestaurantSocket(restaurant?.id ?? null);

  useEffect(() => {
    if (restaurantUpdate) {
      queryClient.invalidateQueries({ queryKey: ['restaurant-orders'] });
    }
  }, [restaurantUpdate, queryClient]);

  const {
    data: orders = [],
    refetch,
    isRefetching,
  } = useQuery<Order[]>({
    queryKey: ['restaurant-orders'],
    queryFn: () => api.get<Order[]>('/orders/restaurant').then((r) => r.data),
    enabled: !!restaurant,
  });

  const { mutate: toggleOpen } = useMutation({
    mutationFn: () =>
      api.patch(`/restaurants/${restaurant?.id}`, {
        isOpen: !restaurant?.isOpen,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['my-restaurant'] }),
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['restaurant-orders'] }),
    onError: (e: any) =>
      Alert.alert(
        'Error',
        e?.response?.data?.message ?? 'Could not update status',
      ),
  });

  useEffect(() => {
    if (isLoading) return;
    if (!restaurant) {
      router.replace('/(owner)/(index)/create-restaurant');
    }
  }, [restaurant, isLoading, isFetching]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Brand.orange} />
      </View>
    );
  }

  const activeOrders = orders.filter((o) =>
    ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP'].includes(o.status),
  );

  const pastOrders = orders.filter((o) =>
    ['DELIVERED', 'CANCELLED'].includes(o.status),
  );

  function renderActionButton(order: Order) {
    if (order.status === 'PENDING') {
      return (
        <Pressable
          style={[styles.actionButton, styles.actionButtonBlue]}
          onPress={() => updateStatus({ id: order.id, status: 'CONFIRMED' })}
        >
          <Text style={styles.actionButtonText}>✓ Confirm Order</Text>
        </Pressable>
      );
    }
    if (order.status === 'CONFIRMED') {
      return (
        <Pressable
          style={styles.actionButton}
          onPress={() => updateStatus({ id: order.id, status: 'PREPARING' })}
        >
          <Text style={styles.actionButtonText}>🍳 Start Preparing</Text>
        </Pressable>
      );
    }
    if (order.status === 'PREPARING') {
      return (
        <Pressable
          style={[styles.actionButton, styles.actionButtonGreen]}
          onPress={() => updateStatus({ id: order.id, status: 'READY' })}
        >
          <Text style={styles.actionButtonText}>✅ Mark Ready</Text>
        </Pressable>
      );
    }
    return null;
  }

  function renderOrderCard(order: Order) {
    const statusColor = STATUS_COLORS[order.status] ?? '#6B7280';
    const statusBg = STATUS_BG[order.status] ?? '#F3F4F6';

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderIdRow}>
            <Text style={styles.orderId}>
              #{order.id.slice(0, 8).toUpperCase()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {order.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <Text style={styles.orderTotal}>${Number(order.totalAmount).toFixed(2)}</Text>
          <Text style={styles.orderAddress} numberOfLines={1}>
            📍 {order.deliveryAddress}
          </Text>
        </View>

        {renderActionButton(order)}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.restaurantName} numberOfLines={1}>
              {restaurant?.name}
            </Text>
          </View>
          <Pressable
            style={[
              styles.toggleButton,
              restaurant?.isOpen ? styles.toggleOpen : styles.toggleClosed,
            ]}
            onPress={() => toggleOpen()}
          >
            <View
              style={[
                styles.toggleDot,
                restaurant?.isOpen ? styles.dotOpen : styles.dotClosed,
              ]}
            />
            <Text style={styles.toggleText}>
              {restaurant?.isOpen ? 'Open' : 'Closed'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.editButton}
          onPress={() => router.push('/(owner)/(index)/edit-restaurant')}
        >
          <Text style={styles.editButtonText}>✏️ Edit Restaurant</Text>
        </Pressable>
      </View>

      {/* Orders List */}
      <FlatList
        style={styles.list}
        data={activeOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + TAB_BAR_OFFSET },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={void refetch}
            tintColor={Brand.orange}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
            </View>
            <Text style={styles.emptyTitle}>No active orders</Text>
            <Text style={styles.emptySubtitle}>
              New orders will appear here when customers place them.
            </Text>
          </View>
        }
        ListHeaderComponent={
          activeOrders.length > 0 ? (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Orders</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{activeOrders.length}</Text>
              </View>
            </View>
          ) : null
        }
        ListFooterComponent={
          pastOrders.length > 0 ? (
            <View style={styles.pastSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Past Orders</Text>
                <View style={styles.countBadgeGray}>
                  <Text style={styles.countBadgeTextGray}>
                    {pastOrders.length}
                  </Text>
                </View>
              </View>
              {pastOrders.slice(0, 5).map((order) => renderOrderCard(order))}
            </View>
          ) : null
        }
        renderItem={({ item: order }) => renderOrderCard(order)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F8',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F7F8',
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.3,
  },

  // Toggle
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  toggleOpen: {
    backgroundColor: '#DCFCE7',
  },
  toggleClosed: {
    backgroundColor: '#FEE2E2',
  },
  toggleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOpen: {
    backgroundColor: '#22C55E',
  },
  dotClosed: {
    backgroundColor: '#EF4444',
  },
  toggleText: {
    fontWeight: '600',
    fontSize: 13,
    color: '#374151',
  },

  // Edit
  editButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },

  // List
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Section
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
  countBadgeGray: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeTextGray: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },

  // Order Card
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 16,
    marginBottom: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  orderDetails: {
    gap: 4,
    marginBottom: 10,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: Brand.orange,
  },
  orderAddress: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Action Button
  actionButton: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonBlue: {
    backgroundColor: '#DBEAFE',
  },
  actionButtonGreen: {
    backgroundColor: '#DCFCE7',
  },
  actionButtonText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#374151',
  },

  // Past Section
  pastSection: {
    marginTop: 24,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
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
