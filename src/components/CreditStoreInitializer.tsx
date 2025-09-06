'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useCredits, PLANS } from '@/lib/credits';
import { useCreditStore } from '@/store/creditStore';

// This component bridges the context-based credit system with our zustand store
export function CreditStoreInitializer() {
  const { user } = useAuth();
  const { 
    imageGenerationsLimit, 
    imageEditsLimit, 
    activePlan, 
    isUnlimitedUser 
  } = useCredits();
  
  const { getUserCredit, initializeUserCredit } = useCreditStore();
  
  // Sync context state to zustand store on mount and when dependencies change
  useEffect(() => {
    if (user) {
      const userCredit = getUserCredit(user.uid);
      
      if (!userCredit) {
        // If unlimited user, use high limits
        if (isUnlimitedUser) {
          initializeUserCredit(user.uid, 9999, 9999);
        } 
        // If paid user with active plan
        else if (activePlan) {
          // Calculate expiry date (30 days from now as a fallback)
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);
          
          initializeUserCredit(
            user.uid, 
            imageGenerationsLimit, 
            imageEditsLimit,
            activePlan.id,
            expiryDate.toISOString(),
            null // We don't have access to paymentId here
          );
        } 
        // Free tier
        else {
          initializeUserCredit(user.uid, imageGenerationsLimit, imageEditsLimit);
        }
      }
    }
  }, [
    user, 
    isUnlimitedUser, 
    activePlan, 
    imageGenerationsLimit, 
    imageEditsLimit,
    getUserCredit,
    initializeUserCredit
  ]);
  
  // This component doesn't render anything
  return null;
}
