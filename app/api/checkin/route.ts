import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import { calcDailyCheckinScore, recordScore } from '@/lib/scoring';

export async function POST() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  // Check if already checked in today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existing = await prisma.score.findFirst({
    where: {
      userId: auth.id,
      sourceType: 'CHECKIN',
      createdAt: { gte: today, lt: tomorrow },
    },
  });

  if (existing) {
    return NextResponse.json({ data: { alreadyCheckedIn: true, points: 0 } });
  }

  const user = await prisma.user.findUnique({ where: { id: auth.id } });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const scoreResult = await calcDailyCheckinScore(user.tier);
  await recordScore(auth.id, scoreResult, 'CHECKIN', undefined, 'Check-in diario');

  return NextResponse.json({
    data: { alreadyCheckedIn: false, points: scoreResult.points },
  });
}
