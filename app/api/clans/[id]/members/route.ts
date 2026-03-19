import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import { getConfig, CONFIG_KEYS } from '@/lib/config';

// POST: unirse o invitar a un clan
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const clan = await prisma.clan.findUnique({
    where: { id: params.id },
    include: { _count: { select: { memberships: true } } },
  });

  if (!clan) return NextResponse.json({ error: 'Clan no encontrado' }, { status: 404 });
  if (clan.status !== 'ACTIVE') return NextResponse.json({ error: 'Clan no está activo' }, { status: 400 });

  // Verificar límite de miembros
  if (clan._count.memberships >= clan.maxMembers) {
    return NextResponse.json({ error: 'El clan está lleno' }, { status: 400 });
  }

  // Verificar cooldown: no puede reingresar al mismo clan dentro de N días
  const cooldownSameDays = await getConfig<number>(CONFIG_KEYS.CLAN_COOLDOWN_SAME_DAYS, 10);
  const lastMembership = await prisma.clanMembership.findFirst({
    where: { clanId: params.id, userId: auth.id, status: { in: ['REMOVED', 'LEFT'] } },
    orderBy: { leftAt: 'desc' },
  });

  if (lastMembership?.leftAt) {
    const daysSinceLeft = (Date.now() - lastMembership.leftAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLeft < cooldownSameDays) {
      return NextResponse.json(
        { error: `Debes esperar ${Math.ceil(cooldownSameDays - daysSinceLeft)} días para reingresar a este clan` },
        { status: 400 },
      );
    }
  }

  // Verificar cambios máximos de clan por mes
  const maxChanges = await getConfig<number>(CONFIG_KEYS.CLAN_MAX_CHANGES_MONTH, 2);
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const changesThisMonth = await prisma.clanMembership.count({
    where: {
      userId: auth.id,
      status: { in: ['LEFT', 'REMOVED'] },
      leftAt: { gte: thisMonth },
    },
  });

  if (changesThisMonth >= maxChanges) {
    return NextResponse.json({ error: 'Has alcanzado el límite de cambios de clan este mes' }, { status: 400 });
  }

  // Crear membresía
  const membership = await prisma.clanMembership.upsert({
    where: { clanId_userId: { clanId: params.id, userId: auth.id } },
    create: { clanId: params.id, userId: auth.id, role: 'MEMBER', status: 'ACTIVE' },
    update: { status: 'ACTIVE', leftAt: null, joinedAt: new Date() },
  });

  return NextResponse.json({ data: membership }, { status: 201 });
}

// DELETE: salir del clan
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const membership = await prisma.clanMembership.findUnique({
    where: { clanId_userId: { clanId: params.id, userId: auth.id } },
  });

  if (!membership || membership.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'No eres miembro de este clan' }, { status: 400 });
  }

  if (membership.role === 'FOUNDER') {
    return NextResponse.json({ error: 'El fundador no puede abandonar el clan. Transfiere la fundación primero.' }, { status: 400 });
  }

  await prisma.clanMembership.update({
    where: { clanId_userId: { clanId: params.id, userId: auth.id } },
    data: { status: 'LEFT', leftAt: new Date() },
  });

  return NextResponse.json({ message: 'Has salido del clan' });
}
