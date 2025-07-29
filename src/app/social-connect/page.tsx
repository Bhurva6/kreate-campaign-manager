"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";

export default function SocialConnectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const { 
    accounts: connectedAccounts, 
    loading, 
    error,
    connectAccount: hookConnectAccount, 
    disconnectAccount: hookDisconnectAccount,
    getAccountsForPlatform,
    clearError
  } = useSocialAccounts();

  const platforms = [
    { 
      name: "Instagram", 
      icon: "📷", 
      color: "bg-gradient-to-r from-purple-500 to-pink-500",
      description: "Connect your Instagram account to post photos and stories"
    },
    { 
      name: "Twitter", 
      icon: "🐦", 
      color: "bg-gradient-to-r from-blue-400 to-blue-600",
      description: "Connect your Twitter account to post tweets and threads"
    },
    { 
      name: "LinkedIn", 
      icon: "💼", 
      color: "bg-gradient-to-r from-blue-600 to-blue-800",
      description: "Connect your LinkedIn account to post professional content"
    },
    { 
      name: "Facebook", 
      icon: "📘", 
      color: "bg-gradient-to-r from-blue-500 to-blue-700",
      description: "Connect your Facebook pages to post updates"
    }
  ];

  useEffect(() => {
    // Clear any previous errors
    if (error) clearError();
    
    // Check for callback messages
    const success = searchParams.get('success');
    const errorParam = searchParams.get('error');
    const platform = searchParams.get('platform');
    const username = searchParams.get('username');

    if (success && platform && username) {
      setMessage({
        type: 'success',
        text: `Successfully connected ${platform} account: @${username}`
      });
      // Clear URL params
      const url = new URL(window.location.href);
      url.searchParams.delete('success');
      url.searchParams.delete('platform');
      url.searchParams.delete('username');
      window.history.replaceState({}, '', url.toString());
    } else if (errorParam) {
      setMessage({
        type: 'error',
        text: decodeURIComponent(errorParam)
      });
      // Clear URL params
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, error, clearError]);

  const connectPlatform = async (platform: string) => {
    setConnecting(platform);
    setMessage(null);
    
    const success = await hookConnectAccount(platform);
    if (!success) {
      setMessage({
        type: 'error',
        text: `Failed to connect to ${platform}. Please try again.`
      });
      setConnecting(null);
    }
  };

  const disconnectAccount = async (platform: string, accountId: string) => {
    const success = await hookDisconnectAccount(platform, accountId);
    if (success) {
      setMessage({
        type: 'success',
        text: `Successfully disconnected ${platform} account`
      });
    } else {
      setMessage({
        type: 'error',
        text: `Failed to disconnect ${platform} account`
      });
    }
  };

  const getConnectedAccountsForPlatform = (platformName: string) => {
    return getAccountsForPlatform(platformName);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#111] flex flex-col">
      {/* Header */}
      <div className="flex flex-row justify-between items-center w-full p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/create-campaign")}
            className="text-white hover:text-lime-400 transition"
          >
            ← Back to Campaign Creation
          </button>
          <Image src="/logo.png" alt="Juicebox Logo" width={48} height={48} />
        </div>
        <div className="flex gap-4">
          <button
            className="px-6 py-2 rounded-lg bg-white/20 text-white font-semibold hover:bg-white/30 transition"
            onClick={() => router.push("/signin")}
          >
            Sign In
          </button>
          <button
            className="px-6 py-2 rounded-lg bg-lime-400 text-black font-semibold hover:bg-lime-300 transition"
            onClick={() => router.push("/signup")}
          >
            Sign Up
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Connect Your Social Media Accounts
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Connect your social media accounts to enable automated posting and content management for your campaigns.
            </p>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`mb-8 p-4 rounded-xl border ${
              message.type === 'success' 
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              <div className="flex items-center gap-2">
                <span>{message.type === 'success' ? '✅' : '❌'}</span>
                <span>{message.text}</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading your connected accounts...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {platforms.map((platform) => {
                const connectedAccountsForPlatform = getConnectedAccountsForPlatform(platform.name);
                const isConnected = connectedAccountsForPlatform.length > 0;
                const isConnecting = connecting === platform.name;

                return (
                  <div key={platform.name} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                    {/* Platform Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-16 h-16 rounded-xl ${platform.color} flex items-center justify-center text-2xl`}>
                        {platform.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{platform.name}</h3>
                        <p className="text-gray-400 text-sm">{platform.description}</p>
                      </div>
                    </div>

                    {/* Connected Accounts */}
                    {isConnected ? (
                      <div className="space-y-4 mb-6">
                        {connectedAccountsForPlatform.map((account) => (
                          <div key={account.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {account.profileImage ? (
                                  <img 
                                    src={account.profileImage} 
                                    alt={account.username}
                                    className="w-10 h-10 rounded-full"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-semibold">
                                    {account.username.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div className="text-white font-semibold">@{account.username}</div>
                                  <div className="text-gray-400 text-sm">{account.displayName}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  account.hasValidToken 
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {account.hasValidToken ? 'Connected' : 'Expired'}
                                </div>
                                <button
                                  onClick={() => disconnectAccount(account.platform, account.id)}
                                  className="text-red-400 hover:text-red-300 transition text-sm"
                                >
                                  Disconnect
                                </button>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              Last connected: {formatDate(account.lastConnected)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 mb-6">
                        <div className="text-gray-400 mb-4">No accounts connected</div>
                      </div>
                    )}

                    {/* Connect Button */}
                    <button
                      onClick={() => connectPlatform(platform.name)}
                      disabled={isConnecting}
                      className={`w-full py-3 px-4 rounded-xl font-semibold transition ${
                        isConnecting
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : `${platform.color} text-white hover:opacity-90`
                      }`}
                    >
                      {isConnecting ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Connecting...
                        </div>
                      ) : (
                        `${isConnected ? 'Connect Another' : 'Connect'} ${platform.name} Account`
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Continue Button */}
          <div className="text-center mt-12">
            <button
              onClick={() => router.push("/create-campaign")}
              className="bg-gradient-to-r from-lime-400 to-green-500 hover:from-lime-300 hover:to-green-400 text-black font-semibold px-12 py-4 rounded-xl text-lg transition shadow-lg"
            >
              Continue to Campaign Creation
            </button>
            <p className="text-gray-400 text-sm mt-4">
              You can connect more accounts later from your campaign settings
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full flex flex-col items-center justify-center py-8 text-gray-400 text-sm">
        <div className="flex items-center gap-2">
          <span>Built in India</span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
