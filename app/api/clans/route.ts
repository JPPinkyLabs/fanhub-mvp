import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import { z } from 'zod';

const createClanSchema = z.object({
  name: z.string().min(3).max(50),
  teamId: z.string(),
  description: z.string().max(500).optional(),
  emblemConfig: z.record(z.unknown()).optional(),
});

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  const search = searchParams.get('search') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

  const where = {
    ...(teamId && { teamId }),
    ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
    status: 'ACTIVE' as const,
  };

  const [clans, total] = await Promise.all([
    prisma.clan.findMany({
      where,
      include: {
        team: { select: { name: true, shortName: true, logoUrl: true } },
        _count: { select: { memberships: true } },
      },
      orderBy: { foundedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.clan.count({ where }),
  ]);

  return NextResponse.json({ data: clans, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json() as unknown;
  const parsed = createClanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Verificar que el nombre no esté duplicado
  const existing = await prisma.clan.findUnique({ where: { name: parsed.data.name } });
  if (existing) {
    return NextResponse.json({ error: 'Ya existe un clan con ese nombre' }, { status: 409 });
  }

  // Verificar que el usuario pertenece al equipo
  const user = await prisma.user.findUnique({ where: { id: auth.id } });
  if (user?.teamId !== parsed.data.teamId) {
    return NextResponse.json({ error: 'Solo puedes crear un clan de tu equipo principal' }, { status: 403 });
  }

  // Crear clan y agregar al creador como FOUNDER
  const clan = await prisma.clan.create({
    data: {
      name: parsed.data.name,
      teamId: parsed.data.teamId,
      description: parsed.data.description,
      emblemConfig: (parsed.data.emblemConfig ?? {}) as object,
      status: 'PENDING',
      memberships: {
        create: {
          userId: auth.id,
          role: 'FOUNDER',
          status: 'ACTIVE',
        },
      },
    },
    include: {
      team: true,
      _count: { select: { memberships: true } },
    },
  });

  return NextResponse.json({ data: clan }, { status: 201 });
}
