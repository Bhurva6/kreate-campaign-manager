import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/db';
import User from '@/models/User';
import OTP from '@/models/OTP';
import { generateTokenPair } from '@/lib/jwt';
import { sendWelcomeEmail } from '@/lib/email';

// Validation schema
const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validationResult = verifyEmailSchema.safeParse(body);
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
    
    const { email, otp } = validationResult.data;
    
    // Connect to database
    await connectDB();
    
    // Find the OTP
    const otpDoc = await OTP.findOne({
      email: email.toLowerCase(),
      otp,
      type: 'email-verification',
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });
    
    if (!otpDoc) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }
    
    // Check attempts
    if (otpDoc.attempts >= 5) {
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Please request a new OTP.' },
        { status: 429 }
      );
    }
    
    // Mark OTP as used
    otpDoc.isUsed = true;
    await otpDoc.save();
    
    // Find and update user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update user verification status
    user.isEmailVerified = true;
    await user.save();
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      isEmailVerified: true,
    });
    
    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();
    
    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the verification if email fails
    }
    
    // Set refresh token in httpOnly cookie
    const response = NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        accessToken,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          isEmailVerified: true,
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
    console.error('Email verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
