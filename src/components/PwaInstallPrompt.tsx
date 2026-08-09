import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles } from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user dismissed previously
      const dismissed = localStorage.getItem('kanji_sensei_pwa_dismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install prompt outcome: ${outcome}`);
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('kanji_sensei_pwa_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 left-6 md:left-auto md:max-w-md z-50 animate-bounce-short">
      <div className="bg-gradient-to-r from-indigo-900/90 via-slate-900/95 to-purple-900/90 backdrop-blur-xl border border-indigo-500/40 rounded-2xl p-5 shadow-2xl text-theme-text">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-lg text-indigo-200">Install SaikouNaru (最高成) PWA</h4>
              <p className="text-xs text-gray-300 mt-1">
                Install as a desktop/mobile application to study offline anytime with full SRS sync.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-theme-text p-1 rounded-lg hover:bg-white/10 transition"
            title="Close popup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-theme-text font-medium"
          >
            Not Now
          </button>
          <button
            onClick={handleInstall}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-theme-text font-semibold rounded-xl text-xs shadow-lg shadow-indigo-500/30 transition transform hover:scale-105 active:scale-95"
          >
            <Download className="w-4 h-4" />
            Install App
          </button>
        </div>
      </div>
    </div>
  );
};
