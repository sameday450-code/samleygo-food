import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Brand } from '@/constants/theme';
import { useLocationStore } from '@/store/location-store';

// Lazy import MapView to avoid issues on web
let MapView: any = null;
let Marker: any = null;

try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
} catch {
  // Maps not available
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

const LABEL_COLORS: Record<string, string> = {
  Home: '#3B82F6',
  Work: '#8B5CF6',
  Other: '#22C55E',
};

export default function LocationPicker({ visible, onClose }: Props) {
  const { address, latitude, longitude, setAddress, savedAddresses } =
    useLocationStore();
  const [inputAddress, setInputAddress] = useState(address);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(latitude && longitude ? { latitude, longitude } : null);

  useEffect(() => {
    setInputAddress(address);
  }, [address]);

  async function handleGetCurrentLocation() {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission denied',
          'Please enable location access in your device settings.',
        );
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude: lat, longitude: lng } = loc.coords;
      setCurrentLocation({ latitude: lat, longitude: lng });

      // Reverse geocode
      const results = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });
      if (results.length > 0) {
        const r = results[0];
        const formatted = [r.name, r.street, r.city, r.region]
          .filter(Boolean)
          .join(', ');
        setInputAddress(formatted);
      }
    } catch {
      Alert.alert('Error', 'Could not get your location. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    if (!inputAddress.trim()) {
      Alert.alert('Enter address', 'Please enter a delivery address.');
      return;
    }
    setAddress(
      inputAddress.trim(),
      currentLocation?.latitude,
      currentLocation?.longitude,
    );
    onClose();
  }

  function handleSelectSaved(saved: (typeof savedAddresses)[0]) {
    if (saved.address) {
      setInputAddress(saved.address);
      if (saved.latitude && saved.longitude) {
        setCurrentLocation({
          latitude: saved.latitude,
          longitude: saved.longitude,
        });
      }
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Delivery Address</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </Pressable>
          </View>

          {/* Current Location Button */}
          <Pressable
            style={({ pressed }) => [
              styles.currentLocationButton,
              pressed && styles.currentLocationButtonPressed,
            ]}
            onPress={handleGetCurrentLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Brand.orange} />
            ) : (
              <Ionicons name="locate" size={20} color={Brand.orange} />
            )}
            <View style={styles.currentLocationTextContainer}>
              <Text style={styles.currentLocationLabel}>
                {loading ? 'Getting location...' : 'Use current location'}
              </Text>
              <Text style={styles.currentLocationSubtext}>
                {loading ? 'Please wait' : 'Auto-detect your address'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
          </Pressable>

          {/* Map Preview */}
          {currentLocation && MapView && (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                  }}
                />
              </MapView>
            </View>
          )}

          {/* Address Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Delivery Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="Enter your delivery address"
                placeholderTextColor="#9CA3AF"
                value={inputAddress}
                onChangeText={setInputAddress}
                multiline
              />
            </View>
          </View>

          {/* Saved Addresses */}
          {savedAddresses.length > 0 && (
            <View style={styles.savedSection}>
              <Text style={styles.savedTitle}>Saved Addresses</Text>
              {savedAddresses.map((saved) => (
                <Pressable
                  key={saved.id}
                  style={({ pressed }) => [
                    styles.savedItem,
                    pressed && styles.savedItemPressed,
                  ]}
                  onPress={() => handleSelectSaved(saved)}
                >
                  <View
                    style={[
                      styles.savedIconContainer,
                      {
                        backgroundColor: `${LABEL_COLORS[saved.label] ?? '#22C55E'}15`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={saved.icon as keyof typeof Ionicons.glyphMap}
                      size={18}
                      color={LABEL_COLORS[saved.label] ?? '#22C55E'}
                    />
                  </View>
                  <View style={styles.savedInfo}>
                    <Text style={styles.savedLabel}>{saved.label}</Text>
                    <Text style={styles.savedAddressText} numberOfLines={1}>
                      {saved.address}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                </Pressable>
              ))}
            </View>
          )}

          {/* Confirm Button */}
          <Pressable
            style={({ pressed }) => [
              styles.confirmButton,
              pressed && styles.confirmButtonPressed,
            ]}
            onPress={handleConfirm}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFF" />
            <Text style={styles.confirmText}>Confirm Address</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Current Location
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFF3ED',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  currentLocationButtonPressed: {
    opacity: 0.8,
  },
  currentLocationTextContainer: {
    flex: 1,
  },
  currentLocationLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.orange,
  },
  currentLocationSubtext: {
    fontSize: 12,
    color: '#D97706',
    marginTop: 1,
  },

  // Map
  mapContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    height: 160,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  map: {
    flex: 1,
  },

  // Input
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A2E',
    minHeight: 40,
    padding: 0,
    lineHeight: 20,
  },

  // Saved Addresses
  savedSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  savedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  savedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  savedItemPressed: {
    opacity: 0.7,
  },
  savedIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedInfo: {
    flex: 1,
  },
  savedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  savedAddressText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },

  // Confirm
  confirmButton: {
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
  confirmButtonPressed: {
    opacity: 0.9,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
