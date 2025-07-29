import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';

// Define protected routes that require authentication
const protectedRoutes = [
  '/home',
  '/dashboard',
  '/brand-kit',
  '/graphics',
  '/interior-designing',
  '/architecture',
  '/copy-the-ad',
  '/make-it-better',
  '/edit',
  '/admin',
  '/profile',
  '/settings',
];

// Define auth routes (should redirect to dashboard if already authenticated)
const authRoutes = [
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/signin',
  '/signup',
];

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/about',
  '/contact',
  '/pricing',
  '/terms',
  '/privacy',
  '/help',
];

// Define API routes that don't require authentication
const publicApiRoutes = [
  '/api/auth/register',
  '/api/auth/signin',
  '/api/auth/verify-email',
  '/api/auth/resend-otp',
  '/api/auth/google',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/send-phone-otp',
  '/api/auth/verify-phone-otp',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Add this to check if middleware is even running
  console.log('🚨 MIDDLEWARE ENTRY:', pathname, 'Time:', new Date().toLocaleTimeString());
  
  console.log('🔐 MIDDLEWARE: Processing path:', pathname);
  
  // Allow static files and Next.js internal routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json'
  ) {
    console.log('🔐 MIDDLEWARE: Allowing static/internal route:', pathname);
    return NextResponse.next();
  }
  
  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    console.log('🔐 MIDDLEWARE: Allowing public route:', pathname);
    return NextResponse.next();
  }
  
  // Allow public API routes
  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    console.log('🔐 MIDDLEWARE: Allowing public API route:', pathname);
    return NextResponse.next();
  }
  
  // Get tokens from both header and cookies
  const authHeader = request.headers.get('authorization');
  const accessTokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  
  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  console.log('🔐 MIDDLEWARE: Route analysis:', {
    pathname,
    isProtectedRoute,
    isAuthRoute,
    hasAccessToken: !!accessTokenFromHeader,
    hasRefreshToken: !!refreshToken
  });
  
  if (isProtectedRoute) {
    let isAuthenticated = false;
    let isEmailVerified = false;
    
    // Check access token first
    if (accessTokenFromHeader) {
      try {
        const payload = verifyAccessToken(accessTokenFromHeader);
        isAuthenticated = true;
        isEmailVerified = payload.isEmailVerified;
        console.log('Access token valid:', { userId: payload.userId, isEmailVerified });
      } catch (error) {
        console.log('Access token invalid:', error instanceof Error ? error.message : 'Unknown error');
      }
    }
    
    // If no valid access token, check refresh token
    if (!isAuthenticated && refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        // For refresh token, we need to check the user in the database
        // For now, we'll allow access but the client should refresh
        isAuthenticated = true;
        console.log('Refresh token valid:', { userId: payload.userId });
      } catch (error) {
        console.log('Refresh token invalid:', error instanceof Error ? error.message : 'Unknown error');
      }
    }
    
    // If no tokens at all, redirect to signin
    if (!isAuthenticated) {
      console.log('🔐 MIDDLEWARE: BLOCKING ACCESS - No valid tokens, redirecting to /signin');
      return NextResponse.redirect(new URL('/signin', request.url));
    }
    
    // If authenticated but email not verified (only for access tokens, not refresh tokens)
    if (accessTokenFromHeader && !isEmailVerified) {
      console.log('🔐 MIDDLEWARE: BLOCKING ACCESS - Email not verified, redirecting to /verify-email');
      return NextResponse.redirect(new URL('/verify-email', request.url));
    }
    
    console.log('🔐 MIDDLEWARE: ALLOWING ACCESS to protected route:', pathname);
    return NextResponse.next();
  }
  
  if (isAuthRoute) {
    let isAuthenticated = false;
    
    // Check if user is already authenticated
    if (accessTokenFromHeader) {
      try {
        const payload = verifyAccessToken(accessTokenFromHeader);
        if (payload.isEmailVerified) {
          isAuthenticated = true;
        }
      } catch (error) {
        // Access token is invalid
      }
    }
    
    // Check refresh token
    if (!isAuthenticated && refreshToken) {
      try {
        verifyRefreshToken(refreshToken);
        isAuthenticated = true;
      } catch (error) {
        // Refresh token is invalid
      }
    }
    
    // If authenticated, redirect to dashboard
    if (isAuthenticated) {
      console.log('🔐 MIDDLEWARE: User authenticated, redirecting from auth route to /brand-kit');
      return NextResponse.redirect(new URL('/brand-kit', request.url));
    }
    
    // Not authenticated, allow access to auth pages
    console.log('🔐 MIDDLEWARE: Allowing access to auth route:', pathname);
    return NextResponse.next();
  }
  
  // For all other routes, allow access
  console.log('🔐 MIDDLEWARE: Allowing access to unmatched route:', pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
