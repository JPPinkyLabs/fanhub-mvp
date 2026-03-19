import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, requireAuth } from '@/lib/permissions';
import { Role } from '@prisma/client';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      _count: { select: { fans: true, clans: true } },
      clans: {
        where: { status: 'ACTIVE' },
        select: { id: true, name: true, _count: { select: { memberships: true } } },
        take: 10,
      },
    },
  });

  if (!team) return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });
  return NextResponse.json({ data: team });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole([Role.SUPER_ADMIN, Role.COUNTRY_MANAGER, Role.SPORT_MANAGER]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json() as {
    name?: string; shortName?: string; city?: string;
    stadiumName?: string; logoUrl?: string; active?: boolean; primaryColor?: string;
  };

  const team = await prisma.team.update({ where: { id }, data: body });
  return NextResponse.json({ data: team });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole([Role.SUPER_ADMIN]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  await prisma.team.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ message: 'Equipo desactivado' });
}
