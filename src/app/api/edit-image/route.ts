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

    // Make sure the input_image is properly formatted for the API
    // The Flux Kontext API expects base64 WITHOUT the data URL prefix
    let processedImage = input_image;
    
    if (typeof input_image !== 'string') {
      console.error("Input image is not a string:", typeof input_image);
      return NextResponse.json({ 
        error: "Invalid image format", 
        details: "Image must be a base64 string or data URL" 
      }, { status: 400 });
    }
    
    // Process the image based on format
    try {
      if (input_image.startsWith('data:image/')) {
        // Extract just the base64 part from data URL
        console.log("Input is a data URL, extracting base64 content");
        // Format: data:image/jpeg;base64,/9j/4AAQSkZJRg...
        const base64Parts = input_image.split(',');
        if (base64Parts.length !== 2) {
          throw new Error("Invalid data URL format");
        }
        
        // Clean up the extracted base64 content
        processedImage = base64Parts[1].trim().replace(/\s/g, '');
        
        // Validate that it's proper base64 with a more permissive check
        if (!/^[A-Za-z0-9+/=]*$/.test(processedImage)) {
          console.error("Data URL base64 validation failed, contains invalid characters");
          throw new Error("Invalid base64 characters in data URL");
        }
        
        // Ensure base64 string is not empty
        if (processedImage.length === 0) {
          throw new Error("Empty base64 content in data URL");
        }
        
        // Some APIs expect base64 strings with padding. Ensure proper padding.
        const remainder = processedImage.length % 4;
        if (remainder > 0) {
          processedImage += '='.repeat(4 - remainder);
          console.log("Added padding to base64 string from data URL");
        }
      } else if (input_image.startsWith('http')) {
        console.error("Input appears to be a URL, cannot process directly");
        return NextResponse.json({
          error: "Invalid image format",
          details: "Direct image URLs are not supported. Please use a base64 or data URL format."
        }, { status: 400 });
      } else {
        // Assume it's already raw base64
        console.log("Input appears to be raw base64");
        
        // Clean up the base64 string by removing whitespace and other non-base64 characters
        processedImage = input_image.trim().replace(/\s/g, '');
        
        // Better validation with more permissive check but still ensures it's mostly valid base64
        if (!/^[A-Za-z0-9+/=]*$/.test(processedImage)) {
          console.error("Base64 validation failed, contains invalid characters");
          throw new Error("Invalid base64 characters in raw string");
        }
        
        // Ensure base64 string is not empty
        if (processedImage.length === 0) {
          throw new Error("Empty base64 string provided");
        }
        
        // Some APIs expect base64 strings with padding. Ensure proper padding.
        const remainder = processedImage.length % 4;
        if (remainder > 0) {
          processedImage += '='.repeat(4 - remainder);
          console.log("Added padding to base64 string");
        }
      }
      
      // Log the first few characters for debugging
      console.log("Processed image type:", typeof processedImage);
      console.log("Processed image preview:", `${processedImage.substring(0, 20)}...`);
    } catch (error: any) {
      console.error("Error processing image:", error);
      return NextResponse.json({
        error: "Invalid image format",
        details: `Could not process image: ${error.message}`,
        help: "Make sure you're providing a valid image in base64 format or as a data URL."
      }, { status: 400 });
    }

    // Validate that the processed image is not too long or too short
    if (processedImage.length < 100) {
      console.error("Processed image is suspiciously short:", processedImage.length);
      return NextResponse.json({
        error: "Invalid image data",
        details: "The processed image data is too short to be valid."
      }, { status: 400 });
    }

    // Log image size in KB for debugging
    console.log(`Image size: ~${Math.round(processedImage.length * 0.75 / 1024)}KB`);

    // Try to validate the prompt and image before sending to API
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({
        error: "Invalid prompt",
        details: "Prompt cannot be empty"
      }, { status: 400 });
    }
    
    const body = {
      prompt: prompt.trim(),
      input_image: processedImage,
      output_format: "png", // Using PNG format is typically more reliable for editing operations
      safety_tolerance: 2,
    };
    
    // Optional: Log a sanitized version of the request for debugging
    console.log("API request:", {
      prompt: body.prompt,
      inputImageLength: body.input_image.length,
      outputFormat: body.output_format
    });

    console.log("Sending request to Flux Kontext API...");
    
    // Implement a retry mechanism
    const MAX_RETRIES = 2;
    let attempt = 0;
    let lastError = null;
    let data;
    
    while (attempt <= MAX_RETRIES) {
      try {
        attempt++;
        console.log(`API attempt ${attempt}/${MAX_RETRIES + 1}`);
        
        // Add timeout handling for the fetch operation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        let res;
        try {
          res = await fetch("https://api.bfl.ai/v1/flux-kontext-pro", {
            method: "POST",
            headers: {
              "x-key": apiKey,
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify(body),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
        } catch (fetchError: any) {
          // Handle timeout or network errors
          console.error("Fetch operation failed:", fetchError.message);
          
          if (fetchError.name === "AbortError") {
            lastError = "Request timed out after 30 seconds";
          } else {
            lastError = fetchError.message;
          }
          
          // If this is the last retry, return an error
          if (attempt > MAX_RETRIES) {
            return NextResponse.json({ 
              error: "Connection error", 
              details: lastError
            }, { status: 500 });
          }
          
          // Wait a bit longer between retries for network issues
          console.log("Network error, retrying in 2 seconds...");
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        
        console.log("Flux Kontext API response status:", res.status);
        
        // First try to parse the response as JSON
        const responseText = await res.text();
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Failed to parse API response as JSON:", responseText.substring(0, 200));
          lastError = "Invalid response from image editing API";
          
          // If this is the last retry, return an error
          if (attempt > MAX_RETRIES) {
            return NextResponse.json({ 
              error: "Invalid response from image editing API", 
              details: "Response couldn't be parsed as JSON" 
            }, { status: 500 });
          }
          
          // Otherwise retry
          console.log("Retrying due to JSON parse error...");
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between retries
          continue;
        }
        
        if (!res.ok) {
          console.error("API error response:", data);
          
          // Handle specific error types with more helpful messages
          let errorMessage = "Failed to edit image";
          let errorDetails = JSON.stringify(data);
          
          // Check for common error patterns from the API
          if (data.detail && data.detail.includes("preparing the task")) {
            errorMessage = "Image processing error";
            errorDetails = "The image format may not be compatible with the editing service. Try using a different image or converting to JPEG/PNG format.";
            
            // Log more details for debugging
            console.error("Task preparation error details:", {
              responseStatus: res.status,
              dataReceived: JSON.stringify(data),
              imageDataLength: processedImage.length,
              promptLength: prompt.length,
              attemptNumber: attempt
            });
            
            // Add a longer delay for task preparation errors
            if (attempt <= MAX_RETRIES) {
              console.log("Task preparation error, waiting 3 seconds before retry...");
              await new Promise(resolve => setTimeout(resolve, 3000));
              continue;
            }
          } else if (data.error && typeof data.error === 'string' && data.error.toLowerCase().includes("too large")) {
            errorMessage = "Image is too large";
            errorDetails = "Please try with a smaller image or reduce the image resolution.";
          }
          
          lastError = errorMessage;
          
          // If this is the last retry, return an error
          if (attempt > MAX_RETRIES) {
            return NextResponse.json({ 
              error: errorMessage,
              details: errorDetails
            }, { status: res.status });
          }
          
          // Otherwise retry
          console.log("Retrying due to API error...");
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between retries
          continue;
        }
        
        // Success - break out of retry loop
        console.log("API request successful, returning data");
        return NextResponse.json({ ...data });
      } catch (error: any) {
        // This catches any other errors in the try block
        console.error("Unexpected error during API request:", error);
        lastError = error.message || "An unexpected error occurred";
        
        // If this is the last retry, return an error
        if (attempt > MAX_RETRIES) {
          return NextResponse.json({ 
            error: "Error processing request", 
            details: lastError
          }, { status: 500 });
        }
        
        // Otherwise retry
        console.log("Retrying after unexpected error...");
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      }
    }
    
    // Should never get here, but just in case
    return NextResponse.json({ 
      error: "Failed to edit image after multiple attempts", 
      details: lastError || "Unknown error" 
    }, { status: 500 });
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