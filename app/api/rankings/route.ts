import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import { getConfig, CONFIG_KEYS } from '@/lib/config';

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  const type = searchParams.get('type') ?? 'individual'; // individual | clan
  const period = searchParams.get('period') ?? 'season'; // weekly | monthly | season
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '50');

  // Calcular fecha de inicio según período
  const now = new Date();
  let startDate: Date | undefined;

  if (period === 'weekly') {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
  } else if (period === 'monthly') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  // 'season' = desde el inicio de los registros

  if (type === 'clan') {
    // Ranking de clanes
    const clanWhere = teamId ? { teamId, status: 'ACTIVE' as const } : { status: 'ACTIVE' as const };

    const clans = await prisma.clan.findMany({
      where: clanWhere,
      include: {
        team: { select: { name: true, shortName: true } },
        memberships: {
          where: { status: 'ACTIVE' },
          select: { userId: true },
        },
      },
    });

    // Calcular puntaje de cada clan
    const clanScores = await Promise.all(
      clans.map(async (clan) => {
        const memberIds = clan.memberships.map((m) => m.userId);
        const result = await prisma.score.aggregate({
          where: {
            userId: { in: memberIds },
            ...(startDate && { createdAt: { gte: startDate } }),
          },
          _sum: { points: true },
        });

        return {
          clanId: clan.id,
          name: clan.name,
          teamId: clan.teamId,
          teamName: clan.team.name,
          memberCount: memberIds.length,
          totalPoints: Math.round(result._sum.points ?? 0),
        };
      }),
    );

    // Filtrar clanes con mínimo de miembros activos
    const minMembers = await getConfig<number>(CONFIG_KEYS.CLAN_MIN_MEMBERS_ACTIVE, 3);
    const activeClanScores = clanScores.filter((c) => c.memberCount >= minMembers);

    // Ordenar por puntaje
    activeClanScores.sort((a, b) => b.totalPoints - a.totalPoints);

    const paginated = activeClanScores
      .slice((page - 1) * pageSize, page * pageSize)
      .map((entry, idx) => ({ ...entry, rank: (page - 1) * pageSize + idx + 1 }));

    return NextResponse.json({
      data: paginated,
      total: activeClanScores.length,
      page,
      pageSize,
      totalPages: Math.ceil(activeClanScores.length / pageSize),
    });
  }

  // Ranking individual
  const userWhere = teamId ? { teamId } : {};

  const users = await prisma.user.findMany({
    where: userWhere,
    select: {
      id: true,
      name: true,
      image: true,
      tier: true,
      teamId: true,
      activeBadges: true,
    },
  });

  const userScores = await Promise.all(
    users.map(async (user) => {
      const result = await prisma.score.aggregate({
        where: {
          userId: user.id,
          ...(startDate && { createdAt: { gte: startDate } }),
        },
        _sum: { points: true },
      });

      return {
        userId: user.id,
        name: user.name,
        image: user.image,
        tier: user.tier,
        teamId: user.teamId,
        activeBadges: user.activeBadges,
        totalPoints: Math.round(result._sum.points ?? 0),
      };
    }),
  );

  userScores.sort((a, b) => b.totalPoints - a.totalPoints);

  const paginated = userScores
    .slice((page - 1) * pageSize, page * pageSize)
    .map((entry, idx) => ({ ...entry, rank: (page - 1) * pageSize + idx + 1 }));

  return NextResponse.json({
    data: paginated,
    total: userScores.length,
    page,
    pageSize,
    totalPages: Math.ceil(userScores.length / pageSize),
  });
}
