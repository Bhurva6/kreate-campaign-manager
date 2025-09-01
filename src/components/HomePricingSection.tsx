'use client';

import React from 'react';
import { useAuth } from '@/lib/auth';
import { PLANS } from '@/lib/credits';
import RazorpayHandler from './RazorpayHandler';

interface HomePricingSectionProps {
  className?: string;
}

export default function HomePricingSection({ className = '' }: HomePricingSectionProps) {
  const { user } = useAuth();
  
  const handleLoginPrompt = () => {
    alert('Please log in to purchase a plan');
    // You can redirect to login page here
    // router.push('/signin');
  };

  return (
    <section className={`py-12 px-4 ${className}`}>
      <div className="max-w-7xl mx-auto text-center">
        <div className="mb-6">
          <span className="inline-block px-4 py-2 bg-lime-400/10 border border-lime-400/20 rounded-full text-lime-300 text-sm font-medium backdrop-blur-sm">
            💎 Upgrade
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Unlock Your Creative Potential</h2>
          <p className="text-lg text-gray-400 mb-12 max-w-3xl mx-auto">
          Choose the plan that&apos;s right for you and start creating amazing visuals today
        </p>        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {PLANS.map((plan) => (
            <div 
              key={plan.id}
              className="backdrop-blur-xl bg-gradient-to-br from-white/10 via-white/5 to-white/2 border border-white/10 rounded-3xl p-8 hover:border-lime-400/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-lime-400/10"
            >
              <h3 className="text-2xl font-bold mb-2 text-white">{plan.name}</h3>
              <div className="text-3xl font-bold mb-4 text-white">
                ₹{plan.price}<span className="text-sm text-gray-400">/month</span>
              </div>
              <p className="text-gray-300 mb-6">{plan.description}</p>
              
              <ul className="space-y-3 mb-8 text-left">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg className="w-5 h-5 text-lime-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {user ? (
                <RazorpayHandler
                  plan={plan}
                  onSuccess={() => alert(`Thank you for purchasing the ${plan.name} plan! Your account has been upgraded.`)}
                  buttonText={`Get ${plan.name}`}
                  customClassName="w-full py-3 px-4 bg-gradient-to-r from-lime-500 to-lime-400 text-black font-medium rounded-lg hover:from-lime-400 hover:to-lime-300 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-opacity-50 transition-all"
                />
              ) : (
                <button
                  onClick={handleLoginPrompt}
                  className="w-full py-3 px-4 bg-gradient-to-r from-lime-500 to-lime-400 text-black font-medium rounded-lg hover:from-lime-400 hover:to-lime-300 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-opacity-50 transition-all"
                >
                  Get {plan.name}
                </button>
              )}
            </div>
          ))}
        </div>
        
        <p className="mt-8 text-sm text-gray-400">
          All plans include 30-day validity. No automatic renewals.
        </p>
      </div>
    </section>
  );
}
