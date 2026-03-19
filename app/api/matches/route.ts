import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  const status = searchParams.get('status') ?? 'SCHEDULED';

  const where = {
    ...(status !== 'ALL' && { status }),
    ...(teamId && {
      OR: [
        { homeTeamId: teamId },
        { awayTeamId: teamId },
      ],
    }),
  };

  const matches = await prisma.match.findMany({
    where,
    include: {
      homeTeam: { select: { name: true, shortName: true } },
      awayTeam: { select: { name: true, shortName: true } },
    },
    orderBy: { date: 'desc' },
    take: 50,
  });

  return NextResponse.json({ data: matches });
}
