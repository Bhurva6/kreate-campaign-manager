import { useState, useEffect } from 'react';

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  displayName: string;
  profileImage?: string;
  permissions: string[];
  isActive: boolean;
  lastConnected: Date;
  hasValidToken: boolean;
}

export function useSocialAccounts(userId: string = 'demo-user') {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/social-accounts?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts);
      } else {
        throw new Error('Failed to load accounts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const connectAccount = async (platform: string) => {
    try {
      const response = await fetch(`/api/auth/${platform.toLowerCase()}?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        // Redirect to OAuth provider
        window.location.href = data.authUrl;
        return true;
      } else {
        throw new Error('Failed to initiate connection');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      return false;
    }
  };

  const disconnectAccount = async (platform: string, accountId: string) => {
    try {
      const response = await fetch('/api/social-accounts', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          platform,
          accountId
        })
      });

      if (response.ok) {
        // Reload accounts after successful disconnect
        await loadAccounts();
        return true;
      } else {
        throw new Error('Failed to disconnect account');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed');
      return false;
    }
  };

  const getAccountsForPlatform = (platform: string) => {
    return accounts.filter(account => 
      account.platform.toLowerCase() === platform.toLowerCase()
    );
  };

  const hasAccountForPlatform = (platform: string) => {
    return getAccountsForPlatform(platform).length > 0;
  };

  const getPostingPermissions = async (platform: string, accountId: string) => {
    try {
      const response = await fetch(
        `/api/social-post?userId=${userId}&platform=${platform}&accountId=${accountId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.permissions;
      } else {
        throw new Error('Failed to get permissions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Permission check failed');
      return null;
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [userId]);

  return {
    accounts,
    loading,
    error,
    loadAccounts,
    connectAccount,
    disconnectAccount,
    getAccountsForPlatform,
    hasAccountForPlatform,
    getPostingPermissions,
    clearError: () => setError(null)
  };
}
