# Social Media Integration Setup Guide

This guide will help you set up social media integrations for Instagram, Twitter, LinkedIn, and Facebook to enable automated posting and content management.

## Overview

The social media integration system allows users to:
- Connect their social media accounts via OAuth
- Request posting permissions for specific accounts
- Schedule and post content automatically
- Manage multiple accounts per platform
- Monitor posting status and activity

## Architecture

### Core Components

1. **Social Authentication Library** (`src/lib/social-auth.ts`)
   - Manages OAuth flows for all platforms
   - Handles token refresh and validation
   - Provides unified API for posting content

2. **API Routes**
   - `/api/auth/[platform]` - Initiate OAuth flow
   - `/api/auth/[platform]/callback` - Handle OAuth callbacks
   - `/api/social-accounts` - Manage connected accounts
   - `/api/social-post` - Post content to platforms

3. **React Components**  
   - `SocialConnectPage` - Account connection interface
   - `PostingManager` - Real-time posting controls
   - `useSocialAccounts` hook - Account management

4. **Integration Points**
   - Campaign creation page with connection status
   - Approved calendar with posting controls
   - Account management and permissions

### Platform Support

| Platform | OAuth | Posting | Media Upload | Scheduling |
|----------|-------|---------|--------------|------------|
| Instagram | ✅ | ✅ | ✅ | ✅ |
| Twitter | ✅ | ✅ | ✅ | ✅ |
| LinkedIn | ✅ | ✅ | ✅ | ✅ |
| Facebook | ✅ | ✅ | ✅ | ✅ |

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env.local` file:

```env
# Frontend URL for OAuth callbacks
FRONTEND_URL=http://localhost:3000

# Instagram Basic Display API
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret

# Twitter API v2
TWITTER_CLIENT_ID=your_twitter_client_id  
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# LinkedIn Marketing Developer Platform
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Facebook Graph API
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
```

### 2. Platform-Specific Setup

#### Instagram
1. Create a Facebook App at [developers.facebook.com](https://developers.facebook.com)
2. Add Instagram Basic Display product
3. Set OAuth redirect URI: `http://localhost:3000/api/auth/instagram/callback`
4. Required permissions: `user_profile`, `user_media`, `instagram_basic`

#### Twitter  
1. Create a Twitter App at [developer.twitter.com](https://developer.twitter.com)
2. Enable OAuth 2.0 with PKCE
3. Set callback URL: `http://localhost:3000/api/auth/twitter/callback`
4. Required scopes: `tweet.read`, `tweet.write`, `users.read`, `offline.access`

#### LinkedIn
1. Create an app at [developer.linkedin.com](https://developer.linkedin.com)
2. Add Marketing Developer Platform product
3. Set redirect URL: `http://localhost:3000/api/auth/linkedin/callback`  
4. Required scopes: `r_liteprofile`, `w_member_social`

#### Facebook
1. Use the same Facebook App from Instagram setup
2. Add Facebook Login product
3. Set OAuth redirect URI: `http://localhost:3000/api/auth/facebook/callback`
4. Required permissions: `pages_manage_posts`, `pages_show_list`

### 3. Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   # or  
   pnpm dev
   ```

3. **Test OAuth flows:**
   - Visit `http://localhost:3000/social-connect`
   - Click "Connect" for each platform
   - Complete OAuth authorization
   - Verify accounts appear as connected

## Usage

### Connecting Accounts

1. Navigate to `/social-connect`
2. Click "Connect [Platform] Account" 
3. Complete OAuth flow on platform
4. Account will appear as connected

### Creating Campaigns

1. Go to `/create-campaign`
2. Select platforms (connection status shown)
3. Configure posting frequency and focus areas
4. Generate campaign calendar

### Managing Posts

1. View approved calendar at `/approved-campaign-calendar`
2. Use Posting Manager to post content live
3. Monitor posting status and activity
4. Edit or reschedule posts as needed

## API Reference

### Authentication Flow

```typescript
// Initiate OAuth
GET /api/auth/{platform}?userId={userId}
// Returns: { authUrl: string }

// Handle callback
GET /api/auth/{platform}/callback?code={code}&state={state}
// Redirects to /social-connect with result
```

### Account Management

```typescript
// Get connected accounts
GET /api/social-accounts?userId={userId}&platform={platform}
// Returns: { accounts: SocialAccount[] }

// Remove account
DELETE /api/social-accounts
// Body: { userId, platform, accountId }
```

### Content Posting

```typescript
// Post content
POST /api/social-post
// Body: { userId, platform, accountId, content }
// Returns: { success: boolean, postId: string }

// Get permissions
GET /api/social-post?userId={userId}&platform={platform}&accountId={accountId}
// Returns: { permissions: PostingPermissions }
```

## Security Considerations

1. **Token Storage**: Access tokens are stored in memory only
2. **HTTPS Required**: OAuth requires HTTPS in production
3. **Scope Limiting**: Request minimal required permissions
4. **Token Refresh**: Automatic token refresh when expired
5. **Rate Limiting**: Respect platform rate limits

## Troubleshooting

### Common Issues

1. **OAuth Callback Errors**
   - Verify redirect URIs match exactly
   - Check app settings on platform
   - Ensure FRONTEND_URL is correct

2. **Token Refresh Failures**  
   - Some platforms require re-authentication
   - Check token expiration handling
   - Verify refresh token storage

3. **Posting Failures**
   - Check account permissions
   - Verify content format requirements
   - Review platform-specific limits

### Debug Logging

Enable debug logging by setting:
```env
DEBUG=social-auth:*
```

## Production Deployment

1. **Environment Variables**: Set all required API keys
2. **HTTPS**: Configure SSL certificates  
3. **Redirect URIs**: Update callback URLs to production domain
4. **Rate Limiting**: Implement proper rate limiting
5. **Monitoring**: Set up error tracking and analytics

## Contributing

1. Follow existing code patterns
2. Add tests for new platform integrations  
3. Update documentation for API changes
4. Test OAuth flows thoroughly

## License

MIT License - see LICENSE file for details.
