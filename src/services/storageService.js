/**
 * Supabase Storage Service
 * Upload and delete item photos
 */

import { supabase } from '../config/supabase';
import { decode as base64Decode } from 'base64-arraybuffer';
import ImageResizer from 'react-native-image-resizer';

const BUCKET = 'fridge-photos';

const getUserId = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('User not authenticated');
  return user.id;
};

/**
 * Upload base64 image to Supabase Storage
 * @param {string} base64Image - base64 string (no data URL prefix)
 * @param {number} [resizeWidth=400] - width to resize image to (reduced from 800 for smaller uploads)
 * @returns {Promise<{ url: string, path: string }>}
 */
export const uploadItemImage = async (base64Image, resizeWidth = 400) => {
  const userId = await getUserId();
  const timestamp = Date.now();
  const path = `${userId}/${timestamp}.jpg`;

  // Convert base64 to temporary file URI for resizing
  const imageUri = `data:image/jpeg;base64,${base64Image}`;
  let resizedUri = imageUri;
  try {
    const resized = await ImageResizer.createResizedImage(
      imageUri,
      resizeWidth,
      resizeWidth,
      'JPEG',
      60 // reduced quality from 80 to 60 for smaller file size
    );
    resizedUri = resized.uri;
  } catch (e) {
    // If resizing fails, fallback to original
    resizedUri = imageUri;
  }

  // Fetch resized image as base64
  let finalBase64 = base64Image;
  if (resizedUri !== imageUri) {
    // Use RNFS or fetch to get base64 from resizedUri
    // If you use expo, use FileSystem.readAsStringAsync(resizedUri, { encoding: 'base64' })
    // For bare RN, you may need react-native-fs
    // Here is a generic fetch:
    try {
      const response = await fetch(resizedUri);
      const blob = await response.blob();
      const reader = new FileReader();
      finalBase64 = await new Promise((resolve, reject) => {
        reader.onloadend = () => {
          const dataUrl = reader.result;
          const base64 = dataUrl.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      finalBase64 = base64Image;
    }
  }

  const arrayBuffer = base64Decode(finalBase64);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: publicUrlData.publicUrl, path };
};

/**
 * Delete image by storage path
 * @param {string} path - storage path inside bucket
 */
export const deleteItemImage = async (path) => {
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
};

/**
 * Extract storage path from public URL
 */
export const getPathFromUrl = (url) => {
  if (!url) return null;
  const marker = `${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
};

export default {
  uploadItemImage,
  deleteItemImage,
  getPathFromUrl,
};
