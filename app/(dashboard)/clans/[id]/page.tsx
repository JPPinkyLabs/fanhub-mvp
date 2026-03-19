'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { cn, formatPoints, tierColor } from '@/lib/utils';

interface Clan {
  id: string; name: string; description: string | null;
  status: string; maxMembers: number; foundedAt: string;
  team: { name: string; shortName: string };
  memberships: Array<{
    role: string; user: { id: string; name: string | null; image: string | null; tier: string };
  }>;
  _count: { memberships: number };
}

export default function ClanDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const id = params.id as string;

  const [clan, setClan] = useState<Clan | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch(`/api/clans/${id}`);
    const data = await res.json() as { data: Clan };
    setClan(data.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const myMembership = clan?.memberships.find((m) => m.user.id === session?.user.id);

  const handleJoin = async () => {
    setJoining(true);
    const res = await fetch(`/api/clans/${id}/members`, { method: 'POST' });
    const body = await res.json() as { error?: string };
    if (!res.ok) { setMessage(body.error ?? 'Error'); }
    else { await load(); }
    setJoining(false);
  };

  const handleLeave = async () => {
    setLeaving(true);
    const res = await fetch(`/api/clans/${id}/members`, { method: 'DELETE' });
    const body = await res.json() as { error?: string };
    if (!res.ok) { setMessage(body.error ?? 'Error'); }
    else { await load(); }
    setLeaving(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-600">Cargando clan...</div>;
  if (!clan) return <div className="p-8 text-center text-gray-600">Clan no encontrado.</div>;

  const isFull = clan._count.memberships >= clan.maxMembers;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black">{clan.name}</h1>
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', isFull ? 'bg-red-500/10 text-red-400' : 'bg-brand-500/10 text-brand-400')}>
                {isFull ? 'Lleno' : 'Abierto'}
              </span>
            </div>
            <p className="text-gray-500 text-sm">⚽ {clan.team.name}</p>
            {clan.description && <p className="text-sm text-gray-400 mt-2">{clan.description}</p>}
          </div>

          <div className="text-right">
            <div className="text-2xl font-black text-brand-400">{clan._count.memberships}/{clan.maxMembers}</div>
            <div className="text-xs text-gray-500">miembros</div>
          </div>
        </div>

        {message && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{message}</div>
        )}

        {/* Join/Leave button */}
        <div className="mt-5 pt-5 border-t border-surface-border">
          {myMembership ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-brand-400 font-semibold">
                ✅ Eres {myMembership.role === 'FOUNDER' ? 'Fundador' : myMembership.role === 'ADMIN' ? 'Admin' : 'Miembro'}
              </span>
              {myMembership.role !== 'FOUNDER' && (
                <button onClick={handleLeave} disabled={leaving} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
                  {leaving ? 'Saliendo...' : 'Abandonar clan'}
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleJoin}
              disabled={joining || isFull}
              className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
            >
              {joining ? 'Uniéndose...' : isFull ? 'Clan lleno' : 'Unirse al clan'}
            </button>
          )}
        </div>
      </div>

      {/* Members */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-5">
        <h2 className="font-bold mb-4">Miembros ({clan._count.memberships})</h2>
        <div className="space-y-2">
          {clan.memberships.map((m) => (
            <div key={m.user.id} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-xs font-bold">
                  {(m.user.name ?? '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{m.user.name ?? 'Anónimo'}</p>
                  <p className={cn('text-xs', tierColor(m.user.tier))}>{m.user.tier}</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {m.role === 'FOUNDER' ? '👑 Fundador' : m.role === 'ADMIN' ? '⚙️ Admin' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
