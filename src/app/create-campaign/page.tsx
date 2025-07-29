"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

function CreateCampaignContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [frequency, setFrequency] = useState("");
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get brand from URL params or default to panache-greens
  const brand = searchParams.get('brand') || 'panache-greens';
  
  // Brand configuration
  const brandConfig = {
    'panache-greens': {
      name: 'Panache Greens',
      backLink: '/panache-greens',
      color: 'lime',
      title: 'Configure your Panache Greens marketing campaign across multiple platforms'
    },
    'evolv': {
      name: 'Evolv',
      backLink: '/evolv',
      color: 'blue',
      title: 'Configure your Evolv marketing campaign across multiple platforms'
    }
  };
  
  const currentBrand = brandConfig[brand as keyof typeof brandConfig] || brandConfig['panache-greens'];

  const platforms = [
    { name: "Instagram", icon: "📷", color: "bg-gradient-to-r from-purple-500 to-pink-500" },
    { name: "Twitter", icon: "🐦", color: "bg-gradient-to-r from-blue-400 to-blue-600" },
    { name: "LinkedIn", icon: "💼", color: "bg-gradient-to-r from-blue-600 to-blue-800" },
    { name: "Emailer", icon: "📧", color: "bg-gradient-to-r from-green-500 to-green-600" },
    { name: "Offline Hoarding", icon: "🏢", color: "bg-gradient-to-r from-gray-600 to-gray-800" },
    { name: "Facebook", icon: "📘", color: "bg-gradient-to-r from-blue-500 to-blue-700" }
  ];

  // Load connected accounts on component mount
  useEffect(() => {
    loadConnectedAccounts();
  }, []);

  const loadConnectedAccounts = async () => {
    try {
      const response = await fetch('/api/social-accounts?userId=demo-user');
      if (response.ok) {
        const data = await response.json();
        setConnectedAccounts(data.accounts);
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConnectedAccountsForPlatform = (platformName: string) => {
    return connectedAccounts.filter(account => 
      account.platform.toLowerCase() === platformName.toLowerCase()
    );
  };

  const hasConnectedAccount = (platformName: string) => {
    return getConnectedAccountsForPlatform(platformName).length > 0;
  };

  const frequencies = [
    "Once a day",
    "Twice a day",
    "Every other day", 
    "3 times a week",
    "Once a week",
    "Twice a week"
  ];

  const focusAreas = [
    "Raise awareness about product",
    "Drive sales and conversions",
    "Build brand recognition",
    "Educate about sustainability",
    "Showcase product features",
    "Customer testimonials",
    "Industry thought leadership",
    "Promote special offers"
  ];

  const togglePlatform = (platform: string) => {
    const platformAccounts = getConnectedAccountsForPlatform(platform);
    
    // Check if platform needs social media connection (not Emailer or Offline Hoarding)
    const needsConnection = !['Emailer', 'Offline Hoarding'].includes(platform) && platformAccounts.length === 0;
    
    if (needsConnection) {
      // Redirect to social connect page for this platform
      router.push(`/social-connect?platform=${platform.toLowerCase()}`);
      return;
    }
    
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const toggleFocusArea = (area: string) => {
    setSelectedFocusAreas(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const handleGenerate = () => {
    if (selectedPlatforms.length === 0 || !frequency || selectedFocusAreas.length === 0) {
      alert("Please select at least one platform, frequency, and focus area");
      return;
    }
    
    // Create URL params to pass campaign data to calendar
    const params = new URLSearchParams({
      platforms: selectedPlatforms.join(','),
      frequency: frequency,
      focusAreas: selectedFocusAreas.join(','),
      brand: brand
    });
    
    // Redirect to campaign calendar with campaign data
    router.push(`/campaign-calendar?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#111] flex flex-col">
      {/* Header */}
      <div className="flex flex-row justify-between items-center w-full p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(currentBrand.backLink)}
            className="text-white hover:text-lime-400 transition"
          >
            ← Back to {currentBrand.name}
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
      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
            Create New Campaign
          </h1>
          <p className="text-lg text-gray-300 text-center mb-12 max-w-2xl mx-auto">
            {currentBrand.title}
          </p>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl">
            
            {/* Social Media Platform Selection */}
            <div className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Select Social Media Platforms
                </h2>
                <button
                  onClick={() => router.push('/social-connect')}
                  className="text-lime-400 hover:text-lime-300 transition text-sm font-semibold"
                >
                  Manage Connections →
                </button>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-400"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {platforms.map((platform) => {
                    const isSelected = selectedPlatforms.includes(platform.name);
                    const needsConnection = !['Emailer', 'Offline Hoarding'].includes(platform.name);
                    const hasConnection = hasConnectedAccount(platform.name);
                    const connectedAccounts = getConnectedAccountsForPlatform(platform.name);
                    
                    return (
                      <div key={platform.name} className="relative">
                        <button
                          onClick={() => togglePlatform(platform.name)}
                          className={`w-full p-6 rounded-xl border-2 transition-all duration-300 ${
                            isSelected
                              ? `${platform.color} border-white/50 shadow-lg scale-105`
                              : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30"
                          }`}
                        >
                          <div className="text-3xl mb-2">{platform.icon}</div>
                          <div className="text-white font-semibold">{platform.name}</div>
                          
                          {/* Connection Status */}
                          {needsConnection && (
                            <div className="mt-2">
                              {hasConnection ? (
                                <div className="flex items-center justify-center gap-1 text-xs">
                                  <span className="text-green-400">✓</span>
                                  <span className="text-green-400">{connectedAccounts.length} account{connectedAccounts.length > 1 ? 's' : ''}</span>
                                </div>
                              ) : (
                                <div className="text-xs text-yellow-400">
                                  Click to connect
                                </div>
                              )}
                            </div>
                          )}
                        </button>
                        
                        {/* Connected Accounts Tooltip */}
                        {needsConnection && hasConnection && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                            {connectedAccounts.length}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {selectedPlatforms.length > 0 && (
                <div className="mt-4 text-lime-400 text-sm">
                  Selected: {selectedPlatforms.join(", ")}
                </div>
              )}
            </div>

            {/* Posting Frequency */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">
                Posting Frequency
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {frequencies.map((freq) => (
                  <button
                    key={freq}
                    onClick={() => setFrequency(freq)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      frequency === freq
                        ? "bg-lime-400 text-black border-lime-400 shadow-lg"
                        : "bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="font-semibold">{freq}</div>
                  </button>
                ))}
              </div>
              {frequency && (
                <div className="mt-4 text-lime-400 text-sm">
                  Selected frequency: {frequency}
                </div>
              )}
            </div>

            {/* Focus Area */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">
                Campaign Focus Area
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {focusAreas.map((area) => (
                  <button
                    key={area}
                    onClick={() => toggleFocusArea(area)}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                      selectedFocusAreas.includes(area)
                        ? "bg-lime-400 text-black border-lime-400 shadow-lg"
                        : "bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="font-semibold">{area}</div>
                  </button>
                ))}
              </div>
              {selectedFocusAreas.length > 0 && (
                <div className="mt-4 text-lime-400 text-sm">
                  Selected focus areas: {selectedFocusAreas.join(", ")}
                </div>
              )}
            </div>

            {/* Campaign Summary */}
            {(selectedPlatforms.length > 0 || frequency || selectedFocusAreas.length > 0) && (
              <div className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">Campaign Summary</h3>
                <div className="space-y-2 text-gray-300">
                  {selectedPlatforms.length > 0 && (
                    <div><span className="text-lime-400">Platforms:</span> {selectedPlatforms.join(", ")}</div>
                  )}
                  {frequency && (
                    <div><span className="text-lime-400">Frequency:</span> {frequency}</div>
                  )}
                  {selectedFocusAreas.length > 0 && (
                    <div><span className="text-lime-400">Focus Areas:</span> {selectedFocusAreas.join(", ")}</div>
                  )}
                </div>
              </div>
            )}

            {/* Generate Button */}
            <div className="text-center">
              <button
                onClick={handleGenerate}
                disabled={selectedPlatforms.length === 0 || !frequency || selectedFocusAreas.length === 0}
                className={`font-semibold px-12 py-4 rounded-xl text-lg transition shadow-lg ${
                  selectedPlatforms.length > 0 && frequency && selectedFocusAreas.length > 0
                    ? "bg-gradient-to-r from-lime-400 to-green-500 hover:from-lime-300 hover:to-green-400 text-black"
                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                }`}
              >
                Generate Campaign
              </button>
              <p className="text-gray-400 text-sm mt-4">
                {selectedPlatforms.length === 0 || !frequency || selectedFocusAreas.length === 0
                  ? "Please complete all selections to generate your campaign"
                  : "Ready to create your marketing campaign!"
                }
              </p>
            </div>
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

export default function CreateCampaignPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <CreateCampaignContent />
    </Suspense>
  );
}
