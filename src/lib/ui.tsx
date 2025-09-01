import { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
  isPricingModalOpen: boolean;
  openPricingModal: () => void;
  closePricingModal: () => void;
}

const UIContext = createContext<UIContextType>({
  isPricingModalOpen: false,
  openPricingModal: () => {},
  closePricingModal: () => {},
});

export const useUI = () => {
  return useContext(UIContext);
};

interface UIProviderProps {
  children: ReactNode;
}

export const UIProvider = ({ children }: UIProviderProps) => {
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  const openPricingModal = () => {
    setIsPricingModalOpen(true);
  };

  const closePricingModal = () => {
    setIsPricingModalOpen(false);
  };

  const value = {
    isPricingModalOpen,
    openPricingModal,
    closePricingModal,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};
