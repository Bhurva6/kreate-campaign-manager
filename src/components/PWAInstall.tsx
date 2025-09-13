'use client';

import { useEffect, useState } from 'react';

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Register service worker to ensure it's loaded properly
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
    
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) {
      console.log('Application is already installed and running in standalone mode');
      setIsInstallable(false);
      return;
    }

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event so it can be triggered later
      setDeferredPrompt(e);
      console.log('beforeinstallprompt event fired and stored');
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setDeferredPrompt(null);
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Debug: Log if beforeinstallprompt never fires
    setTimeout(() => {
      if (!deferredPrompt) {
        console.log('Debug: beforeinstallprompt event did not fire within 5 seconds.');
      }
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('No installation prompt available');
      return;
    }
    
    console.log('Triggering installation prompt');
    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the installation');
      } else {
        console.log('User dismissed the installation');
      }
      
      // Clear the saved prompt since it can't be used again
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (err) {
      console.error('Error during installation:', err);
    }
  };

  // Detect iOS
  const [isIOS, setIsIOS] = useState(false);
  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);
  }, []);

  // Only show the button if the app is installable (Android/desktop) or show iOS instructions
  if (isIOS) {
    // Show iOS install instructions if not in standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (!isStandalone) {
      return (
        <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-auto px-4 py-2 rounded-lg shadow-lg bg-yellow-100 text-gray-900 z-50 flex items-center gap-2">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14m0 0l-6-6m6 6l6-6"/></svg>
          <span>To install this app, tap <b>Share</b> <span role="img" aria-label="share">&#x1f5d2;</span> and then <b>Add to Home Screen</b>.</span>
        </div>
      );
    }
    // If already installed, show nothing
    return null;
  }

  if (!isInstallable) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg transition-colors bg-blue-600 text-white hover:bg-blue-700 z-50"
    >
      Install App
    </button>
  );
}
