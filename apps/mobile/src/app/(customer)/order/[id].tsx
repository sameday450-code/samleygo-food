import { useEffect, useState } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useStripe } from '@stripe/stripe-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/axios';
import { Order } from '@food-delivery/types';
import {
  useOrderSocket,
  useDriverLocationSocket,
} from '@/hooks/use-order-socket';
import { RatingModal } from '@/components/rating-modal';
import {
  Brand,
  Radius,
  Spacing,
  STATUS_COLORS,
  STATUS_BG_COLORS,
} from '@/constants/theme';

const STATUS_STEPS = [
  { key: 'CONFIRMED', label: 'Order Confirmed', icon: 'checkmark-circle' as const },
  { key: 'PREPARING', label: 'Being Prepared', icon: 'flame' as const },
  { key: 'READY', label: 'Ready for Pickup', icon: 'bag-check' as const },
  { key: 'PICKED_UP', label: 'Driver Picked Up', icon: 'bicycle' as const },
  { key: 'DELIVERED', label: 'Delivered', icon: 'heart' as const },
];

const STATUS_ORDER = [
  'CONFIRMED',
  'PREPARING',
  'READY',
  'PICKED_UP',
  'DELIVERED',
];

export default function OrderConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const orderUpdate = useOrderSocket(id ?? null);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const [cachedDriverLocation, setCachedDriverLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    if (orderUpdate) {
      queryClient.setQueryData(['order', id], (old: unknown) => ({
        ...(old as object),
        ...orderUpdate,
      }));
    }
  }, [orderUpdate, id, queryClient]);

  const {
    data: order,
    isLoading,
    refetch,
  } = useQuery<Order & { items: any[] }>({
    queryKey: ['order', id],
    queryFn: () =>
      api.get<Order & { items: any[] }>(`/orders/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  useEffect(() => {
    if (!id || order?.status !== 'DELIVERED') return;
    api
      .get<{ reviewed: boolean }>(`/reviews/order/${id}/status`)
      .then((r) => {
        if (r.data.reviewed) setRatingSubmitted(true);
      })
      .catch(() => {});
  }, [id, order?.status]);

  useEffect(() => {
    if (order?.status === 'DELIVERED' && !ratingSubmitted) {
      const timer = setTimeout(() => setShowRatingModal(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [order?.status, ratingSubmitted]);

  const { mutate: submitReview, isPending: isSubmittingReview } = useMutation({
    mutationFn: (data: {
      restaurantRating: number;
      driverRating?: number;
      comment?: string;
    }) => api.post('/reviews', { orderId: id, ...data }),
    onSuccess: () => {
      setShowRatingModal(false);
      setRatingSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
    onError: () => {
      setShowRatingModal(false);
      setRatingSubmitted(true);
    },
  });

  const liveDriverLocation = useDriverLocationSocket(
    order?.status === 'PICKED_UP' ? (id ?? null) : null,
  );

  useEffect(() => {
    if (!id || !order?.driverId || order?.status !== 'PICKED_UP') return;

    api
      .get<{ latitude: number; longitude: number } | null>(`/location/${id}`)
      .then((r) => {
        if (r.data) setCachedDriverLocation(r.data);
      })
      .catch(() => {});
  }, [id, order?.driverId, order?.status]);

  const driverLocation = liveDriverLocation ?? cachedDriverLocation;
  const showMap = !!driverLocation && order?.status === 'PICKED_UP';

  async function handlePayment() {
    if (!order) return;
    setPaymentLoading(true);

    try {
      const res = await api.post<{ clientSecret: string }>('/payments/intent', {
        orderId: order.id,
      });

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Food Delivery',
        paymentIntentClientSecret: res.data.clientSecret,
      });

      if (initError) {
        Alert.alert('Payment setup failed', initError.message);
        return;
      }

      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        Alert.alert('Payment failed', paymentError.message);
        return;
      }

      let confirmed = false;
      for (let i = 0; i < 5; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const { data } = await refetch();
        if (data?.status === 'CONFIRMED') {
          confirmed = true;
          break;
        }
      }

      if (confirmed) {
        Alert.alert('Payment confirmed!', 'Your order is being prepared.');
      } else {
        Alert.alert(
          'Payment submitted',
          'Your payment is being processed. Check your order status shortly.',
        );
      }
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.response?.data?.message ?? 'Something went wrong',
      );
    } finally {
      setPaymentLoading(false);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Brand.orange} />
        </View>
      </SafeAreaView>
    );
  }

  const currentIndex = STATUS_ORDER.indexOf(order?.status ?? '');
  const statusColor = STATUS_COLORS[order?.status ?? 'PENDING'] || Brand.orange;
  const statusBgColor =
    STATUS_BG_COLORS[order?.status ?? 'PENDING'] || Brand.orangeLight;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Status */}
        <View style={styles.header}>
          <View
            style={[
              styles.statusIconContainer,
              { backgroundColor: statusBgColor },
            ]}
          >
            <Ionicons
              name={
                order?.status === 'CONFIRMED'
                  ? 'checkmark-circle'
                  : order?.status === 'CANCELLED'
                    ? 'close-circle'
                    : 'gift'
              }
              size={48}
              color={statusColor}
            />
          </View>

          <Text style={styles.title}>
            {order?.status === 'CONFIRMED'
              ? 'Order Confirmed!'
              : order?.status === 'CANCELLED'
                ? 'Order Cancelled'
                : 'Order Placed!'}
          </Text>

          <Text style={styles.subtitle}>
            {order?.status === 'CONFIRMED'
              ? 'Your payment was successful'
              : order?.status === 'CANCELLED'
                ? 'This order has been cancelled'
                : 'Complete your payment below'}
          </Text>
        </View>

        {/* Order Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {order?.status}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="receipt-outline" size={18} color="#6B7280" />
              <View>
                <Text style={styles.summaryLabel}>Order ID</Text>
                <Text style={styles.summaryValue}>
                  #{order?.id.slice(0, 8).toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <Ionicons name="card-outline" size={18} color="#6B7280" />
              <View>
                <Text style={styles.summaryLabel}>Total</Text>
                <Text style={styles.summaryValue}>${order?.totalAmount}</Text>
              </View>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryItem, styles.fullWidth]}>
              <Ionicons name="location-outline" size={18} color="#6B7280" />
              <View style={styles.summaryItemContent}>
                <Text style={styles.summaryLabel}>Delivery to</Text>
                <Text style={styles.summaryValue} numberOfLines={2}>
                  {order?.deliveryAddress}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment Button (if pending) */}
        {order?.status === 'PENDING' && (
          <Pressable
            style={({ pressed }) => [
              styles.payButton,
              pressed && styles.payButtonPressed,
            ]}
            onPress={() => {
              void handlePayment();
            }}
            disabled={paymentLoading}
          >
            {paymentLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.payButtonContent}>
                <Ionicons name="card" size={20} color="#fff" />
                <Text style={styles.payButtonText}>
                  Pay ${order?.totalAmount}
                </Text>
              </View>
            )}
          </Pressable>
        )}

        {/* Live Map (when driver is en route) */}
        {showMap && (
          <View style={styles.mapContainer}>
            <View style={styles.mapHeader}>
              <Ionicons name="navigate" size={20} color={Brand.orange} />
              <Text style={styles.mapTitle}>Live Tracking</Text>
            </View>
            <MapView
              style={styles.map}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              region={{
                latitude: driverLocation.latitude,
                longitude: driverLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={driverLocation}
                title="Your driver"
                description="On the way to you"
              >
                <View style={styles.driverMarker}>
                  <Ionicons name="bicycle" size={20} color="#fff" />
                </View>
              </Marker>
            </MapView>
          </View>
        )}

        {/* Order Progress Tracker */}
        {order?.status === 'CANCELLED' ? (
          <View style={styles.cancelledCard}>
            <Ionicons name="close-circle" size={32} color={Brand.red} />
            <Text style={styles.cancelledText}>Order Cancelled</Text>
            <Text style={styles.cancelledSubtext}>
              If you have any questions, please contact support.
            </Text>
          </View>
        ) : order?.status !== 'PENDING' ? (
          <View style={styles.trackerCard}>
            <View style={styles.trackerHeader}>
              <Ionicons name="time-outline" size={20} color={Brand.orange} />
              <Text style={styles.trackerTitle}>Order Progress</Text>
            </View>

            <View style={styles.progressContainer}>
              {/* Progress Bar */}
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${((currentIndex + 1) / STATUS_STEPS.length) * 100}%`,
                    },
                  ]}
                />
              </View>

              {/* Steps */}
              {STATUS_STEPS.map((step, index) => {
                const isCompleted = index <= currentIndex;
                const isActive = index === currentIndex;
                const isLast = index === STATUS_STEPS.length - 1;

                return (
                  <View key={step.key} style={styles.stepContainer}>
                    <View style={styles.stepLeft}>
                      <View
                        style={[
                          styles.stepIconContainer,
                          isCompleted && styles.stepIconCompleted,
                          isActive && styles.stepIconActive,
                        ]}
                      >
                        <Ionicons
                          name={step.icon}
                          size={16}
                          color={isCompleted ? '#fff' : '#9CA3AF'}
                        />
                      </View>
                      {!isLast && (
                        <View
                          style={[
                            styles.stepLine,
                            isCompleted && styles.stepLineCompleted,
                          ]}
                        />
                      )}
                    </View>

                    <View style={styles.stepContent}>
                      <Text
                        style={[
                          styles.stepLabel,
                          isActive && styles.stepLabelActive,
                          isCompleted && styles.stepLabelCompleted,
                        ]}
                      >
                        {step.label}
                      </Text>
                      {isActive && (
                        <Text style={styles.stepTime}>
                          {new Date().toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.homeButton,
              pressed && styles.homeButtonPressed,
            ]}
            onPress={() => router.replace('/(customer)/(tabs)/(home)')}
          >
            <Ionicons name="home" size={20} color={Brand.orange} />
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </Pressable>
        </View>
      </ScrollView>

      <RatingModal
        visible={showRatingModal}
        hasDriver={!!order?.driverId}
        onSubmit={submitReview}
        onDismiss={() => {
          setShowRatingModal(false);
          setRatingSubmitted(true);
        }}
        isSubmitting={isSubmittingReview}
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
  scrollContent: {
    paddingBottom: 120,
  },

  // ─── Header ────────────────────────────────────────────────────
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  statusIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },

  // ─── Summary Card ──────────────────────────────────────────────
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  fullWidth: {
    flex: 2,
  },
  summaryItemContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    lineHeight: 22,
  },

  // ─── Payment Button ────────────────────────────────────────────
  payButton: {
    backgroundColor: Brand.orange,
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: Brand.orange,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  payButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  payButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ─── Map ───────────────────────────────────────────────────────
  mapContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    paddingBottom: 12,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  map: {
    width: '100%',
    height: 200,
  },
  driverMarker: {
    backgroundColor: Brand.orange,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  // ─── Tracker Card ──────────────────────────────────────────────
  trackerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  trackerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  trackerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  progressContainer: {
    paddingLeft: 8,
  },
  progressBarBg: {
    position: 'absolute',
    left: 24,
    top: 24,
    bottom: 24,
    width: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
  },
  progressBarFill: {
    position: 'absolute',
    left: 24,
    top: 24,
    width: 4,
    backgroundColor: Brand.green,
    borderRadius: 2,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepLeft: {
    alignItems: 'center',
    width: 48,
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconCompleted: {
    backgroundColor: Brand.green,
  },
  stepIconActive: {
    backgroundColor: Brand.orange,
    shadowColor: Brand.orange,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  stepLine: {
    width: 2,
    height: 24,
    backgroundColor: '#F3F4F6',
    marginTop: 4,
  },
  stepLineCompleted: {
    backgroundColor: Brand.green,
  },
  stepContent: {
    flex: 1,
    paddingTop: 12,
    paddingLeft: 12,
  },
  stepLabel: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#1A1A2E',
    fontWeight: '700',
  },
  stepLabelCompleted: {
    color: '#374151',
    fontWeight: '600',
  },
  stepTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // ─── Cancelled Card ────────────────────────────────────────────
  cancelledCard: {
    backgroundColor: Brand.redLight,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelledText: {
    fontSize: 18,
    fontWeight: '700',
    color: Brand.red,
    marginTop: 12,
  },
  cancelledSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },

  // ─── Actions ───────────────────────────────────────────────────
  actionsContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  homeButtonPressed: {
    backgroundColor: '#F9FAFB',
    borderColor: Brand.orange,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Brand.orange,
  },
});
