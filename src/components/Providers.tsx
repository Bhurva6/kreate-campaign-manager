import { ReactNode } from 'react';
import { UIProvider } from '@/lib/ui';
import PricingModal from '@/components/PricingModal';
import { useUI } from '@/lib/ui';

// Component to include modals
function Modals() {
  const { isPricingModalOpen, closePricingModal } = useUI();
  
  return (
    <>
      <PricingModal 
        isOpen={isPricingModalOpen} 
        onClose={closePricingModal} 
      />
    </>
  );
}

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <UIProvider>
      {children}
      <Modals />
    </UIProvider>
  );
}
