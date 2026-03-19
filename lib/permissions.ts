/**
 * RBAC - Control de Acceso Basado en Roles
 * Matriz de permisos basada en la sección 2.2 del brief
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';

export type Permission =
  | 'config:read'
  | 'config:write'
  | 'users:read'
  | 'users:write'
  | 'teams:read'
  | 'teams:write'
  | 'clans:read'
  | 'clans:write'
  | 'clans:manage'
  | 'scores:read'
  | 'scores:write'
  | 'verifications:read'
  | 'verifications:approve'
  | 'challenges:read'
  | 'challenges:write'
  | 'challenges:create_internal'
  | 'challenges:create_club'
  | 'challenges:create_brand'
  | 'rankings:read'
  | 'badges:read'
  | 'badges:write'
  | 'analytics:read_own'
  | 'analytics:read_club'
  | 'analytics:read_global'
  | 'admin:access'
  | 'marketplace:read'
  | 'marketplace:write';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    'config:read', 'config:write',
    'users:read', 'users:write',
    'teams:read', 'teams:write',
    'clans:read', 'clans:write', 'clans:manage',
    'scores:read', 'scores:write',
    'verifications:read', 'verifications:approve',
    'challenges:read', 'challenges:write',
    'challenges:create_internal', 'challenges:create_club', 'challenges:create_brand',
    'rankings:read',
    'badges:read', 'badges:write',
    'analytics:read_own', 'analytics:read_club', 'analytics:read_global',
    'admin:access',
    'marketplace:read', 'marketplace:write',
  ],
  COUNTRY_MANAGER: [
    'config:read', 'config:write',
    'users:read',
    'teams:read',
    'clans:read',
    'scores:read',
    'verifications:read', 'verifications:approve',
    'challenges:read', 'challenges:write',
    'challenges:create_internal',
    'rankings:read',
    'badges:read', 'badges:write',
    'analytics:read_own', 'analytics:read_club', 'analytics:read_global',
    'admin:access',
    'marketplace:read',
  ],
  SPORT_MANAGER: [
    'config:read', 'config:write',
    'users:read',
    'teams:read',
    'clans:read',
    'scores:read',
    'verifications:read', 'verifications:approve',
    'challenges:read', 'challenges:write',
    'challenges:create_internal',
    'rankings:read',
    'badges:read', 'badges:write',
    'analytics:read_own', 'analytics:read_global',
    'admin:access',
    'marketplace:read',
  ],
  CLUB_MANAGER: [
    'config:read',
    'users:read',
    'teams:read',
    'clans:read',
    'scores:read',
    'verifications:read',
    'challenges:read', 'challenges:write',
    'challenges:create_club',
    'rankings:read',
    'badges:read',
    'analytics:read_own', 'analytics:read_club',
    'admin:access',
    'marketplace:read', 'marketplace:write',
  ],
  CLAN_ADMIN: [
    'clans:read', 'clans:manage',
    'scores:read',
    'challenges:read',
    'rankings:read',
    'badges:read',
    'analytics:read_own',
    'marketplace:read', 'marketplace:write',
  ],
  USER: [
    'clans:read',
    'scores:read',
    'challenges:read',
    'rankings:read',
    'badges:read',
    'analytics:read_own',
    'marketplace:read', 'marketplace:write',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function isAdminRole(role: Role): boolean {
  return ['SUPER_ADMIN', 'COUNTRY_MANAGER', 'SPORT_MANAGER', 'CLUB_MANAGER'].includes(role);
}

export function isSuperAdmin(role: Role): boolean {
  return role === 'SUPER_ADMIN';
}

/**
 * Helper para API routes: verifica el rol del usuario y lanza error 401/403 si no corresponde.
 * Uso:
 *   const session = await requireRole(['SUPER_ADMIN', 'SPORT_MANAGER']);
 *   if (session instanceof NextResponse) return session;
 */
export async function requireRole(
  allowedRoles: Role[],
): Promise<{ id: string; role: Role; email: string } | NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const user = session.user as { id: string; role: Role; email: string };

  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { error: 'No tienes permisos para esta acción' },
      { status: 403 },
    );
  }

  return user;
}

/**
 * Helper para API routes: verifica que el usuario esté autenticado (cualquier rol).
 */
export async function requireAuth(): Promise<
  { id: string; role: Role; email: string; tier: string } | NextResponse
> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  return session.user as { id: string; role: Role; email: string; tier: string };
}
