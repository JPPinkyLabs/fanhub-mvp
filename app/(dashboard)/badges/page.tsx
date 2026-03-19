'use client';

import { useState, useEffect } from 'react';
import { badgeRarityColor } from '@/lib/utils';

interface Badge {
  id: string;
  name: string;
  description: string;
  rarity: string;
  iconEmoji: string | null;
  _count: { userBadges: number };
  earned: boolean;
}

const RARITIES = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'];
const RARITY_LABELS: Record<string, string> = {
  COMMON: 'Común',
  RARE: 'Raro',
  EPIC: 'Épico',
  LEGENDARY: 'Legendario',
};

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [rarityFilter, setRarityFilter] = useState('');
  const [earnedFilter, setEarnedFilter] = useState('');

  useEffect(() => {
    fetch('/api/badges')
      .then((r) => r.json())
      .then((d: { data: Badge[] }) => {
        setBadges(d.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = badges.filter((b) => {
    if (rarityFilter && b.rarity !== rarityFilter) return false;
    if (earnedFilter === 'earned' && !b.earned) return false;
    if (earnedFilter === 'locked' && b.earned) return false;
    return true;
  });

  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Badges</h1>
        <p className="text-gray-500 text-sm mt-1">
          {earnedCount} de {badges.length} desbloqueados
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={rarityFilter}
          onChange={(e) => setRarityFilter(e.target.value)}
          className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
        >
          <option value="">Todas las rarezas</option>
          {RARITIES.map((r) => (
            <option key={r} value={r}>{RARITY_LABELS[r]}</option>
          ))}
        </select>
        <select
          value={earnedFilter}
          onChange={(e) => setEarnedFilter(e.target.value)}
          className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
        >
          <option value="">Todos</option>
          <option value="earned">Desbloqueados</option>
          <option value="locked">Bloqueados</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-600">Cargando badges...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600">No hay badges con estos filtros.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((badge) => (
            <div
              key={badge.id}
              className={`bg-surface-card border rounded-xl p-5 text-center transition-colors ${
                badge.earned
                  ? 'border-brand-500/40 bg-brand-500/5'
                  : 'border-surface-border opacity-60'
              }`}
            >
              <div className="text-4xl mb-3 relative">
                {badge.iconEmoji ?? '🎖️'}
                {!badge.earned && (
                  <span className="absolute -bottom-1 -right-1 text-base">🔒</span>
                )}
              </div>
              <p className="font-bold text-sm mb-1 leading-tight">{badge.name}</p>
              <p className="text-xs text-gray-500 mb-2 leading-tight line-clamp-2">{badge.description}</p>
              <p className={`text-xs font-semibold ${badgeRarityColor(badge.rarity)}`}>
                {RARITY_LABELS[badge.rarity] ?? badge.rarity}
              </p>
              <p className="text-xs text-gray-600 mt-1">{badge._count.userBadges} usuarios</p>
              {badge.earned && (
                <p className="text-xs text-brand-400 font-semibold mt-2">✓ Desbloqueado</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
