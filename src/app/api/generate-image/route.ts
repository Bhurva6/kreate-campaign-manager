import { NextRequest, NextResponse } from "next/server";
import { uploadMultipleImagesToR2, base64ToBuffer, getMimeTypeFromDataUrl } from "@/lib/r2-upload";
import { tokenManager } from "@/lib/google-auth";

export async function POST(req: NextRequest) {
  try {
    const { prompt, sampleCount = 1, aspectRatio = "1:1", userId } = await req.json();

    // Validate input
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }
    if (sampleCount < 1 || sampleCount > 4) {
      return NextResponse.json({ error: "sampleCount must be 1-4." }, { status: 400 });
    }

    // Get fresh access token from token manager
    let accessToken: string;
    try {
      accessToken = await tokenManager.getAccessToken();
    } catch (error) {
      console.error("Failed to get access token:", error);
      return NextResponse.json({ error: "Failed to authenticate with Google Cloud" }, { status: 401 });
    }

    // Google Cloud/Vertex AI config
    const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT!;
    const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
    const MODEL_VERSION = "imagen-4.0-generate-preview-06-06";

    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_VERSION}:predict`;

    // Build request body
    const body = {
      instances: [{ prompt }],
      parameters: {
        sampleCount,
        aspectRatio,
      },
    };

    // Call Vertex AI
    const vertexRes = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Handle auth errors by retrying with fresh token
    if (vertexRes.status === 401) {
      console.log("Authentication failed, refreshing token and retrying...");
      tokenManager.invalidateToken();
      
      try {
        const freshToken = await tokenManager.getAccessToken();
        const retryRes = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${freshToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!retryRes.ok) {
          const error = await retryRes.text();
          return NextResponse.json({ error: `Retry failed: ${error}` }, { status: 500 });
        }

        const data = await retryRes.json();
        return await processAndUploadImages(data, prompt, userId);
      } catch (retryError) {
        console.error("Token refresh retry failed:", retryError);
        return NextResponse.json({ error: "Authentication failed after retry" }, { status: 401 });
      }
    }

    if (!vertexRes.ok) {
      const error = await vertexRes.text();
      return NextResponse.json({ error }, { status: 500 });
    }

    const data = await vertexRes.json();
    return await processAndUploadImages(data, prompt, userId);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}

async function processAndUploadImages(data: any, prompt: string, userId?: string) {
  try {
    console.log("Processing Vertex AI response:", JSON.stringify(data, null, 2));
    
    if (!data.predictions || !Array.isArray(data.predictions)) {
      console.error("Invalid response format from Vertex AI:", data);
      throw new Error("Invalid response format from Vertex AI");
    }

    // Validate each prediction has required image data
    for (let i = 0; i < data.predictions.length; i++) {
      const pred = data.predictions[i];
      if (!pred.bytesBase64Encoded) {
        console.error(`Prediction ${i} missing image data:`, pred);
        throw new Error(`Missing image data in prediction ${i}`);
      }
    }

    // Upload images to R2 and get public URLs
    const imagesToUpload = data.predictions.map((pred: any) => {
      return {
        buffer: base64ToBuffer(pred.bytesBase64Encoded),
        prompt: pred.prompt || prompt,
        mimeType: pred.mimeType || 'image/png',
      };
    });

    console.log(`Uploading ${imagesToUpload.length} images to R2...`);
    
    const uploadResults = await uploadMultipleImagesToR2(
      imagesToUpload,
      "generate-image",
      userId
    );

    console.log("R2 upload results:", uploadResults);

    // Return both R2 URLs and base64 data URLs for immediate display
    const images = uploadResults.map((result, index) => {
      const pred = data.predictions[index];
      const dataUrl = `data:${pred.mimeType || 'image/png'};base64,${pred.bytesBase64Encoded}`;
      
      // Use public URL as primary since we're setting ACL to public-read
      const displayUrl = result.url; // This is now the public URL
      
      console.log(`Image ${index}: Public URL = ${displayUrl}, Data URL length = ${dataUrl.length}`);
      
      return {
        url: displayUrl, // Use public URL as primary display URL
        dataUrl: dataUrl, // For immediate display fallback
        publicUrl: result.publicUrl, // Same as url now
        prompt: pred.prompt || prompt,
        r2Key: result.key,
      };
    });

    console.log(`Successfully processed and uploaded ${images.length} images`);
    return NextResponse.json({ images, success: true });
  } catch (uploadError) {
    console.error("Failed to upload images to R2:", uploadError);
    
    // Ensure we have valid data before falling back
    if (!data.predictions || !Array.isArray(data.predictions)) {
      console.error("Cannot create fallback images due to invalid data:", data);
      throw uploadError; // Re-throw if we can't even create fallback
    }
    
    // Return images with base64 URLs even if upload fails
    const images = data.predictions.map((pred: any, index: number) => {
      const dataUrl = `data:${pred.mimeType || 'image/png'};base64,${pred.bytesBase64Encoded}`;
      console.log(`Fallback image ${index}: Data URL length = ${dataUrl.length}`);
      
      return {
        url: dataUrl, // Use data URL as main URL when R2 fails
        dataUrl: dataUrl,
        prompt: pred.prompt || prompt,
        error: "R2 upload failed, using base64 data",
      };
    });
    
    console.log(`Returning ${images.length} fallback images (R2 upload failed)`);
    return NextResponse.json({ images, success: false, error: "R2 upload failed" });
  }
} 