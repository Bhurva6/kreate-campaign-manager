'use client';

import { useEffect, useState } from 'react';

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };

  return (
    <button
      onClick={handleInstallClick}
      disabled={!deferredPrompt}
      className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg transition-colors ${
        deferredPrompt
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-gray-400 text-gray-200 cursor-not-allowed'
      }`}
    >
      Install App
    </button>
  );
}
