import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './auth';
import { useUI } from './ui';

// Constants for free limits
const FREE_IMAGE_GENERATIONS = 3;
const FREE_IMAGE_EDITS = 7;
const UNLIMITED_EMAIL = 'golocostudios@gmail.com';

// Define plans
export interface Plan {
  id: string;
  name: string;
  price: number; // in INR
  imageGenerations: number;
  imageEdits: number;
  description: string;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: 'mini',
    name: 'Mini',
    price: 299,
    imageGenerations: 50,
    imageEdits: 50,
    description: 'Try it out',
    features: [
      '50 images per month',
      'Basic editing tools',
      'Valid for 30 days'
    ]
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 700,
    imageGenerations: 150,
    imageEdits: 150,
    description: 'Get started',
    features: [
      '150 images per month',
      'Standard editing tools',
      'HD quality',
      'Valid for 30 days'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 2200,
    imageGenerations: 525,
    imageEdits: 525,
    description: 'For creators',
    features: [
      '525 images per month',
      'Priority processing',
      'Advanced editing tools',
      '4K quality',
      'Valid for 30 days'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 6000,
    imageGenerations: 1400,
    imageEdits: 1400,
    description: 'Power user',
    features: [
      '1400 images per month',
      'Fastest processing',
      'All editing tools',
      '8K quality',
      'Batch processing',
      'API access',
      'Valid for 30 days'
    ]
  }
];

interface CreditContextType {
  imageGenerationsUsed: number;
  imageEditsUsed: number;
  imageGenerationsLimit: number;
  imageEditsLimit: number;
  canUseImageGeneration: boolean;
  canUseImageEdit: boolean;
  isUnlimitedUser: boolean;
  isPaidUser: boolean;
  activePlan: Plan | null;
  consumeImageGeneration: () => boolean;
  consumeImageEdit: () => boolean;
  resetCredits: () => void;
  showPricingModal: boolean;
  setShowPricingModal: (show: boolean) => void;
  handleSuccessfulPayment: (planId: string, paymentId: string) => void;
  displayGenerationsRemaining: string | number;
  displayEditsRemaining: string | number;
}

const CreditContext = createContext<CreditContextType>({
  imageGenerationsUsed: 0,
  imageEditsUsed: 0,
  imageGenerationsLimit: FREE_IMAGE_GENERATIONS,
  imageEditsLimit: FREE_IMAGE_EDITS,
  canUseImageGeneration: false,
  canUseImageEdit: false,
  isUnlimitedUser: false,
  isPaidUser: false,
  activePlan: null,
  consumeImageGeneration: () => false,
  consumeImageEdit: () => false,
  resetCredits: () => {},
  showPricingModal: false,
  setShowPricingModal: () => {},
  handleSuccessfulPayment: () => {},
  displayGenerationsRemaining: 0,
  displayEditsRemaining: 0,
});

export const useCredits = () => {
  return useContext(CreditContext);
};

interface CreditProviderProps {
  children: ReactNode;
}

export const CreditProvider = ({ children }: CreditProviderProps) => {
  const { user } = useAuth();
  const { openPricingModal } = useUI();
  const [imageGenerationsUsed, setImageGenerationsUsed] = useState(0);
  const [imageEditsUsed, setImageEditsUsed] = useState(0);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [isPaidUser, setIsPaidUser] = useState(false);
  
  // Forward the showPricingModal to the UI context
  useEffect(() => {
    if (showPricingModal) {
      openPricingModal();
      setShowPricingModal(false);
    }
  }, [showPricingModal, openPricingModal]);

  // Check if user has unlimited access
  const isUnlimitedUser = user?.email === UNLIMITED_EMAIL;

  // Calculate limits based on active plan or free tier
  const imageGenerationsLimit = activePlan ? activePlan.imageGenerations : FREE_IMAGE_GENERATIONS;
  const imageEditsLimit = activePlan ? activePlan.imageEdits : FREE_IMAGE_EDITS;

  // Load user's plan and usage from localStorage when user changes
  useEffect(() => {
    if (user) {
      // Load usage data
      const savedGenerations = localStorage.getItem(`imageGenerations_${user.uid}`);
      const savedEdits = localStorage.getItem(`imageEdits_${user.uid}`);
      
      if (savedGenerations) {
        setImageGenerationsUsed(parseInt(savedGenerations, 10));
      } else {
        setImageGenerationsUsed(0);
      }
      
      if (savedEdits) {
        setImageEditsUsed(parseInt(savedEdits, 10));
      } else {
        setImageEditsUsed(0);
      }

      // Load active plan data
      const savedPlanData = localStorage.getItem(`plan_${user.uid}`);
      if (savedPlanData) {
        const planData = JSON.parse(savedPlanData);
        
        // Check if plan is still valid (30 days from purchase)
        const purchaseDate = new Date(planData.purchaseDate);
        const expirationDate = new Date(purchaseDate);
        expirationDate.setDate(expirationDate.getDate() + 30);
        
        if (new Date() < expirationDate) {
          // Plan is still valid
          const matchedPlan = PLANS.find(plan => plan.id === planData.planId);
          if (matchedPlan) {
            setActivePlan(matchedPlan);
            setIsPaidUser(true);
          }
        } else {
          // Plan has expired, remove it
          localStorage.removeItem(`plan_${user.uid}`);
          setActivePlan(null);
          setIsPaidUser(false);
        }
      }
    } else {
      // Reset when user logs out
      setImageGenerationsUsed(0);
      setImageEditsUsed(0);
      setActivePlan(null);
      setIsPaidUser(false);
    }
  }, [user]);

  // Save usage to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(`imageGenerations_${user.uid}`, imageGenerationsUsed.toString());
    }
  }, [user, imageGenerationsUsed]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`imageEdits_${user.uid}`, imageEditsUsed.toString());
    }
  }, [user, imageEditsUsed]);

  // Check if user can use image generation
  const canUseImageGeneration = isUnlimitedUser || imageGenerationsUsed < imageGenerationsLimit;
  
  // Check if user can use image editing
  const canUseImageEdit = isUnlimitedUser || imageEditsUsed < imageEditsLimit;

  // Use image generation (returns true if successful, false if limit reached)
  const consumeImageGeneration = (): boolean => {
    if (isUnlimitedUser) {
      return true;
    }
    
    if (imageGenerationsUsed < imageGenerationsLimit) {
      setImageGenerationsUsed(prev => prev + 1);
      return true;
    }
    
    // Show pricing modal when limit is reached
    setShowPricingModal(true);
    return false;
  };

  // Use image edit (returns true if successful, false if limit reached)
  const consumeImageEdit = (): boolean => {
    if (isUnlimitedUser) {
      return true;
    }
    
    if (imageEditsUsed < imageEditsLimit) {
      setImageEditsUsed(prev => prev + 1);
      return true;
    }
    
    // Show pricing modal when limit is reached
    setShowPricingModal(true);
    return false;
  };

  // Reset credits (for testing or when user upgrades)
  const resetCredits = () => {
    if (user) {
      setImageGenerationsUsed(0);
      setImageEditsUsed(0);
      localStorage.removeItem(`imageGenerations_${user.uid}`);
      localStorage.removeItem(`imageEdits_${user.uid}`);
    }
  };

  // Handle successful payment
  const handleSuccessfulPayment = (planId: string, paymentId: string) => {
    if (!user) return;
    
    const selectedPlan = PLANS.find(plan => plan.id === planId);
    if (selectedPlan) {
      // Save plan data to localStorage
      const planData = {
        planId,
        paymentId,
        purchaseDate: new Date().toISOString()
      };
      
      localStorage.setItem(`plan_${user.uid}`, JSON.stringify(planData));
      
      // Update state
      setActivePlan(selectedPlan);
      setIsPaidUser(true);
      
      // Reset usage counters
      resetCredits();
    }
  };

  // Calculate display values for remaining credits
  const displayGenerationsRemaining = isUnlimitedUser ? 'Unlimited' : (imageGenerationsLimit - imageGenerationsUsed);
  const displayEditsRemaining = isUnlimitedUser ? 'Unlimited' : (imageEditsLimit - imageEditsUsed);

  const value = {
    imageGenerationsUsed,
    imageEditsUsed,
    imageGenerationsLimit,
    imageEditsLimit,
    canUseImageGeneration,
    canUseImageEdit,
    isUnlimitedUser,
    isPaidUser,
    activePlan,
    consumeImageGeneration,
    consumeImageEdit,
    resetCredits,
    showPricingModal,
    setShowPricingModal,
    handleSuccessfulPayment,
    displayGenerationsRemaining,
    displayEditsRemaining,
  };

  return (
    <CreditContext.Provider value={value}>
      {children}
    </CreditContext.Provider>
  );
};
