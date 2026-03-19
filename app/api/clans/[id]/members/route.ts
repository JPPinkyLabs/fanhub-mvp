import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import { getConfig, CONFIG_KEYS } from '@/lib/config';

// POST: unirse a un clan
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const clan = await prisma.clan.findUnique({
    where: { id },
    include: { _count: { select: { memberships: true } } },
  });

  if (!clan) return NextResponse.json({ error: 'Clan no encontrado' }, { status: 404 });
  if (clan.status !== 'ACTIVE') return NextResponse.json({ error: 'Clan no está activo' }, { status: 400 });

  // Verificar límite de miembros
  if (clan._count.memberships >= clan.maxMembers) {
    return NextResponse.json({ error: 'El clan está lleno' }, { status: 400 });
  }

  // 1. Verificar si fue expulsado de este clan
  const expelled = await prisma.clanMembership.findFirst({
    where: { clanId: id, userId: auth.id, status: 'REMOVED' },
    orderBy: { leftAt: 'desc' },
  });
  if (expelled?.leftAt) {
    const cooldownExpelled = await getConfig<number>('clan.cooldown_expelled_days', 30);
    const daysSinceExpelled = (Date.now() - expelled.leftAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceExpelled < cooldownExpelled) {
      return NextResponse.json({
        error: `Fuiste expulsado de este clan. Puedes reingresar en ${Math.ceil(cooldownExpelled - daysSinceExpelled)} días.`,
      }, { status: 403 });
    }
  }

  // 2. Verificar cooldown si dejó voluntariamente el mismo clan
  const leftVoluntarily = await prisma.clanMembership.findFirst({
    where: { clanId: id, userId: auth.id, status: 'LEFT' },
    orderBy: { leftAt: 'desc' },
  });
  if (leftVoluntarily?.leftAt) {
    const cooldownSame = await getConfig<number>(CONFIG_KEYS.CLAN_COOLDOWN_SAME_DAYS, 10);
    const daysSinceLeft = (Date.now() - leftVoluntarily.leftAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLeft < cooldownSame) {
      return NextResponse.json({
        error: `Debes esperar ${Math.ceil(cooldownSame - daysSinceLeft)} días para reingresar a este clan.`,
      }, { status: 403 });
    }
  }

  // 3. Verificar máximo cambios de clan por mes
  const now = new Date();
  const maxChanges = await getConfig<number>(CONFIG_KEYS.CLAN_MAX_CHANGES_MONTH, 2);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const recentChanges = await prisma.clanMembership.count({
    where: {
      userId: auth.id,
      joinedAt: { gte: startOfMonth },
    },
  });
  if (recentChanges >= maxChanges) {
    return NextResponse.json({
      error: `Solo puedes cambiar de clan ${maxChanges} veces por mes.`,
    }, { status: 429 });
  }

  // Crear membresía
  const membership = await prisma.clanMembership.upsert({
    where: { clanId_userId: { clanId: id, userId: auth.id } },
    create: { clanId: id, userId: auth.id, role: 'MEMBER', status: 'ACTIVE' },
    update: { status: 'ACTIVE', leftAt: null, joinedAt: new Date() },
  });

  return NextResponse.json({ data: membership }, { status: 201 });
}

// DELETE: salir del clan
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const membership = await prisma.clanMembership.findUnique({
    where: { clanId_userId: { clanId: id, userId: auth.id } },
  });

  if (!membership || membership.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'No eres miembro de este clan' }, { status: 400 });
  }

  if (membership.role === 'FOUNDER') {
    return NextResponse.json({
      error: 'El fundador no puede abandonar el clan. Transfiere la fundación primero.',
    }, { status: 400 });
  }

  await prisma.clanMembership.update({
    where: { clanId_userId: { clanId: id, userId: auth.id } },
    data: { status: 'LEFT', leftAt: new Date() },
  });

  return NextResponse.json({ message: 'Has salido del clan' });
}
