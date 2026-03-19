import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const challenge = await prisma.challenge.findUnique({ where: { id: params.id } });
  if (!challenge) return NextResponse.json({ error: 'Desafío no encontrado' }, { status: 404 });
  if (challenge.status !== 'ACTIVE') return NextResponse.json({ error: 'Desafío no está activo' }, { status: 400 });

  const existing = await prisma.challengeParticipation.findUnique({
    where: { challengeId_userId: { challengeId: params.id, userId: auth.id } },
  });

  if (existing) {
    return NextResponse.json({ error: 'Ya estás participando en este desafío' }, { status: 409 });
  }

  const participation = await prisma.challengeParticipation.create({
    data: {
      challengeId: params.id,
      userId: auth.id,
      progressJson: {},
    },
  });

  return NextResponse.json({ data: participation }, { status: 201 });
}
