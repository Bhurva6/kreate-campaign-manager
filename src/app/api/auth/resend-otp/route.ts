import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/db';
import User from '@/models/User';
import OTP from '@/models/OTP';
import { generateOTP } from '@/lib/utils';
import { sendEmailVerificationOTP } from '@/lib/email';

// Validation schema
const resendOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validationResult = resendOTPSchema.safeParse(body);
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
    
    const { email } = validationResult.data;
    
    // Connect to database
    await connectDB();
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user is already verified
    if (user.isEmailVerified) {
      return NextResponse.json(
        { success: false, error: 'Email is already verified' },
        { status: 400 }
      );
    }
    
    // Check for recent OTP requests (rate limiting)
    const recentOTP = await OTP.findOne({
      email: email.toLowerCase(),
      type: 'email-verification',
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) }, // Last 1 minute
    });
    
    if (recentOTP) {
      return NextResponse.json(
        { success: false, error: 'Please wait before requesting another OTP' },
        { status: 429 }
      );
    }
    
    // Invalidate previous OTPs
    await OTP.updateMany(
      { 
        email: email.toLowerCase(), 
        type: 'email-verification',
        isUsed: false 
      },
      { isUsed: true }
    );
    
    // Generate new OTP
    const otp = generateOTP();
    
    // Save OTP to database
    const otpDoc = new OTP({
      email: email.toLowerCase(),
      otp,
      type: 'email-verification',
    });
    
    await otpDoc.save();
    
    // Send verification email
    try {
      await sendEmailVerificationOTP(email, otp, user.name);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return NextResponse.json(
        { success: false, error: 'Failed to send verification email' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
    }, { status: 200 });
    
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
