import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/permissions';
import { Role } from '@prisma/client';
import { z } from 'zod';

const createChallengeSchema = z.object({
  type: z.enum(['INTERNAL', 'CLUB', 'BRAND']),
  title: z.string().min(3).max(100),
  description: z.string().min(10),
  conditionsJson: z.record(z.unknown()).default({}),
  rewardJson: z.record(z.unknown()).default({}),
  bonusPct: z.number().min(0).max(20).default(0),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  teamId: z.string().optional(),
});

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'ACTIVE';
  const type = searchParams.get('type');
  const teamId = searchParams.get('teamId');

  const challenges = await prisma.challenge.findMany({
    where: {
      status: status as 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED',
      ...(type && { type: type as 'INTERNAL' | 'CLUB' | 'BRAND' }),
      ...(teamId && { teamId }),
    },
    include: {
      _count: { select: { participations: true } },
      participations: {
        where: { userId: auth.id },
        take: 1,
      },
    },
    orderBy: { startDate: 'asc' },
  });

  return NextResponse.json({ data: challenges });
}

export async function POST(req: Request) {
  const auth = await requireRole([
    Role.SUPER_ADMIN, Role.COUNTRY_MANAGER, Role.SPORT_MANAGER, Role.CLUB_MANAGER,
  ]);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json() as unknown;
  const parsed = createChallengeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // CLUB_MANAGER solo puede crear tipo CLUB
  if (auth.role === Role.CLUB_MANAGER && parsed.data.type !== 'CLUB') {
    return NextResponse.json({ error: 'Club Manager solo puede crear activaciones de club' }, { status: 403 });
  }

  const challenge = await prisma.challenge.create({
    data: {
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description,
      conditionsJson: parsed.data.conditionsJson as object,
      rewardJson: parsed.data.rewardJson as object,
      bonusPct: parsed.data.bonusPct,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      teamId: parsed.data.teamId,
      createdBy: auth.id,
    },
  });

  return NextResponse.json({ data: challenge }, { status: 201 });
}
