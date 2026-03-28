import * as ImagePicker from 'expo-image-picker';
import authApi from './authService';

export interface OCRResult {
  amount: number | null;
  description: string | null;
  category: string | null;
  raw_text: string | null;
}

/**
 * Launch image picker from camera or gallery, then send to backend OCR endpoint.
 * Returns null if user cancelled.
 */
export async function pickAndExtract(
  source: 'camera' | 'gallery'
): Promise<OCRResult | null> {
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

  // Launch picker
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
  const mimeType = asset.mimeType ?? 'image/jpeg';

  const response = await authApi.post<{ status: string; data: OCRResult }>(
    '/ocr/extract',
    { image_base64: asset.base64, mime_type: mimeType }
  );

  return response.data.data ?? null;
}
