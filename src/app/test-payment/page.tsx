'use client';

import { useEffect, useState } from 'react';
import TestPayment from '@/components/TestPayment';
import MinimalTest from './minimal-test';
import UPITest from './upi-test';

export default function TestRazorpayPage() {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if Razorpay script is loaded
  useEffect(() => {
    // Check immediately if it&apos;s already loaded
    if ((window as any).Razorpay) {
      setIsScriptLoaded(true);
      return;
    }

    // Set up a listener to check when it loads
    const checkInterval = setInterval(() => {
      if ((window as any).Razorpay) {
        setIsScriptLoaded(true);
        clearInterval(checkInterval);
      }
    }, 500);

    // Safety timeout after 10 seconds
    setTimeout(() => {
      if (!isScriptLoaded) {
        setErrorMessage("Razorpay script failed to load within 10 seconds. Check your network connection and console for errors.");
        clearInterval(checkInterval);
      }
    }, 10000);

    return () => clearInterval(checkInterval);
  }, [isScriptLoaded]);

  const manuallyLoadScript = () => {
    setErrorMessage(null);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => setErrorMessage("Failed to load Razorpay script. Check your network connection.");
    document.body.appendChild(script);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Razorpay Test Page</h1>
          <p className="text-gray-600 mb-4">Use this page to test your Razorpay integration</p>
          
          {/* Script status indicator */}
          <div className={`inline-flex items-center px-4 py-2 rounded-md mb-4 
            bg-opacity-20 border
            ${isScriptLoaded ? 'bg-green-100 border-green-300 text-green-800' : 'bg-yellow-100 border-yellow-300 text-yellow-800'}`}>
            <div className={`w-3 h-3 rounded-full mr-2 ${isScriptLoaded ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span>Razorpay Script: {isScriptLoaded ? 'Loaded' : 'Loading...'}</span>
          </div>
          
          {/* Error message */}
          {errorMessage && (
            <div className="mt-4 p-4 bg-red-100 border border-red-300 text-red-800 rounded-md">
              <p className="font-medium">Error:</p>
              <p>{errorMessage}</p>
              <button 
                onClick={manuallyLoadScript}
                className="mt-2 px-3 py-1 bg-red-800 text-white rounded-md hover:bg-red-700"
              >
                Retry Loading Script
              </button>
            </div>
          )}
        </div>
        
        {/* Debug info */}
        <div className="mb-6 p-4 bg-gray-200 rounded-lg text-sm">
          <h2 className="font-bold mb-2">Debug Information:</h2>
          <p>1. Open your browser console (F12 or Ctrl+Shift+J) to see detailed error messages.</p>
          <p>2. If the payment popup doesn&apos;t open, check for any errors in the console.</p>
          <p>3. Make sure your Razorpay key is correct and working.</p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold mb-4">Option 1: Comprehensive Test</h2>
            <TestPayment />
          </div>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Option 2: Minimal Test</h2>
              <p className="mb-4 text-gray-600">Try this if the comprehensive test isn&apos;t working.</p>
              <MinimalTest />
            </div>
            
            <div>
              <h2 className="text-xl font-bold mb-4">Option 3: UPI Test</h2>
              <p className="mb-4 text-gray-600">If you&apos;re in India, try UPI payment instead.</p>
              <UPITest />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
