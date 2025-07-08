import { NextRequest, NextResponse } from "next/server";
import { uploadImageToR2, base64ToBuffer } from "@/lib/r2-upload";

export async function POST(req: NextRequest) {
  try {
    const { polling_url, prompt, userId } = await req.json();
    if (!polling_url) {
      return NextResponse.json({ error: "polling_url is required" }, { status: 400 });
    }
    
    const res = await fetch(polling_url, { method: "GET" });
    const data = await res.json();
    
    // If image is ready and we have the result, upload to R2
    if (data.status === "Ready" && data.result?.sample) {
      try {
        // Fetch the image from the URL
        const imageRes = await fetch(data.result.sample);
        const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
        
        // Upload to R2
        const uploadResult = await uploadImageToR2({
          imageBuffer,
          category: "edit-image",
          prompt: prompt || "edited-image",
          mimeType: "image/png",
          userId,
        });
        
        // Add R2 URLs to the response
        return NextResponse.json({
          ...data,
          r2: {
            publicUrl: uploadResult.publicUrl,
            signedUrl: uploadResult.url,
            key: uploadResult.key,
          }
        });
      } catch (uploadError) {
        console.error("Failed to upload edited image to R2:", uploadError);
        // Return original response even if upload fails
        return NextResponse.json(data);
      }
    }
    
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
} 