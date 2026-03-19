'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Role } from '@prisma/client';

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: '🏠' },
  { href: '/ranking', label: 'Ranking', icon: '🏆' },
  { href: '/clans', label: 'Clanes', icon: '🛡️' },
  { href: '/challenges', label: 'Desafíos', icon: '⚡' },
  { href: '/badges', label: 'Badges', icon: '🎖️' },
  { href: '/verification', label: 'Verificar', icon: '✅' },
  { href: '/content', label: 'Publicar', icon: '📝' },
  { href: '/profile', label: 'Mi Perfil', icon: '👤' },
];

const adminItems = [
  { href: '/admin', label: 'Panel Admin', icon: '⚙️' },
];

const clubManagerItems = [
  { href: '/admin', label: 'Mi Club', icon: '🏟️' },
  { href: '/admin/challenges', label: 'Activaciones', icon: '⚡' },
];

const adminRoles: Role[] = [Role.SUPER_ADMIN, Role.COUNTRY_MANAGER, Role.SPORT_MANAGER, Role.CLUB_MANAGER];

export default function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const isClubManager = role === Role.CLUB_MANAGER;
  const currentAdminItems = isClubManager ? clubManagerItems : adminItems;

  return (
    <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-surface-card border-r border-surface-border z-40">
      {/* Logo */}
      <div className="p-5 border-b border-surface-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-label="FanHub">
            <circle cx="16" cy="16" r="15" fill="#39ff14" fillOpacity="0.1" stroke="#39ff14" strokeWidth="1.5"/>
            <polygon points="16,6 20,13 28,14 22,20 24,28 16,24 8,28 10,20 4,14 12,13" fill="none" stroke="#39ff14" strokeWidth="1.5" strokeLinejoin="round"/>
            <circle cx="16" cy="16" r="3" fill="#39ff14"/>
          </svg>
          <span className="font-black text-lg text-white">Fan<span className="text-brand-500">Hub</span></span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-surface-elevated',
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        {adminRoles.includes(role) && (
          <>
            <div className="pt-4 pb-1">
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider px-3">
                {isClubManager ? 'Mi Club' : 'Administración'}
              </p>
            </div>
            {currentAdminItems.map((item) => {
              const active = item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-brand-600/20 text-brand-400 border border-brand-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-surface-elevated',
                  )}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-surface-border">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-surface-elevated transition-colors"
        >
          <span>🚪</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
