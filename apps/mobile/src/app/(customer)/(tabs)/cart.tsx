import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { api } from '@/lib/axios';
import { useCartStore } from '@/store/cart-store';
import { useLocationStore } from '@/store/location-store';
import { getImageUrl } from '@/lib/image-url';
import { Brand, Radius, Spacing } from '@/constants/theme';

export default function CartScreen() {
  const {
    items,
    restaurantId,
    restaurantName,
    incrementItem,
    decrementItem,
    clearCart,
  } = useCartStore();
  const { address: savedAddress, setAddress: saveLocation } = useLocationStore();
  const [deliveryAddress, setDeliveryAddress] = useState(savedAddress);
  const [addressFocused, setAddressFocused] = useState(false);
  const [locating, setLocating] = useState(false);
  const locatedRef = useRef(false);

  // Auto-detect location on mount if no address is set
  useEffect(() => {
    if (savedAddress || locatedRef.current) return;
    locatedRef.current = true;
    detectLocation();
  }, []);

  const detectLocation = useCallback(async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocating(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = loc.coords;
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results.length > 0) {
        const r = results[0];
        const formatted = [r.name, r.street, r.city, r.region]
          .filter(Boolean)
          .join(', ');
        if (formatted) {
          setDeliveryAddress(formatted);
          saveLocation(formatted, latitude, longitude);
        }
      }
    } catch {
      // Silently fail — user can type manually
    } finally {
      setLocating(false);
    }
  }, [saveLocation]);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = items.reduce(
    (sum, i) => sum + parseFloat(i.price) * i.quantity,
    0,
  );
  const deliveryFee = items.length > 0 ? 2.99 : 0;
  const grandTotal = cartTotal + deliveryFee;

  const { mutate: placeOrder, isPending } = useMutation({
    mutationFn: () =>
      api.post('/orders', {
        restaurantId,
        deliveryAddress,
        items: items.map((i) => ({
          menuItemId: i.id,
          quantity: String(i.quantity),
        })),
      }),
    onSuccess: (res) => {
      clearCart();
      router.push(`/(customer)/order/${res.data.id}`);
    },
    onError: (e: any) => {
      Alert.alert(
        'Error',
        e?.response?.data?.message ?? 'Could not place order',
      );
    },
  });

  function handlePlaceOrder() {
    if (items.length === 0) return Alert.alert('Your cart is empty');
    if (!deliveryAddress.trim())
      return Alert.alert('Please enter your delivery address');
    placeOrder();
  }

  // ─── Empty State ────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <View style={styles.emptyIconInner}>
              <Ionicons name="cart-outline" size={48} color="#D1D5DB" />
            </View>
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Looks like you haven't added anything yet.{'\n'}Browse restaurants
            to get started.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.emptyButton,
              pressed && styles.emptyButtonPressed,
            ]}
            onPress={() => router.push('/(customer)/(tabs)/(home)')}
          >
            <Ionicons name="search" size={18} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Browse Restaurants</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Cart with items ───────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.heading}>Your Cart</Text>
            <View style={styles.headerMeta}>
              <View style={styles.restaurantPill}>
                <Ionicons name="storefront" size={12} color={Brand.orange} />
                <Text style={styles.restaurantPillText}>{restaurantName}</Text>
              </View>
              <Text style={styles.itemCountBadge}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.clearAllButton,
              pressed && styles.clearAllButtonPressed,
            ]}
            onPress={() =>
              Alert.alert('Clear cart?', 'Remove all items?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: clearCart },
              ])
            }
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={items}
        extraData={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={null}
        renderItem={({ item }) => {
          const lineTotal = parseFloat(item.price) * item.quantity;
          return (
            <View style={styles.cartItemCard}>
              {/* Image */}
              {item.imageUrl ? (
                <Image
                  source={{ uri: getImageUrl(item.imageUrl) }}
                  style={styles.itemImage}
                />
              ) : (
                <View style={styles.itemImagePlaceholder}>
                  <Ionicons name="restaurant-outline" size={24} color="#D1D5DB" />
                </View>
              )}

              {/* Info */}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemUnitPrice}>
                  ${parseFloat(item.price).toFixed(2)}
                </Text>
              </View>

              {/* Quantity & Line Total */}
              <View style={styles.itemRight}>
                <View style={styles.qtyControls}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.qtyButton,
                      item.quantity <= 1 && styles.qtyButtonMuted,
                      pressed && styles.qtyButtonPressed,
                    ]}
                    onPress={() => decrementItem(item.id)}
                  >
                    <Ionicons
                      name={item.quantity <= 1 ? 'trash-outline' : 'remove'}
                      size={14}
                      color={item.quantity <= 1 ? '#EF4444' : '#6B7280'}
                    />
                  </Pressable>
                  <Text style={styles.qtyCount}>{item.quantity}</Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.qtyButton,
                      styles.qtyButtonPlus,
                      pressed && styles.qtyButtonPlusPressed,
                    ]}
                    onPress={() => incrementItem(item.id)}
                  >
                    <Ionicons name="add" size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
                <Text style={styles.lineTotal}>${lineTotal.toFixed(2)}</Text>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <View style={styles.footer}>
            {/* Delivery Address */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="location" size={16} color={Brand.orange} />
                </View>
                <Text style={styles.sectionTitle}>Delivery Address</Text>
              </View>

              {/* Auto-detect button */}
              <Pressable
                style={({ pressed }) => [
                  styles.detectButton,
                  pressed && styles.detectButtonPressed,
                ]}
                onPress={detectLocation}
                disabled={locating}
              >
                {locating ? (
                  <ActivityIndicator size="small" color={Brand.orange} />
                ) : (
                  <Ionicons name="locate" size={16} color={Brand.orange} />
                )}
                <Text style={styles.detectButtonText}>
                  {locating ? 'Detecting location...' : 'Use current location'}
                </Text>
              </Pressable>

              <View
                style={[
                  styles.addressInputWrapper,
                  addressFocused && styles.addressInputFocused,
                ]}
              >
                <Ionicons name="navigate" size={16} color="#9CA3AF" />
                <TextInput
                  style={styles.addressInput}
                  placeholder="Where should we deliver?"
                  placeholderTextColor="#9CA3AF"
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                  onFocus={() => setAddressFocused(true)}
                  onBlur={() => setAddressFocused(false)}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Order Summary */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="receipt" size={16} color={Brand.orange} />
                </View>
                <Text style={styles.sectionTitle}>Order Summary</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${cartTotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryLabelRow}>
                  <Text style={styles.summaryLabel}>Delivery Fee</Text>
                  <View style={styles.deliveryBadge}>
                    <Ionicons name="bicycle" size={10} color={Brand.orange} />
                  </View>
                </View>
                <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>
                  ${grandTotal.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Place Order Button */}
            <Pressable
              style={({ pressed }) => [
                styles.orderButton,
                (!deliveryAddress.trim() || isPending) &&
                  styles.orderButtonDisabled,
                pressed && styles.orderButtonPressed,
              ]}
              onPress={handlePlaceOrder}
              disabled={isPending || !deliveryAddress.trim()}
            >
              {isPending ? (
                <View style={styles.orderButtonLoading}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.orderButtonText}>Placing order...</Text>
                </View>
              ) : (
                <View style={styles.orderButtonContent}>
                  <View style={styles.orderButtonIcon}>
                    <Ionicons name="bag-check" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.orderButtonTextGroup}>
                    <Text style={styles.orderButtonText}>Place Order</Text>
                    <Text style={styles.orderButtonPrice}>
                      ${grandTotal.toFixed(2)}
                    </Text>
                  </View>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="rgba(255,255,255,0.8)"
                  />
                </View>
              )}
            </Pressable>

            {/* Trust signals */}
            <View style={styles.trustRow}>
              <View style={styles.trustItem}>
                <Ionicons name="shield-checkmark" size={14} color="#22C55E" />
                <Text style={styles.trustText}>Secure checkout</Text>
              </View>
              <View style={styles.trustItem}>
                <Ionicons name="time" size={14} color="#3B82F6" />
                <Text style={styles.trustText}>30 min delivery</Text>
              </View>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F8',
  },

  // ─── Header ────────────────────────────────────────────────────
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.4,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  restaurantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3ED',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  restaurantPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.orange,
  },
  itemCountBadge: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  clearAllButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  clearAllButtonPressed: {
    opacity: 0.7,
  },

  // ─── List ──────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },

  // ─── Cart Item Card ────────────────────────────────────────────
  cartItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 12,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },
  itemImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  itemUnitPrice: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 2,
  },
  qtyButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  qtyButtonPressed: {
    opacity: 0.7,
  },
  qtyButtonMuted: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  qtyButtonPlus: {
    backgroundColor: Brand.orange,
    borderColor: Brand.orange,
  },
  qtyButtonPlusPressed: {
    opacity: 0.8,
  },
  qtyCount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    minWidth: 28,
    textAlign: 'center',
  },
  lineTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.1,
  },

  // ─── Footer Sections ───────────────────────────────────────────
  footer: {
    gap: 12,
    marginTop: 8,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    letterSpacing: -0.1,
  },

  // Detect Location
  detectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF3ED',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  detectButtonPressed: {
    opacity: 0.8,
  },
  detectButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.orange,
  },

  // Address
  addressInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  addressInputFocused: {
    borderColor: Brand.orange,
    backgroundColor: '#FFFFFF',
    shadowColor: Brand.orange,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 1,
  },
  addressInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A2E',
    minHeight: 36,
    padding: 0,
    lineHeight: 20,
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFF3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 10,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  summaryTotalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Brand.orange,
    letterSpacing: -0.3,
  },

  // Order Button
  orderButton: {
    backgroundColor: Brand.orange,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    shadowColor: Brand.orange,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  orderButtonPressed: {
    opacity: 0.9,
  },
  orderButtonDisabled: {
    opacity: 0.5,
  },
  orderButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderButtonTextGroup: {
    flex: 1,
    alignItems: 'center',
  },
  orderButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  orderButtonPrice: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  orderButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  // Trust
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 4,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // ─── Empty State ───────────────────────────────────────────────
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  emptyIconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    backgroundColor: Brand.orange,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    gap: 8,
    shadowColor: Brand.orange,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  emptyButtonPressed: {
    opacity: 0.85,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
