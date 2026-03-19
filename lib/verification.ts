/**
 * Lógica de verificación de asistencia
 */

import { prisma } from './db';
import { isWithinStadiumRadius } from './distance';
import { getConfig, CONFIG_KEYS } from './config';
import { VerificationType, VerificationStatus, Tier } from '@prisma/client';
import {
  calcLocalAttendanceScore,
  calcAwayAttendanceScore,
  calcIntlAttendanceScore,
  calcMembershipScore,
  calcSeasonPassScore,
  recordScore,
} from './scoring';

export interface VerificationRequest {
  userId: string;
  type: VerificationType;
  matchId?: string;
  geoLat?: number;
  geoLng?: number;
  evidenceUrl?: string;
}

export interface VerificationResult {
  success: boolean;
  message: string;
  verificationId?: string;
  pointsAwarded?: number;
}

/**
 * Verifica la proximidad geográfica al estadio
 */
export async function checkGeoProximity(
  userLat: number,
  userLng: number,
  stadiumLat: number,
  stadiumLng: number,
): Promise<boolean> {
  const radiusMeters = await getConfig<number>(CONFIG_KEYS.GEO_RADIUS_METERS, 500);
  return isWithinStadiumRadius(userLat, userLng, stadiumLat, stadiumLng, radiusMeters);
}

/**
 * Crea una verificación pendiente de revisión manual o auto-aprueba si pasa los checks.
 */
export async function createVerification(
  req: VerificationRequest,
  userTier: Tier,
): Promise<VerificationResult> {
  // Para membresía y abono: siempre manual (no auto-aprobar)
  if (req.type === 'MEMBERSHIP' || req.type === 'SEASON_PASS') {
    const verification = await prisma.verification.create({
      data: {
        userId: req.userId,
        type: req.type,
        evidenceUrl: req.evidenceUrl,
        status: VerificationStatus.PENDING,
      },
    });

    return {
      success: true,
      message: 'Verificación enviada. Revisión manual pendiente.',
      verificationId: verification.id,
    };
  }

  // Para asistencia: auto-verificar con geolocalización
  if (!req.matchId) {
    return { success: false, message: 'Se requiere partido para verificar asistencia.' };
  }

  const match = await prisma.match.findUnique({
    where: { id: req.matchId },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  if (!match) {
    return { success: false, message: 'Partido no encontrado.' };
  }

  // Calcular puntaje según tipo
  let scoreResult;
  let autoApprove = false;

  if (req.type === 'LOCAL_ATTENDANCE') {
    // Partido local: verificar que el usuario esté en el estadio
    if (req.geoLat && req.geoLng) {
      const inRange = await checkGeoProximity(
        req.geoLat,
        req.geoLng,
        match.homeTeam.stadiumLat,
        match.homeTeam.stadiumLng,
      );
      autoApprove = inRange;
    }
    scoreResult = await calcLocalAttendanceScore(userTier);
  } else if (req.type === 'AWAY_ATTENDANCE') {
    const venueLat = match.venueLat ?? match.homeTeam.stadiumLat;
    const venueLng = match.venueLng ?? match.homeTeam.stadiumLng;

    if (req.geoLat && req.geoLng) {
      const inRange = await checkGeoProximity(req.geoLat, req.geoLng, venueLat, venueLng);
      autoApprove = inRange;
    }

    // Score con distancia desde estadio del equipo del usuario
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { team: true },
    });
    const homeStadiumLat = user?.team?.stadiumLat ?? -33.4489;
    const homeStadiumLng = user?.team?.stadiumLng ?? -70.6693;

    scoreResult = await calcAwayAttendanceScore(userTier, homeStadiumLat, homeStadiumLng, venueLat, venueLng);
  } else if (req.type === 'INTL_ATTENDANCE') {
    const venueLat = match.venueLat ?? 0;
    const venueLng = match.venueLng ?? 0;

    if (req.geoLat && req.geoLng) {
      const inRange = await checkGeoProximity(req.geoLat, req.geoLng, venueLat, venueLng);
      autoApprove = inRange;
    }

    scoreResult = await calcIntlAttendanceScore(userTier, venueLat, venueLng);
  } else {
    return { success: false, message: 'Tipo de verificación no válido.' };
  }

  const status = autoApprove && req.evidenceUrl
    ? VerificationStatus.APPROVED
    : VerificationStatus.PENDING;

  const verification = await prisma.verification.create({
    data: {
      userId: req.userId,
      type: req.type,
      evidenceUrl: req.evidenceUrl,
      geoLat: req.geoLat,
      geoLng: req.geoLng,
      matchId: req.matchId,
      status,
      pointsAwarded: status === VerificationStatus.APPROVED ? scoreResult.points : null,
    },
  });

  // Si se aprueba automáticamente, registrar puntaje
  if (status === VerificationStatus.APPROVED) {
    await recordScore(
      req.userId,
      scoreResult,
      'VERIFICATION',
      verification.id,
      `Asistencia verificada: ${match.homeTeam.name} vs ${match.awayTeam.name}`,
    );
  }

  return {
    success: true,
    message: status === VerificationStatus.APPROVED
      ? `¡Verificación aprobada! +${Math.round(scoreResult.points)} puntos`
      : 'Verificación enviada para revisión.',
    verificationId: verification.id,
    pointsAwarded: status === VerificationStatus.APPROVED ? scoreResult.points : undefined,
  };
}

/**
 * Aprueba una verificación manualmente (admin)
 */
export async function approveVerification(
  verificationId: string,
  reviewerId: string,
): Promise<VerificationResult> {
  const verification = await prisma.verification.findUnique({
    where: { id: verificationId },
    include: { user: true },
  });

  if (!verification) {
    return { success: false, message: 'Verificación no encontrada.' };
  }

  if (verification.status !== VerificationStatus.PENDING) {
    return { success: false, message: 'La verificación ya fue procesada.' };
  }

  // Calcular puntos según tipo y tier del usuario
  let scoreResult;
  const tier = verification.user.tier;

  if (verification.type === 'MEMBERSHIP') {
    scoreResult = await calcMembershipScore(tier);
  } else if (verification.type === 'SEASON_PASS') {
    scoreResult = await calcSeasonPassScore(tier);
  } else {
    return { success: false, message: 'Tipo no soportado para aprobación manual.' };
  }

  await prisma.verification.update({
    where: { id: verificationId },
    data: {
      status: VerificationStatus.APPROVED,
      reviewedBy: reviewerId,
      pointsAwarded: scoreResult.points,
    },
  });

  await recordScore(
    verification.userId,
    scoreResult,
    'VERIFICATION',
    verificationId,
    `Verificación aprobada: ${verification.type}`,
  );

  return {
    success: true,
    message: `Verificación aprobada. +${Math.round(scoreResult.points)} puntos otorgados.`,
    verificationId,
    pointsAwarded: scoreResult.points,
  };
}
