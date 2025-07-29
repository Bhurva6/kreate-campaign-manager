import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyRefreshToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = request.cookies.get('refreshToken')?.value;
    
    if (refreshToken) {
      try {
        // Verify and decode refresh token
        const tokenPayload = verifyRefreshToken(refreshToken);
        
        // Connect to database
        await connectDB();
        
        // Find user and clear refresh token
        const user = await User.findById(tokenPayload.userId);
        if (user && user.refreshToken === refreshToken) {
          user.refreshToken = undefined;
          await user.save();
        }
      } catch (error) {
        // Token is invalid, but we still want to clear the cookie
        console.error('Error during logout:', error);
      }
    }
    
    // Clear refresh token cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful',
    }, { status: 200 });
    
    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
    });
    
    return response;
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
