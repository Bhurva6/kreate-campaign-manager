import { S3Client } from "@aws-sdk/client-s3";

// Cloudflare R2 configuration
export const r2Client = new S3Client({
  region: "auto", // R2 uses "auto" as region
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT || '', // Your R2 endpoint
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
  },
});

export const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || "kreate-primary-bucket";

// R2 Folder structure strategy
export const R2_FOLDERS = {
  GENERATED_IMAGES: "generated",
  EDITED_IMAGES: "edited", 
  BRAND_KIT: "brand-kit",
  ARCHITECTURE: "architecture",
  GRAPHICS: "graphics",
  INTERIOR: "interior-design",
  ADS: "advertisements",
  TEMPORARY: "temp",
  GIFS: "gifs",
} as const;

// Image categories mapping
export const IMAGE_CATEGORIES = {
  "generate-image": R2_FOLDERS.GENERATED_IMAGES,
  "edit-image": R2_FOLDERS.EDITED_IMAGES,
  "brand-kit": R2_FOLDERS.BRAND_KIT,
  "architecture": R2_FOLDERS.ARCHITECTURE,
  "graphics": R2_FOLDERS.GRAPHICS,
  "interior-designing": R2_FOLDERS.INTERIOR,
  "copy-the-ad": R2_FOLDERS.ADS,
  "generate-gif": R2_FOLDERS.GIFS,
} as const;

export type ImageCategory = keyof typeof IMAGE_CATEGORIES;
