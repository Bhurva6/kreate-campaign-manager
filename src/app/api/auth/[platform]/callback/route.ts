import { NextRequest, NextResponse } from 'next/server';
import { socialAuthManager } from '@/lib/social-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const { platform } = params;
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      const errorDescription = searchParams.get('error_description') || 'Authentication failed';
      return NextResponse.redirect(
        `${process.env.FRONTEND_URL}/social-connect?error=${encodeURIComponent(errorDescription)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.FRONTEND_URL}/social-connect?error=Missing authorization code`
      );
    }

    // Extract userId from state (format: userId-platform-timestamp)
    const [userId] = state.split('-');
    
    try {
      // Exchange code for access token and get account info
      const account = await socialAuthManager.exchangeCodeForToken(platform, code, state);
      
      // Store account for user
      socialAuthManager.addAccount(userId, account);

      // Redirect back to social connect page with success
      return NextResponse.redirect(
        `${process.env.FRONTEND_URL}/social-connect?success=true&platform=${platform}&username=${encodeURIComponent(account.username)}`
      );
    } catch (authError) {
      console.error('Auth exchange error:', authError);
      return NextResponse.redirect(
        `${process.env.FRONTEND_URL}/social-connect?error=${encodeURIComponent('Failed to connect account')}`
      );
    }
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(
      `${process.env.FRONTEND_URL}/social-connect?error=${encodeURIComponent('Authentication callback failed')}`
    );
  }
}
