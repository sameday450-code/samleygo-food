import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLocationStore, SavedAddress } from '@/store/location-store';
import { Brand, Radius, Spacing } from '@/constants/theme';
import LocationPicker from '@/components/location-picker';

export default function SavedAddressesScreen() {
  const {
    savedAddresses,
    addSavedAddress,
    updateSavedAddress,
    removeSavedAddress,
    setSavedAddressAsCurrent,
  } = useLocationStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [tempAddress, setTempAddress] = useState('');
  const [tempLat, setTempLat] = useState<number | null>(null);
  const [tempLng, setTempLng] = useState<number | null>(null);

  const handleAdd = () => {
    setEditingAddress(null);
    setSelectedLabel('Home');
    setTempAddress('');
    setTempLat(null);
    setTempLng(null);
    setShowAddModal(true);
  };

  const handleEdit = (address: SavedAddress) => {
    setEditingAddress(address);
    setSelectedLabel(address.label);
    setTempAddress(address.address);
    setTempLat(address.latitude);
    setTempLng(address.longitude);
    setShowAddModal(true);
  };

  const handleSave = () => {
    if (!tempAddress.trim()) {
      Alert.alert('Enter address', 'Please enter an address.');
      return;
    }

    if (editingAddress) {
      updateSavedAddress(editingAddress.id, {
        label: selectedLabel,
        address: tempAddress.trim(),
        latitude: tempLat,
        longitude: tempLng,
        icon: selectedLabel === 'Home' ? 'home' : selectedLabel === 'Work' ? 'briefcase' : 'location',
      });
    } else {
      addSavedAddress({
        label: selectedLabel,
        address: tempAddress.trim(),
        latitude: tempLat,
        longitude: tempLng,
        icon: selectedLabel === 'Home' ? 'home' : selectedLabel === 'Work' ? 'briefcase' : 'location',
      });
    }

    setShowAddModal(false);
    setEditingAddress(null);
  };

  const handleDelete = (address: SavedAddress) => {
    Alert.alert(
      'Delete address?',
      `Remove "${address.label}" from your saved addresses?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeSavedAddress(address.id),
        },
      ],
    );
  };

  const handleSelectAddress = (address: SavedAddress) => {
    setSavedAddressAsCurrent(address.id);
    router.back();
  };

  const LABELS: { label: 'Home' | 'Work' | 'Other'; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
    { label: 'Home', icon: 'home', color: '#3B82F6' },
    { label: 'Work', icon: 'briefcase', color: '#8B5CF6' },
    { label: 'Other', icon: 'location', color: '#22C55E' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1A1A2E" />
        </Pressable>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <Pressable style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add" size={22} color={Brand.orange} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {savedAddresses.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="location-outline" size={48} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>No saved addresses</Text>
            <Text style={styles.emptySubtitle}>
              Add your frequently used addresses for faster checkout.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.emptyButton,
                pressed && styles.emptyButtonPressed,
              ]}
              onPress={handleAdd}
            >
              <Ionicons name="add-circle" size={20} color="#FFF" />
              <Text style={styles.emptyButtonText}>Add Address</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.addressesList}>
            {savedAddresses.map((address) => {
              const labelConfig = LABELS.find((l) => l.label === address.label) ?? LABELS[2];
              return (
                <View key={address.id} style={styles.addressCard}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.addressCardContent,
                      pressed && styles.addressCardPressed,
                    ]}
                    onPress={() => handleSelectAddress(address)}
                  >
                    <View style={[styles.addressIconContainer, { backgroundColor: `${labelConfig.color}15` }]}>
                      <Ionicons
                        name={labelConfig.icon}
                        size={22}
                        color={labelConfig.color}
                      />
                    </View>
                    <View style={styles.addressInfo}>
                      <Text style={styles.addressLabel}>{address.label}</Text>
                      <Text style={styles.addressText} numberOfLines={2}>
                        {address.address}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                  </Pressable>
                  <View style={styles.addressActions}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionButton,
                        pressed && styles.actionButtonPressed,
                      ]}
                      onPress={() => handleEdit(address)}
                    >
                      <Ionicons name="pencil" size={14} color="#6B7280" />
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionButton,
                        styles.deleteButton,
                        pressed && styles.deleteButtonPressed,
                      ]}
                      onPress={() => handleDelete(address)}
                    >
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle}>
              <View style={styles.modalHandleBar} />
            </View>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAddress ? 'Edit Address' : 'Add Address'}
              </Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setShowAddModal(false)}
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </Pressable>
            </View>

            {/* Label Selection */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Label</Text>
              <View style={styles.labelOptions}>
                {LABELS.map((l) => {
                  const isActive = selectedLabel === l.label;
                  return (
                    <Pressable
                      key={l.label}
                      style={({ pressed }) => [
                        styles.labelOption,
                        isActive && styles.labelOptionActive,
                        pressed && styles.labelOptionPressed,
                      ]}
                      onPress={() => setSelectedLabel(l.label)}
                    >
                      <View
                        style={[
                          styles.labelOptionIcon,
                          { backgroundColor: isActive ? l.color : '#F3F4F6' },
                        ]}
                      >
                        <Ionicons
                          name={l.icon}
                          size={18}
                          color={isActive ? '#FFF' : '#6B7280'}
                        />
                      </View>
                      <Text
                        style={[
                          styles.labelOptionText,
                          isActive && { color: l.color, fontWeight: '600' },
                        ]}
                      >
                        {l.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Address Input */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Address</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.locationPickerButton,
                  pressed && styles.locationPickerButtonPressed,
                ]}
                onPress={() => {
                  setShowAddModal(false);
                  setTimeout(() => setShowLocationPicker(true), 300);
                }}
              >
                <Ionicons name="map-outline" size={20} color={Brand.orange} />
                <View style={styles.locationPickerTextContainer}>
                  <Text style={styles.locationPickerLabel}>
                    {tempAddress ? 'Change location' : 'Pick from map'}
                  </Text>
                  {tempAddress ? (
                    <Text style={styles.locationPickerAddress} numberOfLines={1}>
                      {tempAddress}
                    </Text>
                  ) : (
                    <Text style={styles.locationPickerSubtext}>
                      Use map to select location
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              </Pressable>

              <View style={styles.manualInputWrapper}>
                <TextInput
                  style={styles.manualInput}
                  placeholder="Or type address manually"
                  placeholderTextColor="#9CA3AF"
                  value={tempAddress}
                  onChangeText={setTempAddress}
                />
              </View>
            </View>

            {/* Save Button */}
            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.saveButtonPressed,
              ]}
              onPress={handleSave}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.saveButtonText}>
                {editingAddress ? 'Save Changes' : 'Add Address'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Location Picker */}
      <LocationPicker
        visible={showLocationPicker}
        onClose={() => {
          setShowLocationPicker(false);
          const { address, latitude, longitude } = useLocationStore.getState();
          if (address) {
            setTempAddress(address);
            setTempLat(latitude);
            setTempLng(longitude);
          }
          setTimeout(() => setShowAddModal(true), 300);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // ─── Header ────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Empty State ───────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
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

  // ─── Addresses List ────────────────────────────────────────────
  addressesList: {
    padding: 16,
    gap: 12,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    overflow: 'hidden',
  },
  addressCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  addressCardPressed: {
    opacity: 0.7,
  },
  addressIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  addressActions: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
    padding: 8,
    gap: 8,
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  deleteButtonPressed: {
    opacity: 0.7,
  },

  // ─── Modal ─────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 40,
  },
  modalHandle: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  modalHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.3,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal Sections
  modalSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Label Options
  labelOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  labelOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  labelOptionActive: {
    borderColor: 'transparent',
    backgroundColor: '#FFF3ED',
  },
  labelOptionPressed: {
    opacity: 0.8,
  },
  labelOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Location Picker Button
  locationPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF3ED',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginBottom: 10,
  },
  locationPickerButtonPressed: {
    opacity: 0.8,
  },
  locationPickerTextContainer: {
    flex: 1,
  },
  locationPickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.orange,
  },
  locationPickerAddress: {
    fontSize: 12,
    color: '#D97706',
    marginTop: 2,
  },
  locationPickerSubtext: {
    fontSize: 12,
    color: '#D97706',
    marginTop: 2,
  },

  // Manual Input
  manualInputWrapper: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  manualInput: {
    fontSize: 14,
    color: '#1A1A2E',
    paddingVertical: 10,
  },

  // Save Button
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    backgroundColor: Brand.orange,
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: Brand.orange,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveButtonPressed: {
    opacity: 0.9,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
