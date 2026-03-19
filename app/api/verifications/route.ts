import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/permissions';
import { Role } from '@prisma/client';
import { createVerification } from '@/lib/verification';
import { z } from 'zod';

const createVerificationSchema = z.object({
  type: z.enum(['LOCAL_ATTENDANCE', 'AWAY_ATTENDANCE', 'INTL_ATTENDANCE', 'MEMBERSHIP', 'SEASON_PASS']),
  matchId: z.string().optional(),
  geoLat: z.number().optional(),
  geoLng: z.number().optional(),
  evidenceUrl: z.string().url().optional(),
});

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const userId = searchParams.get('userId');
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

  // Role-based visibility
  const isSuperAdmin = ['SUPER_ADMIN', 'COUNTRY_MANAGER', 'SPORT_MANAGER'].includes(auth.role);
  const isClubManager = auth.role === 'CLUB_MANAGER';
  const isAdmin = isSuperAdmin || isClubManager;

  // Club Manager: only see verifications from users in their team
  let clubTeamId: string | null = null;
  if (isClubManager) {
    const team = await prisma.team.findFirst({ where: { clubManagerId: auth.id } });
    clubTeamId = team?.id ?? null;
  }

  const where = {
    ...(!isAdmin && { userId: auth.id }),
    ...(isSuperAdmin && userId && { userId }),
    ...(isClubManager && clubTeamId && { user: { teamId: clubTeamId } }),
    ...(isClubManager && userId && { userId }),
    ...(status && { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' }),
  };

  const [verifications, total] = await Promise.all([
    prisma.verification.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        match: {
          include: {
            homeTeam: { select: { name: true, shortName: true } },
            awayTeam: { select: { name: true, shortName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.verification.count({ where }),
  ]);

  return NextResponse.json({ data: verifications, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json() as unknown;
  const parsed = createVerificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: auth.id } });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const result = await createVerification({ ...parsed.data, userId: auth.id }, user.tier);

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ data: result }, { status: 201 });
}
