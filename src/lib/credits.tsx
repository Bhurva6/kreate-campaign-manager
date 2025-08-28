import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './auth';

interface CreditContextType {
  imageGenerationsUsed: number;
  imageEditsUsed: number;
  canUseImageGeneration: boolean;
  canUseImageEdit: boolean;
  isUnlimitedUser: boolean;
  consumeImageGeneration: () => boolean;
  consumeImageEdit: () => boolean;
  resetCredits: () => void;
  showPricingModal: boolean;
  setShowPricingModal: (show: boolean) => void;
}

const CreditContext = createContext<CreditContextType>({
  imageGenerationsUsed: 0,
  imageEditsUsed: 0,
  canUseImageGeneration: false,
  canUseImageEdit: false,
  isUnlimitedUser: false,
  consumeImageGeneration: () => false,
  consumeImageEdit: () => false,
  resetCredits: () => {},
  showPricingModal: false,
  setShowPricingModal: () => {},
});

export const useCredits = () => {
  return useContext(CreditContext);
};

interface CreditProviderProps {
  children: ReactNode;
}

// Constants for free limits
const FREE_IMAGE_GENERATIONS = 3;
const FREE_IMAGE_EDITS = 7;
const UNLIMITED_EMAIL = 'golocostudios@gmail.com';

export const CreditProvider = ({ children }: CreditProviderProps) => {
  const { user } = useAuth();
  const [imageGenerationsUsed, setImageGenerationsUsed] = useState(0);
  const [imageEditsUsed, setImageEditsUsed] = useState(0);
  const [showPricingModal, setShowPricingModal] = useState(false);

  // Check if user has unlimited access
  const isUnlimitedUser = user?.email === UNLIMITED_EMAIL;

  // Load usage from localStorage when user changes
  useEffect(() => {
    if (user) {
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
    } else {
      // Reset when user logs out
      setImageGenerationsUsed(0);
      setImageEditsUsed(0);
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
  const canUseImageGeneration = isUnlimitedUser || imageGenerationsUsed < FREE_IMAGE_GENERATIONS;
  
  // Check if user can use image editing
  const canUseImageEdit = isUnlimitedUser || imageEditsUsed < FREE_IMAGE_EDITS;

  // Use image generation (returns true if successful, false if limit reached)
  const consumeImageGeneration = (): boolean => {
    if (isUnlimitedUser) {
      return true;
    }
    
    if (imageGenerationsUsed < FREE_IMAGE_GENERATIONS) {
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
    
    if (imageEditsUsed < FREE_IMAGE_EDITS) {
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

  const value = {
    imageGenerationsUsed,
    imageEditsUsed,
    canUseImageGeneration,
    canUseImageEdit,
    isUnlimitedUser,
    consumeImageGeneration,
    consumeImageEdit,
    resetCredits,
    showPricingModal,
    setShowPricingModal,
  };

  return (
    <CreditContext.Provider value={value}>
      {children}
    </CreditContext.Provider>
  );
};
