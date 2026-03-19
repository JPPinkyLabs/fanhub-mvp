'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface Clan {
  id: string; name: string; description: string | null;
  team: { name: string; shortName: string };
  _count: { memberships: number };
  maxMembers: number;
}

export default function ClansPage() {
  const { data: session } = useSession();
  const [clans, setClans] = useState<Clan[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ pageSize: '30' });
    if (search) params.set('search', search);
    if (session?.user.teamId) params.set('teamId', session.user.teamId);

    const timer = setTimeout(() => {
      fetch(`/api/clans?${params}`)
        .then((r) => r.json())
        .then((d: { data: Clan[] }) => { setClans(d.data); setLoading(false); });
    }, 300);

    return () => clearTimeout(timer);
  }, [search, session?.user.teamId]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Clanes</h1>
          <p className="text-gray-500 text-sm mt-1">Únete a un clan y compite en grupo</p>
        </div>
        <Link
          href="/clans/new"
          className="bg-brand-600 hover:bg-brand-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Crear clan
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar clanes..."
          className="w-full max-w-md bg-surface-card border border-surface-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface-card border border-surface-border rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-surface-elevated rounded w-2/3 mb-3" />
              <div className="h-3 bg-surface-elevated rounded w-full mb-2" />
              <div className="h-3 bg-surface-elevated rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : clans.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <p className="text-4xl mb-4">🛡️</p>
          <p className="font-semibold">No hay clanes aún</p>
          <p className="text-sm mt-1">¡Sé el primero en crear uno!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clans.map((clan) => {
            const full = clan._count.memberships >= clan.maxMembers;
            return (
              <Link
                key={clan.id}
                href={`/clans/${clan.id}`}
                className="bg-surface-card border border-surface-border hover:border-brand-500/30 rounded-xl p-5 transition-colors block"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold truncate">{clan.name}</h3>
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full ml-2 flex-shrink-0',
                    full ? 'bg-red-500/10 text-red-400' : 'bg-brand-500/10 text-brand-400',
                  )}>
                    {full ? 'Lleno' : 'Abierto'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                  {clan.description ?? 'Sin descripción'}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>⚽ {clan.team.name}</span>
                  <span>👥 {clan._count.memberships}/{clan.maxMembers}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
