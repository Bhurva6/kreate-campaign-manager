import { NextRequest, NextResponse } from 'next/server';
import { PhoneVerificationService } from '@/lib/phone-verification';
import { z } from 'zod';

const phoneOTPVerificationSchema = z.object({
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = phoneOTPVerificationSchema.safeParse(body);
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

    const { phoneNumber, otp } = validationResult.data;

    // Verify OTP
    const result = await PhoneVerificationService.verifyOTP(phoneNumber, otp);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Phone number verified successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Phone OTP verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
