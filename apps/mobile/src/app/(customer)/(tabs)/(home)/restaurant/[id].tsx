import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/axios';
import { useCartStore } from '@/store/cart-store';
import { MenuCategory, MenuItem, RestaurantType } from '@food-delivery/types';
import { getImageUrl } from '@/lib/image-url';
import { Brand, Radius, Spacing } from '@/constants/theme';

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addItem, restaurantId, clearCart, items } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const {
    data: restaurant,
    isLoading: loadingRestaurant,
    refetch: refetchRestaurant,
    isRefetching: isRefetchingRestaurant,
  } = useQuery<RestaurantType>({
    queryKey: ['restaurant', id],
    queryFn: () =>
      api.get<RestaurantType>(`/restaurants/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const {
    data: categories = [],
    refetch: refetchCategories,
    isRefetching: isRefetchingCategories,
  } = useQuery<MenuCategory[]>({
    queryKey: ['categories', id],
    queryFn: () =>
      api.get<MenuCategory[]>(`/menu/categories/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const {
    data: menuItems = [],
    refetch: refetchItems,
    isRefetching: isRefetchingItems,
  } = useQuery<MenuItem[]>({
    queryKey: ['menu-items', id],
    queryFn: () =>
      api.get<MenuItem[]>(`/menu/items/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const isRefetching =
    isRefetchingRestaurant || isRefetchingCategories || isRefetchingItems;

  function onRefresh() {
    refetchRestaurant();
    refetchCategories();
    refetchItems();
  }

  const cartItemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = items.reduce(
    (sum, i) => sum + parseFloat(i.price) * i.quantity,
    0,
  );

  // Filter categories that have items (treat null/undefined as available)
  const activeCategories = categories.filter((cat) =>
    menuItems.some((i) => i.categoryId === cat.id && i.isAvailable !== false),
  );

  // Filter items based on selected category
  const filteredCategories = selectedCategory
    ? activeCategories.filter((c) => c.id === selectedCategory)
    : activeCategories;

  function handleAddItem(item: MenuItem) {
    if (!restaurant) return;

    if (restaurantId && restaurantId !== item.restaurantId) {
      Alert.alert(
        'Start new cart?',
        `Your cart has items from ${useCartStore.getState().restaurantName}. Clear cart and add from ${restaurant.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear & Add',
            style: 'destructive',
            onPress: () => {
              clearCart();
              addItem({
                id: item.id,
                name: item.name,
                price: item.price,
                imageUrl: item.imageUrl,
                restaurantId: item.restaurantId,
                restaurantName: restaurant.name,
              });
            },
          },
        ],
      );
      return;
    }

    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      restaurantId: item.restaurantId,
      restaurantName: restaurant.name,
    });
  }

  function getItemQuantity(itemId: string) {
    return items.find((i) => i.id === itemId)?.quantity ?? 0;
  }

  if (loadingRestaurant) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Brand.orange} />
        </View>
      </SafeAreaView>
    );
  }

  if (!restaurant) return null;

  const totalAvailable = menuItems.filter((i) => i.isAvailable !== false).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={Brand.orange}
            colors={[Brand.orange]}
          />
        }
        contentContainerStyle={{
          paddingBottom: cartItemCount > 0 ? 200 : 160,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        {restaurant.imageUrl ? (
          <View style={styles.heroContainer}>
            <Image
              source={{ uri: getImageUrl(restaurant.imageUrl) }}
              style={styles.heroImage}
            />
            <View style={styles.heroGradient} />
            {/* Back Button */}
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color="#FFF" />
            </Pressable>
            {/* Share Button */}
            <Pressable style={styles.shareButton}>
              <Ionicons name="heart-outline" size={20} color="#FFF" />
            </Pressable>
            {/* Bottom Gradient Info */}
            <View style={styles.heroBottomInfo}>
              <View style={styles.heroRatingBadge}>
                <Ionicons name="star" size={14} color="#FFF" />
                <Text style={styles.heroRatingText}>
                  {Number(restaurant.rating).toFixed(1)}
                </Text>
              </View>
              {restaurant.isOpen && (
                <View style={styles.heroOpenBadge}>
                  <View style={styles.heroOpenDot} />
                  <Text style={styles.heroOpenText}>Open Now</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.heroPlaceholder}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color="#FFF" />
            </Pressable>
          </View>
        )}

        {/* Restaurant Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.name}>{restaurant.name}</Text>
            <View style={styles.cuisineTag}>
              <Ionicons name="restaurant" size={12} color={Brand.orange} />
              <Text style={styles.cuisineText}>{restaurant.cuisineType}</Text>
            </View>
          </View>

          {restaurant.description ? (
            <Text style={styles.description}>{restaurant.description}</Text>
          ) : null}

          {/* Info Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="star" size={16} color="#F59E0B" />
              </View>
              <Text style={styles.statValue}>
                {Number(restaurant.rating) > 0
                  ? Number(restaurant.rating).toFixed(1)
                  : 'New'}
              </Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="time" size={16} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>25-35</Text>
              <Text style={styles.statLabel}>Min</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="bicycle" size={16} color="#22C55E" />
              </View>
              <Text style={styles.statValue}>$2.99</Text>
              <Text style={styles.statLabel}>Delivery</Text>
            </View>
          </View>

          {/* Address */}
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={16} color="#9CA3AF" />
            <Text style={styles.addressText} numberOfLines={1}>
              {restaurant.address}
            </Text>
            <Pressable style={styles.directionsButton}>
              <Ionicons name="navigate" size={14} color={Brand.orange} />
            </Pressable>
          </View>
        </View>

        {/* Category Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabsContainer}
        >
          <Pressable
            style={({ pressed }) => [
              styles.categoryTab,
              !selectedCategory && styles.categoryTabActive,
              pressed && styles.categoryTabPressed,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.categoryTabText,
                !selectedCategory && styles.categoryTabTextActive,
              ]}
            >
              All ({totalAvailable})
            </Text>
          </Pressable>
          {activeCategories.map((cat) => {
            const count = menuItems.filter(
              (i) => i.categoryId === cat.id && i.isAvailable !== false,
            ).length;
            const isActive = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                style={({ pressed }) => [
                  styles.categoryTab,
                  isActive && styles.categoryTabActive,
                  pressed && styles.categoryTabPressed,
                ]}
                onPress={() =>
                  setSelectedCategory(isActive ? null : cat.id)
                }
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    isActive && styles.categoryTabTextActive,
                  ]}
                >
                  {cat.name} ({count})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          {filteredCategories.map((category) => {
            const categoryItems = menuItems.filter(
              (i) => i.categoryId === category.id && i.isAvailable !== false,
            );

            if (categoryItems.length === 0) return null;

            return (
              <View key={category.id} style={styles.categoryBlock}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryLeft}>
                    <View style={styles.categoryIndicator} />
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </View>
                  <Text style={styles.categoryItemCount}>
                    {categoryItems.length} item{categoryItems.length !== 1 ? 's' : ''}
                  </Text>
                </View>

                {categoryItems.map((item) => {
                  const qty = getItemQuantity(item.id);
                  return (
                    <Pressable
                      key={item.id}
                      style={({ pressed }) => [
                        styles.menuItemCard,
                        pressed && styles.menuItemCardPressed,
                      ]}
                      onPress={() => handleAddItem(item)}
                    >
                      {/* Item Image */}
                      {item.imageUrl ? (
                        <View style={styles.itemImageContainer}>
                          <Image
                            source={{ uri: getImageUrl(item.imageUrl) }}
                            style={styles.itemImage}
                          />
                        </View>
                      ) : (
                        <View style={styles.itemImagePlaceholder}>
                          <Ionicons
                            name="restaurant-outline"
                            size={24}
                            color="#D1D5DB"
                          />
                        </View>
                      )}

                      {/* Item Info */}
                      <View style={styles.itemInfo}>
                        <View style={styles.itemNameRow}>
                          <Text style={styles.itemName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          {qty > 0 && (
                            <View style={styles.itemInCartBadge}>
                              <Ionicons name="bag-check" size={10} color={Brand.orange} />
                              <Text style={styles.itemInCartText}>In cart</Text>
                            </View>
                          )}
                        </View>
                        {item.description ? (
                          <Text
                            style={styles.itemDescription}
                            numberOfLines={2}
                          >
                            {item.description}
                          </Text>
                        ) : null}
                        <View style={styles.itemBottom}>
                          <Text style={styles.itemPrice}>
                            ${item.price}
                          </Text>
                          {qty > 0 ? (
                            <View style={styles.qtyControls}>
                              <Pressable
                                style={({ pressed }) => [
                                  styles.qtyButton,
                                  pressed && styles.qtyButtonPressed,
                                ]}
                                onPress={(e) => {
                                  e.stopPropagation?.();
                                  useCartStore.getState().decrementItem(item.id);
                                }}
                              >
                                <Ionicons
                                  name={qty <= 1 ? 'trash-outline' : 'remove'}
                                  size={13}
                                  color={qty <= 1 ? '#EF4444' : '#6B7280'}
                                />
                              </Pressable>
                              <Text style={styles.qtyCount}>{qty}</Text>
                              <Pressable
                                style={({ pressed }) => [
                                  styles.qtyButton,
                                  styles.qtyButtonPlus,
                                  pressed && styles.qtyButtonPlusPressed,
                                ]}
                                onPress={(e) => {
                                  e.stopPropagation?.();
                                  handleAddItem(item);
                                }}
                              >
                                <Ionicons name="add" size={13} color="#FFF" />
                              </Pressable>
                            </View>
                          ) : (
                            <Pressable
                              style={({ pressed }) => [
                                styles.addButton,
                                pressed && styles.addButtonPressed,
                              ]}
                              onPress={(e) => {
                                e.stopPropagation?.();
                                handleAddItem(item);
                              }}
                            >
                              <Ionicons name="add" size={18} color="#FFF" />
                            </Pressable>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Floating Cart Bar */}
      {cartItemCount > 0 && (
        <Pressable
          style={({ pressed }) => [
            styles.floatingCart,
            pressed && styles.floatingCartPressed,
          ]}
          onPress={() => router.push('/(customer)/(tabs)/cart')}
        >
          <View style={styles.floatingCartLeft}>
            <View style={styles.floatingCartBadge}>
              <Text style={styles.floatingCartBadgeText}>{cartItemCount}</Text>
            </View>
            <View>
              <Text style={styles.floatingCartText}>View Cart</Text>
              <Text style={styles.floatingCartSubtext}>
                {cartItemCount} item{cartItemCount !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <View style={styles.floatingCartRight}>
            <Text style={styles.floatingCartTotal}>
              ${cartTotal.toFixed(2)}
            </Text>
            <View style={styles.floatingCartArrow}>
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </View>
          </View>
        </Pressable>
      )}
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

  // ─── Hero ──────────────────────────────────────────────────────
  heroContainer: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 280,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // Gradient simulation with multiple layers
    borderBottomColor: 'rgba(0,0,0,0.4)',
    borderBottomWidth: 80,
  },
  heroPlaceholder: {
    width: '100%',
    height: 280,
    backgroundColor: '#374151',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  shareButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBottomInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    gap: 8,
  },
  heroRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  heroRatingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroOpenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34,197,94,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  heroOpenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  heroOpenText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── Info Card ─────────────────────────────────────────────────
  infoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 22,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  infoHeader: {
    marginBottom: 12,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  cuisineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF3ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  cuisineText: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.orange,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
    marginBottom: 16,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },

  // Address
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
  },
  directionsButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Category Tabs ─────────────────────────────────────────────
  categoryTabsContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 4,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  categoryTabActive: {
    backgroundColor: Brand.orange,
    borderColor: Brand.orange,
  },
  categoryTabPressed: {
    opacity: 0.8,
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    whiteSpace: 'nowrap',
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },

  // ─── Menu Section ──────────────────────────────────────────────
  menuSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // ─── Category ──────────────────────────────────────────────────
  categoryBlock: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: Brand.orange,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.2,
  },
  categoryItemCount: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // ─── Menu Item Card ────────────────────────────────────────────
  menuItemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 14,
    marginBottom: 10,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  menuItemCardPressed: {
    opacity: 0.97,
  },
  itemImageContainer: {
    position: 'relative',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  itemImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.1,
    flex: 1,
  },
  itemInCartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF3ED',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itemInCartText: {
    fontSize: 9,
    fontWeight: '700',
    color: Brand.orange,
  },
  itemDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
    marginBottom: 8,
  },
  itemBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: Brand.orange,
    letterSpacing: -0.2,
  },

  // ─── Add / Qty Controls ────────────────────────────────────────
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Brand.orange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Brand.orange,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  addButtonPressed: {
    opacity: 0.85,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 2,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  qtyButtonPressed: {
    opacity: 0.7,
  },
  qtyButtonPlus: {
    backgroundColor: Brand.orange,
    borderColor: Brand.orange,
  },
  qtyButtonPlusPressed: {
    opacity: 0.8,
  },
  qtyCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    minWidth: 24,
    textAlign: 'center',
  },

  // ─── Floating Cart Bar ─────────────────────────────────────────
  floatingCart: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Brand.orange,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: Brand.orange,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  floatingCartPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  floatingCartBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCartBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  floatingCartText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  floatingCartSubtext: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
  floatingCartRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  floatingCartTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  floatingCartArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
