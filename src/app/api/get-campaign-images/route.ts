import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createCanvas, loadImage } from "canvas";

const s3Client = new S3Client({
  region: process.env.CLOUDFLARE_R2_REGION || "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { campaignId, keys, logoBase64, logoPosition } = await req.json();

    if (!campaignId || typeof campaignId !== "string") {
      return NextResponse.json({ error: "campaignId is required." }, { status: 400 });
    }
    if (!keys || !Array.isArray(keys)) {
      return NextResponse.json({ error: "keys array is required." }, { status: 400 });
    }

    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
    const images: string[] = [];

    for (const key of keys) {
      try {
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
        });
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour expiry
        
        let finalImage = signedUrl;
        
        // Overlay logo if provided
        if (logoBase64 && logoPosition) {
          try {
            finalImage = await overlayLogoOnImage(signedUrl, logoBase64, logoPosition);
          } catch (error) {
            console.error(`Error overlaying logo on image ${key}:`, error);
            // Fall back to original image if overlay fails
          }
        }
        
        images.push(finalImage);
      } catch (error) {
        console.error(`Failed to process image for key ${key}:`, error);
        // Continue with other images
      }
    }

    return NextResponse.json({ images, success: true });
  } catch (error) {
    console.error("Error in get-campaign-images:", error);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}

// Server-side logo overlay function
async function overlayLogoOnImage(imageUrl: string, logoBase64: string, position: string): Promise<string> {
  try {
    // Load the main image
    const img = await loadImage(imageUrl);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');

    // Draw the main image
    ctx.drawImage(img, 0, 0);

    // Load and draw the logo
    const logoImg = await loadImage(logoBase64);

    // Calculate logo size (20% of image width, maintaining aspect ratio)
    const logoSize = Math.min(img.width * 0.2, img.height * 0.2);
    const logoWidth = logoSize;
    const logoHeight = (logoImg.height / logoImg.width) * logoWidth;

    // Calculate position
    let x = 0, y = 0;
    switch (position) {
      case 'top-left':
        x = 10;
        y = 10;
        break;
      case 'top-right':
        x = img.width - logoWidth - 10;
        y = 10;
        break;
      case 'bottom-left':
        x = 10;
        y = img.height - logoHeight - 10;
        break;
      case 'bottom-right':
        x = img.width - logoWidth - 10;
        y = img.height - logoHeight - 10;
        break;
      case 'center':
        x = (img.width - logoWidth) / 2;
        y = (img.height - logoHeight) / 2;
        break;
      default:
        x = 10;
        y = 10;
    }

    // Draw the logo
    ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);

    // Return as data URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error in overlayLogoOnImage:', error);
    throw error;
  }
}
