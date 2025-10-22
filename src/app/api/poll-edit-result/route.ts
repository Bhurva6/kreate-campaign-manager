import { NextRequest, NextResponse } from "next/server";

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
    
      // If image is ready and we have the result, return as base64 data URL
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
          const mimeType = imageRes.headers.get('content-type') || 'image/png';
          const base64 = imageBuffer.toString('base64');
          const dataUrl = `data:${mimeType};base64,${base64}`;
          
          // Return the data URL directly
          const enhancedResponse = {
            ...data,
            result: {
              ...data.result,
              sample: dataUrl
            }
          };
          
          // Cache the successful result
          processedUrls.set(polling_url, enhancedResponse);
          
          // Clean up old cache entries (keep cache for 10 minutes max)
          setTimeout(() => {
            processedUrls.delete(polling_url);
          }, 10 * 60 * 1000);
          
          console.log("Successfully processed edited image as data URL");
          return NextResponse.json(enhancedResponse);
        } catch (fetchError: any) {
          console.error("Failed to process edited image:", fetchError.message, fetchError.stack);
          // Return original response even if processing fails
          return NextResponse.json({
            ...data,
            processError: "Failed to process edited image",
            details: fetchError.message
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