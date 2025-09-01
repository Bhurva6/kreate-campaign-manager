'use client';

import { useCredits } from '@/lib/credits';
import UpgradeCTA from './UpgradeCTA';

export default function UsageCounter() {
  const { 
    imageGenerationsUsed, 
    imageGenerationsLimit,
    imageEditsUsed,
    imageEditsLimit,
    isPaidUser,
    activePlan
  } = useCredits();

  // Calculate percentages for the progress bars
  const genPercentage = Math.min(100, (imageGenerationsUsed / imageGenerationsLimit) * 100);
  const editPercentage = Math.min(100, (imageEditsUsed / imageEditsLimit) * 100);

  // Determine if usage is getting low (75% or more used)
  const genLow = genPercentage >= 75;
  const editLow = editPercentage >= 75;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Your Usage</h3>
        {isPaidUser && activePlan && (
          <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold px-2.5 py-0.5 rounded">
            {activePlan.name} Plan
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Image Generations */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Image Generations
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {imageGenerationsUsed} / {imageGenerationsLimit}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${
                genLow ? 'bg-orange-500' : 'bg-blue-600'
              }`} 
              style={{ width: `${genPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Image Edits */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Image Edits
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {imageEditsUsed} / {imageEditsLimit}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${
                editLow ? 'bg-orange-500' : 'bg-blue-600'
              }`} 
              style={{ width: `${editPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      {(genLow || editLow || !isPaidUser) && (
        <div className="mt-6 text-center">
          <UpgradeCTA 
            variant="button" 
            preferredPlan={isPaidUser ? 'pro' : 'basic'} 
            showDescription={true} 
          />
        </div>
      )}
    </div>
  );
}
