import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/axios';
import { RestaurantType } from '@food-delivery/types';
import { useDebounce } from '@/hooks/use-debounce';
import { getImageUrl } from '@/lib/image-url';
import { useLocationStore } from '@/store/location-store';
import { Brand, Radius, Spacing } from '@/constants/theme';
import LocationPicker from '@/components/location-picker';

export default function CustomerHomeScreen() {
  const [search, setSearch] = useState('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const { address } = useLocationStore();

  const {
    data: restaurants = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<RestaurantType[]>({
    queryKey: ['restaurants', debouncedSearch],
    queryFn: () =>
      api
        .get<RestaurantType[]>('/restaurants', {
          params: debouncedSearch ? { search: debouncedSearch } : undefined,
        })
        .then((r) => r.data),
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayAddress = address
    ? address.length > 25
      ? `${address.slice(0, 25)}...`
      : address
    : 'Deliver to';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.greeting}>{greeting()} 👋</Text>
          <Pressable
            style={({ pressed }) => [
              styles.locationButton,
              pressed && styles.locationButtonPressed,
            ]}
            onPress={() => setShowLocationPicker(true)}
          >
            <Ionicons name="location" size={14} color={Brand.orange} />
            <Text style={styles.locationText} numberOfLines={1}>
              {displayAddress}
            </Text>
            <Ionicons name="chevron-down" size={12} color={Brand.orange} />
          </Pressable>
        </View>
        <Text style={styles.heading}>What are you craving?</Text>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants or cuisine..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#D1D5DB" />
            </Pressable>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Brand.orange} />
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={Brand.orange}
              colors={[Brand.orange]}
            />
          }
          ListHeaderComponent={
            !debouncedSearch && restaurants.length > 0 ? (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Featured Restaurants</Text>
                <Text style={styles.sectionCount}>
                  {restaurants.length} available
                </Text>
              </View>
            ) : debouncedSearch && restaurants.length > 0 ? (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Search Results</Text>
                <Text style={styles.sectionCount}>
                  {restaurants.length} found
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons
                  name="restaurant-outline"
                  size={40}
                  color="#D1D5DB"
                />
              </View>
              <Text style={styles.emptyTitle}>No restaurants found</Text>
              <Text style={styles.emptySubtitle}>
                {debouncedSearch
                  ? `No results for "${debouncedSearch}". Try a different search.`
                  : 'No restaurants available right now. Check back later!'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
                !item.isOpen && styles.cardClosed,
              ]}
              onPress={() =>
                router.push(
                  `/(customer)/(tabs)/(home)/restaurant/${item.id}`,
                )
              }
            >
              {/* Image */}
              {item.imageUrl ? (
                <View style={styles.cardImageContainer}>
                  <Image
                    source={{ uri: getImageUrl(item.imageUrl) }}
                    style={[styles.cardImage, !item.isOpen && styles.cardImageClosed]}
                  />
                  <View style={[styles.cardImageOverlay, !item.isOpen && styles.cardOverlayClosed]} />
                  {Number(item.rating) > 0 && (
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={12} color="#FFF" />
                      <Text style={styles.ratingText}>
                        {Number(item.rating).toFixed(1)}
                      </Text>
                    </View>
                  )}
                  <View style={item.isOpen ? styles.openBadge : styles.closedBadge}>
                    {item.isOpen && <View style={styles.openDot} />}
                    <Text style={item.isOpen ? styles.openText : styles.closedText}>
                      {item.isOpen ? 'Open' : 'Closed'}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.cardImagePlaceholder, !item.isOpen && styles.cardImagePlaceholderClosed]}>
                  <Ionicons
                    name="restaurant-outline"
                    size={32}
                    color={!item.isOpen ? '#B0B0B0' : '#D1D5DB'}
                  />
                  {Number(item.rating) > 0 && (
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={12} color="#FFF" />
                      <Text style={styles.ratingText}>
                        {Number(item.rating).toFixed(1)}
                      </Text>
                    </View>
                  )}
                  <View style={item.isOpen ? styles.openBadge : styles.closedBadge}>
                    {item.isOpen && <View style={styles.openDot} />}
                    <Text style={item.isOpen ? styles.openText : styles.closedText}>
                      {item.isOpen ? 'Open' : 'Closed'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Card Body */}
              <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                </View>
                <View style={styles.cardMeta}>
                  <View style={[styles.cuisineTag, !item.isOpen && styles.cuisineTagClosed]}>
                    <Ionicons
                      name="restaurant"
                      size={11}
                      color={Brand.orange}
                    />
                    <Text style={[styles.cuisineText, !item.isOpen && styles.cuisineTextClosed]}>{item.cuisineType}</Text>
                  </View>
                  <View style={styles.addressRow}>
                    <Ionicons
                      name="location-outline"
                      size={12}
                      color="#9CA3AF"
                    />
                    <Text style={styles.addressText} numberOfLines={1}>
                      {item.address}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}

      {/* Location Picker Modal */}
      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
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
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3ED',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    maxWidth: '55%',
  },
  locationButtonPressed: {
    opacity: 0.7,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.orange,
    flexShrink: 1,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.5,
    marginBottom: 16,
  },

  // ─── Search ────────────────────────────────────────────────────
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F8',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A2E',
    padding: 0,
  },

  // ─── List ──────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.2,
  },
  sectionCount: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // ─── Restaurant Card ───────────────────────────────────────────
  card: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.97,
    transform: [{ scale: 0.995 }],
  },
  cardClosed: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  cardImageContainer: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backdropFilter: 'blur(4px)',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  openBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34,197,94,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  openDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  openText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  closedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardImageClosed: {
    opacity: 0.6,
  },
  cardOverlayClosed: {
    backgroundColor: 'rgba(128,128,128,0.25)',
  },
  cardImagePlaceholderClosed: {
    backgroundColor: '#E8E8E8',
  },

  // Card Body
  cardBody: {
    padding: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.2,
    flex: 1,
  },
  cardNameClosed: {
    color: '#9CA3AF',
  },
  cardMeta: {
    gap: 8,
  },
  cuisineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF3ED',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  cuisineText: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.orange,
  },
  cuisineTagClosed: {
    backgroundColor: '#F3F4F6',
  },
  cuisineTextClosed: {
    color: '#9CA3AF',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressText: {
    fontSize: 13,
    color: '#9CA3AF',
    flex: 1,
  },

  // ─── Empty State ───────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});
