// Social Media Authentication Library
import { NextRequest, NextResponse } from 'next/server';

export interface SocialMediaAccount {
  id: string;
  platform: string;
  username: string;
  displayName: string;
  profileImage?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  permissions: string[];
  isActive: boolean;
  lastConnected: Date;
}

export interface AuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export class SocialMediaAuthManager {
  private static instance: SocialMediaAuthManager;
  private accounts: Map<string, SocialMediaAccount[]> = new Map();

  private constructor() {}

  static getInstance(): SocialMediaAuthManager {
    if (!SocialMediaAuthManager.instance) {
      SocialMediaAuthManager.instance = new SocialMediaAuthManager();
    }
    return SocialMediaAuthManager.instance;
  }

  // Platform-specific auth configurations
  getAuthConfig(platform: string): AuthConfig {
    const configs: Record<string, AuthConfig> = {
      instagram: {
        clientId: process.env.INSTAGRAM_CLIENT_ID || '',
        clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
        redirectUri: `${process.env.FRONTEND_URL}/api/auth/instagram/callback`,
        scopes: ['user_profile', 'user_media', 'instagram_basic', 'instagram_content_publish']
      },
      twitter: {
        clientId: process.env.TWITTER_CLIENT_ID || '',
        clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
        redirectUri: `${process.env.FRONTEND_URL}/api/auth/twitter/callback`,
        scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access']
      },
      linkedin: {
        clientId: process.env.LINKEDIN_CLIENT_ID || '',
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
        redirectUri: `${process.env.FRONTEND_URL}/api/auth/linkedin/callback`,
        scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social', 'w_organization_social']
      },
      facebook: {
        clientId: process.env.FACEBOOK_CLIENT_ID || '',
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '', 
        redirectUri: `${process.env.FRONTEND_URL}/api/auth/facebook/callback`,
        scopes: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list', 'public_profile']
      }
    };

    return configs[platform.toLowerCase()] || configs.instagram;
  }

