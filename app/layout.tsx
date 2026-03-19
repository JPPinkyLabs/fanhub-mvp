import type { Metadata } from 'next';
import './globals.css';
import AuthProvider from '@/components/auth/AuthProvider';

export const metadata: Metadata = {
  title: 'FanHub — Red Social para Hinchas',
  description: 'Compite, conecta y gana como el mejor hincha de tu equipo. FanHub: la red social gamificada del deporte chileno.',
  keywords: 'fútbol, hinchas, gamificación, Chile, Primera División, clanes, ranking',
  openGraph: {
    title: 'FanHub — Red Social para Hinchas',
    description: 'Compite por ser el mejor hincha de tu equipo',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
