import { NextRequest, NextResponse } from "next/server";
import { uploadImageToR2 } from "@/lib/r2-upload";

// Cache to avoid redundant storage uploads
const processedUrls = new Map<string, any>();

export async function POST(req: NextRequest) {
  try {
    const { polling_url, prompt, userId } = await req.json();
    if (!polling_url) {
      return NextResponse.json({ error: "polling_url is required" }, { status: 400 });
    }
    
    // Check if we've already processed this URL and cached the result
    if (processedUrls.has(polling_url)) {
      console.log("Using cached polling result");
      return NextResponse.json(processedUrls.get(polling_url));
    }
    
    console.log(`Polling edit result: ${polling_url.substring(0, 50)}...`);
    
    // Add a timeout to the fetch to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const res = await fetch(polling_url, { 
        method: "GET",
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        return NextResponse.json(
          { error: `Polling service returned ${res.status}: ${res.statusText}` }, 
          { status: res.status }
        );
      }
      
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
          
          // Enhance response with progress information
          const enhancedResponse = {
            ...data,
            r2: {
              publicUrl: uploadResult.publicUrl,
              signedUrl: uploadResult.url,
              key: uploadResult.key,
            }
          };
          
          // Cache the successful result
          processedUrls.set(polling_url, enhancedResponse);
          
          // Clean up old cache entries (keep cache for 10 minutes max)
          setTimeout(() => {
            processedUrls.delete(polling_url);
          }, 10 * 60 * 1000);
          
          return NextResponse.json(enhancedResponse);
        } catch (uploadError) {
          console.error("Failed to upload edited image to R2:", uploadError);
          // Return original response even if upload fails
          return NextResponse.json(data);
        }
      }
      
      // Add progress information based on status
      if (data.status && data.status === "Processing") {
        data.progress = "Processing your edit";
      } else if (data.progress === undefined) {
        data.progress = "Working on your image";
      }
      
      return NextResponse.json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("Error fetching polling URL:", fetchError);
      return NextResponse.json({ 
        error: fetchError instanceof Error ? fetchError.message : "Failed to fetch polling result",
        status: "Error"
      }, { status: 500 });
    }
  } catch (err: any) {
    console.error("Poll edit result error:", err);
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}