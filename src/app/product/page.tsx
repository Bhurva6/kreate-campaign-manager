'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import UserDropdown from '@/components/UserDropdown';
import AuthModal from '@/components/AuthModal';
import PricingCards from '@/components/PricingCards';
import ImageGrid from '@/components/ImageGrid';

export default function ProductPage() {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

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
          {loading ? (
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

      <div className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white">Choose your vibe</h1>
            <p className="mt-4 text-lg text-[#181E53] dark:text-white max-w-2xl mx-auto">
              Choose your vibe from our collection of unique and trendy product photography to save time and give excellent results without the production hassle.
            </p>
          </div>
          
          <ImageGrid />
          
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
