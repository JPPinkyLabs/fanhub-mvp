import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import { getUserTotalScore } from '@/lib/scoring';

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const user = await prisma.user.findUnique({
    where: { id: auth.id },
    include: {
      team: true,
      userBadges: { include: { badge: true } },
      clanMemberships: {
        where: { status: 'ACTIVE' },
        include: { clan: { include: { team: true } } },
        take: 1,
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const totalScore = await getUserTotalScore(auth.id);

  return NextResponse.json({ data: { ...user, totalScore } });
}

export async function PATCH(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json() as { name?: string; bio?: string; city?: string; teamId?: string; activeBadges?: string[] };

  const updated = await prisma.user.update({
    where: { id: auth.id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.bio !== undefined && { bio: body.bio }),
      ...(body.city !== undefined && { city: body.city }),
      ...(body.teamId && { teamId: body.teamId }),
      ...(body.activeBadges && { activeBadges: body.activeBadges }),
    },
  });

  return NextResponse.json({ data: updated });
}
