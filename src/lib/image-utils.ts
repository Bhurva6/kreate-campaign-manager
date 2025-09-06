// Utility functions for image handling

/**
 * Creates a proper image URL with proxy handling for R2/Cloudflare images
 * @param imageUrl Original image URL
 * @returns URL that should be used in img src
 */
export function getSafeImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return '/GoLoco-creation.png'; // Default fallback image
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
 * Handles image errors by providing fallbacks
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
  console.error(`Image failed to load: ${img.src}`);
  
  // Set fallback image
  img.src = '/GoLoco-creation.png';
  
  // Optionally update error state
  if (setError) {
    setError('Image failed to load. Using fallback image.');
  }
}
