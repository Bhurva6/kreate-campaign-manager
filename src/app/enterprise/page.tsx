"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import EnterpriseOnboarding from "../../components/EnterpriseOnboarding";
import EnterpriseDashboard from "../../components/EnterpriseDashboard";
import UserDropdown from "../../components/UserDropdown";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import ThemeToggle from "../../components/ThemeToggle";

export default function EnterprisePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  // Default theme values in case the provider is not available
  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  
  // Try to use the theme context if available
  let themeContext;
  try {
    themeContext = useTheme();
  } catch (error) {
    // Theme provider not available, we'll use our local state
    console.log("Theme provider not available, using default theme");
  }
  
  const effectiveIsDarkMode = themeContext?.isDarkMode ?? isDarkMode;
  const effectiveToggleTheme = themeContext?.toggleTheme ?? toggleTheme;
  
  const [companyData, setCompanyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    if (!loading && !user) {
      router.push("/signin?redirect=/enterprise");
      return;
    }

    // If user is logged in, check if they have already completed onboarding
    if (user) {
      // TODO: Replace with actual Firebase fetch of company data
      // For now using mock check with localStorage
      try {
        const savedData = localStorage.getItem(`enterprise_${user.uid}`);
        if (savedData) {
          setCompanyData(JSON.parse(savedData));
        }
      } catch (error) {
        console.error("Error fetching company data:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [user, loading, router]);

  const handleOnboardingComplete = (data: any) => {
    // Save company data to localStorage for now
    // In a real implementation, this would save to Firebase
    if (user) {
      localStorage.setItem(`enterprise_${user.uid}`, JSON.stringify(data));
      setCompanyData(data);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black">
      {/* Navbar */}
      <div className="w-full bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
              GoLoco
            </Link>
            <div className="ml-8 hidden md:flex space-x-6">
              <Link href="/my-creations" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                My Creations
              </Link>
              <Link href="/enterprise" className="text-blue-600 dark:text-blue-400 font-medium">
                Enterprise
              </Link>
              <Link href="/pricing" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                Pricing
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle isDarkMode={effectiveIsDarkMode} toggleTheme={effectiveToggleTheme} />
            {user && <UserDropdown />}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 flex-grow bg-white dark:bg-black">
        {!companyData && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
              Trusted by leading enterprises worldwide
            </h2>
            
            <div className="relative overflow-hidden max-w-4xl mx-auto">
              {/* Gradient overlay (left) */}
              <div className="absolute left-0 top-0 w-16 h-full bg-gradient-to-r from-white dark:from-black to-transparent z-10"></div>
              
              {/* Gradient overlay (right) */}
              <div className="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-white dark:from-black to-transparent z-10"></div>
              
              {/* Carousel container */}
              <div className="flex gap-12 py-6 animate-scroll">
                {/* First set of logos */}
                <div className="flex gap-12 items-center">
                  <div className="w-36 h-12 flex items-center justify-center">
                    <img src="/vercel.svg" alt="Vercel" className="h-8 opacity-70 hover:opacity-100 transition-opacity duration-300 dark:invert" />
                  </div>
                  <div className="w-36 h-12 flex items-center justify-center">
                    <img src="/google.svg" alt="Google" className="h-9 opacity-70 hover:opacity-100 transition-opacity duration-300 dark:invert" />
                  </div>
                  <div className="w-36 h-12 flex items-center justify-center">
                    <img src="/next.svg" alt="Next.js" className="h-7 opacity-70 hover:opacity-100 transition-opacity duration-300 dark:invert" />
                  </div>
                  <div className="w-36 h-12 flex items-center justify-center">
                    <img src="/globe.svg" alt="GlobalTech" className="h-10 opacity-70 hover:opacity-100 transition-opacity duration-300 dark:invert" />
                  </div>
                  <div className="w-36 h-12 flex items-center justify-center">
                    <img src="/file.svg" alt="FileCorp" className="h-9 opacity-70 hover:opacity-100 transition-opacity duration-300 dark:invert" />
                  </div>
                </div>
                
                {/* Duplicated set for seamless looping */}
                <div className="flex gap-12 items-center">
                  <div className="w-36 h-12 flex items-center justify-center">
                    <img src="/vercel.svg" alt="Vercel" className="h-8 opacity-70 hover:opacity-100 transition-opacity duration-300 dark:invert" />
                  </div>
                  <div className="w-36 h-12 flex items-center justify-center">
                    <img src="/google.svg" alt="Google" className="h-9 opacity-70 hover:opacity-100 transition-opacity duration-300 dark:invert" />
                  </div>
                  <div className="w-36 h-12 flex items-center justify-center">
                    <img src="/next.svg" alt="Next.js" className="h-7 opacity-70 hover:opacity-100 transition-opacity duration-300 dark:invert" />
                  </div>
                  <div className="w-36 h-12 flex items-center justify-center">
                    <img src="/globe.svg" alt="GlobalTech" className="h-10 opacity-70 hover:opacity-100 transition-opacity duration-300 dark:invert" />
                  </div>
                  <div className="w-36 h-12 flex items-center justify-center">
                    <img src="/file.svg" alt="FileCorp" className="h-9 opacity-70 hover:opacity-100 transition-opacity duration-300 dark:invert" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {companyData ? (
          <EnterpriseDashboard companyData={companyData} />
        ) : (
          <EnterpriseOnboarding onComplete={handleOnboardingComplete} />
        )}
      </div>
      
      {/* Footer */}
      <footer className="w-full bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} GoLoco. All rights reserved.
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
