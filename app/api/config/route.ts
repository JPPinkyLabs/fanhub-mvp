import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, requireAuth } from '@/lib/permissions';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { invalidateConfigCache } from '@/lib/config';

const createConfigSchema = z.object({
  key: z.string().min(2),
  value: z.unknown(),
  scope: z.enum(['GLOBAL', 'COUNTRY', 'SPORT']).default('GLOBAL'),
  description: z.string().optional(),
  editableByRole: z.nativeEnum(Role).default(Role.SUPER_ADMIN),
  dataType: z.enum(['number', 'string', 'boolean', 'json']).default('number'),
});

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get('scope');
  const search = searchParams.get('search') ?? '';

  const configs = await prisma.appConfig.findMany({
    where: {
      ...(scope && { scope: scope as 'GLOBAL' | 'COUNTRY' | 'SPORT' }),
      ...(search && { key: { contains: search, mode: 'insensitive' } }),
    },
    orderBy: [{ scope: 'asc' }, { key: 'asc' }],
  });

  return NextResponse.json({ data: configs });
}

export async function POST(req: Request) {
  const auth = await requireRole([Role.SUPER_ADMIN]);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json() as unknown;
  const parsed = createConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const config = await prisma.appConfig.create({
    data: {
      key: parsed.data.key,
      value: (parsed.data.value ?? 0) as object,
      scope: parsed.data.scope,
      description: parsed.data.description,
      editableByRole: parsed.data.editableByRole,
      dataType: parsed.data.dataType,
      updatedBy: auth.id,
    },
  });

  return NextResponse.json({ data: config }, { status: 201 });
}
