import * as ImagePicker from 'expo-image-picker';
import authApi from './authService';

export interface OCRResult {
  amount: number | null;
  description: string | null;
  category: string | null;
  raw_text: string | null;
}

export interface PickedImage {
  uri: string;
  base64: string;
  mimeType: string;
}

/**
 * Launch image picker and return the image data without calling OCR.
 * Returns null if user cancelled.
 */
export async function pickImage(
  source: 'camera' | 'gallery'
): Promise<PickedImage | null> {
  // Request permissions
  if (source === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Camera permission denied');
    }
  } else {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Gallery permission denied');
    }
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          base64: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          base64: true,
        });

  if (result.canceled || !result.assets?.[0]?.base64) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    base64: asset.base64,
    mimeType: asset.mimeType ?? 'image/jpeg',
  };
}

/**
 * Send a base64 image to the backend OCR endpoint.
 */
export async function extractFromImage(
  base64: string,
  mimeType: string
): Promise<OCRResult> {
  const response = await authApi.post<{ status: string; data: OCRResult }>(
    '/ocr/extract',
    { image_base64: base64, mime_type: mimeType }
  );

  return response.data.data ?? { amount: null, description: null, category: null, raw_text: null };
}

/**
 * Legacy: pick and extract in one call.
 */
export async function pickAndExtract(
  source: 'camera' | 'gallery'
): Promise<OCRResult | null> {
  const picked = await pickImage(source);
  if (!picked) return null;
  return extractFromImage(picked.base64, picked.mimeType);
}
