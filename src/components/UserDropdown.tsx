'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useCredits } from '../lib/credits';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UserDropdown() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { 
    imageGenerationsUsed, 
    imageEditsUsed, 
    isUnlimitedUser 
  } = useCredits();
  const [isOpen, setIsOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Set hasMounted to true after component mounts
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
      // Redirect to home page after successful logout
      router.push('/');
      // Force page refresh to ensure all auth state is cleared
      window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error);
      // Still close the dropdown even if sign out fails
      setIsOpen(false);
    }
  };

  // Don't render if no user or component hasn't mounted yet
  if (!hasMounted || !user) return null;

  // Get user's display name or email
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative z-[999999]" ref={dropdownRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 md:p-2 rounded-full transition-all duration-300 hover:scale-110 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20"
        title={`Signed in as ${displayName}`}
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={displayName}
            className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover border-2 border-white/30"
            onError={(e) => {
              // Fallback to initials if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        {/* Fallback initials (hidden by default if photo exists) */}
        <div 
          className={`w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-r from-[#0171B9] to-[#004684] flex items-center justify-center text-white font-semibold text-sm border-2 border-white/30 ${
            user.photoURL ? 'hidden' : 'flex'
          }`}
        >
          {initials}
        </div>
        <span className="hidden md:block text-sm font-medium text-white max-w-24 truncate">
          {displayName}
        </span>
        <svg
          className={`w-4 h-4 text-white transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="fixed md:absolute right-2 md:right-0 top-16 md:top-full mt-2 w-[calc(100vw-16px)] sm:w-80 md:w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-[999999] md:z-[999999] max-h-[80vh] overflow-y-auto">
          {/* User Info Section */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={displayName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              {/* Fallback initials for dropdown */}
              <div className={`w-12 h-12 rounded-full bg-gradient-to-r from-[#0171B9] to-[#004684] flex items-center justify-center text-white font-semibold text-lg border-2 border-gray-200 ${
                user.photoURL ? 'hidden' : 'flex'
              }`}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Credit Usage Section */}
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              {isUnlimitedUser ? 'Unlimited Access' : 'Free Credits'}
            </h4>
            {isUnlimitedUser ? (
              <div className="text-sm text-green-600 font-medium">
                ✨ Unlimited generations & edits
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Image Generations</span>
                  <span className="text-xs font-medium text-gray-900">
                    {imageGenerationsUsed}/3
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-[#0171B9] h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${(imageGenerationsUsed / 3) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Image Edits</span>
                  <span className="text-xs font-medium text-gray-900">
                    {imageEditsUsed}/7
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-[#004684] h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${(imageEditsUsed / 7) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                setIsOpen(false);
                // Add navigation to profile/settings page if needed
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Account Settings
            </button>
            
            <Link
              href="/billing"
              onClick={() => {
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Billing
            </Link>

            <div className="border-t border-gray-100 mt-2 pt-2">
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
