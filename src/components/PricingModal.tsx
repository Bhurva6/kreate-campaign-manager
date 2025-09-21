import React, { useEffect } from 'react';
import { useCredits, PLANS } from '@/lib/credits';
import { useAuth } from '@/lib/auth';
import RazorpayHandler from './RazorpayHandler';

// Constants for free limits
const FREE_IMAGE_GENERATIONS = 3;
const FREE_IMAGE_EDITS = 7;

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const { handleSuccessfulPayment, imageGenerationsUsed, imageEditsUsed } = useCredits();
  const { user } = useAuth();

  // Load Razorpay script
  useEffect(() => {
    if (isOpen) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [isOpen]);

  // We use the RazorpayHandler component now instead of handling payment here

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Upgrade Your Creative Potential
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Usage Stats */}
        <div className="p-6 bg-blue-50 dark:bg-blue-900/20">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Your Current Usage</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600 dark:text-gray-400">Image Generations</div>
              <div className="mt-1 flex items-end">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{imageGenerationsUsed}</span>
                <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">/ {FREE_IMAGE_GENERATIONS} free</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.min(100, (imageGenerationsUsed / FREE_IMAGE_GENERATIONS) * 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600 dark:text-gray-400">Image Edits</div>
              <div className="mt-1 flex items-end">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{imageEditsUsed}</span>
                <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">/ {FREE_IMAGE_EDITS} free</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.min(100, (imageEditsUsed / FREE_IMAGE_EDITS) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="p-6">
          <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white text-center">Choose a Plan</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {PLANS.map((plan) => (
              <div 
                key={plan.id}
                className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <h4 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{plan.name}</h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">₹{plan.price}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">/ month</span>
                  </div>
                  
                  <ul className="mb-6 space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <RazorpayHandler 
                    plan={plan}
                    buttonText={`Get ${plan.name} Now`}
                    customClassName="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
                    onSuccess={(paymentId) => {
                      handleSuccessfulPayment(plan.id, paymentId);
                      alert(`Thank you for purchasing the ${plan.name} plan!`);
                      onClose();
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
          Payments processed securely via Razorpay. No auto-renewal, plans expire after 30 days.
        </div>
      </div>
    </div>
  );
}
