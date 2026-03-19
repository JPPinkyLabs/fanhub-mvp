import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/permissions';
import { Role } from '@prisma/client';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: {
      _count: { select: { participations: true } },
      participations: { where: { userId: auth.id }, take: 1 },
    },
  });

  if (!challenge) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json({ data: challenge });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole([Role.SUPER_ADMIN, Role.COUNTRY_MANAGER, Role.SPORT_MANAGER, Role.CLUB_MANAGER]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json() as { status?: string; bonusPct?: number; title?: string; description?: string };

  const challenge = await prisma.challenge.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status as 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' }),
      ...(body.bonusPct !== undefined && { bonusPct: body.bonusPct }),
      ...(body.title && { title: body.title }),
      ...(body.description && { description: body.description }),
    },
  });

  return NextResponse.json({ data: challenge });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole([Role.SUPER_ADMIN]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  await prisma.challenge.delete({ where: { id } });
  return NextResponse.json({ message: 'Desafío eliminado' });
}
