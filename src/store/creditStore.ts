import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserCredit {
  userId: string;
  imageGenerationsUsed: number;
  imageEditsUsed: number;
  imageGenerationsLimit: number;
  imageEditsLimit: number;
  lastUpdated: string;
  activePlanId: string | null;
  planExpiryDate: string | null;
  paymentId: string | null;
}

interface CreditStore {
  credits: Record<string, UserCredit>;
  
  // Get credit for a specific user
  getUserCredit: (userId: string) => UserCredit | null;
  
  // Initialize a user's credit
  initializeUserCredit: (
    userId: string, 
    generationLimit?: number, 
    editLimit?: number, 
    planId?: string | null,
    expiryDate?: string | null,
    paymentId?: string | null
  ) => void;
  
  // Credit consumption functions
  consumeImageGeneration: (userId: string) => boolean;
  consumeImageEdit: (userId: string) => boolean;
  
  // Plan management functions
  setUserPlan: (userId: string, planId: string, generationLimit: number, editLimit: number, paymentId: string) => void;
  resetUserCredits: (userId: string) => void;
  
  // Check if user can use services
  canUseImageGeneration: (userId: string) => boolean;
  canUseImageEdit: (userId: string) => boolean;
}

// Default free limits
const DEFAULT_GENERATION_LIMIT = 3;
const DEFAULT_EDIT_LIMIT = 7;

export const useCreditStore = create<CreditStore>()(
  persist(
    (set, get) => ({
      credits: {},
      
      getUserCredit: (userId: string) => {
        return get().credits[userId] || null;
      },
      
      initializeUserCredit: (
        userId: string, 
        generationLimit = DEFAULT_GENERATION_LIMIT, 
        editLimit = DEFAULT_EDIT_LIMIT,
        planId = null,
        expiryDate = null,
        paymentId = null
      ) => {
        set((state) => {
          // If user already exists, don't overwrite their data
          if (state.credits[userId]) {
            return state;
          }
          
          return {
            credits: {
              ...state.credits,
              [userId]: {
                userId,
                imageGenerationsUsed: 0,
                imageEditsUsed: 0,
                imageGenerationsLimit: generationLimit,
                imageEditsLimit: editLimit,
                lastUpdated: new Date().toISOString(),
                activePlanId: planId,
                planExpiryDate: expiryDate,
                paymentId: paymentId
              }
            }
          };
        });
      },
      
      consumeImageGeneration: (userId: string) => {
        const userCredit = get().getUserCredit(userId);
        
        // If user doesn't exist or has reached limit
        if (!userCredit) return false;
        if (userCredit.imageGenerationsUsed >= userCredit.imageGenerationsLimit) return false;
        
        // Consume credit
        set((state) => ({
          credits: {
            ...state.credits,
            [userId]: {
              ...userCredit,
              imageGenerationsUsed: userCredit.imageGenerationsUsed + 1,
              lastUpdated: new Date().toISOString()
            }
          }
        }));
        
        return true;
      },
      
      consumeImageEdit: (userId: string) => {
        const userCredit = get().getUserCredit(userId);
        
        // If user doesn't exist or has reached limit
        if (!userCredit) return false;
        if (userCredit.imageEditsUsed >= userCredit.imageEditsLimit) return false;
        
        // Consume credit
        set((state) => ({
          credits: {
            ...state.credits,
            [userId]: {
              ...userCredit,
              imageEditsUsed: userCredit.imageEditsUsed + 1,
              lastUpdated: new Date().toISOString()
            }
          }
        }));
        
        return true;
      },
      
      setUserPlan: (userId: string, planId: string, generationLimit: number, editLimit: number, paymentId: string) => {
        const userCredit = get().getUserCredit(userId);
        
        if (!userCredit) {
          // Initialize user with the plan if they don't exist
          get().initializeUserCredit(userId, generationLimit, editLimit, planId, null, paymentId);
          return;
        }
        
        // Calculate expiry date (30 days from now)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        
        set((state) => ({
          credits: {
            ...state.credits,
            [userId]: {
              ...userCredit,
              imageGenerationsLimit: generationLimit,
              imageEditsLimit: editLimit,
              // Reset used credits when upgrading to a new plan
              imageGenerationsUsed: 0,
              imageEditsUsed: 0,
              activePlanId: planId,
              planExpiryDate: expiryDate.toISOString(),
              paymentId: paymentId,
              lastUpdated: new Date().toISOString()
            }
          }
        }));
      },
      
      resetUserCredits: (userId: string) => {
        const userCredit = get().getUserCredit(userId);
        if (!userCredit) return;
        
        set((state) => ({
          credits: {
            ...state.credits,
            [userId]: {
              ...userCredit,
              imageGenerationsUsed: 0,
              imageEditsUsed: 0,
              lastUpdated: new Date().toISOString()
            }
          }
        }));
      },
      
      canUseImageGeneration: (userId: string) => {
        const userCredit = get().getUserCredit(userId);
        
        // Special unlimited user condition (could be added from context)
        const unlimitedUser = userId === "special_unlimited_id";
        
        if (unlimitedUser) return true;
        if (!userCredit) return false;
        
        // Check if plan has expired
        if (userCredit.planExpiryDate) {
          const expiryDate = new Date(userCredit.planExpiryDate);
          if (expiryDate < new Date()) {
            // Plan expired, revert to free tier
            set((state) => ({
              credits: {
                ...state.credits,
                [userId]: {
                  ...userCredit,
                  imageGenerationsLimit: DEFAULT_GENERATION_LIMIT,
                  imageEditsLimit: DEFAULT_EDIT_LIMIT,
                  activePlanId: null,
                  planExpiryDate: null,
                  lastUpdated: new Date().toISOString()
                }
              }
            }));
            return userCredit.imageGenerationsUsed < DEFAULT_GENERATION_LIMIT;
          }
        }
        
        return userCredit.imageGenerationsUsed < userCredit.imageGenerationsLimit;
      },
      
      canUseImageEdit: (userId: string) => {
        const userCredit = get().getUserCredit(userId);
        
        // Special unlimited user condition (could be added from context)
        const unlimitedUser = userId === "special_unlimited_id";
        
        if (unlimitedUser) return true;
        if (!userCredit) return false;
        
        // Check if plan has expired
        if (userCredit.planExpiryDate) {
          const expiryDate = new Date(userCredit.planExpiryDate);
          if (expiryDate < new Date()) {
            // Plan expired, revert to free tier
            set((state) => ({
              credits: {
                ...state.credits,
                [userId]: {
                  ...userCredit,
                  imageGenerationsLimit: DEFAULT_GENERATION_LIMIT,
                  imageEditsLimit: DEFAULT_EDIT_LIMIT,
                  activePlanId: null,
                  planExpiryDate: null,
                  lastUpdated: new Date().toISOString()
                }
              }
            }));
            return userCredit.imageEditsUsed < DEFAULT_EDIT_LIMIT;
          }
        }
        
        return userCredit.imageEditsUsed < userCredit.imageEditsLimit;
      }
    }),
    {
      name: "user-credits-storage",
      // Customize serialization to handle Date objects
      partialize: (state) => ({
        credits: state.credits
      })
    }
  )
);
