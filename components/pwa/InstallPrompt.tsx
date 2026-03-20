'use client';

import { useState, useEffect } from 'react';

/**
 * PWA Install Prompt
 * - Android/Chrome: listens for `beforeinstallprompt`, shows a banner with native install button
 * - iOS/Safari: detects standalone mode is not active + iOS UA, shows manual instructions
 * - Dismissed state is persisted in localStorage so the banner doesn't reappear
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type BannerMode = 'android' | 'ios' | null;

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone === true)
  );
}

const DISMISSED_KEY = 'fanhub_pwa_install_dismissed';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<BannerMode>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Don't show if already installed or user dismissed before
    if (isInStandaloneMode()) return;
    if (localStorage.getItem(DISMISSED_KEY) === '1') return;

    // Android / Chrome: native install prompt available
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setMode('android');
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS: no native prompt, show manual instructions
    if (isIOS()) {
      setMode('ios');
      setVisible(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      dismiss();
    } else {
      setInstalling(false);
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-[4.5rem] lg:bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-50 animate-fade-in">
      <div className="bg-surface-card border border-surface-border rounded-2xl p-4 shadow-xl shadow-black/50">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <circle cx="16" cy="16" r="15" fill="#39ff14" fillOpacity="0.15" stroke="#39ff14" strokeWidth="1.5"/>
              <polygon
                points="16,6 20,13 28,14 22,20 24,28 16,24 8,28 10,20 4,14 12,13"
                fill="none" stroke="#39ff14" strokeWidth="1.5" strokeLinejoin="round"
              />
              <circle cx="16" cy="16" r="3" fill="#39ff14"/>
            </svg>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-snug">Instala FanHub</p>
            {mode === 'android' ? (
              <p className="text-xs text-gray-500 mt-0.5">Acceso rápido desde tu pantalla de inicio, sin abrir el navegador.</p>
            ) : (
              <p className="text-xs text-gray-500 mt-0.5">
                Toca{' '}
                <span className="inline-flex items-center gap-0.5 text-white font-medium">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  Compartir
                </span>
                {' '}→{' '}
                <span className="text-white font-medium">Agregar a inicio</span>
              </p>
            )}
          </div>

          {/* Close */}
          <button
            onClick={dismiss}
            aria-label="Cerrar"
            className="flex-shrink-0 text-gray-600 hover:text-gray-400 transition-colors mt-0.5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Android install button */}
        {mode === 'android' && (
          <button
            onClick={handleInstall}
            disabled={installing}
            className="mt-3 w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
          >
            {installing ? 'Instalando...' : 'Instalar aplicación'}
          </button>
        )}
      </div>
    </div>
  );
}
