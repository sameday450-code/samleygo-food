import { useState } from 'react';
import { openSettings } from 'expo-linking';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/axios';
import { useServerImageUploader } from '@/lib/use-server-upload';
import { MenuCategory, MenuItem, RestaurantType } from '@food-delivery/types';
import { Brand, Spacing, Radius } from '@/constants/theme';
import { getImageUrl } from '@/lib/image-url';

export default function OwnerMenuScreen() {
  const queryClient = useQueryClient();
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');


  const {
    data: restaurant,
    isPending: restaurantPending,
    isFetching: restaurantFetching,
  } = useQuery<RestaurantType | null>({
    queryKey: ['my-restaurant'],
    queryFn: () =>
      api.get<RestaurantType | null>('/restaurants/mine').then((r) => r.data),
  });

  const {
    data: categories = [],
    isPending: categoriesPending,
    isFetching: categoriesFetching,
  } = useQuery<MenuCategory[]>({
    queryKey: ['categories', restaurant?.id],
    queryFn: () =>
      api.get<MenuCategory[]>(`/menu/categories/${restaurant?.id}`).then((r) => r.data),
    enabled: !!restaurant?.id,
  });

  const restaurantLoading = restaurantPending || restaurantFetching;
  const categoriesLoading = !!restaurant?.id && (categoriesPending || categoriesFetching);

  const { data: items = [] } = useQuery<MenuItem[]>({
    queryKey: ['menu-items', restaurant?.id],
    queryFn: () =>
      api.get<MenuItem[]>(`/menu/items/${restaurant?.id}`).then((r) => r.data),
    enabled: !!restaurant?.id,
  });

  const totalItems = items.length;
  const availableItems = items.filter((i) => i.isAvailable !== false).length;

  const { mutate: addCategory, isPending: addingCategory } = useMutation({
    mutationFn: (name: string) => api.post('/menu/categories', { name }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories', restaurant?.id] });
      setNewCategoryName('');
      setShowAddCategory(false);
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      Alert.alert('Error', e.response?.data?.message ?? 'Could not create category');
    },
  });

  const { mutate: deleteCategory } = useMutation({
    mutationFn: (id: string) => api.delete(`/menu/categories/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories', restaurant?.id] });
      void queryClient.invalidateQueries({ queryKey: ['menu-items', restaurant?.id] });
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      Alert.alert('Error', e.response?.data?.message ?? 'Could not delete category');
    },
  });

  function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) {
      Alert.alert('Name required', 'Please enter a category name.');
      return;
    }
    addCategory(name);
  }

  const [newItemImageUrl, setNewItemImageUrl] = useState<string | null>(null);
  const { pickAndUpload: pickAndUploadItemImage, isUploading: uploadingItemImage } =
    useServerImageUploader();

  const { mutate: addItem, isPending: addingItem } = useMutation({
    mutationFn: () =>
      api.post('/menu/items', {
        categoryId: selectedCategoryId,
        name: newItemName,
        price: newItemPrice,
        description: newItemDescription.trim() || undefined,
        imageUrl: newItemImageUrl,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['menu-items', restaurant?.id] });
      setNewItemName('');
      setNewItemPrice('');
      setNewItemDescription('');
      setNewItemImageUrl(null);
      setShowAddItem(false);
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      Alert.alert('Error', e.response?.data?.message ?? 'Could not create menu item');
    },
  });



  const { mutate: toggleAvailability } = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      api.patch(`/menu/items/${id}`, { isAvailable }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['menu-items', restaurant?.id] }),
    onError: (e: { response?: { data?: { message?: string } } }) => {
      Alert.alert('Error', e.response?.data?.message ?? 'Could not update availability');
    },
  });

  function handleAddItem() {
    const name = newItemName.trim();
    const price = newItemPrice.trim();
    if (!name || !price) {
      Alert.alert('Required fields', 'Item name and price are required.');
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert('Error', 'No category selected.');
      return;
    }
    addItem();
  }

  function closeAddItemModal() {
    setShowAddItem(false);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemDescription('');
    setNewItemImageUrl(null);
  }

  const { mutate: deleteItem } = useMutation({
    mutationFn: (id: string) => api.delete(`/menu/items/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['menu-items', restaurant?.id] }),
  });

  if (restaurantLoading || categoriesLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Brand.orange} />
        </View>
      </SafeAreaView>
    );
  }

  if (!restaurant) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="restaurant-outline" size={48} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>No restaurant yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your restaurant on the Orders tab first.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Menu</Text>
            <Text style={styles.subtitle}>Manage your menu items</Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.addCategoryButton,
              pressed && styles.addCategoryButtonPressed,
            ]}
            onPress={() => setShowAddCategory(true)}
          >
            <Ionicons name="add" size={20} color="#FFF" />
          </Pressable>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{categories.length}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalItems}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#22C55E' }]}>{availableItems}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
        </View>
      </View>

      <FlatList
        style={styles.list}
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>No categories yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first category to start building your menu.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.emptyButton,
                pressed && styles.emptyButtonPressed,
              ]}
              onPress={() => setShowAddCategory(true)}
            >
              <Ionicons name="add-circle" size={20} color="#FFF" />
              <Text style={styles.emptyButtonText}>Add Category</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item: category }) => {
          const categoryItems = items.filter((i) => i.categoryId === category.id);
          const availableCount = categoryItems.filter((i) => i.isAvailable !== false).length;
          return (
            <View style={styles.categoryCard}>
              {/* Category Header */}
              <View style={styles.categoryHeader}>
                <View style={styles.categoryLeft}>
                  <View style={styles.categoryIndicator} />
                  <View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryMeta}>
                      {categoryItems.length} item{categoryItems.length !== 1 ? 's' : ''}
                      {availableCount < categoryItems.length
                        ? ` · ${availableCount} available`
                        : ''}
                    </Text>
                  </View>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.categoryDeleteButton,
                    pressed && styles.categoryDeleteButtonPressed,
                  ]}
                  onPress={() => {
                    Alert.alert('Delete category?', 'All items in this category will also be deleted.', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteCategory(category.id) },
                    ]);
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </Pressable>
              </View>

              {/* Items */}
              {categoryItems.map((item, index) => {
                const isAvailable = item.isAvailable !== false;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.itemRow,
                      index === 0 && styles.itemRowFirst,
                    ]}
                  >
                    {item.imageUrl ? (
                      <Image source={{ uri: getImageUrl(item.imageUrl) }} style={styles.itemImage} />
                    ) : (
                      <View style={styles.itemImagePlaceholder}>
                        <Ionicons name="restaurant-outline" size={18} color="#D1D5DB" />
                      </View>
                    )}
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.itemPrice}>${Number(item.price).toFixed(2)}</Text>
                    </View>
                    <View style={styles.itemActions}>
                      <View style={styles.switchRow}>
                        <Text
                          style={[
                            styles.switchLabel,
                            { color: isAvailable ? '#22C55E' : '#9CA3AF' },
                          ]}
                        >
                          {isAvailable ? 'Active' : 'Off'}
                        </Text>
                        <Switch
                          value={isAvailable}
                          onValueChange={(value) =>
                            toggleAvailability({ id: item.id, isAvailable: value })
                          }
                          trackColor={{ false: '#E5E7EB', true: '#BBF7D0' }}
                          thumbColor={isAvailable ? '#22C55E' : '#9CA3AF'}
                        />
                      </View>
                      <Pressable
                        style={({ pressed }) => [
                          styles.deleteItemButton,
                          pressed && styles.deleteItemButtonPressed,
                        ]}
                        onPress={() => {
                          Alert.alert('Delete item?', item.name, [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => deleteItem(item.id) },
                          ]);
                        }}
                      >
                        <Ionicons name="trash-outline" size={13} color="#EF4444" />
                      </Pressable>
                    </View>
                  </View>
                );
              })}

              {/* Add Item Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.addItemButton,
                  pressed && styles.addItemButtonPressed,
                ]}
                onPress={() => {
                  setSelectedCategoryId(category.id);
                  setShowAddItem(true);
                }}
              >
                <Ionicons name="add-circle-outline" size={18} color={Brand.orange} />
                <Text style={styles.addItemText}>Add Item</Text>
              </Pressable>
            </View>
          );
        }}
      />

      {/* Add Category Modal */}
      <Modal visible={showAddCategory} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Category</Text>
              <Pressable style={styles.modalClose} onPress={() => setShowAddCategory(false)}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>
              Create a category to organize your menu items.
            </Text>

            <View style={styles.modalInputContainer}>
              <Text style={styles.modalLabel}>
                Category name <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.modalInputWrapper}>
                <Ionicons name="pricetag-outline" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Appetizers, Main Course, Drinks"
                  placeholderTextColor="#9CA3AF"
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                />
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.modalButton,
                (addingCategory || !newCategoryName.trim()) && styles.modalButtonDisabled,
                pressed && styles.modalButtonPressed,
              ]}
              onPress={handleAddCategory}
              disabled={addingCategory || !newCategoryName.trim()}
            >
              {addingCategory ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  <Text style={styles.modalButtonText}>Create Category</Text>
                </>
              )}
            </Pressable>

            <Pressable style={styles.modalCancelButton} onPress={() => setShowAddCategory(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Item Modal */}
      <Modal visible={showAddItem} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal} onStartShouldSetResponder={() => true}>
            <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Menu Item</Text>
              <Pressable style={styles.modalClose} onPress={closeAddItemModal}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>
              Add a delicious item to your menu.
            </Text>

            {/* Item Name */}
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalLabel}>
                Item name <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.modalInputWrapper}>
                <Ionicons name="fast-food-outline" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Grilled Chicken Salad"
                  placeholderTextColor="#9CA3AF"
                  value={newItemName}
                  onChangeText={setNewItemName}
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalLabel}>Description</Text>
              <View style={[styles.modalInputWrapper, styles.modalTextAreaWrapper]}>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  placeholder="Brief description of the item"
                  placeholderTextColor="#9CA3AF"
                  value={newItemDescription}
                  onChangeText={setNewItemDescription}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Price */}
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalLabel}>
                Price <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.modalInputWrapper}>
                <Text style={styles.modalInputPrefix}>$</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  value={newItemPrice}
                  onChangeText={setNewItemPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Image Picker — after inputs so it doesn't steal focus */}
            <Pressable
              style={styles.modalImagePicker}
              onPress={() =>
                void pickAndUploadItemImage({
                  source: 'library',
                  allowsEditing: false,
                  onInsufficientPermissions: () => {
                    Alert.alert('No Permissions', 'Grant permission to your Photos', [
                      { text: 'Dismiss' },
                      { text: 'Open Settings', onPress: () => void openSettings() },
                    ]);
                  },
                })
                  .then((url) => url && setNewItemImageUrl(url))
                  .catch((e) => Alert.alert('Upload failed', e.message))
              }
              disabled={uploadingItemImage}
            >
              {newItemImageUrl ? (
                <View style={styles.modalImagePreviewContainer}>
                  <Image source={{ uri: getImageUrl(newItemImageUrl) }} style={styles.modalItemImage} />
                  <View style={styles.modalImageOverlay}>
                    <Ionicons name="camera" size={24} color="#FFF" />
                    <Text style={styles.modalImageChangeText}>Change Image</Text>
                  </View>
                </View>
              ) : uploadingItemImage ? (
                <View style={styles.modalImageLoading}>
                  <ActivityIndicator size="large" color={Brand.orange} />
                  <Text style={styles.modalImageLoadingText}>Uploading...</Text>
                </View>
              ) : (
                <View style={styles.modalImagePlaceholder}>
                  <View style={styles.modalImageIconContainer}>
                    <Ionicons name="camera-outline" size={28} color={Brand.orange} />
                  </View>
                  <Text style={styles.modalImageText}>Tap to add item image</Text>
                  <Text style={styles.modalImageHint}>Optional · PNG, JPG</Text>
                </View>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.modalButton,
                (addingItem || uploadingItemImage || !newItemName.trim() || !newItemPrice.trim()) &&
                  styles.modalButtonDisabled,
                pressed && styles.modalButtonPressed,
              ]}
              onPress={handleAddItem}
              disabled={addingItem || uploadingItemImage || !newItemName.trim() || !newItemPrice.trim()}
            >
              {addingItem ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color="#FFF" />
                  <Text style={styles.modalButtonText}>Add Item</Text>
                </>
              )}
            </Pressable>

            <Pressable style={styles.modalCancelButton} onPress={closeAddItemModal}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  addCategoryButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Brand.orange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Brand.orange,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  addCategoryButtonPressed: {
    opacity: 0.85,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingVertical: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E7EB',
  },

  // ─── List ──────────────────────────────────────────────────────
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // ─── Category Card ─────────────────────────────────────────────
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    backgroundColor: Brand.orange,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.1,
  },
  categoryMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  categoryDeleteButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryDeleteButtonPressed: {
    opacity: 0.7,
  },

  // ─── Item Row ──────────────────────────────────────────────────
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  itemRowFirst: {
    borderTopWidth: 0,
    marginTop: 8,
    paddingTop: 12,
  },
  itemImage: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  itemImagePlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.orange,
  },
  itemActions: {
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  switchLabel: {
    fontSize: 11,
    fontWeight: '600',
    width: 50,
    textAlign: 'right',
  },
  deleteItemButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteItemButtonPressed: {
    opacity: 0.7,
  },

  // ─── Add Item Button ───────────────────────────────────────────
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
  },
  addItemButtonPressed: {
    opacity: 0.7,
  },
  addItemText: {
    color: Brand.orange,
    fontSize: 14,
    fontWeight: '600',
  },

  // ─── Empty State ───────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Brand.orange,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: Brand.orange,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  emptyButtonPressed: {
    opacity: 0.9,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
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
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.3,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  modalInputContainer: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requiredStar: {
    color: '#EF4444',
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 10,
  },
  modalInputWrapperFocused: {
    borderColor: Brand.orange,
    backgroundColor: '#FFFFFF',
    shadowColor: Brand.orange,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  modalTextAreaWrapper: {
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  modalInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A2E',
    paddingVertical: 10,
  },
  modalTextArea: {
    minHeight: 50,
    textAlignVertical: 'top',
  },
  modalInputPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Brand.orange,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
    shadowColor: Brand.orange,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonPressed: {
    opacity: 0.9,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalCancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
  },

  // ─── Modal Image Picker ────────────────────────────────────────
  modalImagePicker: {
    height: 160,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
    marginBottom: 16,
  },
  modalImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalImageIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  modalImageHint: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  modalImageLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalImageLoadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  modalImagePreviewContainer: {
    flex: 1,
  },
  modalItemImage: {
    width: '100%',
    height: '100%',
  },
  modalImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  modalImageChangeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
