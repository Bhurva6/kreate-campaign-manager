'use client';

import { useEffect, useState } from 'react';
import { PLANS } from '@/lib/credits';
import { useAuth } from '@/lib/auth';

export default function RazorpayTest() {
  const { user } = useAuth();
  const plan = PLANS[0]; // Basic plan
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Add log entry
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  // Load Razorpay script manually
  useEffect(() => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      addLog('Razorpay script already exists');
      setRazorpayLoaded(true);
      return;
    }

    addLog('Loading Razorpay script...');
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    
    script.onload = () => {
      addLog('✅ Razorpay script loaded successfully');
      setRazorpayLoaded(true);
    };
    
    script.onerror = (err) => {
      addLog(`❌ Error loading Razorpay script: ${err}`);
      setError('Failed to load Razorpay script');
    };
    
    document.body.appendChild(script);

    return () => {
      // Don't remove script on unmount
    };
  }, []);

  // Direct test of Razorpay popup
  const testRazorpay = () => {
    if (!user) {
      addLog('❌ Not logged in');
      setError('Please log in to test payment');
      return;
    }

    addLog(`Attempting to open Razorpay with plan: ${plan.name}`);

    if (!(window as any).Razorpay) {
      addLog('❌ Razorpay object not found on window');
      setError('Razorpay is not loaded. Check console for details.');
      return;
    }

    try {
      const options = {
        key: 'rzp_live_RCLRfxSb4IfcwU',
        amount: plan.price * 100,
        currency: 'INR',
        name: 'GoLoco',
        description: `${plan.name} Plan - TEST`,
        image: '/logo.png',
        handler: function(response: any) {
          addLog(`✅ Payment successful with ID: ${response.razorpay_payment_id}`);
          alert(`Test successful! Payment ID: ${response.razorpay_payment_id}`);
        },
        prefill: {
          name: user.displayName || 'Test User',
          email: user.email || 'test@example.com',
          contact: '9999999999',
        },
        notes: {
          test_payment: 'true',
          plan_id: plan.id,
          user_id: user.uid || '',
        },
        theme: {
          color: '#0171B9',
        },
        modal: {
          ondismiss: function() {
            addLog('Payment modal dismissed by user');
          },
          escape: true,
        },
      };

      addLog('Creating Razorpay instance');
      const paymentObject = new (window as any).Razorpay(options);
      
      paymentObject.on('payment.failed', function (resp: any){
        addLog(`❌ Payment failed: ${resp.error.description}`);
      });
      
      addLog('Opening Razorpay dialog...');
      paymentObject.open();
      addLog('Razorpay open() method called');
      
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setError(`Error initializing payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Razorpay Test Page</h1>
      
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Status:</h2>
        <div className="flex items-center mb-4">
          <div className={`w-3 h-3 rounded-full mr-2 ${razorpayLoaded ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{razorpayLoaded ? 'Razorpay script loaded' : 'Razorpay script not loaded'}</span>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Test Plan:</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p><strong>Name:</strong> {plan.name}</p>
            <p><strong>Price:</strong> ₹{plan.price}</p>
            <p><strong>Description:</strong> {plan.description}</p>
          </div>
        </div>
      </div>
      
      <button 
        onClick={testRazorpay}
        className="py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
        disabled={!razorpayLoaded || !user}
      >
        {!user ? 'Please Log In First' : 'Test Razorpay Payment'}
      </button>
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Debug Log:</h2>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-300 dark:border-gray-700 h-64 overflow-y-auto font-mono text-sm">
          {logs.length > 0 ? (
            logs.map((log, i) => (
              <div key={i} className="py-1 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                {log}
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No logs yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
