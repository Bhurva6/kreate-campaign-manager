"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface OpenRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * OpenRoute component for pages that should only be accessible when NOT logged in
 * Redirects authenticated users to a specified route (default: /home)
 */
const OpenRoute: React.FC<OpenRouteProps> = ({ 
  children, 
  redirectTo = "/home" 
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('OpenRoute check:', { user: !!user, loading });
    
    if (!loading && user) {
      console.log('User is authenticated, redirecting to:', redirectTo);
      // User is authenticated, redirect them away from this open route
      router.replace(redirectTo);
      return;
    }
  }, [user, loading, router, redirectTo]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#1a1a1a]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show loading while redirect happens
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#1a1a1a]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="text-white text-lg">Redirecting...</p>
        </div>
      </div>
    );
  }

  // User is not authenticated, show the page
  return <>{children}</>;
};

export default OpenRoute;
