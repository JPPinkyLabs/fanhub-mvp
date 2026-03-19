import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/permissions';
import { Role } from '@prisma/client';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const clan = await prisma.clan.findUnique({
    where: { id: params.id },
    include: {
      team: true,
      memberships: {
        where: { status: 'ACTIVE' },
        include: {
          user: { select: { id: true, name: true, image: true, tier: true } },
        },
      },
      _count: { select: { memberships: true } },
    },
  });

  if (!clan) return NextResponse.json({ error: 'Clan no encontrado' }, { status: 404 });
  return NextResponse.json({ data: clan });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  // Verificar que el usuario es FOUNDER o ADMIN del clan
  const membership = await prisma.clanMembership.findUnique({
    where: { clanId_userId: { clanId: params.id, userId: auth.id } },
  });

  const isAdmin = ['SUPER_ADMIN', 'COUNTRY_MANAGER'].includes(auth.role);
  if (!membership || !['FOUNDER', 'ADMIN'].includes(membership.role)) {
    if (!isAdmin) {
      return NextResponse.json({ error: 'No tienes permisos para editar este clan' }, { status: 403 });
    }
  }

  const body = await req.json() as { description?: string; emblemConfig?: Record<string, unknown>; maxMembers?: number };

  const clan = await prisma.clan.update({
    where: { id: params.id },
    data: {
      ...(body.description !== undefined && { description: body.description }),
      ...(body.emblemConfig && { emblemConfig: body.emblemConfig as object }),
      ...(body.maxMembers && { maxMembers: body.maxMembers }),
    },
  });

  return NextResponse.json({ data: clan });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireRole([Role.SUPER_ADMIN]);
  if (auth instanceof NextResponse) return auth;

  await prisma.clan.update({
    where: { id: params.id },
    data: { status: 'DISSOLVED' },
  });

  return NextResponse.json({ message: 'Clan disuelto' });
}
