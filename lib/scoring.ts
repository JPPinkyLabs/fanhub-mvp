/**
 * Motor de puntaje de FanHub
 * Fórmula: Puntaje Total = (Pts_Orgánicos × Multiplicador_Tier) + Pts_Activación_Interna + Pts_Activación_Club + Pts_Activación_Marca
 * Todos los valores se leen desde AppConfig — NADA hardcodeado.
 */

import { Tier, ScoreCategory } from '@prisma/client';
import { prisma } from './db';
import { getConfig, CONFIG_KEYS } from './config';
import { haversineDistanceKm, CHILE_REFERENCE_COORDS } from './distance';

export interface ScoringContext {
  userId: string;
  tier: Tier;
  matchId?: string;
  verificationType?: string;
  geoLat?: number;
  geoLng?: number;
  stadiumLat?: number;
  stadiumLng?: number;
  stadiumCity?: string;
  isInternational?: boolean;
  distanceKm?: number;
}

export interface ScoreResult {
  points: number;
  category: ScoreCategory;
  breakdown: {
    basePoints: number;
    tierMultiplier: number;
    organicPoints: number;
    distanceBonus: number;
    activationPoints: number;
  };
}

/**
 * Obtiene el multiplicador de tier desde AppConfig
 */
export async function getTierMultiplier(tier: Tier): Promise<number> {
  const keyMap: Record<Tier, string> = {
    FREE: CONFIG_KEYS.MULTIPLIER_FREE,
    PREMIUM: CONFIG_KEYS.MULTIPLIER_PREMIUM,
    PLATINUM: CONFIG_KEYS.MULTIPLIER_PLATINUM,
  };
  return getConfig<number>(keyMap[tier], tier === 'PREMIUM' ? 1.10 : tier === 'PLATINUM' ? 1.20 : 1.0);
}

/**
 * Calcula puntaje por asistencia a partido local
 */
export async function calcLocalAttendanceScore(tier: Tier): Promise<ScoreResult> {
  const basePoints = await getConfig<number>(CONFIG_KEYS.POINTS_LOCAL_ATTENDANCE, 100);
  const multiplier = await getTierMultiplier(tier);
  const organicPoints = basePoints * multiplier;

  return {
    points: organicPoints,
    category: ScoreCategory.ORGANIC,
    breakdown: {
      basePoints,
      tierMultiplier: multiplier,
      organicPoints,
      distanceBonus: 0,
      activationPoints: 0,
    },
  };
}

/**
 * Calcula puntaje por asistencia a partido de visita
 * Incluye bonus por distancia: +1 pt/km desde la ciudad sede del club visitante
 */
export async function calcAwayAttendanceScore(
  tier: Tier,
  homeStadiumLat: number,
  homeStadiumLng: number,
  matchVenueLat: number,
  matchVenueLng: number,
): Promise<ScoreResult> {
  const basePoints = await getConfig<number>(CONFIG_KEYS.POINTS_AWAY_ATTENDANCE, 100);
  const distanceFactor = await getConfig<number>(CONFIG_KEYS.DISTANCE_FACTOR_AWAY, 1); // pts por km
  const multiplier = await getTierMultiplier(tier);

  const distanceKm = haversineDistanceKm(homeStadiumLat, homeStadiumLng, matchVenueLat, matchVenueLng);
  const distanceBonus = Math.round(distanceKm * distanceFactor);

  const organicPoints = (basePoints + distanceBonus) * multiplier;

  return {
    points: organicPoints,
    category: ScoreCategory.ORGANIC,
    breakdown: {
      basePoints,
      tierMultiplier: multiplier,
      organicPoints,
      distanceBonus,
      activationPoints: 0,
    },
  };
}

/**
 * Calcula puntaje por asistencia a partido internacional
 * Bonus: +1 pt/100km desde Chile
 */
export async function calcIntlAttendanceScore(
  tier: Tier,
  matchVenueLat: number,
  matchVenueLng: number,
): Promise<ScoreResult> {
  const basePoints = await getConfig<number>(CONFIG_KEYS.POINTS_INTL_ATTENDANCE, 200);
  const distanceFactor = await getConfig<number>(CONFIG_KEYS.DISTANCE_FACTOR_INTL, 1); // pts por 100km
  const multiplier = await getTierMultiplier(tier);

  const distanceKm = haversineDistanceKm(
    CHILE_REFERENCE_COORDS.lat,
    CHILE_REFERENCE_COORDS.lng,
    matchVenueLat,
    matchVenueLng,
  );
  const distanceBonus = Math.round((distanceKm / 100) * distanceFactor);

  const organicPoints = (basePoints + distanceBonus) * multiplier;

  return {
    points: organicPoints,
    category: ScoreCategory.ORGANIC,
    breakdown: {
      basePoints,
      tierMultiplier: multiplier,
      organicPoints,
      distanceBonus,
      activationPoints: 0,
    },
  };
}

