'use client';

import { useState } from 'react';
import { useAuth } from '../lib/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (typeof window === 'undefined') {
      return; // Don't run on server side
    }
    
    setIsLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (error) {
      console.error('Error signing in:', error);
      // You can add error handling here
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render on server side
  if (typeof window === 'undefined' || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border-2 border-[#F3752A]/20 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>

        <div className="text-center">
          {/* Logo/Icon */}
          <div className="text-6xl mb-4">🎨</div>
          
          {/* Title */}
          <h2 className="text-3xl font-bold text-[#1E1E1E] mb-2">
            Welcome to GoLoco
          </h2>
          
          {/* Subtitle */}
          <p className="text-[#1E1E1E] opacity-70 mb-8">
            Sign in to start creating amazing content
          </p>
          
          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 border-gray-200 hover:border-[#F3752A]/40 hover:shadow-lg transition-all duration-300 font-semibold text-[#1E1E1E] mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-[#F3752A] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </button>
          
          {/* Terms */}
          <p className="text-xs text-[#1E1E1E] opacity-50">
            By signing in, you agree to our{' '}
            <a href="/terms" className="text-[#F3752A] hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-[#F3752A] hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
