import {
  User,
  Team,
  Clan,
  ClanMembership,
  Score,
  Verification,
  Match,
  Challenge,
  ChallengeParticipation,
  Badge,
  UserBadge,
  AppConfig,
} from '@prisma/client';

// Re-exports con relaciones comunes

export type UserWithTeam = User & {
  team: Team | null;
};

export type UserWithBadges = User & {
  team: Team | null;
  userBadges: (UserBadge & { badge: Badge })[];
};

export type ClanWithTeam = Clan & {
  team: Team;
  memberships: (ClanMembership & {
    user: Pick<User, 'id' | 'name' | 'image' | 'tier'>;
  })[];
  _count: { memberships: number };
};

export type RankingEntry = {
  userId: string;
  name: string | null;
  image: string | null;
  tier: string;
  totalPoints: number;
  rank: number;
  teamId: string | null;
  activeBadges: string[];
};

export type ClanRankingEntry = {
  clanId: string;
  name: string;
  teamId: string;
  teamName: string;
  memberCount: number;
  totalPoints: number;
  rank: number;
};

export type VerificationWithUser = Verification & {
  user: Pick<User, 'id' | 'name' | 'email' | 'image'>;
  match: Match | null;
};

export type ChallengeWithParticipation = Challenge & {
  participations: ChallengeParticipation[];
  _count: { participations: number };
};

export type ScoreWithCategory = Score;

// Exported types from Prisma
export type {
  User,
  Team,
  Clan,
  ClanMembership,
  Score,
  Verification,
  Match,
  Challenge,
  ChallengeParticipation,
  Badge,
  UserBadge,
  AppConfig,
};
