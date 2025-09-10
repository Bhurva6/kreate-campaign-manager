import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useCredits, PLANS } from '@/lib/credits';
import { useCreditStore } from '@/store/creditStore';

// This hook bridges the existing useCredits context with our new Zustand store
// for more reliable credit management during API calls
export const useCreditManagement = () => {
  const { user } = useAuth();
  const userId = user?.uid || '';
  
  // Get functions and data from both the context and store
  const {
    imageGenerationsUsed: contextGenerationsUsed,
    imageEditsUsed: contextEditsUsed,
    imageGenerationsLimit: contextGenerationsLimit,
    imageEditsLimit: contextEditsLimit,
    canUseImageGeneration: contextCanUseGeneration,
    canUseImageEdit: contextCanUseEdit,
    isUnlimitedUser,
    isPaidUser,
    activePlan,
    consumeImageGeneration: contextConsumeGeneration,
    consumeImageEdit: contextConsumeEdit,
    resetCredits: contextResetCredits,
    showPricingModal,
    setShowPricingModal,
    handleSuccessfulPayment: contextHandlePayment,
  } = useCredits();
  
  const {
    getUserCredit,
    initializeUserCredit,
    consumeImageGeneration: storeConsumeGeneration,
    consumeImageEdit: storeConsumeEdit,
    setUserPlan,
    resetUserCredits,
    canUseImageGeneration: storeCanUseGeneration,
    canUseImageEdit: storeCanUseEdit,
  } = useCreditStore();

  // Special unlimited user email
  const UNLIMITED_EMAIL = ['golocostudios@gmail.com','paridhi.jain0007@gmail.com','lixxca8@gmail.com'];

  // Initialize the store with user data from context
  useEffect(() => {
    if (user) {
      const userCredit = getUserCredit(user.uid);
      
      if (!userCredit) {
        // If unlimited user, use high limits
        if (user.email && UNLIMITED_EMAIL.includes(user.email)) {
          initializeUserCredit(user.uid, 9999, 9999);
        } 
        // If paid user from context, set up their plan in the store
        else if (isPaidUser && activePlan) {
          initializeUserCredit(
            user.uid, 
            activePlan.imageGenerations, 
            activePlan.imageEdits,
            activePlan.id
          );
        } 
        // Free user
        else {
          initializeUserCredit(user.uid);
        }
      }
    }
  }, [user, isPaidUser, activePlan, initializeUserCredit, getUserCredit]);

  // Function to consume generation credit - uses both context and store
  const consumeImageGeneration = (): boolean => {
    if (!user) return false;
    
    // If unlimited user, always allow
    if (isUnlimitedUser) return true;
    
    // Check if user can use the service from store (which has persistence)
    const canUseFromStore = storeCanUseGeneration(user.uid);
    if (!canUseFromStore) {
      setShowPricingModal(true);
      return false;
    }
    
    // Update both store and context
    const storeSuccess = storeConsumeGeneration(user.uid);
    const contextSuccess = contextConsumeGeneration();
    
    return storeSuccess && contextSuccess;
  };

  // Function to consume edit credit - uses both context and store
  const consumeImageEdit = (): boolean => {
    if (!user) return false;
    
    // If unlimited user, always allow
    if (isUnlimitedUser) return true;
    
    // Check if user can use the service from store (which has persistence)
    const canUseFromStore = storeCanUseEdit(user.uid);
    if (!canUseFromStore) {
      setShowPricingModal(true);
      return false;
    }
    
    // Update both store and context
    const storeSuccess = storeConsumeEdit(user.uid);
    const contextSuccess = contextConsumeEdit();
    
    return storeSuccess && contextSuccess;
  };

  // Handle successful payment
  const handleSuccessfulPayment = (planId: string, paymentId: string) => {
    if (!user) return;
    
    const selectedPlan = PLANS.find(plan => plan.id === planId);
    if (selectedPlan) {
      // Update store
      setUserPlan(
        user.uid, 
        planId, 
        selectedPlan.imageGenerations, 
        selectedPlan.imageEdits, 
        paymentId
      );
      
      // Update context
      contextHandlePayment(planId, paymentId);
    }
  };

  // Reset credits
  const resetCredits = () => {
    if (!user) return;
    
    // Reset both store and context
    resetUserCredits(user.uid);
    contextResetCredits();
  };

  return {
    // Expose original context values
    imageGenerationsUsed: contextGenerationsUsed,
    imageEditsUsed: contextEditsUsed,
    imageGenerationsLimit: contextGenerationsLimit,
    imageEditsLimit: contextEditsLimit,
    isUnlimitedUser,
    isPaidUser,
    activePlan,
    showPricingModal,
    setShowPricingModal,
    
    // Expose enhanced functions that update both context and store
    consumeImageGeneration,
    consumeImageEdit,
    resetCredits,
    handleSuccessfulPayment,
    
    // Functions to check if user can use services (uses both sources for reliability)
    canUseImageGeneration: user ? 
      (isUnlimitedUser || (storeCanUseGeneration(user.uid) && contextCanUseGeneration)) : false,
    canUseImageEdit: user ? 
      (isUnlimitedUser || (storeCanUseEdit(user.uid) && contextCanUseEdit)) : false,
  };
};
