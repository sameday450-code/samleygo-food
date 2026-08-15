import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/axios';
import { useAuth } from '@/context/auth-context';
import { Order } from '@food-delivery/types';
import { Brand } from '@/constants/theme';

export default function DriverActiveScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);

  const { data: activeOrders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['driver-active-orders'],
    queryFn: () =>
      api
        .get<Order[]>('/orders/mine')
        .then((r) => r.data.filter((o) => o.status === 'PICKED_UP')),
  });

  const activeOrder = activeOrders[0] ?? null;

  const { mutate: markDelivered, isPending } = useMutation({
    mutationFn: (orderId: string) =>
      api.patch(`/orders/${orderId}/status`, { status: 'DELIVERED' }),
    onSuccess: () => {
      stopTracking();
      queryClient.invalidateQueries({ queryKey: ['driver-active-orders'] });
      queryClient.invalidateQueries({ queryKey: ['driver-orders'] });
    },
    onError: (e: any) =>
      Alert.alert('Error', e?.response?.data?.message ?? 'Something went wrong'),
  });

  async function startTracking(orderId: string) {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      Alert.alert(
        'Permission denied',
        'Location permission is required for delivery tracking.',
      );
      return;
    }

    socketRef.current = io(`${process.env.EXPO_PUBLIC_SERVER_URL}/orders`, {
      transports: ['websocket'],
    });

    locationWatchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000,
        distanceInterval: 10,
      },
      (location) => {
        socketRef.current?.emit('driver:location', {
          driverId: user?.id,
          orderId,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      },
    );
  }

  function stopTracking() {
    locationWatchRef.current?.remove();
    socketRef.current?.disconnect();
    locationWatchRef.current = null;
    socketRef.current = null;
  }

  useEffect(() => {
    if (activeOrder) {
      void startTracking(activeOrder.id);
    }
    return () => stopTracking();
  }, [activeOrder?.id]);

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

  if (!activeOrder) {
    return (
      <View style={styles.bgContainer}>
        <Image
          source={require('../../../assets/images/driver.jpeg')}
          style={styles.bgImage}
        />
        <View style={styles.bgOverlay} />
        <SafeAreaView style={styles.contentContainer} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.title}>Active Delivery</Text>
          </View>
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="car-outline" size={48} color="rgba(255,255,255,0.6)" />
            </View>
            <Text style={styles.emptyTitle}>No active delivery</Text>
            <Text style={styles.emptySubtitle}>
              Accept an order on Home, or tap a PICKED_UP order in History
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const orderDate = new Date(activeOrder.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

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
          <Text style={styles.title}>Active Delivery</Text>
        </View>

        {/* Delivery Card */}
        <View style={styles.deliveryCard}>
          <View style={styles.deliveryCardHeader}>
            <View style={styles.orderIdContainer}>
              <Ionicons name="receipt" size={16} color={Brand.orange} />
              <Text style={styles.orderId}>
                #{activeOrder.id.slice(0, 8).toUpperCase()}
              </Text>
            </View>
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Active</Text>
            </View>
          </View>

          <View style={styles.deliveryDetails}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="location" size={16} color="#3B82F6" />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Deliver to</Text>
                <Text style={styles.detailValue} numberOfLines={2}>
                  {activeOrder.deliveryAddress}
                </Text>
              </View>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="time" size={16} color="#8B5CF6" />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Order time</Text>
                <Text style={styles.detailValue}>{orderDate}</Text>
              </View>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="cash" size={16} color="#22C55E" />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Earning</Text>
                <Text style={[styles.detailValue, { color: '#22C55E' }]}>
                  $2.99
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tracking Status */}
        <View style={styles.trackingCard}>
          <View style={styles.trackingContent}>
            <View style={styles.trackingPulse}>
              <View style={styles.trackingPulseRing} />
              <Ionicons name="radio" size={20} color="#22C55E" />
            </View>
            <View>
              <Text style={styles.trackingTitle}>Broadcasting location</Text>
              <Text style={styles.trackingSubtitle}>
                Customer can see your live location
              </Text>
            </View>
          </View>
        </View>

        {/* Mark Delivered Button */}
        <View style={styles.bottomSection}>
          <Pressable
            style={({ pressed }) => [
              styles.deliveredButton,
              pressed && styles.deliveredButtonPressed,
            ]}
            onPress={() => {
              Alert.alert('Confirm delivery?', 'Mark this order as delivered?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delivered', onPress: () => markDelivered(activeOrder.id) },
              ]);
            }}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                <Text style={styles.deliveredButtonText}>Mark as Delivered</Text>
              </>
            )}
          </Pressable>
        </View>
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

  // ─── Delivery Card ─────────────────────────────────────────────
  deliveryCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  deliveryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  activeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },

  // Details
  deliveryDetails: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    marginTop: 2,
  },
  detailDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F3F4F6',
    marginVertical: 2,
  },

  // ─── Tracking ──────────────────────────────────────────────────
  trackingCard: {
    backgroundColor: 'rgba(34,197,94,0.9)',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
  },
  trackingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trackingPulse: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackingPulseRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34,197,94,0.2)',
  },
  trackingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trackingSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },

  // ─── Bottom ────────────────────────────────────────────────────
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  deliveredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Brand.orange,
    borderRadius: 16,
    paddingVertical: 18,
    shadowColor: Brand.orange,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  deliveredButtonPressed: {
    opacity: 0.9,
  },
  deliveredButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  // ─── Empty State ───────────────────────────────────────────────
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
