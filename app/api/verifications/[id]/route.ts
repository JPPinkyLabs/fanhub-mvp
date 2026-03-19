import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/permissions';
import { approveVerification } from '@/lib/verification';
import { Role } from '@prisma/client';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole([Role.SUPER_ADMIN, Role.COUNTRY_MANAGER, Role.SPORT_MANAGER, Role.CLUB_MANAGER]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const v = await prisma.verification.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, tier: true } },
      match: { include: { homeTeam: true, awayTeam: true } },
    },
  });

  if (!v) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
  return NextResponse.json({ data: v });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole([Role.SUPER_ADMIN, Role.COUNTRY_MANAGER, Role.SPORT_MANAGER, Role.CLUB_MANAGER]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json() as { action: 'approve' | 'reject'; reviewNote?: string };

  if (body.action === 'approve') {
    const result = await approveVerification(id, auth.id);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
    return NextResponse.json({ data: result });
  }

  if (body.action === 'reject') {
    const v = await prisma.verification.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedBy: auth.id,
        reviewNote: body.reviewNote,
      },
    });
    return NextResponse.json({ data: v });
  }

  return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
}
