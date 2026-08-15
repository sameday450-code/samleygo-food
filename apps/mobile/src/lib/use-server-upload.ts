import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { api } from './axios';

interface PickAndUploadOptions {
  source?: 'library' | 'camera';
  allowsEditing?: boolean;
  quality?: number;
  onInsufficientPermissions?: () => void;
  onCancel?: () => void;
}

export function useServerImageUploader() {
  const [isUploading, setIsUploading] = useState(false);

  const pickAndUpload = async (opts?: PickAndUploadOptions) => {
    const {
      source = 'library',
      allowsEditing = true,
      quality = 0.8,
      onInsufficientPermissions,
      onCancel,
    } = opts ?? {};

    try {
      // Check permissions
      const permMethod =
        source === 'camera'
          ? ImagePicker.getCameraPermissionsAsync
          : ImagePicker.getMediaLibraryPermissionsAsync;

      const requestMethod =
        source === 'camera'
          ? ImagePicker.requestCameraPermissionsAsync
          : ImagePicker.requestMediaLibraryPermissionsAsync;

      const current = await permMethod();
      let granted = current.granted;
      if (!granted && current.canAskAgain) {
        const newPerm = await requestMethod();
        granted = newPerm.granted;
      }
      if (!granted) {
        onInsufficientPermissions?.();
        return null;
      }

      // Pick image
      const launcher =
        source === 'camera'
          ? ImagePicker.launchCameraAsync
          : ImagePicker.launchImageLibraryAsync;

      const result = await launcher({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        quality,
      });

      if (result.canceled) {
        onCancel?.();
        return null;
      }

      const asset = result.assets[0];
      setIsUploading(true);

      // Create FormData with the image
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.fileName ?? 'upload.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      } as any);

      // Send to our API server → Cloudinary
      const response = await api.post<{ url: string }>(
        '/upload/image',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );

      return response.data.url;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return { pickAndUpload, isUploading };
}
