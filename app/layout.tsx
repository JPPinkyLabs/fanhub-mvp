import type { Metadata, Viewport } from 'next';
import './globals.css';
import AuthProvider from '@/components/auth/AuthProvider';
import ServiceWorkerRegistration from '@/components/pwa/ServiceWorkerRegistration';

export const metadata: Metadata = {
  title: 'FanHub — Red Social para Hinchas',
  description: 'Compite, conecta y gana como el mejor hincha de tu equipo. FanHub: la red social gamificada del deporte chileno.',
  keywords: 'fútbol, hinchas, gamificación, Chile, Primera División, clanes, ranking',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FanHub',
  },
  openGraph: {
    title: 'FanHub — Red Social para Hinchas',
    description: 'Compite por ser el mejor hincha de tu equipo',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icons/icon-192x192.png',
  },
};

// theme-color and viewport config via the Viewport export (Next.js 14+)
export const viewport: Viewport = {
  themeColor: '#39ff14',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover',   // needed for iPhone notch (standalone mode)
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body>
        <AuthProvider>{children}</AuthProvider>
        {/* Registers /sw.js after first paint — zero impact on SSR */}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
