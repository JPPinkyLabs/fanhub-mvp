'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const items = [
  { href: '/dashboard', label: 'Inicio', icon: '🏠' },
  { href: '/ranking', label: 'Ranking', icon: '🏆' },
  { href: '/badges', label: 'Badges', icon: '🎖️' },
  { href: '/verification', label: 'Verificar', icon: '✅' },
  { href: '/content', label: 'Publicar', icon: '📝' },
  { href: '/profile', label: 'Perfil', icon: '👤' },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-surface-card border-t border-surface-border z-40">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors',
                active ? 'text-brand-400' : 'text-gray-600',
              )}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
