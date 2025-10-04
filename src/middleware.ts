import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Block requests to /genai/banners to prevent 404 errors
  if (request.nextUrl.pathname === '/genai/banners') {
    return new Response(null, { status: 204 }); // No Content response
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/genai/banners',
};
