import { NextRequest, NextResponse } from "next/server";

/**
 * Simple test endpoint for image loading issues
 * Allows testing different image loading scenarios
 */
export async function GET(req: NextRequest) {
  try {
    // Get test parameters from query
    const { searchParams } = new URL(req.url);
    const testCase = searchParams.get('case') || 'success';
    
    console.log(`Running image load test: ${testCase}`);
    
    // Different test cases
    switch (testCase) {
      case 'success':
        // Return success message
        return NextResponse.json({ 
          status: 'success', 
          message: 'Image proxy is working correctly',
          testUrls: [
            '/api/proxy-image?url=' + encodeURIComponent('https://via.placeholder.com/300x200'),
            '/api/proxy-image?url=' + encodeURIComponent('https://source.unsplash.com/random/300x200')
          ]
        }, { status: 200 });
        
      case 'load-external':
        // Test loading an external image through the proxy
        const externalUrl = 'https://source.unsplash.com/random/300x200';
        const response = await fetch(externalUrl);
        
        if (!response.ok) {
          throw new Error(`External image fetch failed: ${response.status}`);
        }
        
        const imageData = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        
        return new NextResponse(imageData, {
          headers: {
            'Content-Type': contentType
          }
        });
        
      case 'error':
        // Simulate an error response
        return NextResponse.json({ 
          status: 'error', 
          message: 'Simulated error response' 
        }, { status: 500 });
        
      case 'timeout':
        // Simulate a timeout by waiting and then responding
        await new Promise(resolve => setTimeout(resolve, 5000));
        return NextResponse.json({ 
          status: 'timeout-resolved', 
          message: 'Request completed after delay' 
        });
        
      default:
        return NextResponse.json({ 
          status: 'unknown-test', 
          message: `Unknown test case: ${testCase}` 
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in test-image-loading route:', error);
    return NextResponse.json({ 
      status: 'error',
      message: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
