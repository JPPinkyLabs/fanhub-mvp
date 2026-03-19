import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getUserTotalScore } from '@/lib/scoring';
import { formatPoints, tierLabel, tierColor } from '@/lib/utils';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      team: true,
      userBadges: { include: { badge: true }, take: 5 },
      clanMemberships: {
        where: { status: 'ACTIVE' },
        include: { clan: { include: { team: { select: { name: true } } } } },
        take: 1,
      },
    },
  });

  if (!user) redirect('/login');

  // Redirigir a onboarding si no tiene equipo
  if (!user.teamId) redirect('/settings');

  const [totalScore, recentScores, pendingVerifications, upcomingMatches] = await Promise.all([
    getUserTotalScore(session.user.id),
    prisma.score.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.verification.count({
      where: { userId: session.user.id, status: 'PENDING' },
    }),
    prisma.match.findMany({
      where: { date: { gte: new Date() }, status: 'SCHEDULED' },
      include: {
        homeTeam: { select: { name: true, shortName: true } },
        awayTeam: { select: { name: true, shortName: true } },
      },
      orderBy: { date: 'asc' },
      take: 3,
    }),
  ]);

  // Calcular posición en el ranking del equipo
  const teamUsers = await prisma.user.findMany({ where: { teamId: user.teamId } });
  const teamScores = await Promise.all(
    teamUsers.map(async (u) => ({ id: u.id, pts: await getUserTotalScore(u.id) }))
  );
  teamScores.sort((a, b) => b.pts - a.pts);
  const userRank = teamScores.findIndex((s) => s.id === user.id) + 1;

  const activeBadges = user.userBadges.filter((ub) => user.activeBadges.includes(ub.badgeId));
  const clan = user.clanMemberships[0]?.clan;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black">¡Hola, {user.name?.split(' ')[0] ?? 'hincha'}! 👋</h1>
        <p className="text-gray-500 text-sm mt-1">
          {user.team ? `Hincha de ${user.team.name}` : 'Sin equipo asignado'}
          {' · '}
          <span className={tierColor(user.tier)}>{tierLabel(user.tier)}</span>
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Puntaje Total', value: formatPoints(totalScore), accent: true, href: '/ranking' },
          { label: 'Posición Equipo', value: `#${userRank}`, accent: false, href: '/ranking' },
          { label: 'Verificaciones', value: String(pendingVerifications), accent: false, href: '/verification', note: 'pendientes' },
          { label: 'Clan', value: clan?.name ?? '—', accent: false, href: '/clans' },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-surface-card border border-surface-border hover:border-brand-500/30 rounded-xl p-4 transition-colors"
          >
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className={`text-2xl font-black truncate ${stat.accent ? 'text-brand-400' : 'text-white'}`}>
              {stat.value}
            </p>
            {stat.note && <p className="text-xs text-gray-600">{stat.note}</p>}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Badges activos */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Mis Badges</h2>
            <Link href="/profile" className="text-xs text-brand-400 hover:text-brand-300">Ver todos</Link>
          </div>
          {activeBadges.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-4">
              Aún no tienes badges. ¡Verifica tu primera asistencia!
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeBadges.map((ub) => (
                <div
                  key={ub.badgeId}
                  className="flex items-center gap-2 bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-sm"
                  title={ub.badge.description}
                >
                  <span>{ub.badge.iconEmoji ?? '🎖️'}</span>
                  <span className="font-medium">{ub.badge.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Próximos partidos */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Próximos Partidos</h2>
            <Link href="/verification" className="text-xs text-brand-400 hover:text-brand-300">Verificar</Link>
          </div>
          {upcomingMatches.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-4">No hay partidos programados próximamente.</p>
          ) : (
            <div className="space-y-3">
              {upcomingMatches.map((match) => (
                <div key={match.id} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                  <div className="text-sm">
                    <span className="font-medium">{match.homeTeam.shortName}</span>
                    <span className="text-gray-500 mx-2">vs</span>
                    <span className="font-medium">{match.awayTeam.shortName}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(match.date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historial de puntaje */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Actividad Reciente</h2>
            <Link href="/profile" className="text-xs text-brand-400 hover:text-brand-300">Ver historial</Link>
          </div>
          {recentScores.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-4">
              Sin actividad aún.{' '}
              <Link href="/verification" className="text-brand-400">Verifica tu primera asistencia →</Link>
            </p>
          ) : (
            <div className="space-y-2">
              {recentScores.map((score) => (
                <div key={score.id} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{score.description ?? score.sourceType}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(score.createdAt).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  <span className="text-brand-400 font-bold">+{formatPoints(score.points)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
