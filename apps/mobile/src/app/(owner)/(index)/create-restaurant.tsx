import { openSettings } from 'expo-linking';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Image,
  View,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { api } from '@/lib/axios';
import { useServerImageUploader } from '@/lib/use-server-upload';
import { Brand, Spacing, Radius } from '@/constants/theme';
import { getImageUrl } from '@/lib/image-url';

export default function CreateRestaurantScreen() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [nameFocused, setNameFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [addressFocused, setAddressFocused] = useState(false);
  const [cuisineFocused, setCuisineFocused] = useState(false);

  const { pickAndUpload, isUploading } = useServerImageUploader();

  const { mutate: createRestaurant, isPending } = useMutation({
    mutationFn: () =>
      api.post('/restaurants', {
        name,
        description,
        address,
        cuisineType,
        imageUrl,
      }),
    onSuccess: (restaurant) => {
      void queryClient.setQueryData(['my-restaurant'], restaurant);
      router.replace('/(owner)/(index)');
    },
    onError: (e: any) => {
      Alert.alert(
        'Error',
        e?.response?.data?.message ?? 'Something went wrong',
      );
    },
  });

  function handleSubmit() {
    if (!name || !address || !cuisineType) {
      return Alert.alert('Please fill in all required fields');
    }
    createRestaurant();
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Create your restaurant</Text>
        <Text style={styles.subtitle}>
          Set up your restaurant profile to start receiving orders.
        </Text>
      </View>

      {/* Image Upload Card */}
      <View style={styles.imageSection}>
        <Text style={styles.label}>
          Restaurant image{' '}
          <Text style={styles.requiredStar}>*</Text>
        </Text>
        <Pressable
          style={[
            styles.imagePicker,
            imageUrl && styles.imagePickerWithImage,
          ]}
          onPress={() =>
            void pickAndUpload({
              source: 'library',
              onInsufficientPermissions: () => {
                Alert.alert(
                  'No permissions',
                  'You need to grant permission to your phone',
                  [
                    { text: 'Dismiss' },
                    { text: 'Open Settings', onPress: void openSettings },
                  ],
                );
              },
            }).then((url) => url && setImageUrl(url)).catch((e) => Alert.alert('Upload failed', e.message))
          }
          disabled={isUploading}
        >
          {isUploading ? (
            <View style={styles.uploadLoading}>
              <ActivityIndicator size="large" color={Brand.orange} />
              <Text style={styles.uploadLoadingText}>Uploading...</Text>
            </View>
          ) : imageUrl ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: getImageUrl(imageUrl) }} style={styles.image} />
              <View style={styles.imageOverlay}>
                <View style={styles.changeImageButton}>
                  <Text style={styles.changeImageText}>Change Image</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <View style={styles.uploadIconContainer}>
                <Text style={styles.uploadIcon}>📷</Text>
              </View>
              <Text style={styles.uploadTitle}>Upload restaurant image</Text>
              <Text style={styles.uploadSubtitle}>PNG, JPG or WEBP</Text>
              <Text style={styles.uploadHint}>Recommended: 1200 × 800 px</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Form Fields */}
      <View style={styles.formSection}>
        {/* Restaurant Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Restaurant name <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              nameFocused && styles.inputFocused,
            ]}
            placeholder="Enter your restaurant name"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
          />
        </View>

        {/* Description */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              descFocused && styles.inputFocused,
            ]}
            placeholder="Tell customers about your restaurant"
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            onFocus={() => setDescFocused(true)}
            onBlur={() => setDescFocused(false)}
          />
        </View>

        {/* Address */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Address <Text style={styles.requiredStar}>*</Text>
          </Text>
          <View style={styles.inputWithIcon}>
            <Text style={styles.inputIcon}>📍</Text>
            <TextInput
              style={[
                styles.inputIconField,
                addressFocused && styles.inputFocused,
              ]}
              placeholder="Enter restaurant address"
              placeholderTextColor="#9CA3AF"
              value={address}
              onChangeText={setAddress}
              onFocus={() => setAddressFocused(true)}
              onBlur={() => setAddressFocused(false)}
            />
          </View>
        </View>

        {/* Cuisine Type */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Cuisine type <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              cuisineFocused && styles.inputFocused,
            ]}
            placeholder="e.g. Italian, Chinese, Ghanaian"
            placeholderTextColor="#9CA3AF"
            value={cuisineType}
            onChangeText={setCuisineType}
            onFocus={() => setCuisineFocused(true)}
            onBlur={() => setCuisineFocused(false)}
          />
        </View>
      </View>

      {/* Submit Button */}
      <Pressable
        style={[
          styles.submitButton,
          (isPending || isUploading) && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={isPending || isUploading}
      >
        {isPending ? (
          <View style={styles.submitLoading}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.submitButtonText}>Creating restaurant...</Text>
          </View>
        ) : (
          <Text style={styles.submitButtonText}>Create Restaurant →</Text>
        )}
      </Pressable>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },

  // Image Upload
  imageSection: {
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#EF4444',
  },
  imagePicker: {
    height: 200,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  imagePickerWithImage: {
    borderStyle: 'solid',
    borderColor: '#F0F0F0',
  },
  uploadPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  uploadIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF3ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadIcon: {
    fontSize: 24,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  uploadHint: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  uploadLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadLoadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  imagePreviewContainer: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeImageButton: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  changeImageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },

  // Form
  formSection: {
    gap: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A2E',
    lineHeight: 20,
  },
  inputFocused: {
    borderColor: Brand.orange,
    backgroundColor: '#FFFFFF',
    shadowColor: Brand.orange,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  inputIconField: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A2E',
  },

  // Submit
  submitButton: {
    backgroundColor: Brand.orange,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    marginTop: 8,
    shadowColor: Brand.orange,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  bottomSpacer: {
    height: 32,
  },
});
