import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import connectDB from '@/lib/db';
import User from '@/models/User';

export const GET = withAuth(async (request: NextRequest, context: any, user: any) => {
  try {
    // Connect to database
    await connectDB();
    
    // Find user with fresh data
    const userData = await User.findById(user.userId).select('-password -refreshToken');
    
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: userData._id.toString(),
          name: userData.name,
          email: userData.email,
          isEmailVerified: userData.isEmailVerified,
          avatar: userData.avatar,
          provider: userData.provider,
          createdAt: userData.createdAt,
        },
      },
    }, { status: 200 });
    
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});
