import { prisma } from './db';

// Cache en memoria para evitar queries repetitivas en el mismo request
const configCache = new Map<string, { value: unknown; ts: number }>();
const CACHE_TTL_MS = 30_000; // 30 segundos

export async function getConfig<T = number>(key: string, fallback: T): Promise<T> {
  const now = Date.now();
  const cached = configCache.get(key);

  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return cached.value as T;
  }

  try {
    const record = await prisma.appConfig.findUnique({ where: { key } });
    if (record === null) return fallback;
    const val = record.value as T;
    configCache.set(key, { value: val, ts: now });
    return val;
  } catch {
    return fallback;
  }
}

export async function getConfigs(keys: string[]): Promise<Record<string, unknown>> {
  const records = await prisma.appConfig.findMany({
    where: { key: { in: keys } },
  });

  const result: Record<string, unknown> = {};
  for (const r of records) {
    result[r.key] = r.value;
  }
  return result;
}

export function invalidateConfigCache(key?: string) {
  if (key) {
    configCache.delete(key);
  } else {
    configCache.clear();
  }
}

// Constantes de keys para type-safety
export const CONFIG_KEYS = {
  // Puntajes base
  POINTS_LOCAL_ATTENDANCE: 'points.local_attendance',
  POINTS_AWAY_ATTENDANCE: 'points.away_attendance',
  POINTS_INTL_ATTENDANCE: 'points.intl_attendance',
  POINTS_MEMBERSHIP: 'points.membership',
  POINTS_SEASON_PASS: 'points.season_pass',
  POINTS_MARKETPLACE_PURCHASE: 'points.marketplace_purchase',
  POINTS_REFERRAL: 'points.referral',
  POINTS_DAILY_CHECKIN: 'points.daily_checkin',
  POINTS_CONTENT_POST: 'points.content_post',

  // Multiplicadores tier
  MULTIPLIER_FREE: 'multiplier.free',
  MULTIPLIER_PREMIUM: 'multiplier.premium',
  MULTIPLIER_PLATINUM: 'multiplier.platinum',

  // Distancias
  DISTANCE_FACTOR_AWAY: 'distance.factor_away',    // pts por km (partidos visita)
  DISTANCE_FACTOR_INTL: 'distance.factor_intl',    // pts por 100km (internacionales)

  // Clan
  CLAN_COOLDOWN_SAME_DAYS: 'clan.cooldown_same_days',
  CLAN_COOLDOWN_EXPELLED_DAYS: 'clan.cooldown_expelled_days',
  CLAN_MAX_CHANGES_MONTH: 'clan.max_changes_month',
  CLAN_MIN_MEMBERS_ACTIVE: 'clan.min_members_active',
  CLAN_MAX_MEMBERS_DEFAULT: 'clan.max_members_default',

  // Verificación
  GEO_RADIUS_METERS: 'verification.geo_radius_meters',
  DAILY_CHECKIN_MAX: 'verification.daily_checkin_max',
  CONTENT_POST_MAX_DAILY: 'verification.content_post_max_daily',

  // Activaciones
  ACTIVATION_BONUS_MIN_PCT: 'activation.bonus_min_pct',
  ACTIVATION_BONUS_MAX_PCT: 'activation.bonus_max_pct',
  ACTIVATION_MAX_PER_MONTH: 'activation.max_per_month',

  // Badges
  BADGE_MAX_ACTIVE: 'badge.max_active',

  // Precios suscripciones (CLP)
  PRICE_PREMIUM_MONTHLY: 'price.premium_monthly',
  PRICE_PREMIUM_ANNUAL: 'price.premium_annual',
  PRICE_PLATINUM_MONTHLY: 'price.platinum_monthly',
  PRICE_PLATINUM_ANNUAL: 'price.platinum_annual',
} as const;
