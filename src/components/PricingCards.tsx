'use client';

import React from 'react';
import RazorpayHandler from './RazorpayHandler';
import { useAuth } from '@/lib/auth';

export default function PricingCards() {
  const { user } = useAuth();

  const handleSuccess = (planName: string) => {
    alert(`Thank you for purchasing the ${planName} plan! Your account has been upgraded.`);
  };

  const handleLoginPrompt = () => {
    alert('Please log in to continue');
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      description: 'Perfect for getting started',
      features: [
        '7 credits free',
        'No credit card required',
        'Access to plugins and APIs',
        'Process up to 7 hifi assets',
      ],
    },
    {
      id: 'payg',
      name: 'Pay-As-You-Go',
      price: 0,
      description: 'Top-up as needed',
      features: [
        'No monthly charges',
        'Top-up credits as you go',
        'Access to plugins, APIs, and Dashboard',
        'Build Your Own (Localization) Model',
        'Great for variable needs',
      ],
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 1600,
      description: 'Perfect for starters',
      features: [
        '20,000 credits / month',
        'Access to plugins, APIs, and Dashboard',
        'Process up to 25 hifi or 100 lofi assets',
        'Top-up credits as you go',
        'Great for early/start-up teams',
      ],
    },
    {
      id: 'plus',
      name: 'Plus',
      price: 6700,
      description: 'Most popular',
      features: [
        '100,000 credits / month',
        'Access to plugins, APIs, and Dashboard',
        'Process up to 125 hifi or 500 lofi assets',
        'Build Your Own (Localization) Model',
        'Dedicated technical support',
        'Top-up credits as you go',
        'Ideal for mid-tier marketing and creative teams',
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 25000,
      description: 'For scale-ups',
      features: [
        '500,000 credits per month',
        'Access to plugins, APIs, and Dashboard',
        'Process up to 500 hifi or 2K lofi assets',
        'Build Your Own (Localization) Model',
        'Priority technical support',
        'Dedicated onboarding',
        'Top-up credits as you go',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 0,
      description: 'Talk to us',
      features: [
        'Unlimited credits per month',
        'Access to plugins, APIs, and Dashboard',
        'Process unlimited hifi or lofi assets',
        'Build Your Own (Localization) Model',
        'Dedicated priority onboarding',
        'Dedicated 24x7 technical support',
        'TMS and DAM integrations',
      ],
    },
  ] as const;

  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-4">
      <h2 className="text-3xl font-bold text-center mb-12">Choose Your Plan</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold mb-2">₹{plan.price}<span className="text-sm text-gray-500 font-normal">/month</span></div>
                </div>
                {plan.id === 'plus' && (
                  <span className="bg-gradient-to-r from-orange-500 to-pink-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</span>
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

              {plan.id === 'enterprise' ? (
                <button
                  className="w-full py-3 px-4 bg-gray-600 text-white font-medium rounded-lg transition hover:bg-gray-700"
                  onClick={() => {
                    const subject = encodeURIComponent('Enterprise Plan Inquiry - GoLoco');
                    const body = encodeURIComponent(`Hello GoLoco Team,\n\nI am interested in learning more about your Enterprise plan and would like to discuss custom pricing and features for my organization.\n\nPlease contact me to schedule a call or provide more information.\n\nBest regards`);
                    const mailtoLink = `mailto:golocostudios@gmail.com?subject=${subject}&body=${body}`;
                    window.open(mailtoLink, '_self');
                  }}
                >
                  Talk to Us
                </button>
              ) : plan.id === 'free' || plan.id === 'payg' ? (
                user ? (
                  <button
                    className="w-full py-3 px-4 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg cursor-not-allowed"
                    disabled
                  >
                    {plan.id === 'free' ? 'Current Plan' : 'Available by Top-up'}
                  </button>
                ) : (
                  <button
                    className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg transition hover:bg-blue-700"
                    onClick={handleLoginPrompt}
                  >
                    {plan.id === 'free' ? 'Sign Up' : 'Get Started'}
                  </button>
                )
              ) : user ? (
                <RazorpayHandler
                  plan={{ id: plan.id, name: plan.name, price: plan.price, imageGenerations: 0, imageEdits: 0, description: plan.description, features: plan.features.slice() }}
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
