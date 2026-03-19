import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/permissions';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { getConfig, CONFIG_KEYS } from '@/lib/config';

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
  const status = searchParams.get('status') ?? 'ACTIVE'; // 'ALL' = no status filter
  const type = searchParams.get('type');
  const teamId = searchParams.get('teamId');

  // For regular users: CLUB challenges only shown if they match user's teamId
  const isRegularUser = auth.role === Role.USER || auth.role === Role.CLAN_ADMIN;

  type ChallengeWhere = {
    status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    type?: 'INTERNAL' | 'CLUB' | 'BRAND';
    teamId?: string;
    createdBy?: string;
    OR?: Array<{ type?: 'INTERNAL' | 'CLUB' | 'BRAND'; teamId?: string | null }>;
  };

  // status=ALL means no status filter (admin wants to see everything)
  let where: ChallengeWhere = {};
  if (status !== 'ALL') {
    where.status = (status ?? 'ACTIVE') as 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  }

  // Club Manager: only see their own challenges
  if (auth.role === Role.CLUB_MANAGER) {
    where.createdBy = auth.id;
  }

  if (type) {
    where.type = type as 'INTERNAL' | 'CLUB' | 'BRAND';
    if (teamId) where.teamId = teamId;
  } else if (isRegularUser && auth.teamId) {
    // Show INTERNAL/BRAND to all + CLUB only for user's team
    where = {
      ...where,
      OR: [
        { type: 'INTERNAL' },
        { type: 'BRAND' },
        { type: 'CLUB', teamId: auth.teamId },
      ],
    };
  } else if (teamId) {
    where.teamId = teamId;
  }

  const challenges = await prisma.challenge.findMany({
    where,
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

  // CLUB_MANAGER: force CLUB type + auto-assign their team
  if (auth.role === Role.CLUB_MANAGER) {
    if (parsed.data.type !== 'CLUB') {
      return NextResponse.json({ error: 'Club Manager solo puede crear activaciones de club' }, { status: 403 });
    }

    const team = await prisma.team.findFirst({ where: { clubManagerId: auth.id } });
    if (!team) {
      return NextResponse.json({ error: 'No tienes un equipo asignado. Contacta a un administrador.' }, { status: 403 });
    }

    // Validate bonusPct range
    const [bonusMin, bonusMax] = await Promise.all([
      getConfig<number>(CONFIG_KEYS.ACTIVATION_BONUS_MIN_PCT, 0),
      getConfig<number>(CONFIG_KEYS.ACTIVATION_BONUS_MAX_PCT, 20),
    ]);
    if (parsed.data.bonusPct < bonusMin || parsed.data.bonusPct > bonusMax) {
      return NextResponse.json({
        error: `El bonus debe estar entre ${bonusMin}% y ${bonusMax}%`,
      }, { status: 400 });
    }

    // Monthly limit check
    const maxPerMonth = await getConfig<number>(CONFIG_KEYS.ACTIVATION_MAX_PER_MONTH, 4);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthCount = await prisma.challenge.count({
      where: {
        type: 'CLUB',
        createdBy: auth.id,
        createdAt: { gte: startOfMonth },
      },
    });

    if (thisMonthCount >= maxPerMonth) {
      return NextResponse.json({
        error: `Límite de activaciones mensuales alcanzado (máx ${maxPerMonth})`,
      }, { status: 429 });
    }

    const challenge = await prisma.challenge.create({
      data: {
        type: 'CLUB',
        title: parsed.data.title,
        description: parsed.data.description,
        conditionsJson: parsed.data.conditionsJson as object,
        rewardJson: parsed.data.rewardJson as object,
        bonusPct: parsed.data.bonusPct,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
        teamId: team.id,
        createdBy: auth.id,
      },
    });

    return NextResponse.json({ data: challenge }, { status: 201 });
  }

  // Other admin roles
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
