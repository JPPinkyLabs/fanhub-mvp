import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, requireAuth } from '@/lib/permissions';
import { Role } from '@prisma/client';
import { z } from 'zod';

const createTeamSchema = z.object({
  name: z.string().min(2),
  shortName: z.string().min(2).max(10),
  city: z.string().min(2),
  stadiumName: z.string().min(2),
  stadiumLat: z.number(),
  stadiumLng: z.number(),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().optional(),
  country: z.string().default('CL'),
  sport: z.string().default('football'),
});

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const teams = await prisma.team.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      shortName: true,
      city: true,
      stadiumName: true,
      stadiumLat: true,
      stadiumLng: true,
      logoUrl: true,
      primaryColor: true,
      country: true,
      sport: true,
      competition: true,
      _count: { select: { fans: true, clans: true } },
    },
  });

  return NextResponse.json({ data: teams });
}

export async function POST(req: Request) {
  const auth = await requireRole([Role.SUPER_ADMIN, Role.COUNTRY_MANAGER, Role.SPORT_MANAGER]);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json() as unknown;
  const parsed = createTeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const team = await prisma.team.create({ data: parsed.data });
  return NextResponse.json({ data: team }, { status: 201 });
}
