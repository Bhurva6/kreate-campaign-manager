interface CompressImageOptions {
  maxSizeMB: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  mimeType?: string;
}

export async function compressImage(
  imageFile: File | string,
  options: CompressImageOptions = { maxSizeMB: 3 }
): Promise<string> {
  // If input is already a base64 string
  if (typeof imageFile === 'string') {
    return compressBase64Image(imageFile, options);
  }

  // If input is a File
  try {
    const base64String = await fileToBase64(imageFile);
    return compressBase64Image(base64String, options);
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
}

async function compressBase64Image(
  base64String: string,
  options: CompressImageOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Scale down if needed
      if (options.maxWidthOrHeight && (width > options.maxWidthOrHeight || height > options.maxWidthOrHeight)) {
        const ratio = width / height;
        if (width > height) {
          width = options.maxWidthOrHeight;
          height = width / ratio;
        } else {
          height = options.maxWidthOrHeight;
          width = height * ratio;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.fillStyle = 'white'; // Set white background
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Get the mime type from the original base64 or use default
      let mimeType = options.mimeType || 'image/jpeg';
      if (base64String.startsWith('data:')) {
        const matches = base64String.match(/^data:([A-Za-z-+/]+);base64,/);
        if (matches && matches[1]) {
          mimeType = matches[1];
        }
      }

      // Compress with different quality until size is under maxSizeMB
      let quality = 0.9;
      const maxSizeBytes = options.maxSizeMB * 1024 * 1024;
      let result = canvas.toDataURL(mimeType, quality);

      while (result.length > maxSizeBytes && quality > 0.1) {
        quality -= 0.1;
        result = canvas.toDataURL(mimeType, quality);
      }

      resolve(result);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // If the input is already a data URL, use it directly
    if (base64String.startsWith('data:')) {
      img.src = base64String;
    } else {
      // If it's just base64 data, add the data URL prefix
      img.src = `data:image/jpeg;base64,${base64String}`;
    }
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function getBase64Size(base64String: string): number {
  // Remove data URL prefix if present
  const base64Data = base64String.split(',').pop() || base64String;
  // Calculate size in MB
  return (base64Data.length * 0.75) / (1024 * 1024);
}
