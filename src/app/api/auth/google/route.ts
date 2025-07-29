import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { generateTokenPair } from '@/lib/jwt';
import { sendWelcomeEmail } from '@/lib/email';
import { verifyFirebaseToken } from '@/lib/firebase-admin';

// Validation schema
const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validationResult = googleAuthSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid input data',
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }
    
    const { credential } = validationResult.data;
    
    // Verify Firebase ID token using Firebase Admin SDK
    let decodedToken;
    try {
      decodedToken = await verifyFirebaseToken(credential);
      console.log('Verified Firebase token:', decodedToken.email);
    } catch (error) {
      console.error('Firebase token verification error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Firebase authentication is not configured properly. Please check Firebase Admin SDK setup.',
          details: error instanceof Error ? error.message : 'Firebase verification failed'
        },
        { status: 503 } // Service unavailable
      );
    }
    
    const { 
      uid: googleId, 
      email, 
      name, 
      picture 
    } = decodedToken;
    
    if (!email || !name || !googleId) {
      return NextResponse.json(
        { success: false, error: 'Incomplete Google profile data' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { googleId }
      ]
    });
    
    let isNewUser = false;
    
    if (!user) {
      // Create new user
      user = new User({
        email: email.toLowerCase(),
        name,
        avatar: picture,
        googleId,
        provider: 'google',
        isEmailVerified: true, // Google accounts are pre-verified
      });
      
      await user.save();
      isNewUser = true;
    } else {
      // Update existing user
      if (user.provider === 'email' && !user.googleId) {
        // Link Google account to existing email account
        user.googleId = googleId;
        user.avatar = picture || user.avatar;
        user.isEmailVerified = true;
        await user.save();
      } else if (user.provider === 'google' && user.googleId === googleId) {
        // Update existing Google user
        user.name = name;
        user.avatar = picture || user.avatar;
        await user.save();
      }
    }
    
    // Update last login
    user.lastLoginAt = new Date();
    await user.save();
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      isEmailVerified: user.isEmailVerified,
    }, user.tokenVersion);
    
    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();
    
    // Send welcome email for new users
    if (isNewUser) {
      try {
        await sendWelcomeEmail(user.email, user.name);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the authentication if email fails
      }
    }
    
    // Set refresh token in httpOnly cookie
    const response = NextResponse.json({
      success: true,
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      data: {
        accessToken,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          avatar: user.avatar,
          provider: user.provider,
        },
        isNewUser,
      },
    }, { status: 200 });
    
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
    
    return response;
    
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
