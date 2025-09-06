import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Get the image URL from the query parameters
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get('url');
    
    console.log(`Proxy-image: Processing request for ${imageUrl}`);
    
    if (!imageUrl) {
      console.error('Proxy-image: No URL provided');
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }
    
    // Validate URL
    try {
      new URL(imageUrl);
    } catch (urlError) {
      console.error(`Proxy-image: Invalid URL format: ${imageUrl}`);
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }
    
    // Fetch the image through the server with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
    
    try {
      // Fetch the image through the server
      const response = await fetch(imageUrl, {
        headers: {
          // Add necessary headers for R2 or other services
          'Accept': 'image/*',
          'User-Agent': 'Mozilla/5.0 GoLoco Image Proxy'
        },
        signal: controller.signal,
        cache: 'no-store' // Ensure fresh content
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`Proxy-image: Failed to fetch from ${imageUrl} - Status: ${response.status} ${response.statusText}`);
        return NextResponse.json(
          { error: `Failed to fetch image: ${response.status} ${response.statusText}` }, 
          { status: response.status }
        );
      }
      
      // Get the image data and content type
      const imageData = await response.arrayBuffer();
      
      // Verify we got actual data
      if (imageData.byteLength === 0) {
        console.error(`Proxy-image: Empty response from ${imageUrl}`);
        return NextResponse.json({ error: 'Empty image data received' }, { status: 500 });
      }
      
      const contentType = response.headers.get('content-type') || 'image/png';
      console.log(`Proxy-image: Successfully fetched ${imageUrl} (${imageData.byteLength} bytes, ${contentType})`);
      
      // Return the image with appropriate headers
      return new NextResponse(imageData, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=604800', // Cache for 7 days
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error(`Proxy-image: Fetch timeout for ${imageUrl}`);
        return NextResponse.json({ error: 'Image fetch timed out' }, { status: 504 });
      }
      throw fetchError; // Re-throw to be caught by the outer catch
    }
  } catch (error: any) {
    console.error(`Proxy-image: Error processing ${req.url}:`, error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
