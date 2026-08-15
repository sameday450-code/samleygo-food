import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/axios';
import { useAuth } from '@/context/auth-context';
import { Order } from '@food-delivery/types';
import { Brand } from '@/constants/theme';

let socket: Socket | null = null;

export default function DriverHomeScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [incomingOrder, setIncomingOrder] = useState<Order | null>(null);

  const { data: status, isLoading } = useQuery<{ isOnline: boolean }>({
    queryKey: ['driver-status'],
    queryFn: () =>
      api.get<{ isOnline: boolean }>('/driver/status').then((r) => r.data),
  });

  const { mutate: toggleOnline, isPending: toggling } = useMutation({
    mutationFn: () => api.patch('/driver/online'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['driver-status'] }),
  });

  const { mutate: declineOrder } = useMutation({
    mutationFn: (orderId: string) => api.post(`/driver/orders/${orderId}/decline`),
    onSuccess: () => setIncomingOrder(null),
    onError: (e: any) =>
      Alert.alert('Error', e?.response?.data?.message ?? 'Something went wrong'),
  });

  const { mutate: acceptOrder } = useMutation({
    mutationFn: (orderId: string) =>
      api.patch(`/orders/${orderId}/status`, { status: 'PICKED_UP' }),
    onSuccess: () => {
      setIncomingOrder(null);
      queryClient.invalidateQueries({ queryKey: ['driver-active-orders'] });
    },
    onError: (e: any) =>
      Alert.alert('Error', e?.response?.data?.message ?? 'Something went wrong'),
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['driver-orders'],
    queryFn: () => api.get<Order[]>('/orders/mine').then((r) => r.data),
  });

  const todayDeliveries = orders.filter((o) => {
    const orderDate = new Date(o.createdAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString() && o.status === 'DELIVERED';
  }).length;

  const totalDeliveries = orders.filter((o) => o.status === 'DELIVERED').length;
  const earnings = orders.filter((o) => o.status === 'DELIVERED').reduce((sum) => sum + 2.99, 0);

  useEffect(() => {
    if (!user?.id) return;

    socket = io(`${process.env.EXPO_PUBLIC_SERVER_URL}/orders`, {
      transports: ['websocket'],
    });

    socket.emit('join:driver', user.id);

    socket.on('driver:assigned', (order: Order) => {
      setIncomingOrder(order);
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [user?.id]);

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

  const isOnline = status?.isOnline ?? false;

  return (
    <View style={styles.bgContainer}>
      {/* Background Image */}
      <Image
        source={require('../../../assets/images/driver.jpeg')}
        style={styles.bgImage}
      />
      <View style={styles.bgOverlay} />

      <SafeAreaView style={styles.contentContainer} edges={['top']}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.greeting}>Hey, {user?.firstName} 👋</Text>
            <Text style={styles.heading}>Driver Dashboard</Text>
            <Text style={styles.heroSubtext}>Ready to hit the road?</Text>
          </View>

          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusLeft}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isOnline ? '#22C55E' : '#EF4444' },
                  ]}
                />
                <View>
                  <Text style={styles.statusLabel}>
                    {isOnline ? 'You are Online' : 'You are Offline'}
                  </Text>
                  <Text style={styles.statusText}>
                    {isOnline
                      ? 'Ready to receive deliveries'
                      : 'Go online to start delivering'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isOnline}
                onValueChange={() => toggleOnline()}
                disabled={toggling}
                trackColor={{ false: '#FECACA', true: '#BBF7D0' }}
                thumbColor={isOnline ? '#22C55E' : '#EF4444'}
              />
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FFF3ED' }]}>
                <Ionicons name="bicycle" size={22} color={Brand.orange} />
              </View>
              <Text style={styles.statValue}>{todayDeliveries}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="checkmark-done-circle" size={22} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>{totalDeliveries}</Text>
              <Text style={styles.statLabel}>All Time</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="wallet" size={22} color="#22C55E" />
              </View>
              <Text style={styles.statValue}>${earnings.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Incoming Order Modal */}
      <Modal visible={!!incomingOrder} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHandle} />

            <View style={styles.modalPulseContainer}>
              <View style={styles.modalPulseRing} />
              <View style={styles.modalPulseDot} />
            </View>

            <Text style={styles.modalTitle}>New Delivery Request</Text>
            <Text style={styles.modalSubtitle}>
              You have a new order to deliver
            </Text>

            <View style={styles.modalOrderCard}>
              <View style={styles.modalOrderRow}>
                <View style={styles.modalOrderIcon}>
                  <Ionicons name="receipt" size={16} color={Brand.orange} />
                </View>
                <View style={styles.modalOrderInfo}>
                  <Text style={styles.modalOrderLabel}>Order</Text>
                  <Text style={styles.modalOrderValue}>
                    #{incomingOrder?.id.slice(0, 8).toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.modalOrderDivider} />

              <View style={styles.modalOrderRow}>
                <View style={styles.modalOrderIcon}>
                  <Ionicons name="location" size={16} color="#3B82F6" />
                </View>
                <View style={styles.modalOrderInfo}>
                  <Text style={styles.modalOrderLabel}>Deliver to</Text>
                  <Text style={styles.modalOrderValue} numberOfLines={2}>
                    {incomingOrder?.deliveryAddress}
                  </Text>
                </View>
              </View>

              <View style={styles.modalOrderDivider} />

              <View style={styles.modalOrderRow}>
                <View style={styles.modalOrderIcon}>
                  <Ionicons name="cash" size={16} color="#22C55E" />
                </View>
                <View style={styles.modalOrderInfo}>
                  <Text style={styles.modalOrderLabel}>Earning</Text>
                  <Text style={[styles.modalOrderValue, { color: '#22C55E' }]}>
                    $2.99
                  </Text>
                </View>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.acceptButton,
                pressed && styles.acceptButtonPressed,
              ]}
              onPress={() => {
                if (incomingOrder) acceptOrder(incomingOrder.id);
              }}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.acceptButtonText}>Accept Delivery</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.declineButton,
                pressed && styles.declineButtonPressed,
              ]}
              onPress={() => {
                if (incomingOrder) declineOrder(incomingOrder.id);
              }}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Header ────────────────────────────────────────────────────
  header: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },

  // ─── Status Card ───────────────────────────────────────────────
  statusCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  statusText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },

  // ─── Stats Grid ────────────────────────────────────────────────
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // ─── Modal ─────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
  },
  modalPulseContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalPulseRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(34,197,94,0.15)',
  },
  modalPulseDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22C55E',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 20,
  },

  // Order Details
  modalOrderCard: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  modalOrderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  modalOrderIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOrderInfo: {
    flex: 1,
  },
  modalOrderLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalOrderValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    marginTop: 2,
  },
  modalOrderDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginVertical: 2,
  },

  // Buttons
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 16,
    paddingVertical: 18,
    shadowColor: '#22C55E',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  acceptButtonPressed: {
    opacity: 0.9,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  declineButton: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  declineButtonPressed: {
    opacity: 0.7,
  },
  declineButtonText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
  },
});
