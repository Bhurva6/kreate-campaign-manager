import { NextRequest, NextResponse } from "next/server";
import { uploadImageToR2, base64ToBuffer, getMimeTypeFromDataUrl } from "@/lib/r2-upload";

// Simple request deduplication cache - stores recent prompts with timestamps
// This helps prevent duplicate API calls
const recentRequests = new Map<string, number>();
const DEDUPLICATION_WINDOW = 3000; // 3 seconds window for deduplication
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB maximum size (approximate for base64)

export async function POST(req: NextRequest) {
  try {
    const { prompt, input_image, userId } = await req.json();
    if (!prompt || !input_image) {
      return NextResponse.json({ error: "Prompt and input_image are required." }, { status: 400 });
    }
    
    // Check image size (approximate calculation for base64)
    // Base64 encoding increases size by ~33%, so this is a conservative estimate
    const approximateSize = input_image.length * 0.75;
    if (approximateSize > MAX_IMAGE_SIZE) {
      console.error("Image too large:", Math.round(approximateSize / (1024 * 1024)), "MB (approx). Max size is", MAX_IMAGE_SIZE / (1024 * 1024), "MB");
      return NextResponse.json({ 
        error: `Image is too large. Maximum size is 10MB.` 
      }, { status: 400 });
    }
    
    // Generate a cache key based on prompt and first 100 chars of image data
    // This should be enough to identify duplicate requests
    const cacheKey = `${prompt}-${input_image.substring(0, 100)}`;
    const now = Date.now();
    
    // Check for recent identical requests
    if (recentRequests.has(cacheKey)) {
      const lastRequestTime = recentRequests.get(cacheKey) || 0;
      if (now - lastRequestTime < DEDUPLICATION_WINDOW) {
        console.log("Duplicate edit request detected and blocked");
        return NextResponse.json({ error: "Please wait a moment before submitting the same request again." }, { status: 429 });
      }
    }
    
    // Store this request in the cache
    recentRequests.set(cacheKey, now);
    
    // Clean up old cache entries (those older than 1 minute)
    for (const [key, timestamp] of recentRequests.entries()) {
      if (now - timestamp > 60000) { // 1 minute
        recentRequests.delete(key);
      }
    }

    const apiKey = process.env.FLUX_KONTEXT_API_KEY;
    if (!apiKey) {
      console.error("Missing Flux Kontext API key in environment variables");
      return NextResponse.json({ error: "Missing Flux Kontext API key." }, { status: 500 });
    }

    const body = {
      prompt,
      input_image,
      output_format: "png",
      safety_tolerance: 2,
    };

    console.log("Sending request to Flux Kontext API...");
    
    let data;
    try {
      const res = await fetch("https://api.bfl.ai/v1/flux-kontext-pro", {
        method: "POST",
        headers: {
          "x-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      
      console.log("Flux Kontext API response status:", res.status);
      
      // First try to parse the response as JSON
      const responseText = await res.text();
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse API response as JSON:", responseText.substring(0, 200));
        return NextResponse.json({ 
          error: "Invalid response from image editing API", 
          details: "Response couldn't be parsed as JSON" 
        }, { status: 500 });
      }
      
      if (!res.ok) {
        console.error("API error response:", data);
        return NextResponse.json({ 
          error: data.error || "Failed to edit image",
          details: JSON.stringify(data).substring(0, 200)
        }, { status: res.status });
      }
      
      console.log("API request successful, returning data");
      return NextResponse.json({ ...data });
    } catch (fetchError: any) {
      console.error("Error fetching from Flux Kontext API:", fetchError.message);
      return NextResponse.json({ 
        error: "Error connecting to image editing service", 
        details: fetchError.message 
      }, { status: 500 });
    }
  } catch (err: any) {
    console.error("Edit image error details:", {
      message: err.message,
      stack: err.stack,
      cause: err.cause,
    });
    return NextResponse.json({ 
      error: err.message || "Unknown error",
      errorType: err.name || "UnknownError"
    }, { status: 500 });
  }
}