/**
 * Calcula puntaje por hacerse socio del club
 */
export async function calcMembershipScore(tier: Tier): Promise<ScoreResult> {
  const basePoints = await getConfig<number>(CONFIG_KEYS.POINTS_MEMBERSHIP, 300);
  const multiplier = await getTierMultiplier(tier);
  const organicPoints = basePoints * multiplier;

  return {
    points: organicPoints,
    category: ScoreCategory.ORGANIC,
    breakdown: {
      basePoints,
      tierMultiplier: multiplier,
      organicPoints,
      distanceBonus: 0,
      activationPoints: 0,
    },
  };
}

/**
 * Calcula puntaje por abono de temporada
 */
export async function calcSeasonPassScore(tier: Tier): Promise<ScoreResult> {
  const basePoints = await getConfig<number>(CONFIG_KEYS.POINTS_SEASON_PASS, 250);
  const multiplier = await getTierMultiplier(tier);
  const organicPoints = basePoints * multiplier;

  return {
    points: organicPoints,
    category: ScoreCategory.ORGANIC,
    breakdown: {
      basePoints,
      tierMultiplier: multiplier,
      organicPoints,
      distanceBonus: 0,
      activationPoints: 0,
    },
  };
}

/**
 * Calcula puntaje por referido exitoso
 */
export async function calcReferralScore(tier: Tier): Promise<ScoreResult> {
  const basePoints = await getConfig<number>(CONFIG_KEYS.POINTS_REFERRAL, 50);
  const multiplier = await getTierMultiplier(tier);
  const organicPoints = basePoints * multiplier;

  return {
    points: organicPoints,
    category: ScoreCategory.ORGANIC,
    breakdown: {
      basePoints,
      tierMultiplier: multiplier,
      organicPoints,
      distanceBonus: 0,
      activationPoints: 0,
    },
  };
}

/**
 * Calcula puntaje por check-in diario
 */
export async function calcDailyCheckinScore(tier: Tier): Promise<ScoreResult> {
  const basePoints = await getConfig<number>(CONFIG_KEYS.POINTS_DAILY_CHECKIN, 5);
  const multiplier = await getTierMultiplier(tier);
  const organicPoints = basePoints * multiplier;

  return {
    points: organicPoints,
    category: ScoreCategory.ORGANIC,
    breakdown: {
      basePoints,
      tierMultiplier: multiplier,
      organicPoints,
      distanceBonus: 0,
      activationPoints: 0,
    },
  };
}

/**
 * Calcula puntaje por publicación de contenido (10 pts base, máx 3/día)
 */
export async function calcContentPostScore(tier: Tier): Promise<ScoreResult> {
  const basePoints = await getConfig<number>(CONFIG_KEYS.POINTS_CONTENT_POST, 10);
  const multiplier = await getTierMultiplier(tier);
  const organicPoints = basePoints * multiplier;

  return {
    points: organicPoints,
    category: ScoreCategory.ORGANIC,
    breakdown: {
      basePoints,
      tierMultiplier: multiplier,
      organicPoints,
      distanceBonus: 0,
      activationPoints: 0,
    },
  };
}

/**
 * Aplica una activación (interna, club, o marca)
 * Los puntos de activación NO se multiplican por tier
 */
export function calcActivationScore(
  bonusPoints: number,
  category: 'ACTIVATION_INTERNAL' | 'ACTIVATION_CLUB' | 'ACTIVATION_BRAND',
): ScoreResult {
  return {
    points: bonusPoints,
    category,
    breakdown: {
      basePoints: bonusPoints,
      tierMultiplier: 1,
      organicPoints: 0,
      distanceBonus: 0,
      activationPoints: bonusPoints,
    },
  };
}

/**
 * Graba los puntos en la base de datos
 */
export async function recordScore(
  userId: string,
  result: ScoreResult,
  sourceType: string,
  sourceId?: string,
  description?: string,
): Promise<void> {
  await prisma.score.create({
    data: {
      userId,
      category: result.category,
      points: result.points,
      sourceType,
      sourceId,
      description,
    },
  });
}

/**
 * Calcula el puntaje total de un usuario (suma de todos sus scores)
 */
export async function getUserTotalScore(userId: string): Promise<number> {
  const result = await prisma.score.aggregate({
    where: { userId },
    _sum: { points: true },
  });
  return result._sum.points ?? 0;
}

/**
 * Calcula el puntaje de un clan (suma de scores de miembros activos)
 */
export async function getClanTotalScore(clanId: string): Promise<number> {
  const members = await prisma.clanMembership.findMany({
    where: { clanId, status: 'ACTIVE' },
    select: { userId: true },
  });

  const memberIds = members.map((m) => m.userId);
  if (memberIds.length === 0) return 0;

  const result = await prisma.score.aggregate({
    where: { userId: { in: memberIds } },
    _sum: { points: true },
  });

  return result._sum.points ?? 0;
}
