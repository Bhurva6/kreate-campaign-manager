// Utility functions for image handling
import { importDynamic } from './dynamic-import';

/**
 * Creates a proper image URL with proxy handling for R2/Cloudflare images
 * @param imageUrl Original image URL
 * @returns URL that should be used in img src
 */
export function getSafeImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return ''; // Return empty string instead of fallback image
  }
  
  // Check if it's an R2 or Cloudflare image that needs proxying
  const needsProxy = imageUrl.includes('r2.cloudflarestorage.com') || 
                    imageUrl.includes('.r2.') ||
                    imageUrl.includes('cloudflare');
  
  // Return either the proxied URL or the original
  return needsProxy 
    ? `/api/proxy-image?url=${encodeURIComponent(imageUrl)}` 
    : imageUrl;
}

/**
 * Preloads an image to check if it can be loaded successfully
 * @param imageUrl Image URL to preload
 * @param timeout Timeout in milliseconds (default 10 seconds)
 * @returns Promise that resolves with true if image loaded successfully
 */
export function preloadImage(imageUrl: string, timeout: number = 10000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    
    // Set up timeout
    const timeoutId = setTimeout(() => {
      console.error(`Image load timed out: ${imageUrl}`);
      resolve(false);
    }, timeout);
    
    // Set up success handler
    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(true);
    };
    
    // Set up error handler
    img.onerror = () => {
      clearTimeout(timeoutId);
      console.error(`Image load failed: ${imageUrl}`);
      resolve(false);
    };
    
    // Start loading
    img.src = imageUrl;
  });
}

/**
 * Handles image errors by providing error messages
 * @param event Error event from an image element
 * @param setError Optional function to set error state
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  setError?: (message: string) => void
) {
  const img = event.currentTarget;
  
  // Prevent infinite error loops
  img.onerror = null;
  
  // Log the error
  const errorMsg = `Image failed to load: ${img.src}`;
  console.error(errorMsg);
  
  // Don't set fallback image, let component handle errors
  
  // Optionally update error state
  if (setError) {
    setError(errorMsg);
  }
}

/**
 * Detects if a file is a HEIC/HEIF image based on its magic numbers
 * @param buffer The file buffer to check
 * @returns boolean indicating if the file is HEIC format
 */
export function isHeicImage(buffer: Buffer): boolean {
  // Check for HEIC/HEIF magic numbers
  if (buffer.length < 12) return false;

  // Check for ftyp box which identifies the file type
  // HEIC files typically have 'ftyp' at position 4 and one of the 
  // following brand identifiers: 'heic', 'heix', 'hevc', 'hevx'
  const ftypPos = buffer.indexOf('ftyp', 4, 'ascii');
  if (ftypPos < 0) return false;

  // Check for HEIC brand identifiers
  const brandPos = ftypPos + 8;
  if (brandPos + 4 > buffer.length) return false;

  const brand = buffer.toString('ascii', brandPos, brandPos + 4);
  return ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand.toLowerCase());
}

/**
 * Converts a HEIC image buffer to JPEG or PNG format
 * @param buffer HEIC image buffer
 * @param format Output format ('jpeg' or 'png')
 * @param quality Output quality (1-100)
 * @returns Promise resolving to the converted image buffer
 */
export async function convertHeicImage(
  buffer: Buffer, 
  format: 'jpeg' | 'png' = 'jpeg', 
  quality: number = 90
): Promise<{ buffer: Buffer; mimeType: string }> {
  try {
    // Dynamically import heic-convert to avoid SSR issues
    const heicConvert = await importDynamic<any>(() => import('heic-convert'));
    
    // Convert HEIC to target format
    const convertedBuffer = await heicConvert({
      buffer,
      format,
      quality
    });
    
    return { 
      buffer: convertedBuffer, 
      mimeType: format === 'jpeg' ? 'image/jpeg' : 'image/png'
    };
  } catch (error) {
    console.error('HEIC conversion failed:', error);
    throw new Error('Failed to convert HEIC image. Please try with a JPEG or PNG image.');
  }
}
