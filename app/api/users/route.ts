import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/permissions';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  role: z.nativeEnum(Role).optional(),
  teamId: z.string().optional(),
});

export async function GET(req: Request) {
  const auth = await requireRole([Role.SUPER_ADMIN, Role.COUNTRY_MANAGER, Role.SPORT_MANAGER, Role.CLUB_MANAGER]);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');
  const search = searchParams.get('search') ?? '';
  const teamIdParam = searchParams.get('teamId');

  // Club Manager: auto-scope to their team
  let effectiveTeamId: string | undefined = teamIdParam ?? undefined;
  if (auth.role === Role.CLUB_MANAGER) {
    const team = await prisma.team.findFirst({ where: { clubManagerId: auth.id } });
    effectiveTeamId = team?.id ?? undefined;
  }

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(effectiveTeamId && { teamId: effectiveTeamId }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        tier: true,
        teamId: true,
        createdAt: true,
        team: { select: { name: true, shortName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    data: users,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: Request) {
  const auth = await requireRole([Role.SUPER_ADMIN, Role.COUNTRY_MANAGER]);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json() as unknown;
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, name, password, role, teamId } = parsed.data;

  // CLUB_MANAGER requires a teamId
  if (role === Role.CLUB_MANAGER) {
    if (!teamId) {
      return NextResponse.json({ error: 'El equipo es obligatorio para el rol Club Manager' }, { status: 400 });
    }
    // Check the team doesn't already have a club manager
    const existingTeam = await prisma.team.findUnique({ where: { id: teamId } });
    if (!existingTeam) {
      return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });
    }
    if (existingTeam.clubManagerId) {
      return NextResponse.json({ error: 'Este equipo ya tiene un Club Manager asignado' }, { status: 409 });
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: role ?? Role.USER,
      teamId,
    },
  });

  // Assign club manager to team
  if (role === Role.CLUB_MANAGER && teamId) {
    await prisma.team.update({
      where: { id: teamId },
      data: { clubManagerId: user.id },
    });
  }

  const { passwordHash: _, ...userWithoutPassword } = user;
  return NextResponse.json({ data: userWithoutPassword }, { status: 201 });
}
