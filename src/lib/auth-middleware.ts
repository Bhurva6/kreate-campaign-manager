import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractTokenFromRequest, TokenPayload } from './jwt';
import connectDB from './db';
import User from '@/models/User';

export interface AuthenticatedRequest extends NextRequest {
  user?: TokenPayload;
}

/**
 * Middleware to authenticate requests
 */
export const authenticateRequest = async (request: NextRequest): Promise<{
  success: boolean;
  user?: TokenPayload;
  error?: string;
}> => {
  try {
    const token = extractTokenFromRequest(request);
    
    if (!token) {
      return {
        success: false,
        error: 'No authentication token provided',
      };
    }
    
    // Verify the token
    let payload: TokenPayload;
    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TokenExpiredError') {
          return {
            success: false,
            error: 'Token expired',
          };
        }
        
        if (error.name === 'JsonWebTokenError') {
          return {
            success: false,
            error: 'Invalid token',
          };
        }
      }
      
      return {
        success: false,
        error: 'Token verification failed',
      };
    }
    
    // Connect to database and verify user exists
    await connectDB();
    const user = await User.findById(payload.userId).select('-password -refreshToken');
    
    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }
    
    // Check if email is verified for sensitive operations
    if (!user.isEmailVerified) {
      return {
        success: false,
        error: 'Email not verified',
      };
    }
    
    return {
      success: true,
      user: {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
      },
    };
    
  } catch (error) {
    console.error('Authentication error:', error);
    
    return {
      success: false,
      error: 'Authentication failed',
    };
  }
};

/**
 * Create authentication response
 */
export const createAuthErrorResponse = (error: string, status: number = 401) => {
  return NextResponse.json(
    { success: false, error },
    { status }
  );
};

/**
 * Higher-order function for protected API routes
 */
export const withAuth = (
  handler: (request: NextRequest, context: any, user: TokenPayload) => Promise<NextResponse>
) => {
  return async (request: NextRequest, context: any) => {
    const authResult = await authenticateRequest(request);
    
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error || 'Authentication failed');
    }
    
    return handler(request, context, authResult.user!);
  };
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const authenticateOptional = async (request: NextRequest): Promise<{
  user?: TokenPayload;
}> => {
  const authResult = await authenticateRequest(request);
  
  if (authResult.success) {
    return { user: authResult.user };
  }
  
  return {};
};
