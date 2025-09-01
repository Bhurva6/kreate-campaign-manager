'use client';

import PricingCards from '@/components/PricingCards';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold">Pricing Plans</h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choose the plan that suits your creative needs. Upgrade anytime to unlock more generations and edits.
          </p>
        </div>
        
        <PricingCards />
        
        <div className="mt-20 max-w-3xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">Frequently Asked Questions</h3>
          
          <div className="space-y-6 mt-8 text-left">
            <div>
              <h4 className="text-lg font-semibold">How do the credits work?</h4>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Each plan comes with a specific number of image generations and edits. 
                These credits are valid for 30 days from purchase.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold">Do plans automatically renew?</h4>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                No, all plans are one-time purchases valid for 30 days. You can purchase a new plan
                when your current plan expires.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold">Can I upgrade my plan?</h4>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Yes, you can purchase a higher-tier plan at any time. The new plan will replace your
                current plan and reset your credit limits.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold">What payment methods are accepted?</h4>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                We accept credit/debit cards, UPI, net banking, and digital wallets through our secure
                payment partner, Razorpay.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
