'use client';

import { AuthProvider } from '../lib/auth';
import { CreditProvider } from '../lib/credits';
import { useEffect, useState } from 'react';

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
    <AuthProvider>
      <CreditProvider>
        {children}
      </CreditProvider>
    </AuthProvider>
  );
}
