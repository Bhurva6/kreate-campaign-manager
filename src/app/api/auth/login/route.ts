import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { generateTokenPair } from '@/lib/jwt';
import { isValidEmail } from '@/lib/utils';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validationResult = loginSchema.safeParse(body);
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
    
    const { email, password } = validationResult.data;
    
    // Additional validation
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Check if user registered with email (has password)
    if (user.provider !== 'email' || !user.password) {
      return NextResponse.json(
        { success: false, error: 'Please login with Google' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Check if email is verified
    if (!user.isEmailVerified) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Please verify your email first',
          requiresVerification: true,
          email: user.email,
        },
        { status: 403 }
      );
    }
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      isEmailVerified: user.isEmailVerified,
    });
    
    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();
    
    // Set refresh token in httpOnly cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          avatar: user.avatar,
        },
      },
    }, { status: 200 });
    
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
