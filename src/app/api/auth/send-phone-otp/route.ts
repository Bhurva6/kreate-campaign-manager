import { NextRequest, NextResponse } from 'next/server';
import { PhoneVerificationService } from '@/lib/phone-verification';
import { z } from 'zod';

const phoneVerificationSchema = z.object({
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = phoneVerificationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid phone number',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { phoneNumber } = validationResult.data;

    // Send OTP
    const result = await PhoneVerificationService.sendOTP(phoneNumber);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Phone verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
