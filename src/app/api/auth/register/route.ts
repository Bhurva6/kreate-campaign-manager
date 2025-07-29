import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/db';
import User from '@/models/User';
import OTP from '@/models/OTP';
import { generateOTP, isValidEmail, validatePassword } from '@/lib/utils';
import { sendVerificationEmail } from '@/lib/email';

// Validation schema
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validationResult = registerSchema.safeParse(body);
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
    
    const { name, email, password } = validationResult.data;
    
    // Additional validation
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.message },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists with this email' },
        { status: 409 }
      );
    }
    
    // Create new user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      provider: 'email',
    });
    
    await newUser.save();
    
    // Generate OTP
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
      await sendVerificationEmail(email, name, otp);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the registration if email fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please check your email for verification code.',
      data: {
        email: email.toLowerCase(),
        name: name.trim(),
        isEmailVerified: false,
      },
    }, { status: 201 });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
