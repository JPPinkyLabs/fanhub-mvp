'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          // Check for updates in the background
          reg.update().catch(() => {});
        })
        .catch((err) => {
          console.warn('[FanHub SW] Registration failed:', err);
        });
    }
  }, []);

  return null;
}
