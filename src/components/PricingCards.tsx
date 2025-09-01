'use client';

import React from 'react';
import RazorpayHandler from './RazorpayHandler';
import { PLANS } from '@/lib/credits';
import { useAuth } from '@/lib/auth';
import { useUI } from '@/lib/ui';

export default function PricingCards() {
  const { user } = useAuth();
  const { openPricingModal } = useUI();

  const handleSuccess = (planName: string) => {
    alert(`Thank you for purchasing the ${planName} plan! Your account has been upgraded.`);
  };

  // If user is not logged in, show login prompt
  const handleLoginPrompt = () => {
    alert('Please log in to purchase a plan');
    // You can redirect to login page or open login modal here
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-4">
      <h2 className="text-3xl font-bold text-center mb-12">Choose Your Plan</h2>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Free Plan Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-xl">
          <div className="p-6">
            <h3 className="text-xl font-bold mb-2">Free</h3>
            <div className="text-3xl font-bold mb-2">₹0<span className="text-sm text-gray-500 font-normal">/month</span></div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Perfect for getting started</p>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">3 image generations</span>
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">7 image edits</span>
              </li>
              <li className="flex items-center opacity-50">
                <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-500">No priority processing</span>
              </li>
            </ul>
            
            <button
              className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              disabled
            >
              Current Plan
            </button>
          </div>
        </div>
      
        {/* Paid Plans */}
        {PLANS.map((plan) => (
          <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold mb-2">₹{plan.price}<span className="text-sm text-gray-500 font-normal">/month</span></div>
                </div>
                {plan.id === 'pro' && (
                  <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Popular</span>
                )}
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">{plan.description}</p>
              
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {user ? (
                <RazorpayHandler
                  plan={plan}
                  onSuccess={() => handleSuccess(plan.name)}
                  buttonText={`Get ${plan.name} Plan`}
                  customClassName="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg transition-all hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                />
              ) : (
                <button
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg transition-all hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  onClick={handleLoginPrompt}
                >
                  Get {plan.name} Plan
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
        Payments processed securely via Razorpay. No automatic renewals, plans valid for 30 days.
      </div>
    </div>
  );
}
