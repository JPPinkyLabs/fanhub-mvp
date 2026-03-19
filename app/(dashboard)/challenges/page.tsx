'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Challenge {
  id: string; type: string; title: string; description: string;
  bonusPct: number; startDate: string; endDate: string; status: string;
  _count: { participations: number };
  participations: { completed: boolean }[];
}

const typeColors: Record<string, string> = {
  INTERNAL: 'text-brand-400 bg-brand-400/10',
  CLUB: 'text-blue-400 bg-blue-400/10',
  BRAND: 'text-orange-400 bg-orange-400/10',
};

const typeLabels: Record<string, string> = {
  INTERNAL: 'FanHub',
  CLUB: 'Club',
  BRAND: 'Marca',
};

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/challenges?status=ACTIVE')
      .then((r) => r.json())
      .then((d: { data: Challenge[] }) => { setChallenges(d.data); setLoading(false); });
  }, []);

  const handleJoin = async (id: string) => {
    setJoining(id);
    await fetch(`/api/challenges/${id}/participate`, { method: 'POST' });
    // Refresh
    const res = await fetch('/api/challenges?status=ACTIVE');
    const data = await res.json() as { data: Challenge[] };
    setChallenges(data.data);
    setJoining(null);
  };

  if (loading) return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-black mb-6">Desafíos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface-card border border-surface-border rounded-xl p-5 animate-pulse">
            <div className="h-4 bg-surface-elevated rounded w-1/3 mb-3" />
            <div className="h-5 bg-surface-elevated rounded w-2/3 mb-2" />
            <div className="h-3 bg-surface-elevated rounded w-full" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-black mb-2">Desafíos</h1>
      <p className="text-gray-500 text-sm mb-8">Completa desafíos para ganar puntos extra</p>

      {challenges.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <p className="text-4xl mb-4">⚡</p>
          <p className="font-semibold">No hay desafíos activos</p>
          <p className="text-sm mt-1">¡Vuelve pronto para nuevas activaciones!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map((c) => {
            const participating = c.participations.length > 0;
            const daysLeft = Math.ceil((new Date(c.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

            return (
              <div key={c.id} className="bg-surface-card border border-surface-border rounded-xl p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', typeColors[c.type] ?? 'text-gray-400 bg-gray-400/10')}>
                    {typeLabels[c.type] ?? c.type}
                  </span>
                  {c.bonusPct > 0 && (
                    <span className="text-xs text-orange-400 font-semibold">+{c.bonusPct}% bonus</span>
                  )}
                </div>

                <h3 className="font-bold mb-2">{c.title}</h3>
                <p className="text-sm text-gray-400 mb-4 flex-1">{c.description}</p>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>👥 {c._count.participations} participantes</span>
                  <span className={cn(daysLeft <= 3 ? 'text-red-400' : 'text-gray-500')}>
                    ⏱️ {daysLeft > 0 ? `${daysLeft} días` : 'Termina hoy'}
                  </span>
                </div>

                {participating ? (
                  <div className="w-full bg-brand-600/10 border border-brand-500/30 text-brand-400 text-sm font-semibold py-2 rounded-lg text-center">
                    ✅ Participando
                  </div>
                ) : (
                  <button
                    onClick={() => handleJoin(c.id)}
                    disabled={joining === c.id}
                    className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
                  >
                    {joining === c.id ? 'Uniéndose...' : 'Participar'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
