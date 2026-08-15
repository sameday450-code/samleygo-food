import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/axios';
import { RestaurantType } from '@food-delivery/types';
import { getImageUrl } from '@/lib/image-url';
import { useDebounce } from '@/hooks/use-debounce';
import { Brand, Radius, Spacing } from '@/constants/theme';

const CUISINE_FILTERS = [
  { label: 'All', icon: 'flame' as const },
  { label: 'Italian', icon: 'pizza' as const },
  { label: 'Chinese', icon: 'restaurant' as const },
  { label: 'Japanese', icon: 'fish' as const },
  { label: 'Indian', icon: 'cafe' as const },
  { label: 'Mexican', icon: 'nutrition' as const },
  { label: 'Ghanaian', icon: 'leaf' as const },
  { label: 'American', icon: 'fast-food' as const },
];

const POPULAR_CATEGORIES = [
  { label: 'Pizza', icon: 'pizza-outline', color: '#EF4444' },
  { label: 'Burgers', icon: 'fast-food-outline', color: '#F59E0B' },
  { label: 'Sushi', icon: 'fish-outline', color: '#3B82F6' },
  { label: 'Salads', icon: 'leaf-outline', color: '#22C55E' },
  { label: 'Desserts', icon: 'ice-cream-outline', color: '#8B5CF6' },
  { label: 'Coffee', icon: 'cafe-outline', color: '#92400E' },
];

