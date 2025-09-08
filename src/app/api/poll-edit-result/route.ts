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
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout (increased from 10s)
    
    try {
      const res = await fetch(polling_url, { 
        method: "GET",
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        console.error("Polling error:", res.status, res.statusText);
        return NextResponse.json(
          { 
            error: `Polling service returned ${res.status}: ${res.statusText}`,
            details: `Failed to poll results from ${polling_url.substring(0, 30)}...`
          }, 
          { status: res.status }
        );
      }
      
      // First try to parse the response as JSON
      let data;
      const responseText = await res.text();
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse polling response as JSON:", responseText.substring(0, 200));
        return NextResponse.json({ 
          error: "Invalid response from polling service", 
          details: "Response couldn't be parsed as JSON" 
        }, { status: 500 });
      }
    
      // If image is ready and we have the result, upload to R2
      if (data.status === "Ready" && data.result?.sample) {
        try {
          console.log("Edit is ready, fetching result image");
          // Fetch the image from the URL
          const imageRes = await fetch(data.result.sample);
          if (!imageRes.ok) {
            console.error("Failed to fetch result image:", imageRes.status, imageRes.statusText);
            return NextResponse.json({
              error: "Failed to fetch edited image result",
              details: `Image URL returned status ${imageRes.status}`
            }, { status: 500 });
          }
          
          const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
          
          console.log("Uploading edited image to R2 storage");
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
          
          console.log("Successfully processed and stored edited image");
          return NextResponse.json(enhancedResponse);
        } catch (uploadError: any) {
          console.error("Failed to upload edited image to R2:", uploadError.message, uploadError.stack);
          // Return original response even if upload fails
          return NextResponse.json({
            ...data,
            uploadError: "Failed to store edited image",
            details: uploadError.message
          });
        }
      }
      
      // Add progress information based on status
      if (data.status && data.status === "Processing") {
        data.progress = "Processing your edit";
      } else if (data.progress === undefined) {
        data.progress = "Working on your image";
      }
      
      return NextResponse.json(data);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error("Error fetching polling URL:", fetchError.message, fetchError.stack);
      
      // For timeout errors, give more helpful information
      if (fetchError.name === "AbortError") {
        return NextResponse.json({ 
          error: "Polling request timed out",
          details: "The image editing service is taking longer than expected to respond",
          status: "Processing", // Return "Processing" instead of "Error" to encourage client to keep polling
          progress: "Still working on your image...",
          recoverable: true,
          suggestion: "Continue polling, your image is still being processed"
        }, { status: 202 }); // Use 202 Accepted to indicate processing is continuing
      }
      
      return NextResponse.json({ 
        error: fetchError instanceof Error ? fetchError.message : "Failed to fetch polling result",
        details: fetchError instanceof Error ? fetchError.stack : undefined,
        status: "Error",
        recoverable: false // Indicate this is not recoverable
      }, { status: 500 });
    }
  } catch (err: any) {
    console.error("Poll edit result error:", err.message, err.stack);
    return NextResponse.json({ 
      error: err.message || "Unknown error",
      details: err.stack,
      errorType: err.name || "UnknownError" 
    }, { status: 500 });
  }
}