import { NextRequest, NextResponse } from 'next/server';
import { socialAuthManager } from '@/lib/social-auth';

// Get user's connected accounts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || 'demo-user'; // In production, get from session
    const platform = searchParams.get('platform');

    let accounts;
    if (platform) {
      accounts = socialAuthManager.getPlatformAccounts(userId, platform);
    } else {
      accounts = socialAuthManager.getAccounts(userId);
    }

    // Return only safe account info (no tokens)
    const safeAccounts = accounts.map(account => ({
      id: account.id,
      platform: account.platform,
      username: account.username,
      displayName: account.displayName,
      profileImage: account.profileImage,
      permissions: account.permissions,
      isActive: account.isActive,
      lastConnected: account.lastConnected,
      hasValidToken: account.expiresAt ? account.expiresAt > new Date() : true
    }));

    return NextResponse.json({ accounts: safeAccounts });
  } catch (error) {
    console.error('Get accounts error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve accounts' },
      { status: 500 }
    );
  }
}

// Remove a connected account
export async function DELETE(request: NextRequest) {
  try {
    const { userId, platform, accountId } = await request.json();
    
    if (!platform || !accountId) {
      return NextResponse.json(
        { error: 'Platform and accountId are required' },
        { status: 400 }
      );
    }

    const targetUserId = userId || 'demo-user';
    const success = socialAuthManager.removeAccount(targetUserId, platform, accountId);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Remove account error:', error);
    return NextResponse.json(
      { error: 'Failed to remove account' },
      { status: 500 }
    );
  }
}
