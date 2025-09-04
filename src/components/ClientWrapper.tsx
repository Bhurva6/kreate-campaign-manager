'use client';

import { AuthProvider } from '../lib/auth';
import { CreditProvider } from '../lib/credits';
import { UIProvider } from '../lib/ui';
import PricingModal from './PricingModal';
import { useEffect, useState } from 'react';
import { useUI } from '../lib/ui';
import { ThemeProvider } from '../context/ThemeContext';

// Component to include modals
function PricingModalWrapper() {
  const { isPricingModalOpen, closePricingModal } = useUI();
  
  return (
    <PricingModal 
      isOpen={isPricingModalOpen} 
      onClose={closePricingModal} 
    />
  );
}

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show loading or render children without auth during SSR
  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <UIProvider>
          <CreditProvider>
            {children}
            <PricingModalWrapper />
          </CreditProvider>
        </UIProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
