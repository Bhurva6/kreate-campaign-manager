import { NextRequest, NextResponse } from 'next/server';
import { socialAuthManager } from '@/lib/social-auth';

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      platform, 
      accountId, 
      content 
    } = await request.json();

    if (!platform || !accountId || !content) {
      return NextResponse.json(
        { error: 'Platform, accountId, and content are required' },
        { status: 400 }
      );
    }

    const targetUserId = userId || 'demo-user';
    const accounts = socialAuthManager.getPlatformAccounts(targetUserId, platform);
    const account = accounts.find(acc => acc.id === accountId);

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found or not connected' },
        { status: 404 }
      );
    }

    if (!account.isActive) {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 400 }
      );
    }

    // Post content to platform
    const postId = await socialAuthManager.postContent(account, content);

    return NextResponse.json({ 
      success: true, 
      postId,
      platform: account.platform,
      account: account.username
    });
  } catch (error) {
    console.error('Post content error:', error);
    return NextResponse.json(
      { error: 'Failed to post content' },
      { status: 500 }
    );
  }
}

// Get posting permissions for an account
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || 'demo-user';
    const platform = searchParams.get('platform');
    const accountId = searchParams.get('accountId');

    if (!platform || !accountId) {
      return NextResponse.json(
        { error: 'Platform and accountId are required' },
        { status: 400 }
      );
    }

    const accounts = socialAuthManager.getPlatformAccounts(userId, platform);
    const account = accounts.find(acc => acc.id === accountId);

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    const permissions = {
      canPost: account.permissions.includes('write') || 
               account.permissions.includes('tweet.write') ||
               account.permissions.includes('w_member_social') ||
               account.permissions.includes('instagram_content_publish') ||
               account.permissions.includes('pages_manage_posts'),
      canSchedule: true, // Most platforms support scheduling through their APIs
      canUploadMedia: account.permissions.includes('user_media') ||
                     account.permissions.includes('tweet.write') ||
                     account.permissions.includes('w_member_social') ||
                     account.permissions.includes('pages_manage_posts'),
      hasValidToken: account.expiresAt ? account.expiresAt > new Date() : true,
      permissions: account.permissions
    };

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('Get permissions error:', error);
    return NextResponse.json(
      { error: 'Failed to get permissions' },
      { status: 500 }
    );
  }
}
