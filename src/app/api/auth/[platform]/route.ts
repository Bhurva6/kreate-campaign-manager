import { NextRequest, NextResponse } from 'next/server';
import { socialAuthManager } from '@/lib/social-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const { platform } = params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || 'demo-user'; // In production, get from session
    const state = searchParams.get('state');

    if (!platform) {
      return NextResponse.json({ error: 'Platform is required' }, { status: 400 });
    }

    // Generate OAuth URL
    const authUrl = socialAuthManager.generateAuthUrl(platform, userId, state || undefined);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Auth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate authentication' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const { platform } = params;
    const { code, state, userId } = await request.json();

    if (!platform || !code) {
      return NextResponse.json({ error: 'Platform and code are required' }, { status: 400 });
    }

    // Exchange code for access token and get account info
    const account = await socialAuthManager.exchangeCodeForToken(platform, code, state);
    
    // Store account for user (in production, get userId from session)
    const targetUserId = userId || 'demo-user';
    socialAuthManager.addAccount(targetUserId, account);

    return NextResponse.json({ 
      success: true, 
      account: {
        id: account.id,
        platform: account.platform,
        username: account.username,
        displayName: account.displayName,
        profileImage: account.profileImage,
        isActive: account.isActive,
        lastConnected: account.lastConnected
      }
    });
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
