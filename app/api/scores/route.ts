import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import { getUserTotalScore } from '@/lib/scoring';

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') ?? auth.id;
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

  // Solo admin puede ver los scores de otros usuarios
  const isAdmin = ['SUPER_ADMIN', 'COUNTRY_MANAGER', 'SPORT_MANAGER'].includes(auth.role);
  const targetUserId = (isAdmin || userId === auth.id) ? userId : auth.id;

  const [scores, total, totalPoints] = await Promise.all([
    prisma.score.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.score.count({ where: { userId: targetUserId } }),
    getUserTotalScore(targetUserId),
  ]);

  return NextResponse.json({
    data: scores,
    total,
    totalPoints,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
