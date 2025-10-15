'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import AuthModal from '@/components/AuthModal';

export default function GifPage() {
  const { user, loading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [startingFrame, setStartingFrame] = useState<File | null>(null);
  const [finishingFrame, setFinishingFrame] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [durationSeconds, setDurationSeconds] = useState('6');
  const [sampleCount, setSampleCount] = useState(4);
  const [generatedVideos, setGeneratedVideos] = useState<any[]>([]);
  const [videoLoadingStates, setVideoLoadingStates] = useState<{[key: number]: boolean}>({});

  const handleStartingFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStartingFrame(file);
    }
  };

  const handleFinishingFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFinishingFrame(file);
    }
  };

  const handleSend = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-gif', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          sampleCount,
          durationSeconds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate video');
      }

      if (data.success && data.videos) {
        setGeneratedVideos(data.videos);
      }
    } catch (error) {
      console.error('Error generating video:', error);
      alert('Failed to generate video. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black dark:bg-black">
      {/* Navbar */}
      <div className="flex justify-between items-center w-full p-3 sm:p-4 md:p-6 bg-black z-[999999] relative">
        <Link href="/">
          <img
            src="/logo.png"
            alt="GoLoco Logo"
            className="h-8 sm:h-10 md:h-12 w-auto cursor-pointer"
          />
        </Link>
        <div className="flex justify-center items-center absolute left-1/2 transform -translate-x-1/2 gap-30">
          <Link
            href="/"
            className="text-white hover:text-[#3C38A4] transition-colors"
          >
            Home
          </Link>
          <Link
            href="/campaign"
            className="text-white hover:text-[#3C38A4] transition-colors"
          >
            Campaigner
          </Link>
          <Link
            href="/festive"
            className="text-white hover:text-[#3C38A4] transition-colors"
          >
            Festive
          </Link>
          <Link
            href="/pricing"
            className="text-white hover:text-[#3C38A4] transition-colors"
          >
            Pricing
          </Link>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4">
          {/* Authentication Section */}
          {authLoading ? (
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : user ? (
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 relative z-[999999]">
              <UserDropdown />
            </div>
          ) : (
            <>
              <button
                className="px-2 py-1 sm:px-3 sm:py-1.5 md:px-6 md:py-2 rounded-lg bg-[#6C2F83] text-white font-semibold hover:shadow-lg hover:shadow-[#3C38A4]/25 transition-all duration-300 text-xs sm:text-sm md:text-base whitespace-nowrap"
                onClick={() => setShowAuthModal(true)}
              >
                Sign Up
              </button>
              <button
                className="px-2 py-1 sm:px-3 sm:py-1.5 md:px-6 md:py-2 rounded-lg bg-[#181E53] text-white font-semibold hover:bg-[#502D81] transition-all duration-300 text-xs sm:text-sm md:text-base whitespace-nowrap"
                onClick={() => setShowAuthModal(true)}
              >
                Sign In
              </button>
            </>
          )}
        </div>
      </div>

      {/* Page Content */}
      <div className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white">GIF Generator</h1>
            <p className="mt-4 text-lg text-[#181E53] dark:text-white max-w-2xl mx-auto">
              Create animated videos for your campaigns and marketing needs.
            </p>
          </div>

          {/* GIF Generator Content */}
          <div className="flex flex-col items-center space-y-8">
            {/* Image Upload Areas - Show when starting frame is uploaded */}
            {startingFrame && (
              <div className="flex gap-8 items-start">
                {/* Starting Frame */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-32 h-32 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center bg-gray-800">
                    <img
                      src={URL.createObjectURL(startingFrame)}
                      alt="Starting frame"
                      className="max-w-full max-h-full object-contain rounded"
                    />
                  </div>
                  <p className="text-white text-sm">Starting Frame</p>
                </div>

                {/* Finishing Frame Upload */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-32 h-32 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center bg-gray-800 relative">
                    {finishingFrame ? (
                      <img
                        src={URL.createObjectURL(finishingFrame)}
                        alt="Finishing frame"
                        className="max-w-full max-h-full object-contain rounded"
                      />
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-white transition-colors">
                        <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFinishingFrameUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-white text-sm">Finishing Frame</p>
                </div>
              </div>
            )}

            {/* Video Parameters */}
            <div className="flex flex-wrap gap-4 items-center justify-center w-full max-w-2xl">
              <div className="flex flex-col space-y-1">
                <label className="text-white text-sm font-medium">Aspect Ratio</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3C38A4] focus:border-transparent"
                  disabled={isGenerating}
                >
                  <option value="1:1">1:1 (Square)</option>
                  <option value="4:3">4:3 (Standard)</option>
                  <option value="16:9">16:9 (Widescreen)</option>
                  <option value="9:16">9:16 (Vertical)</option>
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-white text-sm font-medium">Duration</label>
                <select
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(e.target.value)}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3C38A4] focus:border-transparent"
                  disabled={isGenerating}
                >
                  <option value="2">2 seconds</option>
                  <option value="4">4 seconds</option>
                  <option value="6">6 seconds</option>
                  <option value="8">8 seconds</option>
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-white text-sm font-medium">Number of Videos</label>
                <select
                  value={sampleCount}
                  onChange={(e) => setSampleCount(parseInt(e.target.value))}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3C38A4] focus:border-transparent"
                  disabled={isGenerating}
                >
                  <option value={1}>1 video</option>
                  <option value={2}>2 videos</option>
                  <option value={3}>3 videos</option>
                  <option value={4}>4 videos</option>
                </select>
              </div>
            </div>

            {/* Prompt Input and Controls */}
            <div className="flex items-center space-x-4 w-full max-w-2xl">
              {/* Starting Frame Upload - Show when no starting frame */}
              {!startingFrame && (
                <div className="flex flex-col items-center space-y-1">
                  <label className="cursor-pointer flex flex-col items-center justify-center w-12 h-12 border-2 border-dashed border-gray-400 rounded-lg bg-gray-800 hover:border-white transition-colors">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleStartingFrameUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-gray-400">Start</span>
                </div>
              )}

              {/* Prompt Input */}
              <input
                type="text"
                placeholder="Enter prompt for video generation..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3C38A4] focus:border-transparent"
                disabled={isGenerating}
              />

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={isGenerating || !prompt.trim()}
                className="px-6 py-3 bg-[#6C2F83] text-white font-semibold rounded-lg hover:bg-[#502D81] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <span>Generate Video</span>
                )}
              </button>

              {/* Additional Starting Frame Upload - Show when starting frame exists */}
              {startingFrame && (
                <div className="flex flex-col items-center space-y-1">
                  <label className="cursor-pointer flex flex-col items-center justify-center w-12 h-12 border-2 border-dashed border-gray-400 rounded-lg bg-gray-800 hover:border-white transition-colors">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleStartingFrameUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-gray-400">Start</span>
                </div>
              )}
            </div>

            {/* Generated Videos Display */}
            {generatedVideos.length > 0 && (
              <div className="w-full max-w-4xl">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">Generated Videos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {generatedVideos.map((video, index) => (
                    <div key={index} className="flex flex-col items-center space-y-2">
                      <video onLoadStart={() => setVideoLoadingStates(prev => ({ ...prev, [index]: true }))} onCanPlay={() => setVideoLoadingStates(prev => ({ ...prev, [index]: false }))} onError={() => setVideoLoadingStates(prev => ({ ...prev, [index]: false }))} className={`w-full max-w-md rounded-lg ${videoLoadingStates[index] === false ? 'block' : 'hidden'}`} 
                      {...videoLoadingStates[index] !== false && (
                        <div className="w-full max-w-md h-48 bg-gray-800 rounded-lg flex items-center justify-center">
                          <div className="flex flex-col items-center space-y-2">
                            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            <p className="text-white text-sm">Loading video...</p>
                          </div>
                        </div>
                      )}
                        src={video.publicUrl}
                        controls
                        poster={startingFrame ? URL.createObjectURL(startingFrame) : undefined}
                      />
                      <a
                        href={video.publicUrl}
                        download={`generated-video-${index + 1}.mp4`}
                        className="px-4 py-2 bg-[#3C38A4] text-white rounded-lg hover:bg-[#2a2780] transition-colors"
                      >
                        Download Video
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}

// UserDropdown component
function UserDropdown() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-white hover:text-[#3C38A4] transition-colors"
      >
        <img
          src={user.photoURL || '/google.svg'}
          alt="Profile"
          className="w-8 h-8 rounded-full"
        />
        <span className="text-sm">{user.displayName || user.email}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-[1000000]">
          <div className="py-1">
            <Link
              href="/my-creations"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              My Creations
            </Link>
            <Link
              href="/billing"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              Billing
            </Link>
            <button
              onClick={() => {
                signOut();
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}