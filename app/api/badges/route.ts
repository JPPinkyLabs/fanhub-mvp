import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/permissions';
import { Role } from '@prisma/client';
import { z } from 'zod';

const createBadgeSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  rarity: z.enum(['COMMON', 'RARE', 'EPIC', 'LEGENDARY']),
  conditionJson: z.record(z.unknown()).default({}),
  iconEmoji: z.string().optional(),
  iconUrl: z.string().url().optional(),
});

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const badges = await prisma.badge.findMany({
    orderBy: [{ rarity: 'desc' }, { name: 'asc' }],
    include: {
      _count: { select: { userBadges: true } },
    },
  });

  // Marcar cuáles tiene el usuario
  const userBadges = await prisma.userBadge.findMany({ where: { userId: auth.id } });
  const earnedIds = new Set(userBadges.map((ub) => ub.badgeId));

  const enriched = badges.map((b) => ({ ...b, earned: earnedIds.has(b.id) }));

  return NextResponse.json({ data: enriched });
}

export async function POST(req: Request) {
  const auth = await requireRole([Role.SUPER_ADMIN, Role.COUNTRY_MANAGER]);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json() as unknown;
  const parsed = createBadgeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const badge = await prisma.badge.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      rarity: parsed.data.rarity,
      conditionJson: parsed.data.conditionJson as object,
      iconEmoji: parsed.data.iconEmoji,
      iconUrl: parsed.data.iconUrl,
    },
  });
  return NextResponse.json({ data: badge }, { status: 201 });
}
