/**
 * FanHub MVP — Seed
 * 16 equipos Primera División Chile 2026 + datos de prueba + AppConfig inicial
 */

import { PrismaClient, Role, Tier, BadgeRarity, ConfigScope, ChallengeType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

// ─────────────────────────────────────────
// 16 EQUIPOS — PRIMERA DIVISIÓN CHILE 2026
// Coordenadas reales de los estadios
// ─────────────────────────────────────────
const TEAMS = [
  {
    name: 'Colo-Colo',
    shortName: 'COLO',
    city: 'Santiago',
    stadiumName: 'Estadio Monumental David Arellano',
    stadiumLat: -33.4975,
    stadiumLng: -70.6126,
    primaryColor: '#FFFFFF',
  },
  {
    name: 'Universidad de Chile',
    shortName: 'UCHI',
    city: 'Santiago',
    stadiumName: 'Estadio Nacional Julio Martínez Prádanos',
    stadiumLat: -33.4650,
    stadiumLng: -70.6142,
    primaryColor: '#003DA5',
  },
  {
    name: 'Universidad Católica',
    shortName: 'UCATO',
    city: 'Santiago',
    stadiumName: 'Estadio San Carlos de Apoquindo',
    stadiumLat: -33.4013,
    stadiumLng: -70.5596,
    primaryColor: '#8B0000',
  },
  {
    name: 'Everton de Viña del Mar',
    shortName: 'EVER',
    city: 'Viña del Mar',
    stadiumName: 'Estadio Sausalito',
    stadiumLat: -33.0420,
    stadiumLng: -71.5530,
    primaryColor: '#FFD700',
  },
  {
    name: 'Huachipato',
    shortName: 'HUACH',
    city: 'Talcahuano',
    stadiumName: 'Estadio CAP',
    stadiumLat: -36.7219,
    stadiumLng: -73.1101,
    primaryColor: '#004B87',
  },
  {
    name: 'Audax Italiano',
    shortName: 'AUDAX',
    city: 'Santiago',
    stadiumName: 'Estadio Bicentenario La Florida',
    stadiumLat: -33.5270,
    stadiumLng: -70.5950,
    primaryColor: '#006400',
  },
  {
    name: 'Deportes Iquique',
    shortName: 'IQUI',
    city: 'Iquique',
    stadiumName: 'Estadio Cavancha',
    stadiumLat: -20.2150,
    stadiumLng: -70.1560,
    primaryColor: '#FF4500',
  },
  {
    name: 'Unión Española',
    shortName: 'UNION',
    city: 'Santiago',
    stadiumName: 'Estadio Santa Laura',
    stadiumLat: -33.4400,
    stadiumLng: -70.6680,
    primaryColor: '#8B0000',
  },
  {
    name: 'Cobreloa',
    shortName: 'COBR',
    city: 'Calama',
    stadiumName: 'Estadio Municipal Calama',
    stadiumLat: -22.4560,
    stadiumLng: -68.9273,
    primaryColor: '#FF8C00',
  },
  {
    name: 'Deportes Antofagasta',
    shortName: 'ANTO',
    city: 'Antofagasta',
    stadiumName: 'Estadio Regional Calvo y Bascuñán',
    stadiumLat: -23.6310,
    stadiumLng: -70.4060,
    primaryColor: '#006400',
  },
  {
    name: 'O\'Higgins FC',
    shortName: "OHIG",
    city: 'Rancagua',
    stadiumName: 'Estadio El Teniente',
    stadiumLat: -34.1688,
    stadiumLng: -70.7448,
    primaryColor: '#B22222',
  },
  {
    name: 'Deportes Temuco',
    shortName: 'TEMU',
    city: 'Temuco',
    stadiumName: 'Estadio Germán Becker',
    stadiumLat: -38.7359,
    stadiumLng: -72.5904,
    primaryColor: '#006400',
  },
  {
    name: 'San Luis de Quillota',
    shortName: 'SLQ',
    city: 'Quillota',
    stadiumName: 'Estadio La Granja',
    stadiumLat: -32.8817,
    stadiumLng: -71.2479,
    primaryColor: '#0000CD',
  },
  {
    name: 'Coquimbo Unido',
    shortName: 'COQU',
    city: 'Coquimbo',
    stadiumName: 'Estadio Francisco Sánchez Rumoroso',
    stadiumLat: -29.9687,
    stadiumLng: -71.3484,
    primaryColor: '#FF8C00',
  },
  {
    name: 'Magallanes',
    shortName: 'MAGA',
    city: 'Santiago',
    stadiumName: 'Estadio Municipal El Teniente Chico',
    stadiumLat: -33.5420,
    stadiumLng: -70.7400,
    primaryColor: '#000080',
  },
  {
    name: 'Ñublense',
    shortName: 'ÑUBL',
    city: 'Chillán',
    stadiumName: 'Estadio Nelson Oyarzún Arenas',
    stadiumLat: -36.6205,
    stadiumLng: -72.1017,
    primaryColor: '#8B0000',
  },
];

// ─────────────────────────────────────────
// APP CONFIG INICIAL
// ─────────────────────────────────────────
const APP_CONFIGS = [
  // Puntajes base
  { key: 'points.local_attendance', value: 100, description: 'Puntos por partido de local', dataType: 'number' },
  { key: 'points.away_attendance', value: 100, description: 'Puntos base por partido de visita', dataType: 'number' },
  { key: 'points.intl_attendance', value: 200, description: 'Puntos base por partido internacional', dataType: 'number' },
  { key: 'points.membership', value: 300, description: 'Puntos por hacerse socio del club', dataType: 'number' },
  { key: 'points.season_pass', value: 250, description: 'Puntos por abono de temporada', dataType: 'number' },
  { key: 'points.marketplace_purchase', value: 10, description: 'Puntos por compra en marketplace', dataType: 'number' },
  { key: 'points.referral', value: 50, description: 'Puntos por referir un usuario (cuando el referido verifica primera asistencia)', dataType: 'number' },
  { key: 'points.daily_checkin', value: 5, description: 'Puntos por check-in diario (apertura de app)', dataType: 'number' },
  { key: 'points.content_post', value: 10, description: 'Puntos por publicar contenido', dataType: 'number' },
  // Multiplicadores tier
  { key: 'multiplier.free', value: 1.0, description: 'Multiplicador de puntaje para usuarios Free', dataType: 'number' },
  { key: 'multiplier.premium', value: 1.10, description: 'Multiplicador de puntaje para usuarios Premium (+10%)', dataType: 'number' },
  { key: 'multiplier.platinum', value: 1.20, description: 'Multiplicador de puntaje para usuarios Platinum (+20%)', dataType: 'number' },
  // Distancias
  { key: 'distance.factor_away', value: 1, description: 'Puntos por km de distancia en partido de visita', dataType: 'number' },
  { key: 'distance.factor_intl', value: 1, description: 'Puntos por 100km de distancia en partido internacional', dataType: 'number' },
  // Clan
  { key: 'clan.cooldown_same_days', value: 10, description: 'Días de cooldown para reingresar al mismo clan (baja voluntaria)', dataType: 'number' },
  { key: 'clan.cooldown_expelled_days', value: 30, description: 'Días de cooldown para reingresar a un clan tras expulsión', dataType: 'number' },
  { key: 'clan.max_changes_month', value: 2, description: 'Máximo de cambios de clan por mes (anti-gaming)', dataType: 'number' },
  { key: 'clan.min_members_active', value: 3, description: 'Mínimo de miembros para que el clan aparezca en rankings', dataType: 'number' },
  { key: 'clan.max_members_default', value: 50, description: 'Máximo de miembros por clan (por defecto)', dataType: 'number' },
  // Verificación
  { key: 'verification.geo_radius_meters', value: 500, description: 'Radio en metros para validar geolocalización en el estadio', dataType: 'number' },
  { key: 'verification.daily_checkin_max', value: 1, description: 'Máximo de check-ins diarios', dataType: 'number' },
  { key: 'verification.content_post_max_daily', value: 3, description: 'Máximo de publicaciones de contenido diarias con puntaje', dataType: 'number' },
  // Activaciones
  { key: 'activation.bonus_min_pct', value: 0, description: 'Porcentaje mínimo de bonificación para activaciones de club', dataType: 'number' },
  { key: 'activation.bonus_max_pct', value: 20, description: 'Porcentaje máximo de bonificación para activaciones de club', dataType: 'number' },
  { key: 'activation.max_per_month', value: 4, description: 'Máximo de activaciones de club por mes', dataType: 'number' },
  // Badges
  { key: 'badge.max_active', value: 5, description: 'Máximo de badges activos simultáneamente en tarjeta de perfil', dataType: 'number' },
  // Precios suscripciones
  { key: 'price.premium_monthly', value: 3990, description: 'Precio mensual Premium (CLP)', dataType: 'number' },
  { key: 'price.premium_annual', value: 39900, description: 'Precio anual Premium (CLP)', dataType: 'number' },
  { key: 'price.platinum_monthly', value: 7990, description: 'Precio mensual Platinum (CLP)', dataType: 'number' },
  { key: 'price.platinum_annual', value: 79900, description: 'Precio anual Platinum (CLP)', dataType: 'number' },
];

// ─────────────────────────────────────────
// BADGES INICIALES (sección 7.2 del brief)
// ─────────────────────────────────────────
const BADGES = [
  {
    name: 'Trotamundos',
    description: 'Asististe a un partido internacional. ¡Eso es dedicación!',
    rarity: BadgeRarity.RARE,
    iconEmoji: '✈️',
    conditionJson: { type: 'INTL_ATTENDANCE', count: 1 },
  },
  {
    name: 'Hincha #1 del Mes',
    description: 'Mayor puntaje orgánico del mes en tu equipo',
    rarity: BadgeRarity.EPIC,
    iconEmoji: '👑',
    conditionJson: { type: 'MONTHLY_TOP', metric: 'organic_points' },
  },
  {
    name: 'Fiel de Invierno',
    description: 'Asististe a todos los partidos de junio y julio',
    rarity: BadgeRarity.RARE,
    iconEmoji: '🧊',
    conditionJson: { type: 'SEASONAL_ATTENDANCE', months: [6, 7], all: true },
  },
  {
    name: 'Fundador de Clan',
    description: 'Creaste un clan que llegó a 20 miembros',
    rarity: BadgeRarity.EPIC,
    iconEmoji: '🛡️',
    conditionJson: { type: 'CLAN_FOUNDER', minMembers: 20 },
  },
  {
    name: 'Misionero',
    description: 'Referiste 10 usuarios activos a FanHub',
    rarity: BadgeRarity.EPIC,
    iconEmoji: '🌱',
    conditionJson: { type: 'REFERRAL', count: 10 },
  },
  {
    name: 'Colección Completa',
    description: 'Obtuviste todos los badges de la temporada',
    rarity: BadgeRarity.LEGENDARY,
    iconEmoji: '💎',
    conditionJson: { type: 'COMPLETE_SEASON_BADGES' },
  },
  {
    name: 'Primer Grito',
    description: 'Verificaste tu primera asistencia en FanHub',
    rarity: BadgeRarity.COMMON,
    iconEmoji: '📣',
    conditionJson: { type: 'ATTENDANCE', count: 1 },
  },
  {
    name: 'Guerrero de Visita',
    description: 'Asististe a 5 partidos de visita',
    rarity: BadgeRarity.RARE,
    iconEmoji: '⚔️',
    conditionJson: { type: 'AWAY_ATTENDANCE', count: 5 },
  },
];

// ─────────────────────────────────────────
// MAIN SEED
// ─────────────────────────────────────────
async function main() {
  console.log('🌱 Iniciando seed de FanHub MVP...\n');

  // 1. Crear equipos
  console.log('🏟️  Creando 16 equipos de la Primera División de Chile...');
  const createdTeams: Array<{ id: string; name: string }> = [];
  for (const team of TEAMS) {
    const t = await prisma.team.upsert({
      where: { id: team.shortName },
      update: {},
      create: {
        id: team.shortName,
        ...team,
        country: 'CL',
        sport: 'football',
        competition: 'Primera División Chile',
      },
    });
    createdTeams.push(t);
  }
  console.log(`   ✅ ${createdTeams.length} equipos creados\n`);

  // 2. Crear AppConfig
  console.log('⚙️  Creando configuración inicial (AppConfig)...');
  for (const config of APP_CONFIGS) {
    await prisma.appConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: {
        key: config.key,
        value: config.value,
        scope: ConfigScope.GLOBAL,
        description: config.description,
        dataType: config.dataType,
        editableByRole: Role.SUPER_ADMIN,
      },
    });
  }
  console.log(`   ✅ ${APP_CONFIGS.length} configuraciones creadas\n`);

  // 3. Crear badges
  console.log('🎖️  Creando badges iniciales...');
  const createdBadges: Array<{ id: string; name: string }> = [];
  for (const badge of BADGES) {
    const b = await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: badge,
    });
    createdBadges.push(b);
  }
  console.log(`   ✅ ${createdBadges.length} badges creados\n`);

  // 4. Crear usuarios de prueba
  console.log('👥 Creando usuarios de prueba...');
  const adminHash = await bcrypt.hash('admin123', 12);
  const userHash = await bcrypt.hash('test1234', 12);

  const colocolo = createdTeams.find((t) => t.name === 'Colo-Colo')!;
  const uchi = createdTeams.find((t) => t.name === 'Universidad de Chile')!;
  const ucato = createdTeams.find((t) => t.name === 'Universidad Católica')!;

  const admin = await prisma.user.upsert({
    where: { email: 'admin@fanhub.cl' },
    update: {},
    create: {
      email: 'admin@fanhub.cl',
      name: 'Admin FanHub',
      passwordHash: adminHash,
      role: Role.SUPER_ADMIN,
      tier: Tier.PLATINUM,
      teamId: colocolo.id,
    },
  });

  const testUsers = [
    { email: 'carlos@test.cl', name: 'Carlos Mendes', tier: Tier.FREE, teamId: colocolo.id },
    { email: 'maria@test.cl', name: 'María González', tier: Tier.PREMIUM, teamId: uchi.id },
    { email: 'pedro@test.cl', name: 'Pedro Rojas', tier: Tier.PLATINUM, teamId: ucato.id },
    { email: 'ana@test.cl', name: 'Ana Muñoz', tier: Tier.FREE, teamId: colocolo.id },
    { email: 'luis@test.cl', name: 'Luis Pérez', tier: Tier.PREMIUM, teamId: uchi.id },
  ];

  const createdTestUsers: Array<{ id: string; email: string }> = [];
  for (const u of testUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash: userHash, role: Role.USER },
    });
    createdTestUsers.push(user);
  }
  console.log(`   ✅ 1 admin + ${createdTestUsers.length} usuarios de prueba\n`);

  // 5. Crear clanes de prueba
  console.log('🛡️  Creando clanes de prueba...');
  const clan1 = await prisma.clan.upsert({
    where: { name: 'Los Guerreros del Monumental' },
    update: {},
    create: {
      name: 'Los Guerreros del Monumental',
      teamId: colocolo.id,
      description: 'El clan más fiel de Colo-Colo. Nunca falta uno.',
      status: 'ACTIVE',
      maxMembers: 50,
    },
  });

  const clan2 = await prisma.clan.upsert({
    where: { name: 'Azul Total' },
    update: {},
    create: {
      name: 'Azul Total',
      teamId: uchi.id,
      description: 'Para los que tienen azul en la sangre. Fans de U de Chile.',
      status: 'ACTIVE',
      maxMembers: 50,
    },
  });

  // Agregar miembros a los clanes
  const carlosUser = createdTestUsers.find((u) => u.email === 'carlos@test.cl')!;
  const anaUser = createdTestUsers.find((u) => u.email === 'ana@test.cl')!;
  const mariaUser = createdTestUsers.find((u) => u.email === 'maria@test.cl')!;
  const luisUser = createdTestUsers.find((u) => u.email === 'luis@test.cl')!;

  await prisma.clanMembership.upsert({
    where: { clanId_userId: { clanId: clan1.id, userId: carlosUser.id } },
    update: {},
    create: { clanId: clan1.id, userId: carlosUser.id, role: 'FOUNDER', status: 'ACTIVE' },
  });
  await prisma.clanMembership.upsert({
    where: { clanId_userId: { clanId: clan1.id, userId: anaUser.id } },
    update: {},
    create: { clanId: clan1.id, userId: anaUser.id, role: 'MEMBER', status: 'ACTIVE' },
  });
  await prisma.clanMembership.upsert({
    where: { clanId_userId: { clanId: clan2.id, userId: mariaUser.id } },
    update: {},
    create: { clanId: clan2.id, userId: mariaUser.id, role: 'FOUNDER', status: 'ACTIVE' },
  });
  await prisma.clanMembership.upsert({
    where: { clanId_userId: { clanId: clan2.id, userId: luisUser.id } },
    update: {},
    create: { clanId: clan2.id, userId: luisUser.id, role: 'MEMBER', status: 'ACTIVE' },
  });
  console.log('   ✅ 2 clanes con miembros asignados\n');

  // 6. Crear partidos de ejemplo
  console.log('⚽ Creando partidos de ejemplo...');
  const everton = createdTeams.find((t) => t.name === 'Everton de Viña del Mar')!;
  const huachipato = createdTeams.find((t) => t.name === 'Huachipato')!;

  const match1 = await prisma.match.upsert({
    where: { id: 'match-local-1' },
    update: {},
    create: {
      id: 'match-local-1',
      homeTeamId: colocolo.id,
      awayTeamId: uchi.id,
      date: new Date('2026-04-15T20:00:00-03:00'),
      venue: 'Estadio Monumental David Arellano',
      venueLat: -33.4975,
      venueLng: -70.6126,
      isInternational: false,
      competition: 'Primera División Chile',
      round: 'Fecha 12',
    },
  });

  const match2 = await prisma.match.upsert({
    where: { id: 'match-away-1' },
    update: {},
    create: {
      id: 'match-away-1',
      homeTeamId: huachipato.id,
      awayTeamId: colocolo.id,
      date: new Date('2026-05-03T18:00:00-04:00'),
      venue: 'Estadio CAP',
      venueLat: -36.7219,
      venueLng: -73.1101,
      isInternational: false,
      competition: 'Primera División Chile',
      round: 'Fecha 15',
    },
  });

  const match3 = await prisma.match.upsert({
    where: { id: 'match-intl-1' },
    update: {},
    create: {
      id: 'match-intl-1',
      homeTeamId: colocolo.id,
      awayTeamId: everton.id,
      date: new Date('2026-05-20T20:00:00-05:00'),
      venue: 'Estadio El Campín, Bogotá',
      venueLat: 4.6458,
      venueLng: -74.0810,
      isInternational: true,
      competition: 'Copa Libertadores',
      round: 'Fase de grupos',
    },
  });
  console.log('   ✅ 3 partidos de ejemplo (1 local, 1 visita, 1 internacional)\n');

  // 7. Crear scores de prueba para los usuarios
  console.log('🏆 Creando scores de prueba...');
  const scores = [
    { userId: carlosUser.id, category: 'ORGANIC' as const, points: 100, sourceType: 'VERIFICATION', sourceId: 'v1', description: 'Partido local: Colo-Colo vs U de Chile' },
    { userId: carlosUser.id, category: 'ORGANIC' as const, points: 215, sourceType: 'VERIFICATION', sourceId: 'v2', description: 'Partido de visita: Huachipato vs Colo-Colo (+115km)' },
    { userId: anaUser.id, category: 'ORGANIC' as const, points: 100, sourceType: 'VERIFICATION', sourceId: 'v3', description: 'Partido local: Colo-Colo vs Everton' },
    { userId: mariaUser.id, category: 'ORGANIC' as const, points: 110, sourceType: 'VERIFICATION', sourceId: 'v4', description: 'Partido local: U de Chile vs Audax' },
    { userId: luisUser.id, category: 'ORGANIC' as const, points: 110, sourceType: 'VERIFICATION', sourceId: 'v5', description: 'Partido local: U de Chile vs Coquimbo' },
  ];

  for (const s of scores) {
    await prisma.score.upsert({
      where: { id: s.sourceId },
      update: {},
      create: { ...s, id: s.sourceId },
    });
  }
  console.log(`   ✅ ${scores.length} registros de puntaje\n`);

  // 8. Otorgar badge "Primer Grito" a usuarios con scores
  const primerGritoBadge = createdBadges.find((b) => b.name === 'Primer Grito')!;
  for (const userId of [carlosUser.id, anaUser.id, mariaUser.id, luisUser.id]) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId: primerGritoBadge.id } },
      update: {},
      create: { userId, badgeId: primerGritoBadge.id },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { activeBadges: [primerGritoBadge.id] },
    });
  }
  console.log('   ✅ Badge "Primer Grito" otorgado a usuarios activos\n');

  // 9. Crear desafío interno de ejemplo
  console.log('⚡ Creando desafíos de ejemplo...');
  await prisma.challenge.upsert({
    where: { id: 'challenge-1' },
    update: {},
    create: {
      id: 'challenge-1',
      type: ChallengeType.INTERNAL,
      title: 'Hincha de Invierno 2026',
      description: 'Asiste a todos los partidos de local de tu equipo durante junio y julio 2026. ¡Demuestra que el frío no te detiene!',
      conditionsJson: { type: 'LOCAL_ATTENDANCE_ALL', months: [6, 7], year: 2026 },
      rewardJson: { badge: 'Fiel de Invierno', bonusPts: 500 },
      bonusPct: 10,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-07-31'),
      status: 'ACTIVE',
      createdBy: admin.id,
    },
  });

  // 10. Club Manager para Colo-Colo
  console.log('🏥 Creando Club Manager para Colo-Colo...');
  const clubManager = await prisma.user.upsert({
    where: { email: 'club.colocolo@fanhub.cl' },
    update: {},
    create: {
      email: 'club.colocolo@fanhub.cl',
      name: 'Manager Colo-Colo',
      passwordHash: await bcrypt.hash('club1234', 12),
      role: Role.CLUB_MANAGER,
      teamId: colocolo.id,
      referralCode: `FH-${nanoid(8).toUpperCase()}`,
    },
  });
  await prisma.team.update({
    where: { id: colocolo.id },
    data: { clubManagerId: clubManager.id },
  });

  await prisma.challenge.upsert({
    where: { id: 'challenge-club-1' },
    update: {},
    create: {
      id: 'challenge-club-1',
      type: ChallengeType.CLUB,
      title: 'Doble Puntaje Superclásico',
      description: '¡Asiste al Superclásico Colo-Colo vs U de Chile y gana 15% de bonus en puntaje! Exclusivo para hinchas del Cacique.',
      conditionsJson: { type: 'MATCH_ATTENDANCE', matchId: 'match-local-1' },
      rewardJson: { bonusPct: 15 },
      bonusPct: 15,
      startDate: new Date('2026-04-14'),
      endDate: new Date('2026-04-16'),
      teamId: colocolo.id,
      status: 'ACTIVE',
      createdBy: clubManager.id,
    },
  });
  console.log('   ✅ Club Manager Colo-Colo + desafío de club creados\n');

  // 11. Agregar referralCode a usuarios existentes que no lo tengan
  console.log('🔗 Generando referral codes...');
  const usersWithoutCode = await prisma.user.findMany({ where: { referralCode: null } });
  for (const u of usersWithoutCode) {
    await prisma.user.update({
      where: { id: u.id },
      data: { referralCode: `FH-${nanoid(8).toUpperCase()}` },
    });
  }
  console.log(`   ✅ Referral codes generados para ${usersWithoutCode.length} usuarios\n`);

  console.log('────────────────────────────────────────');
  console.log('✅ Seed completado exitosamente!\n');
  console.log('Credenciales de prueba:');
  console.log('  Admin: admin@fanhub.cl / admin123');
  console.log('  Users: carlos@test.cl, maria@test.cl, pedro@test.cl, ana@test.cl, luis@test.cl');
  console.log('  Password usuarios: test1234');
  console.log('  Club Manager Colo-Colo: club.colocolo@fanhub.cl / club1234\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
