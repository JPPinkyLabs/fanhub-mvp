export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RankingQuery {
  teamId?: string;
  period?: 'weekly' | 'monthly' | 'season';
  page?: number;
  pageSize?: number;
}

export interface CreateVerificationBody {
  type: string;
  matchId?: string;
  geoLat?: number;
  geoLng?: number;
  evidenceUrl?: string;
}

export interface CreateClanBody {
  name: string;
  teamId: string;
  description?: string;
  emblemConfig?: Record<string, unknown>;
}

export interface CreateChallengeBody {
  type: string;
  title: string;
  description: string;
  conditionsJson: Record<string, unknown>;
  rewardJson: Record<string, unknown>;
  bonusPct?: number;
  startDate: string;
  endDate: string;
  teamId?: string;
}

export interface UpdateConfigBody {
  value: unknown;
  description?: string;
}