  // Generate OAuth URL for platform
  generateAuthUrl(platform: string, userId: string, state?: string): string {
    const config = this.getAuthConfig(platform);
    const authState = state || `${userId}-${platform}-${Date.now()}`;
    
    const baseUrls: Record<string, string> = {
      instagram: 'https://api.instagram.com/oauth/authorize',
      twitter: 'https://twitter.com/i/oauth2/authorize',
      linkedin: 'https://www.linkedin.com/oauth/v2/authorization',
      facebook: 'https://www.facebook.com/v18.0/dialog/oauth'
    };

    const baseUrl = baseUrls[platform.toLowerCase()];
    if (!baseUrl) throw new Error(`Unsupported platform: ${platform}`);

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      response_type: 'code',
      state: authState
    });

    // Twitter uses different parameter names
    if (platform.toLowerCase() === 'twitter') {
      params.set('code_challenge', 'challenge');
      params.set('code_challenge_method', 'plain');
    }

    return `${baseUrl}?${params.toString()}`;
  }

  // Exchange code for access token
  async exchangeCodeForToken(platform: string, code: string, state: string): Promise<SocialMediaAccount> {
    const config = this.getAuthConfig(platform);
    
    const exchangeUrls: Record<string, string> = {
      instagram: 'https://api.instagram.com/oauth/access_token',
      twitter: 'https://api.twitter.com/2/oauth2/token',
      linkedin: 'https://www.linkedin.com/oauth/v2/accessToken',
      facebook: 'https://graph.facebook.com/v18.0/oauth/access_token'
    };

    const exchangeUrl = exchangeUrls[platform.toLowerCase()];
    if (!exchangeUrl) throw new Error(`Unsupported platform: ${platform}`);

    let body: Record<string, string> = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      code: code
    };

    // Platform-specific parameters
    if (platform.toLowerCase() === 'instagram' || platform.toLowerCase() === 'facebook') {
      body.grant_type = 'authorization_code';
    } else if (platform.toLowerCase() === 'linkedin') {
      body.grant_type = 'authorization_code';
    } else if (platform.toLowerCase() === 'twitter') {
      body.grant_type = 'authorization_code';
      body.code_verifier = 'challenge';
    }

    const response = await fetch(exchangeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams(body)
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const tokenData = await response.json();
    
    // Get user profile info
    const userProfile = await this.getUserProfile(platform, tokenData.access_token);

    const account: SocialMediaAccount = {
      id: userProfile.id,
      platform: platform.toLowerCase(),
      username: userProfile.username,
      displayName: userProfile.displayName,
      profileImage: userProfile.profileImage,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
      permissions: config.scopes,
      isActive: true,
      lastConnected: new Date()
    };

    return account;
  }

  // Get user profile from platform
  async getUserProfile(platform: string, accessToken: string): Promise<any> {
    const profileUrls: Record<string, string> = {
      instagram: 'https://graph.instagram.com/me?fields=id,username,account_type,media_count',
      twitter: 'https://api.twitter.com/2/users/me',
      linkedin: 'https://api.linkedin.com/v2/people/~:(id,firstName,lastName,profilePicture)',
      facebook: 'https://graph.facebook.com/me?fields=id,name,picture'
    };

    const profileUrl = profileUrls[platform.toLowerCase()];
    if (!profileUrl) throw new Error(`Unsupported platform: ${platform}`);

    const response = await fetch(profileUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Profile fetch failed: ${response.statusText}`);
    }

    const profile = await response.json();
    
    // Normalize profile data across platforms
    return {
      id: profile.id || profile.data?.id,
      username: profile.username || profile.data?.username || profile.firstName?.localized?.en_US,
      displayName: profile.name || profile.data?.name || `${profile.firstName?.localized?.en_US} ${profile.lastName?.localized?.en_US}`,
      profileImage: profile.picture?.data?.url || profile.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier
    };
  }

  // Store account for user
  addAccount(userId: string, account: SocialMediaAccount): void {
    if (!this.accounts.has(userId)) {
      this.accounts.set(userId, []);
    }
    
    const userAccounts = this.accounts.get(userId)!;
    const existingIndex = userAccounts.findIndex(a => a.platform === account.platform && a.id === account.id);
    
    if (existingIndex >= 0) {
      userAccounts[existingIndex] = account;
    } else {
      userAccounts.push(account);
    }
  }

  // Get user's connected accounts
  getAccounts(userId: string): SocialMediaAccount[] {
    return this.accounts.get(userId) || [];
  }

  // Get specific platform accounts
  getPlatformAccounts(userId: string, platform: string): SocialMediaAccount[] {
    const userAccounts = this.getAccounts(userId);
    return userAccounts.filter(account => account.platform === platform.toLowerCase());
  }

  // Remove account
  removeAccount(userId: string, platform: string, accountId: string): boolean {
    const userAccounts = this.accounts.get(userId);
    if (!userAccounts) return false;

    const index = userAccounts.findIndex(a => a.platform === platform && a.id === accountId);
    if (index >= 0) {
      userAccounts.splice(index, 1);
      return true;
    }
    return false;
  }

  // Refresh token if expired
  async refreshAccessToken(account: SocialMediaAccount): Promise<string> {
    if (!account.refreshToken) {
      throw new Error('No refresh token available');
    }

    const config = this.getAuthConfig(account.platform);
    const refreshUrls: Record<string, string> = {
      instagram: 'https://graph.instagram.com/refresh_access_token',
      twitter: 'https://api.twitter.com/2/oauth2/token',
      linkedin: 'https://www.linkedin.com/oauth/v2/accessToken',
      facebook: 'https://graph.facebook.com/v18.0/oauth/access_token'
    };

    const refreshUrl = refreshUrls[account.platform];
    if (!refreshUrl) throw new Error(`Token refresh not supported for ${account.platform}`);

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: account.refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret
    });

    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const tokenData = await response.json();
    account.accessToken = tokenData.access_token;
    if (tokenData.refresh_token) {
      account.refreshToken = tokenData.refresh_token;
    }
    account.expiresAt = tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined;

    return account.accessToken;
  }

  // Check if token needs refresh
  needsTokenRefresh(account: SocialMediaAccount): boolean {
    if (!account.expiresAt) return false;
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
    return account.expiresAt.getTime() - bufferTime < Date.now();
  }

  // Post content to platform
  async postContent(account: SocialMediaAccount, content: {
    text?: string;
    imageUrl?: string;
    mediaUrls?: string[];
  }): Promise<string> {
    // Check if token needs refresh
    if (this.needsTokenRefresh(account)) {
      await this.refreshAccessToken(account);
    }

    const postUrls: Record<string, string> = {
      instagram: 'https://graph.instagram.com/me/media',
      twitter: 'https://api.twitter.com/2/tweets',
      linkedin: 'https://api.linkedin.com/v2/ugcPosts',
      facebook: 'https://graph.facebook.com/me/feed'
    };

    const postUrl = postUrls[account.platform];
    if (!postUrl) throw new Error(`Posting not supported for ${account.platform}`);

    // Platform-specific post logic will be implemented here
    // This is a simplified version
    const response = await fetch(postUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${account.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: content.text,
        // Add platform-specific fields
      })
    });

    if (!response.ok) {
      throw new Error(`Post failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.id || result.data?.id || 'unknown';
  }
}

export const socialAuthManager = SocialMediaAuthManager.getInstance();
