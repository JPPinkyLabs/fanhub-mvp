import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getUserTotalScore } from '@/lib/scoring';
import { formatPoints, tierLabel, tierColor, badgeRarityColor } from '@/lib/utils';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      team: true,
      userBadges: { include: { badge: true } },
      clanMemberships: {
        where: { status: 'ACTIVE' },
        include: { clan: { include: { team: { select: { name: true } } } } },
      },
    },
  });

  if (!user) redirect('/login');

  const [totalScore, recentScores] = await Promise.all([
    getUserTotalScore(session.user.id),
    prisma.score.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Profile header */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-brand flex items-center justify-center text-3xl font-black text-white flex-shrink-0">
            {user.name?.charAt(0).toUpperCase() ?? '?'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h1 className="text-xl font-black">{user.name ?? 'Hincha'}</h1>
                <p className="text-gray-500 text-sm">{user.email}</p>
              </div>
              <Link href="/settings" className="text-xs text-brand-400 border border-brand-500/30 px-3 py-1.5 rounded-lg hover:bg-brand-500/10 transition-colors">
                Editar
              </Link>
            </div>

            <div className="flex flex-wrap gap-3 mt-3">
              <span className={`text-sm font-semibold ${tierColor(user.tier)}`}>
                {tierLabel(user.tier)}
              </span>
              {user.team && (
                <span className="text-sm text-gray-400">⚽ {user.team.name}</span>
              )}
              {user.city && (
                <span className="text-sm text-gray-400">📍 {user.city}</span>
              )}
              {user.clanMemberships[0] && (
                <span className="text-sm text-gray-400">🛡️ {user.clanMemberships[0].clan.name}</span>
              )}
            </div>

            {user.bio && <p className="text-sm text-gray-400 mt-2">{user.bio}</p>}
          </div>
        </div>

        {/* Score */}
        <div className="mt-5 pt-5 border-t border-surface-border">
          <div className="text-4xl font-black text-brand-400">{formatPoints(totalScore)}</div>
          <div className="text-sm text-gray-500">puntos totales</div>
        </div>
      </div>

      {/* Badges */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Badges ({user.userBadges.length})</h2>
          <span className="text-xs text-gray-600">Máximo 5 activos en perfil</span>
        </div>
        {user.userBadges.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-4">
            Aún no tienes badges. ¡Verifica asistencias y completa desafíos!
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {user.userBadges.map((ub) => {
              const isActive = user.activeBadges.includes(ub.badgeId);
              return (
                <div
                  key={ub.badgeId}
                  className={`border rounded-xl p-3 text-center transition-colors ${
                    isActive ? 'border-brand-500/50 bg-brand-500/5' : 'border-surface-border'
                  }`}
                >
                  <div className="text-2xl mb-1">{ub.badge.iconEmoji ?? '🎖️'}</div>
                  <p className="text-xs font-semibold truncate">{ub.badge.name}</p>
                  <p className={`text-xs mt-0.5 ${badgeRarityColor(ub.badge.rarity)}`}>
                    {ub.badge.rarity}
                  </p>
                  {isActive && <p className="text-xs text-brand-400 mt-1">Activo</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Score history */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-5">
        <h2 className="font-bold mb-4">Historial de Puntaje</h2>
        {recentScores.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-4">Sin actividad registrada.</p>
        ) : (
          <div className="space-y-2">
            {recentScores.map((score) => (
              <div key={score.id} className="flex items-center justify-between py-2.5 border-b border-surface-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{score.description ?? score.sourceType}</p>
                  <p className="text-xs text-gray-500">
                    {score.category} · {new Date(score.createdAt).toLocaleDateString('es-CL')}
                  </p>
                </div>
                <span className="text-brand-400 font-bold text-sm">+{formatPoints(score.points)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
