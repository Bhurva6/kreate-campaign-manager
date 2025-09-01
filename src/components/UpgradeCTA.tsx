import Link from 'next/link';
import { useCredits, PLANS } from '@/lib/credits';
import { useAuth } from '@/lib/auth';
import RazorpayHandler from './RazorpayHandler';

interface UpgradeCTAProps {
  variant?: 'inline' | 'button' | 'banner';
  preferredPlan?: 'basic' | 'pro';
  showDescription?: boolean;
  className?: string;
}

export default function UpgradeCTA({ 
  variant = 'button', 
  preferredPlan = 'basic',
  showDescription = false,
  className = ''
}: UpgradeCTAProps) {
  const { user } = useAuth();
  const { imageGenerationsUsed, imageEditsUsed } = useCredits();
  
  // Find the plan by id
  const plan = PLANS.find(p => p.id === preferredPlan) || PLANS[0];

  // Different styling based on variant
  const buttonStyles = {
    inline: "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline",
    button: "inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all",
    banner: "w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
  };
  
  // User not logged in - show link to pricing page
  if (!user) {
    return (
      <div className={className}>
        {showDescription && (
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
            Upgrade to get more image generations and edits.
          </p>
        )}
        <Link href="/pricing" className={buttonStyles[variant]}>
          View Pricing
        </Link>
      </div>
    );
  }
  
  // User logged in - show direct payment button
  return (
    <div className={className}>
      {showDescription && (
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          You've used {imageGenerationsUsed} of 3 free generations and {imageEditsUsed} of 7 free edits.
        </p>
      )}
      <RazorpayHandler
        plan={plan}
        buttonText={variant === 'inline' ? "Upgrade Now" : `Upgrade to ${plan.name}`}
        customClassName={buttonStyles[variant]}
        onSuccess={() => alert(`Thank you for purchasing the ${plan.name} plan! Your account has been upgraded.`)}
      />
    </div>
  );
}
