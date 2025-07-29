import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyRefreshToken, generateTokenPair } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = request.cookies.get('refreshToken')?.value;
    
    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'No refresh token provided' },
        { status: 401 }
      );
    }
    
    // Verify refresh token
    let tokenPayload;
    try {
      tokenPayload = verifyRefreshToken(refreshToken);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid refresh token' },
        { status: 401 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Find user and verify refresh token
    const user = await User.findById(tokenPayload.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid refresh token' },
        { status: 401 }
      );
    }
    
    // Generate new token pair
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      isEmailVerified: user.isEmailVerified,
    });
    
    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save();
    
    // Set new refresh token in cookie
    const response = NextResponse.json({
      success: true,
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
    
    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    return response;
    
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
