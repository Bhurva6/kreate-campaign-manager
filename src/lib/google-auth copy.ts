import { GoogleAuth } from 'google-auth-library';

interface TokenInfo {
  token: string;
  expiryTime: number;
}

class GoogleCloudTokenManager {
  private auth: GoogleAuth;
  private tokenInfo: TokenInfo | null = null;
  private tokenExpiryMargin: number = 360; // seconds
  private refreshInProgress: boolean = false;

  constructor() {
    // Create credentials object from environment variables
    const credentials = {
      type: process.env.GC_TYPE!,
      project_id: process.env.GC_PROJECT_ID!,
      private_key_id: process.env.GC_PRIVATE_KEY_ID!,
      private_key: process.env.GC_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      client_email: process.env.GC_CLIENT_EMAIL!,
      client_id: process.env.GC_CLIENT_ID!,
      auth_uri: process.env.GC_AUTH_URI!,
      token_uri: process.env.GC_TOKEN_URI!,
      auth_provider_x509_cert_url: process.env.GC_AUTH_PROVIDER_X509_CERT_URL!,
      client_x509_cert_url: process.env.GC_CLIENT_X509_CERT_URL!,
    };

    this.auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
  }

  private async refreshToken(): Promise<string> {
    if (this.refreshInProgress) {
      // Wait for the refresh to complete
      while (this.refreshInProgress) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.tokenInfo?.token || '';
    }

    try {
      this.refreshInProgress = true;
      
      const client = await this.auth.getClient();
      const accessToken = await client.getAccessToken();
      
      if (!accessToken.token) {
        throw new Error('Failed to obtain access token');
      }

      this.tokenInfo = {
        token: accessToken.token,
        expiryTime: Date.now() + (3600 * 1000) - (this.tokenExpiryMargin * 1000), // 1 hour minus margin
      };

      console.log('Google Cloud access token refreshed successfully.');
      return this.tokenInfo.token;
    } catch (error) {
      console.error('Failed to refresh Google Cloud access token:', error);
      throw error;
    } finally {
      this.refreshInProgress = false;
    }
  }

  async getAccessToken(): Promise<string> {
    const currentTime = Date.now();
    
    if (!this.tokenInfo || currentTime >= (this.tokenInfo.expiryTime - 120000)) { // 2 minutes buffer
      return await this.refreshToken();
    }
    
    return this.tokenInfo.token;
  }

  invalidateToken(): void {
    this.tokenInfo = null;
    console.log('Token invalidated, will be refreshed on next use');
  }
}

// Singleton instance
const tokenManager = new GoogleCloudTokenManager();

export { tokenManager };
export default GoogleCloudTokenManager;
