import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import { calcContentPostScore, recordScore } from '@/lib/scoring';
import { getConfig, CONFIG_KEYS } from '@/lib/config';
import { z } from 'zod';

const createContentSchema = z.object({
  title: z.string().min(3).max(120),
  body: z.string().min(10).max(2000),
  mediaUrl: z.string().url().optional(),
});

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

  const [contents, total] = await Promise.all([
    prisma.userContent.findMany({
      where: { userId: auth.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.userContent.count({ where: { userId: auth.id } }),
  ]);

  return NextResponse.json({ data: contents, total, page, pageSize });
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json() as unknown;
  const parsed = createContentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Check daily limit from AppConfig
  const maxPerDay = await getConfig<number>(CONFIG_KEYS.CONTENT_POST_MAX_DAILY, 3);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayCount = await prisma.userContent.count({
    where: {
      userId: auth.id,
      createdAt: { gte: startOfDay },
    },
  });

  // Create content regardless — only award points up to daily limit
  const earnedPoints = todayCount < maxPerDay;

  const user = await prisma.user.findUnique({ where: { id: auth.id } });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const scoreResult = earnedPoints ? await calcContentPostScore(user.tier) : null;

  const content = await prisma.userContent.create({
    data: {
      userId: auth.id,
      title: parsed.data.title,
      body: parsed.data.body,
      mediaUrl: parsed.data.mediaUrl,
      pointsAwarded: scoreResult?.points ?? 0,
    },
  });

  if (scoreResult) {
    await recordScore(
      auth.id,
      scoreResult,
      'CONTENT_POST',
      content.id,
      `Publicación: ${parsed.data.title}`,
    );
  }

  return NextResponse.json({
    data: content,
    pointsAwarded: scoreResult?.points ?? 0,
    message: earnedPoints
      ? `¡Ganaste ${Math.round(scoreResult!.points)} pts por tu publicación!`
      : `Publicación creada (límite diario de ${maxPerDay} publicaciones con puntaje alcanzado)`,
  }, { status: 201 });
}
