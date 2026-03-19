import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatPoints(points: number): string {
  if (points >= 1_000_000) return `${(points / 1_000_000).toFixed(1)}M`;
  if (points >= 1_000) return `${(points / 1_000).toFixed(1)}K`;
  return Math.round(points).toLocaleString('es-CL');
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function tierLabel(tier: string): string {
  const labels: Record<string, string> = {
    FREE: 'Free',
    PREMIUM: 'Premium',
    PLATINUM: 'Platinum',
  };
  return labels[tier] ?? tier;
}

export function tierColor(tier: string): string {
  const colors: Record<string, string> = {
    FREE: 'text-gray-400',
    PREMIUM: 'text-yellow-400',
    PLATINUM: 'text-cyan-400',
  };
  return colors[tier] ?? 'text-gray-400';
}

export function badgeRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    COMMON: 'border-gray-500 text-gray-300',
    RARE: 'border-blue-500 text-blue-300',
    EPIC: 'border-purple-500 text-purple-300',
    LEGENDARY: 'border-yellow-500 text-yellow-300',
  };
  return colors[rarity] ?? 'border-gray-500 text-gray-300';
}

export function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    COUNTRY_MANAGER: 'Country Manager',
    SPORT_MANAGER: 'Sport Manager',
    CLUB_MANAGER: 'Club Manager',
    CLAN_ADMIN: 'Clan Admin',
    USER: 'Hincha',
  };
  return labels[role] ?? role;
}

export function verificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    LOCAL_ATTENDANCE: 'Partido Local',
    AWAY_ATTENDANCE: 'Partido Visita',
    INTL_ATTENDANCE: 'Partido Internacional',
    MEMBERSHIP: 'Socio del Club',
    SEASON_PASS: 'Abono de Temporada',
  };
  return labels[type] ?? type;
}

export function verificationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pendiente',
    APPROVED: 'Aprobada',
    REJECTED: 'Rechazada',
  };
  return labels[status] ?? status;
}

export function verificationStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'text-yellow-400 bg-yellow-400/10',
    APPROVED: 'text-green-400 bg-green-400/10',
    REJECTED: 'text-red-400 bg-red-400/10',
  };
  return colors[status] ?? 'text-gray-400 bg-gray-400/10';
}
