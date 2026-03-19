'use client';

import { useState, useEffect, useCallback } from 'react';
import { tierColor, tierLabel, roleLabel } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  tier: string;
  teamId: string | null;
  createdAt: string;
  team: { name: string } | null;
}

interface Team {
  id: string;
  name: string;
}

const ROLES = ['USER', 'CLAN_ADMIN', 'CLUB_MANAGER', 'SPORT_MANAGER', 'COUNTRY_MANAGER'];
const TIERS = ['FREE', 'PREMIUM', 'PLATINUM'];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', name: '', password: '', role: 'USER', teamId: '' });
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ role: '', tier: '', teamId: '' });
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ pageSize: '50' });
    if (search) params.set('search', search);
    fetch(`/api/users?${params}`)
      .then((r) => r.json())
      .then((d: { data: User[]; total: number }) => {
        setUsers(d.data ?? []);
        setTotal(d.total);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(loadUsers, 300);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  useEffect(() => {
    fetch('/api/teams?pageSize=50')
      .then((r) => r.json())
      .then((d: { data: Team[] }) => setTeams(d.data ?? []));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: createForm.email,
        name: createForm.name,
        password: createForm.password,
        role: createForm.role,
        ...(createForm.teamId && { teamId: createForm.teamId }),
      }),
    });
    setCreating(false);
    if (res.ok) {
      setShowCreate(false);
      setCreateForm({ email: '', name: '', password: '', role: 'USER', teamId: '' });
      loadUsers();
    } else {
      const d = await res.json() as { error: unknown };
      setCreateError(typeof d.error === 'string' ? d.error : 'Error al crear usuario');
    }
  }

  function openEdit(u: User) {
    setEditUser(u);
    setEditForm({ role: u.role, tier: u.tier, teamId: u.teamId ?? '' });
    setEditError('');
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setEditError('');
    setSaving(true);
    const res = await fetch(`/api/users/${editUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: editForm.role,
        tier: editForm.tier,
        teamId: editForm.teamId || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setEditUser(null);
      loadUsers();
    } else {
      const d = await res.json() as { error: unknown };
      setEditError(typeof d.error === 'string' ? d.error : 'Error al guardar cambios');
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Usuarios</h1>
          <p className="text-gray-500 text-sm mt-1">{total} usuarios registrados</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateError(''); }}
          className="bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + Crear Usuario
        </button>
      </div>

      <div className="mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="w-full max-w-md bg-surface-card border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-black mb-4">Crear Usuario</h2>
            {createError && <p className="text-red-400 text-sm mb-3">{createError}</p>}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                  className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nombre</label>
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                  minLength={2}
                  className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Contraseña</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Rol</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
                </select>
              </div>
              {createForm.role === 'CLUB_MANAGER' && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Equipo (obligatorio)</label>
                  <select
                    value={createForm.teamId}
                    onChange={(e) => setCreateForm({ ...createForm, teamId: e.target.value })}
                    required
                    className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                  >
                    <option value="">— Seleccionar equipo —</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creando...' : 'Crear Usuario'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 bg-surface-elevated border border-surface-border text-gray-300 font-semibold py-2 rounded-lg text-sm hover:bg-surface-card transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-black mb-1">Editar Usuario</h2>
            <p className="text-gray-500 text-sm mb-4">{editUser.name} · {editUser.email}</p>
            {editError && <p className="text-red-400 text-sm mb-3">{editError}</p>}
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Rol</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tier</label>
                <select
                  value={editForm.tier}
                  onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                  className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                >
                  {TIERS.map((t) => <option key={t} value={t}>{tierLabel(t)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Equipo</label>
                <select
                  value={editForm.teamId}
                  onChange={(e) => setEditForm({ ...editForm, teamId: e.target.value })}
                  className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                >
                  <option value="">— Sin equipo —</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="flex-1 bg-surface-elevated border border-surface-border text-gray-300 font-semibold py-2 rounded-lg text-sm hover:bg-surface-card transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-600">Cargando usuarios...</div>
      ) : (
        <div className="bg-surface-card border border-surface-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Usuario</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Rol</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Tier</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Equipo</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Registrado</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-surface-border last:border-0 hover:bg-surface-elevated transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{u.name ?? '—'}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-surface-elevated px-2 py-1 rounded-full">{roleLabel(u.role)}</span>
                  </td>
                  <td className={`px-4 py-3 text-xs font-semibold ${tierColor(u.tier)}`}>{tierLabel(u.tier)}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{u.team?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString('es-CL')}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openEdit(u)}
                      className="text-xs text-brand-400 hover:text-brand-300 bg-brand-400/10 px-2 py-1 rounded transition-colors"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
