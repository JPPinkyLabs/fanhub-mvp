import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/permissions';
import { Role } from '@prisma/client';
import { invalidateConfigCache } from '@/lib/config';

export async function GET(
  _req: Request,
  { params }: { params: { key: string } },
) {
  const config = await prisma.appConfig.findUnique({ where: { key: params.key } });
  if (!config) return NextResponse.json({ error: 'Config no encontrada' }, { status: 404 });
  return NextResponse.json({ data: config });
}

export async function PATCH(
  req: Request,
  { params }: { params: { key: string } },
) {
  const auth = await requireRole([Role.SUPER_ADMIN, Role.COUNTRY_MANAGER, Role.SPORT_MANAGER]);
  if (auth instanceof NextResponse) return auth;

  const config = await prisma.appConfig.findUnique({ where: { key: params.key } });
  if (!config) return NextResponse.json({ error: 'Config no encontrada' }, { status: 404 });

  // Verificar que el rol puede editar esta config
  const roleHierarchy: Record<Role, number> = {
    SUPER_ADMIN: 6, COUNTRY_MANAGER: 5, SPORT_MANAGER: 4,
    CLUB_MANAGER: 3, CLAN_ADMIN: 2, USER: 1,
  };

  if (roleHierarchy[auth.role as Role] < roleHierarchy[config.editableByRole]) {
    return NextResponse.json({ error: 'No tienes permisos para editar esta configuración' }, { status: 403 });
  }

  const body = await req.json() as { value: unknown; description?: string };

  const updated = await prisma.appConfig.update({
    where: { key: params.key },
    data: { value: body.value as Parameters<typeof prisma.appConfig.update>[0]['data']['value'], description: body.description, updatedBy: auth.id },
  });

  // Invalidar cache
  invalidateConfigCache(params.key);

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { key: string } },
) {
  const auth = await requireRole([Role.SUPER_ADMIN]);
  if (auth instanceof NextResponse) return auth;

  await prisma.appConfig.delete({ where: { key: params.key } });
  invalidateConfigCache(params.key);

  return NextResponse.json({ message: 'Configuración eliminada' });
}
