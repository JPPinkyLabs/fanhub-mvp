'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { formatPoints, tierColor, tierLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';

type RankingType = 'individual' | 'clan';
type Period = 'weekly' | 'monthly' | 'season';

interface RankingEntry {
  userId?: string; clanId?: string; name: string | null;
  image?: string | null; tier?: string; totalPoints: number; rank: number;
  teamId?: string | null; memberCount?: number; teamName?: string;
}

interface Team { id: string; name: string; shortName: string; }

export default function RankingPage() {
  const { data: session } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [type, setType] = useState<RankingType>('individual');
  const [period, setPeriod] = useState<Period>('season');
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/teams').then((r) => r.json()).then((d: { data: Team[] }) => {
      setTeams(d.data);
      if (session?.user.teamId) setSelectedTeam(session.user.teamId);
    });
  }, [session]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ type, period, pageSize: '50' });
    if (selectedTeam) params.set('teamId', selectedTeam);
    fetch(`/api/rankings?${params}`)
      .then((r) => r.json())
      .then((d: { data: RankingEntry[] }) => { setEntries(d.data); setLoading(false); });
  }, [type, period, selectedTeam]);

  const me = entries.find((e) => e.userId === session?.user.id);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-black mb-6">Ranking</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Team selector */}
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition-colors"
        >
          <option value="">Global</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        {/* Type toggle */}
        <div className="flex bg-surface-card border border-surface-border rounded-lg overflow-hidden">
          {(['individual', 'clan'] as RankingType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                type === t ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white',
              )}
            >
              {t === 'individual' ? 'Hinchas' : 'Clanes'}
            </button>
          ))}
        </div>

        {/* Period toggle */}
        <div className="flex bg-surface-card border border-surface-border rounded-lg overflow-hidden">
          {([['weekly', 'Semanal'], ['monthly', 'Mensual'], ['season', 'Temporada']] as [Period, string][]).map(([p, label]) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-3 py-2 text-sm font-medium transition-colors',
                period === p ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* My position banner */}
      {me && (
        <div className="bg-brand-600/10 border border-brand-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-brand-400">#{me.rank}</span>
            <div>
              <p className="font-semibold text-sm">Tu posición</p>
              <p className="text-xs text-gray-400">{formatPoints(me.totalPoints)} puntos</p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-surface-border text-xs text-gray-500 font-semibold">
          <div className="col-span-1">#</div>
          <div className="col-span-7">Nombre</div>
          {type === 'individual' && <div className="col-span-2 text-center">Tier</div>}
          {type === 'clan' && <div className="col-span-2 text-center">Miembros</div>}
          <div className="col-span-2 text-right">Puntos</div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-600">Cargando ranking...</div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center text-gray-600">Sin datos para este período.</div>
        ) : (
          entries.map((entry) => {
            const isMe = entry.userId === session?.user.id;
            return (
              <div
                key={entry.userId ?? entry.clanId}
                className={cn(
                  'grid grid-cols-12 gap-2 px-4 py-3 border-b border-surface-border last:border-0 items-center transition-colors',
                  isMe ? 'bg-brand-600/5' : 'hover:bg-surface-elevated',
                )}
              >
                <div className="col-span-1">
                  {entry.rank <= 3 ? (
                    <span className="text-lg">{['🥇', '🥈', '🥉'][entry.rank - 1]}</span>
                  ) : (
                    <span className="text-sm text-gray-500 font-mono">{entry.rank}</span>
                  )}
                </div>
                <div className="col-span-7 flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-surface-elevated flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {(entry.name ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-sm truncate">
                    {entry.name ?? 'Anónimo'}
                    {isMe && <span className="ml-1 text-brand-400 text-xs">(tú)</span>}
                  </span>
                </div>
                {type === 'individual' && (
                  <div className="col-span-2 text-center">
                    <span className={cn('text-xs font-semibold', tierColor(entry.tier ?? 'FREE'))}>
                      {tierLabel(entry.tier ?? 'FREE')}
                    </span>
                  </div>
                )}
                {type === 'clan' && (
                  <div className="col-span-2 text-center text-xs text-gray-500">
                    {entry.memberCount}
                  </div>
                )}
                <div className="col-span-2 text-right font-bold text-brand-400 text-sm">
                  {formatPoints(entry.totalPoints)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
