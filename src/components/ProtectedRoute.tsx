'use client';

import React, { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireEmailVerification?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireEmailVerification = true 
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('ProtectedRoute check:', { user, loading, requireEmailVerification });
    
    if (!loading) {
      if (!user) {
        console.log('No user found, redirecting to login');
        // User not authenticated, redirect to login
        router.replace('/signin');
        return;
      }

      if (requireEmailVerification && !user.isEmailVerified) {
        console.log('Email not verified, redirecting to verification');
        // User not verified, redirect to verification page
        router.replace(`/verify-email?email=${encodeURIComponent(user.email)}`);
        return;
      }

      console.log('User authenticated and verified, allowing access');
    }
  }, [user, loading, router, requireEmailVerification]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#1a1a1a]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="text-white text-lg">Authenticating...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show loading while redirect happens
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#1a1a1a]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="text-white text-lg">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // If email verification is required but not completed
  if (requireEmailVerification && !user.isEmailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#1a1a1a]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="text-white text-lg">Redirecting to email verification...</p>
        </div>
      </div>
    );
  }

  // User is authenticated and verified, render children
  return <>{children}</>;
};

export default ProtectedRoute;
