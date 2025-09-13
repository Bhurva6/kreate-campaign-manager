'use client';

import { AuthProvider } from '../lib/auth';
import { CreditProvider } from '../lib/credits';
import { UIProvider } from '../lib/ui';
import PricingModal from './PricingModal';
import { useEffect, useState } from 'react';
import { useUI } from '../lib/ui';
import { ThemeProvider } from '../context/ThemeContext';
// Import our credit store initialization component
import { CreditStoreInitializer } from '@/components/CreditStoreInitializer';
import PWAInstall from './PWAInstall';

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
            {/* CreditStoreInitializer syncs context with zustand store */}
            <CreditStoreInitializer />
            {children}
            <PricingModalWrapper />
            <PWAInstall />
          </CreditProvider>
        </UIProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