export default function CustomerSearchScreen() {
  const [search, setSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [recentSearches] = useState<string[]>([
    'Pizza',
    'Chinese food',
    'Near me',
  ]);

  const debouncedSearch = useDebounce(search, 400);

  const {
    data: restaurants = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<RestaurantType[]>({
    queryKey: ['restaurants', debouncedSearch, selectedCuisine],
    queryFn: () =>
      api
        .get<RestaurantType[]>('/restaurants', {
          params: {
            ...(debouncedSearch ? { search: debouncedSearch } : {}),
            ...(selectedCuisine !== 'All'
              ? { cuisine: selectedCuisine }
              : {}),
          },
        })
        .then((r) => r.data),
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const hasActiveSearch = debouncedSearch.length > 0 || selectedCuisine !== 'All';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Find your next favorite meal</Text>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants, cuisines..."
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

      {/* Cuisine Filter Chips */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {CUISINE_FILTERS.map((filter) => {
            const isActive = selectedCuisine === filter.label;
            return (
              <Pressable
                key={filter.label}
                style={({ pressed }) => [
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                  pressed && styles.filterChipPressed,
                ]}
                onPress={() => setSelectedCuisine(filter.label)}
              >
                <Ionicons
                  name={filter.icon}
                  size={14}
                  color={isActive ? '#FFF' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Results */}
      {hasActiveSearch ? (
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
            restaurants.length > 0 ? (
              <View style={styles.resultHeader}>
                <Text style={styles.resultCount}>
                  {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} found
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="search-outline" size={40} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search or filters
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.resultCard,
                pressed && styles.resultCardPressed,
                !item.isOpen && styles.resultCardClosed,
              ]}
              onPress={() =>
                router.push(
                  `/(customer)/(tabs)/(home)/restaurant/${item.id}`,
                )
              }
            >
              {item.imageUrl ? (
                <Image
                  source={{ uri: getImageUrl(item.imageUrl) }}
                  style={[styles.resultImage, !item.isOpen && styles.resultImageClosed]}
                />
              ) : (
                <View style={[styles.resultImagePlaceholder, !item.isOpen && styles.resultImagePlaceholderClosed]}>
                  <Ionicons
                    name="restaurant-outline"
                    size={24}
                    color={!item.isOpen ? '#B0B0B0' : '#D1D5DB'}
                  />
                </View>
              )}
              <View style={styles.resultInfo}>
                <Text style={[styles.resultName, !item.isOpen && styles.resultNameClosed]} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.resultMeta}>
                  <View style={[styles.resultCuisineTag, !item.isOpen && styles.resultCuisineTagClosed]}>
                    <Ionicons
                      name="restaurant"
                      size={10}
                      color={!item.isOpen ? '#9CA3AF' : Brand.orange}
                    />
                    <Text style={[styles.resultCuisineText, !item.isOpen && styles.resultCuisineTextClosed]}>
                      {item.cuisineType}
                    </Text>
                  </View>
                  {!item.isOpen && (
                    <View style={styles.resultClosedBadge}>
                      <Text style={styles.resultClosedText}>Closed</Text>
                    </View>
                  )}
                </View>
                <View style={styles.resultBottom}>
                  {Number(item.rating) > 0 && (
                    <View style={styles.resultRating}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.resultRatingText}>
                        {Number(item.rating).toFixed(1)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.resultAddressRow}>
                    <Ionicons
                      name="location-outline"
                      size={11}
                      color="#9CA3AF"
                    />
                    <Text style={styles.resultAddress} numberOfLines={1}>
                      {item.address}
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </Pressable>
          )}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.discoverContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <Pressable>
                  <Text style={styles.sectionAction}>Clear</Text>
                </Pressable>
              </View>
              {recentSearches.map((term, index) => (
                <Pressable
                  key={`${term}-${index}`}
                  style={styles.recentItem}
                  onPress={() => setSearch(term)}
                >
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color="#9CA3AF"
                  />
                  <Text style={styles.recentText}>{term}</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color="#D1D5DB"
                  />
                </Pressable>
              ))}
            </View>
          )}

          {/* Popular Categories */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular Categories</Text>
            </View>
            <View style={styles.categoriesGrid}>
              {POPULAR_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.label}
                  style={({ pressed }) => [
                    styles.categoryCard,
                    pressed && styles.categoryCardPressed,
                  ]}
                  onPress={() => setSearch(cat.label)}
                >
                  <View
                    style={[
                      styles.categoryIconContainer,
                      { backgroundColor: `${cat.color}15` },
                    ]}
                  >
                    <Ionicons
                      name={cat.icon as keyof typeof Ionicons.glyphMap}
                      size={24}
                      color={cat.color}
                    />
                  </View>
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Quick Suggestions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Suggestions</Text>
            </View>
            <View style={styles.suggestionChips}>
              {['Open now', 'Free delivery', 'Top rated', 'Nearby'].map(
                (suggestion) => (
                  <Pressable
                    key={suggestion}
                    style={({ pressed }) => [
                      styles.suggestionChip,
                      pressed && styles.suggestionChipPressed,
                    ]}
                    onPress={() => setSearch(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </Pressable>
                ),
              )}
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      )}
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
    marginTop: 2,
  },
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

  // ─── Filter Chips ──────────────────────────────────────────────
  filterSection: {
    paddingTop: 14,
    paddingBottom: 4,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: Brand.orange,
    borderColor: Brand.orange,
  },
  filterChipPressed: {
    opacity: 0.8,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // ─── Results List ──────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
  },
  resultHeader: {
    marginBottom: 12,
  },
  resultCount: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // ─── Result Card ───────────────────────────────────────────────
  resultCard: {
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
  resultCardClosed: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  resultCardPressed: {
    opacity: 0.97,
  },
  resultImage: {
    width: 72,
    height: 72,
    borderRadius: 14,
  },
  resultImagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultImageClosed: {
    opacity: 0.55,
  },
  resultImagePlaceholderClosed: {
    backgroundColor: '#E8E8E8',
  },
  resultInfo: {
    flex: 1,
    minWidth: 0,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  resultNameClosed: {
    color: '#9CA3AF',
  },
  resultMeta: {
    marginBottom: 6,
  },
  resultCuisineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  resultCuisineText: {
    fontSize: 11,
    fontWeight: '600',
    color: Brand.orange,
  },
  resultCuisineTagClosed: {
    backgroundColor: '#F3F4F6',
  },
  resultCuisineTextClosed: {
    color: '#9CA3AF',
  },
  resultClosedBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  resultClosedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  resultBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  resultRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  resultAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  resultAddress: {
    fontSize: 12,
    color: '#9CA3AF',
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

  // ─── Discover Content ──────────────────────────────────────────
  discoverContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.2,
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: '500',
    color: Brand.orange,
  },

  // Recent Searches
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  recentText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },

  // Categories Grid
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  categoryCardPressed: {
    opacity: 0.8,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },

  // Suggestion Chips
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestionChipPressed: {
    backgroundColor: '#FFF3ED',
    borderColor: Brand.orange,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
});
