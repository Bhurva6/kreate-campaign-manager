import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
    const { campaignId, keys } = await req.json();

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
        images.push(signedUrl);
      } catch (error) {
        console.error(`Failed to generate signed URL for key ${key}:`, error);
        // Continue with other images
      }
    }

    return NextResponse.json({ images, success: true });
  } catch (error) {
    console.error("Error in get-campaign-images:", error);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}
