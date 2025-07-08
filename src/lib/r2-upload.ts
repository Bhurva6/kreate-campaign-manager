import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, R2_BUCKET_NAME, IMAGE_CATEGORIES, type ImageCategory } from "./r2-config";
import { randomUUID } from "crypto";

interface UploadImageParams {
  imageBuffer: Buffer;
  category: ImageCategory;
  prompt?: string;
  mimeType?: string;
  userId?: string;
}

interface UploadResult {
  key: string;
  url: string;
  publicUrl: string;
}

/**
 * Generate a structured filename for R2 storage
 * Format: {category}/{year}/{month}/{day}/{timestamp}_{uuid}_{sanitized-prompt}.{ext}
 */
export function generateR2Key(category: ImageCategory, prompt?: string, mimeType = "image/png"): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = now.getTime();
  const uuid = randomUUID().slice(0, 8); // Short UUID for readability
  
  // Sanitize prompt for filename
  const sanitizedPrompt = prompt 
    ? prompt
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .slice(0, 50) // Limit length
    : 'image';
  
  // Get file extension from mime type
  const ext = mimeType.includes('jpeg') ? 'jpg' : 
              mimeType.includes('png') ? 'png' : 
              mimeType.includes('webp') ? 'webp' : 'png';
  
  const folder = IMAGE_CATEGORIES[category];
  return `${folder}/${year}/${month}/${day}/${timestamp}_${uuid}_${sanitizedPrompt}.${ext}`;
}

/**
 * Upload image buffer to Cloudflare R2
 */
export async function uploadImageToR2({
  imageBuffer,
  category,
  prompt,
  mimeType = "image/png",
  userId
}: UploadImageParams): Promise<UploadResult> {
  try {
    const key = generateR2Key(category, prompt, mimeType);
    
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: imageBuffer,
      ContentType: mimeType,
      // Note: R2 doesn't support ACLs like AWS S3
      // Public access is controlled via bucket settings or custom domains
      Metadata: {
        category,
        prompt: prompt || '',
        userId: userId || '',
        uploadedAt: new Date().toISOString(),
      },
    });

    await r2Client.send(command);

    // Generate signed URL with extended expiry for better user experience
    const getCommand = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    
    const signedUrl = await getSignedUrl(r2Client, getCommand, { 
      expiresIn: 3600 * 24 * 7 // 7 days (maximum allowed by R2)
    });

    // Generate public URL (may not work unless bucket is configured for public access)
    const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;

    return {
      key,
      url: signedUrl, // Use signed URL as primary since it's guaranteed to work
      publicUrl, // Keep public URL for reference
    };
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw new Error(`Failed to upload image to R2: ${error}`);
  }
}

/**
 * Convert base64 string to Buffer
 */
export function base64ToBuffer(base64String: string): Buffer {
  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

/**
 * Get mime type from base64 data URL
 */
export function getMimeTypeFromDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);base64,/);
  return match ? match[1] : 'image/png';
}

/**
 * Upload multiple images to R2 in parallel
 */
export async function uploadMultipleImagesToR2(
  images: Array<{
    buffer: Buffer;
    prompt?: string;
    mimeType?: string;
  }>,
  category: ImageCategory,
  userId?: string
): Promise<UploadResult[]> {
  const uploadPromises = images.map(({ buffer, prompt, mimeType }) =>
    uploadImageToR2({
      imageBuffer: buffer,
      category,
      prompt,
      mimeType,
      userId,
    })
  );

  return Promise.all(uploadPromises);
}
