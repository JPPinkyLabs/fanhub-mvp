import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, requireAuth } from '@/lib/permissions';
import { Role } from '@prisma/client';
import { getUserTotalScore } from '@/lib/scoring';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      team: true,
      userBadges: { include: { badge: true } },
      clanMemberships: {
        where: { status: 'ACTIVE' },
        include: { clan: { include: { team: { select: { name: true } } } } },
      },
    },
  });

  if (!user) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const totalScore = await getUserTotalScore(id);
  const { passwordHash: _, ...safeUser } = user;

  return NextResponse.json({ data: { ...safeUser, totalScore } });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole([Role.SUPER_ADMIN, Role.COUNTRY_MANAGER]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json() as { role?: Role; tier?: string; teamId?: string };

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(body.role && { role: body.role }),
      ...(body.tier && { tier: body.tier as 'FREE' | 'PREMIUM' | 'PLATINUM' }),
      ...(body.teamId !== undefined && { teamId: body.teamId }),
    },
    select: { id: true, email: true, name: true, role: true, tier: true },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole([Role.SUPER_ADMIN]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ message: 'Usuario eliminado' });
}
