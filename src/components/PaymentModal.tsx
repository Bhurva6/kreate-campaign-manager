'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RazorpayHandler from './RazorpayHandler';
import { useCredits, PLANS } from '@/lib/credits';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { handleSuccessfulPayment } = useCredits();
  const router = useRouter();

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

  if (!isOpen) return null;

  const plan = PLANS[1]; // Use the first paid plan

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 flex flex-col items-center">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-2xl font-bold mb-4 text-center">Ready to Create More?</h3>
          <p className="text-center mb-6 text-gray-600 dark:text-gray-400">
            You&apos;ve used your free generation. Upgrade now to create unlimited campaigns!
          </p>
          <div className="w-full space-y-4">
            <RazorpayHandler 
              plan={plan}
              buttonText="Upgrade Now"
              customClassName="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
              onSuccess={(paymentId) => {
                handleSuccessfulPayment(plan.id, paymentId);
                onClose();
                alert('Thank you for upgrading! You can now create more campaigns.');
              }}
            />
            <button
              onClick={() => {
                onClose();
                router.push('/');
              }}
              className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-all"
            >
              Maybe Later
            </button>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
          Payments processed securely via Razorpay. No auto-renewal.
        </div>
      </div>
    </div>
  );
}
