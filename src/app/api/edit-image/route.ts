import { NextRequest, NextResponse } from "next/server";
import { uploadImageToR2, base64ToBuffer, getMimeTypeFromDataUrl } from "@/lib/r2-upload";
import { tokenManager } from '@/lib/google-auth';

// Simple request deduplication cache - stores recent prompts with timestamps
// This helps prevent duplicate API calls
const recentRequests = new Map<string, number>();
const DEDUPLICATION_WINDOW = 3000; // 3 seconds window for deduplication
const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB maximum size (reduced from 10MB for better performance)

// API endpoint interface
type ApiEndpoint = {
  url: string;
  headerKey: string;
  envKey: string;
  timeout: number;
  retryDelay: number;
  apiType?: string;
};

// API endpoints - primary and fallback
const API_ENDPOINTS = [
  {
    url: "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-image-preview:generateContent", // Use gemini-2.5-flash-image-preview which requires OAuth token
    headerKey: "Authorization", 
    envKey: "GEMINI_OAUTH_TOKEN", // We'll use the dynamically generated token instead of env var
    timeout: 60000, // 60 seconds - increased timeout for OAuth token usage
    retryDelay: 1500, // 1.5 seconds
    apiType: "gemini-direct"
  },
  {
    url: "https://api.bfl.ai/v1/flux-kontext-pro",
    headerKey: "x-key", 
    envKey: "FLUX_KONTEXT_API_KEY",
    timeout: 60000, // 60 seconds
    retryDelay: 2000 // 2 seconds
  },

];

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
        error: `Image is too large. Maximum size is 8MB.`,
        suggestion: "Please resize your image before uploading."
      }, { status: 400 });
    }
    
    // Generate a job ID for tracking this request
    const jobId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    console.log(`Starting image edit job ${jobId}`);
    
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

    // Check if any of our API keys are available and generate OAuth token for Gemini
    let geminiToken: string | null = null;
    try {
      // Generate a fresh OAuth token for gemini-2.5-flash-image-preview which requires OAuth
      geminiToken = await tokenManager.getAccessToken();
      console.log("Generated OAuth token for Gemini API");
    } catch (tokenErr) {
      console.error("Failed to generate Gemini OAuth token:", tokenErr);
      // We'll continue without the token and try other APIs if available
    }
    
    const fluxKey = process.env.FLUX_KONTEXT_API_KEY;
    const stabilityKey = process.env.STABILITY_API_KEY;
    
    console.log("API Keys available check:", {
      "GEMINI_OAUTH_TOKEN": geminiToken ? "Available (generated)" : "Failed to generate",
      "FLUX_KONTEXT_API_KEY": fluxKey ? "Available" : "Missing",
      "STABILITY_API_KEY": stabilityKey ? "Available" : "Missing"
    });

    // At least one API key should be available
    if (!geminiToken && !fluxKey && !stabilityKey) {
      console.error("No API keys available or OAuth token could not be generated");
      return NextResponse.json({ 
        error: "API configuration error", 
        details: "No API keys available or OAuth token could not be generated. Please check your environment variables and service account configuration." 
      }, { status: 500 });
    }
    
    // Continue even without primary API key as we'll try fallbacks

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
        
        // Get the mime type for format detection
        const mimeType = base64Parts[0].match(/data:(.*?);/)?.[1]?.toLowerCase() || '';
        console.log("Detected mime type:", mimeType);
        
        // Handle iPhone HEIC/HEIF images specifically if needed
        if (mimeType === 'image/heic' || mimeType === 'image/heif') {
          console.log("iPhone HEIC/HEIF image detected, ensuring compatibility");
          // We'll continue with processing, but note the format for potential conversion
          // The actual conversion happens in the browser before upload in most cases
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

    console.log("Preparing to send request to image editing APIs...");
    
    // Smart retry mechanism with multiple API fallbacks
    const MAX_RETRIES_PER_API = 2; // 2 retries per API
    const MAX_TOTAL_ATTEMPTS = API_ENDPOINTS.length * MAX_RETRIES_PER_API; // Total attempts across all APIs
    
    // Determine which API to start with based on available keys
    let apiIndex = 0; // Default: start with primary API (Gemini)
    
    // If the primary API (Gemini with OAuth token) is not available, start with the first available one
    if (!geminiToken) {
      console.log("Gemini OAuth token not available, looking for alternative APIs");
      let foundAlternative = false;
      for (let i = 1; i < API_ENDPOINTS.length; i++) {
        if (process.env[API_ENDPOINTS[i].envKey]) {
          console.log(`Starting with ${API_ENDPOINTS[i].envKey} instead`);
          apiIndex = i;
          foundAlternative = true;
          break;
        }
      }
      if (!foundAlternative) {
        console.log("No alternative APIs found, will still try with Gemini but likely to fail");
      }
    }
    let attemptsOnCurrentApi = 0;
    let totalAttempts = 0;
    let lastError = null;
    let data;
    
    // Compress large images further if needed
    const imageSize = Math.round(processedImage.length * 0.75 / 1024);
    console.log(`Processing image of size: ~${imageSize}KB with ${MAX_TOTAL_ATTEMPTS} total allowed attempts`);
    
    // Prepare progress tracking
    const startTime = Date.now();
    
    while (totalAttempts < MAX_TOTAL_ATTEMPTS) {
      try {
        totalAttempts++;
        attemptsOnCurrentApi++;
        
        const currentEndpoint: ApiEndpoint = API_ENDPOINTS[apiIndex];
        
        // Get the appropriate key or token based on the endpoint
        let currentApiKey: string | null = null;
        if (currentEndpoint.envKey === 'GEMINI_OAUTH_TOKEN') {
          // Use the dynamically generated OAuth token for Gemini
          currentApiKey = geminiToken;
          console.log("Using dynamically generated OAuth token for Gemini model");
        } else {
          // Use environment variable for other APIs
          currentApiKey = process.env[currentEndpoint.envKey] || null;
        }
        
        if (!currentApiKey) {
          console.error(`Missing API key/token for ${currentEndpoint.url}`);
          
          // Try next API if available
          if (apiIndex < API_ENDPOINTS.length - 1) {
            console.log(`Missing API key/token for ${currentEndpoint.apiType || currentEndpoint.url}, trying next API...`);
            apiIndex++;
            attemptsOnCurrentApi = 0;
            continue;
          } else {
            return NextResponse.json({ 
              error: "API configuration error", 
              details: `No API keys available. Make sure API keys or OAuth token are properly configured.`
            }, { status: 500 });
          }
        }
        
        // Progress logging
        const elapsedSecs = Math.round((Date.now() - startTime) / 1000);
        console.log(`API attempt ${totalAttempts}/${MAX_TOTAL_ATTEMPTS} (${elapsedSecs}s elapsed) using ${currentEndpoint.apiType === "vertex-gemini" ? "Vertex AI Gemini" : currentEndpoint.url}`);
        
        // Setup timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), currentEndpoint.timeout);
        
        let res;
        try {
          console.log(`Starting API request to ${currentEndpoint.apiType === "vertex-gemini" ? "us-central1-aiplatform.googleapis.com" : new URL(currentEndpoint.url).hostname}...`);
          
          // Create appropriate request body for current API endpoint
          let apiBody = body;
          const apiHeaders = {
            "Content-Type": "application/json",
            "Accept": "application/json"
          };
          
          // Format request body based on which API we're calling
          if (currentEndpoint.apiType === "gemini-direct") {
            // Direct Gemini 2.5 Flash Image format 
            // Determine the best mime type to use
            let mimeType = "image/jpeg"; // Default mime type
            
            // Try to detect the image format from data URL if present
            if (input_image.startsWith('data:image/')) {
              const detectedMime = input_image.match(/data:(image\/[^;]+);/)?.[1];
              if (detectedMime) {
                // For HEIC/HEIF from iPhones, convert mime type to jpeg for better compatibility
                if (detectedMime === 'image/heic' || detectedMime === 'image/heif') {
                  mimeType = "image/jpeg";
                  console.log("Converting HEIC/HEIF format to JPEG for API compatibility");
                } else {
                  mimeType = detectedMime;
                }
              }
            }
            
            apiBody = {
              contents: [{
                parts: [
                  {
                    text: `Edit this image based on the following prompt: ${body.prompt}`
                  },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: body.input_image
                    }
                  }
                ]
              }],
              generation_config: {
                temperature: 0.4,
                top_p: 1,
                top_k: 32,
                max_output_tokens: 8192
              }
            } as any;
          } else if (currentEndpoint.url.includes('stability.ai')) {
            // Stability AI format is different (with type assertion)
            apiBody = {
              text_prompts: [
                {
                  text: body.prompt,
                  weight: 1.0
                }
              ],
              image: body.input_image,
              cfg_scale: 8,
              samples: 1,
              style_preset: "photographic"
            } as any; // Using type assertion since this is a different API schema
          }
          
          // Set the API key in the correct header - using type assertion for header key
          let requestUrl = currentEndpoint.url;
          
          if (currentEndpoint.apiType === "gemini-direct") {
            // For direct Gemini API with the 2.5-flash-image-preview model, use OAuth token
            // This model requires OAuth authentication in the Authorization header
            apiHeaders[currentEndpoint.headerKey as keyof typeof apiHeaders] = `Bearer ${currentApiKey}`;
          } else {
            apiHeaders[currentEndpoint.headerKey as keyof typeof apiHeaders] = currentEndpoint.headerKey === "Authorization" 
              ? `Bearer ${currentApiKey}` 
              : currentApiKey;
          }
            
          res = await fetch(requestUrl, {
            method: "POST",
            headers: apiHeaders,
            body: JSON.stringify(apiBody),
            signal: controller.signal,
          });
          console.log("API request completed with status:", res.status);
          clearTimeout(timeoutId);
        } catch (fetchError: any) {
          // Handle timeout or network errors
          console.error("Fetch operation failed:", fetchError.message);
          
          if (fetchError.name === "AbortError") {
            lastError = "Request timed out after 60 seconds. This usually happens with large images or when the service is busy.";
          } else {
            lastError = fetchError.message;
          }
          
          // Try fallback API if we've exhausted retries on current API
          if (attemptsOnCurrentApi >= MAX_RETRIES_PER_API) {
            // Try next API if available
            if (apiIndex < API_ENDPOINTS.length - 1) {
              console.log(`Switching to fallback API ${apiIndex + 2}...`);
              apiIndex++;
              attemptsOnCurrentApi = 0;
            } else if (totalAttempts >= MAX_TOTAL_ATTEMPTS) {
              // All APIs and retries exhausted
              return NextResponse.json({ 
                error: "Connection error", 
                details: lastError,
                suggestion: "Try uploading a smaller image or try again later."
              }, { status: 500 });
            }
          }
          
          // Wait before retry
          const retryDelay = currentEndpoint.retryDelay;
          console.log(`Network error, retrying in ${retryDelay/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        console.log(`${new URL(currentEndpoint.url).hostname} API response status:`, res.status);
        
        // First try to parse the response as JSON
        const responseText = await res.text();
        try {
          data = JSON.parse(responseText);
          
          // Process the response based on which API was used
          if ((currentEndpoint.apiType === "vertex-gemini" || currentEndpoint.apiType === "gemini-direct") && data.candidates && data.candidates.length > 0) {
            // Extract image from Gemini API response (works for both direct and Vertex)
            const candidate = data.candidates[0];
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
              // Find the part that contains the image
              const imagePart = candidate.content.parts.find((part: any) => 
                part.inline_data && part.inline_data.mime_type && part.inline_data.mime_type.startsWith('image/'));
              
              if (imagePart && imagePart.inline_data && imagePart.inline_data.data) {
                // Reformat the response to match our expected format
                data = {
                  images: [imagePart.inline_data.data],
                  result: "success"
                };
                console.log(`Successfully extracted image from ${currentEndpoint.apiType === "gemini-direct" ? "Gemini API" : "Vertex AI Gemini"} response`);
              } else {
                console.error(`No image found in ${currentEndpoint.apiType === "gemini-direct" ? "Gemini API" : "Vertex AI Gemini"} response`);
                throw new Error(`No image found in ${currentEndpoint.apiType === "gemini-direct" ? "Gemini API" : "Vertex AI Gemini"} response`);
              }
            } else {
              console.error(`Invalid ${currentEndpoint.apiType === "gemini-direct" ? "Gemini API" : "Vertex AI Gemini"} response format`);
              throw new Error(`Invalid ${currentEndpoint.apiType === "gemini-direct" ? "Gemini API" : "Vertex AI Gemini"} response format`);
            }
          }
        } catch (parseError) {
          console.error("Failed to parse API response as JSON:", responseText.substring(0, 200));
          lastError = "Invalid response from image editing API";
          
          // Try fallback API if we've exhausted retries on current API
          if (attemptsOnCurrentApi >= MAX_RETRIES_PER_API) {
            // Try next API if available
            if (apiIndex < API_ENDPOINTS.length - 1) {
              console.log(`Switching to fallback API ${apiIndex + 2}...`);
              apiIndex++;
              attemptsOnCurrentApi = 0;
            } else if (totalAttempts >= MAX_TOTAL_ATTEMPTS) {
              // All APIs and retries exhausted
              return NextResponse.json({ 
                error: "Invalid response from image editing API", 
                details: "Response couldn't be parsed as JSON" 
              }, { status: 500 });
            }
          }
          
          // Wait before retry
          console.log("Retrying due to JSON parse error...");
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between retries
          continue;
        }
        
        if (!res.ok) {
          console.error("API error response:", data);
          
          // Handle specific error types with more helpful messages
          let errorMessage = "Failed to edit image";
          let errorDetails = JSON.stringify(data);
          
          // Special handling for iPhone image format errors
          if (data.error && typeof data.error === 'object' && data.error.message && 
              data.error.message.includes("unsupported image format")) {
            errorMessage = "Unsupported image format";
            errorDetails = "The image format (possibly HEIC/HEIF from iPhone) is not supported. Please convert to JPEG/PNG before uploading.";
            console.log("iPhone image format error detected, advising user to convert format");
          }
          // Special handling for Vertex AI permission errors
          else if (data.error && typeof data.error === 'object' && data.error.message &&
              (data.error.message.includes("Permission") || data.error.status === 'PERMISSION_DENIED')) {
            errorMessage = "API access issue";
            errorDetails = "Access to the image editing service is currently restricted. Switching to alternative service.";
            console.log("Vertex AI permission error detected, switching to alternative API immediately");
            
            // Immediately switch to the next API without retrying
            if (apiIndex < API_ENDPOINTS.length - 1) {
              console.log(`Permission denied for ${currentEndpoint.envKey}, switching to next API immediately`);
              apiIndex++;
              attemptsOnCurrentApi = 0;
              continue;
            }
          }
          // Check for common error patterns from the API
          else if (data.detail && data.detail.includes("preparing the task")) {
            errorMessage = "Image processing error";
            errorDetails = "The image format may not be compatible with the editing service. Try using a different image or converting to JPEG/PNG format.";
            
            // Log more details for debugging
            console.error("Task preparation error details:", {
              responseStatus: res.status,
              dataReceived: JSON.stringify(data),
              imageDataLength: processedImage.length,
              promptLength: prompt.length,
              attemptNumber: totalAttempts,
              apiProvider: new URL(currentEndpoint.url).hostname
            });
            
            // Try with longer delay, or switch APIs
            if (attemptsOnCurrentApi < MAX_RETRIES_PER_API) {
              console.log("Task preparation error, waiting 3 seconds before retry...");
              await new Promise(resolve => setTimeout(resolve, 3000));
              continue;
            } else if (apiIndex < API_ENDPOINTS.length - 1) {
              // Switch to fallback API
              console.log(`Switching to fallback API ${apiIndex + 2}...`);
              apiIndex++;
              attemptsOnCurrentApi = 0;
              continue;
            }
          } else if (data.error && typeof data.error === 'string' && data.error.toLowerCase().includes("too large")) {
            errorMessage = "Image is too large";
            errorDetails = "Please try with a smaller image or reduce the image resolution.";
          }
          
          lastError = errorMessage;
          
          // Try fallback API if we've exhausted retries on current API
          if (attemptsOnCurrentApi >= MAX_RETRIES_PER_API) {
            // Try next API if available
            if (apiIndex < API_ENDPOINTS.length - 1) {
              console.log(`Switching to fallback API ${apiIndex + 2}...`);
              apiIndex++;
              attemptsOnCurrentApi = 0;
            } else if (totalAttempts >= MAX_TOTAL_ATTEMPTS) {
              // All APIs and retries exhausted
              return NextResponse.json({ 
                error: errorMessage,
                details: errorDetails,
                suggestion: "Please try with a different image or edit prompt."
              }, { status: res.status });
            }
          }
          
          // Wait before retry
          console.log("Retrying due to API error...");
          await new Promise(resolve => setTimeout(resolve, currentEndpoint.retryDelay));
          continue;
        }
        
        // Success - break out of retry loop
        const endTime = Date.now();
        const processingTime = Math.round((endTime - startTime) / 100) / 10; // To seconds with 1 decimal
        
        console.log(`✓ API request successful (${processingTime}s) using ${currentEndpoint.apiType === "vertex-gemini" ? "Vertex AI Gemini" : new URL(currentEndpoint.url).hostname}`);
        
        // Include performance metrics and api used in response
        return NextResponse.json({ 
          ...data, 
          _meta: {
            processingTimeSeconds: processingTime,
            apiProvider: currentEndpoint.apiType === "vertex-gemini" ? 
              "Vertex AI Gemini" : new URL(currentEndpoint.url).hostname,
            apiEndpoint: currentEndpoint.url,
            jobId,
            attempts: totalAttempts
          }
        });
      } catch (error: any) {
        // This catches any other errors in the try block
        console.error("Unexpected error during API request:", error);
        lastError = error.message || "An unexpected error occurred";
        
        // Try fallback API if we've exhausted retries on current API
        if (attemptsOnCurrentApi >= MAX_RETRIES_PER_API) {
          // Try next API if available
          if (apiIndex < API_ENDPOINTS.length - 1) {
            console.log(`Switching to fallback API ${apiIndex + 2}...`);
            apiIndex++;
            attemptsOnCurrentApi = 0;
          } else if (totalAttempts >= MAX_TOTAL_ATTEMPTS) {
            // All APIs and retries exhausted
            return NextResponse.json({ 
              error: "Error processing request", 
              details: lastError,
              suggestion: "Please try again later."
            }, { status: 500 });
          }
        }
        
        // Wait before retry
        const retryDelay = API_ENDPOINTS[apiIndex].retryDelay || 2000;
        console.log(`Retrying after unexpected error in ${retryDelay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    const endTime = Date.now();
    const totalTimeSeconds = Math.round((endTime - startTime) / 1000);
    
    // Should never get here, but just in case
    console.error(`❌ All API attempts failed after ${totalTimeSeconds}s and ${totalAttempts} attempts`);
    
    return NextResponse.json({ 
      error: "Failed to edit image after multiple attempts", 
      details: lastError || "Unknown error",
      suggestion: "Our image editing service is experiencing high load. Please try again in a few minutes.",
      _meta: {
        totalTimeSeconds,
        attempts: totalAttempts,
        jobId
      }
    }, { status: 500 });
  } catch (err: any) {
    console.error("Edit image error details:", {
      message: err.message,
      stack: err.stack,
      cause: err.cause,
    });
    
    // Include troubleshooting instructions
    return NextResponse.json({ 
      error: err.message || "Unknown error",
      errorType: err.name || "UnknownError",
      suggestion: "Try using a smaller image or different format (JPEG/PNG).",
      troubleshooting: [
        "Make sure your image is in a standard format (JPEG/PNG)",
        "If uploading from an iPhone, make sure HEIC/HEIF images are converted to JPEG",
        "Try with a smaller image (under 4MB)",
        "Check your network connection",
        "Try a simpler edit prompt"
      ]
    }, { status: 500 });
  }
}