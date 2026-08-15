import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/axios';
import { Order } from '@food-delivery/types';
import { Brand } from '@/constants/theme';

type DriverOrder = Order & {
  restaurant: { id: string; name: string };
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  READY: { color: '#06B6D4', bg: '#CFFAFE', icon: 'checkmark-circle' },
  PICKED_UP: { color: Brand.orange, bg: '#FFF3ED', icon: 'bicycle' },
  DELIVERED: { color: '#22C55E', bg: '#DCFCE7', icon: 'checkmark-done-circle' },
  CANCELLED: { color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle' },
};

function DeliveryCard({ order, onPress }: { order: DriverOrder; onPress?: () => void }) {
  const config = STATUS_CONFIG[order.status] ?? { color: '#9CA3AF', bg: '#F3F4F6', icon: 'help-circle' };
  const date = new Date(order.createdAt);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const isActive = order.status === 'PICKED_UP';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isActive && styles.cardActive,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      disabled={!isActive}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.cardStatusIcon, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon} size={16} color={config.color} />
          </View>
          <View>
            <Text style={styles.restaurant}>{order.restaurant.name}</Text>
            <Text style={styles.orderId}>
              #{order.id.slice(0, 8).toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
          <Text style={[styles.statusText, { color: config.color }]}>
            {order.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardDetailRow}>
          <Ionicons name="location-outline" size={14} color="#9CA3AF" />
          <Text style={styles.address} numberOfLines={1}>
            {order.deliveryAddress}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.cardFooterLeft}>
          <Ionicons name="time-outline" size={12} color="#9CA3AF" />
          <Text style={styles.date}>{dateStr} · {timeStr}</Text>
        </View>
        <Text style={styles.total}>${Number(order.totalAmount).toFixed(2)}</Text>
      </View>

      {isActive && (
        <View style={styles.activeHint}>
          <Ionicons name="arrow-forward" size={14} color={Brand.orange} />
          <Text style={styles.tapHint}>Open active delivery</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function DriverHistoryScreen() {
  const { data: orders = [], isLoading } = useQuery<DriverOrder[]>({
    queryKey: ['driver-orders'],
    queryFn: () => api.get<DriverOrder[]>('/orders/mine').then((r) => r.data),
  });

  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const inProgressCount = orders.filter((o) => ['READY', 'PICKED_UP'].includes(o.status)).length;
  const totalEarnings = orders.filter((o) => o.status === 'DELIVERED').reduce((sum) => sum + 2.99, 0);

  if (isLoading) {
    return (
      <View style={styles.bgContainer}>
        <Image
          source={require('../../../assets/images/driver.jpeg')}
          style={styles.bgImage}
        />
        <View style={styles.bgOverlay} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.bgContainer}>
      {/* Background Image */}
      <Image
        source={require('../../../assets/images/driver.jpeg')}
        style={styles.bgImage}
      />
      <View style={styles.bgOverlay} />

      <SafeAreaView style={styles.contentContainer} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Deliveries</Text>
          <Text style={styles.subtitle}>Track your delivery history</Text>
        </View>

        {/* Stats */}
        {orders.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FFF3ED' }]}>
                <Ionicons name="time" size={18} color={Brand.orange} />
              </View>
              <Text style={styles.statValue}>{inProgressCount}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="checkmark-done-circle" size={18} color="#22C55E" />
              </View>
              <Text style={styles.statValue}>{deliveredCount}</Text>
              <Text style={styles.statLabel}>Delivered</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="wallet" size={18} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>${totalEarnings.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
          </View>
        )}

        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="bicycle-outline" size={48} color="rgba(255,255,255,0.6)" />
              </View>
              <Text style={styles.emptyTitle}>No deliveries yet</Text>
              <Text style={styles.emptySubtitle}>
                Assigned orders will appear here
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <DeliveryCard
              order={item}
              onPress={
                item.status === 'PICKED_UP'
                  ? () => router.push('/(driver)/active')
                  : undefined
              }
            />
          )}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // ─── Background ──────────────────────────────────────────────
  bgContainer: {
    flex: 1,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  contentContainer: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Header ────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  // ─── Stats ─────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // ─── List ──────────────────────────────────────────────────────
  list: {
    padding: 16,
    paddingBottom: 100,
    gap: 12,
  },

  // ─── Card ──────────────────────────────────────────────────────
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardActive: {
    borderWidth: 2,
    borderColor: Brand.orange,
  },
  cardPressed: {
    opacity: 0.97,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    paddingBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cardStatusIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurant: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  orderId: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 1,
  },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Card Body
  cardBody: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  cardDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  address: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F0F0F0',
  },
  cardFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  total: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.2,
  },

  // Active Hint
  activeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#FFF3ED',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#FED7AA',
  },
  tapHint: {
    fontSize: 13,
    color: Brand.orange,
    fontWeight: '600',
  },

  // ─── Empty State ───────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
