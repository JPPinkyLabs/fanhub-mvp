'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { z } from 'zod';

interface Challenge {
  id: string;
  type: 'INTERNAL' | 'CLUB' | 'BRAND';
  title: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  bonusPct: number;
  startDate: string;
  endDate: string;
  teamId: string | null;
  _count: { participations: number };
}

interface Team {
  id: string;
  name: string;
}

const createSchema = z.object({
  type: z.enum(['INTERNAL', 'CLUB', 'BRAND']),
  title: z.string().min(3).max(100),
  description: z.string().min(10),
  bonusPct: z.number().min(0).max(20),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  teamId: z.string().optional(),
});

const TYPE_COLORS: Record<string, string> = {
  INTERNAL: 'text-brand-400 bg-brand-400/10',
  CLUB: 'text-blue-400 bg-blue-400/10',
  BRAND: 'text-orange-400 bg-orange-400/10',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-gray-400 bg-gray-400/10',
  ACTIVE: 'text-green-400 bg-green-400/10',
  COMPLETED: 'text-purple-400 bg-purple-400/10',
  CANCELLED: 'text-red-400 bg-red-400/10',
};

export default function AdminChallengesPage() {
  const { data: session } = useSession();
  const isClubManager = session?.user.role === 'CLUB_MANAGER';

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    type: isClubManager ? 'CLUB' : 'INTERNAL',
    title: '',
    description: '',
    bonusPct: 0,
    startDate: '',
    endDate: '',
    teamId: '',
  });

  const loadChallenges = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ pageSize: '100' });
    // Send 'ALL' when no filter selected so API returns every status
    params.set('status', statusFilter || 'ALL');
    if (typeFilter) params.set('type', typeFilter);
    fetch(`/api/challenges?${params}`)
      .then((r) => r.json())
      .then((d: { data: Challenge[] }) => {
        setChallenges(d.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [statusFilter, typeFilter]);

  useEffect(() => { loadChallenges(); }, [loadChallenges]);

  useEffect(() => {
    fetch('/api/teams?pageSize=50')
      .then((r) => r.json())
      .then((d: { data: Team[] }) => setTeams(d.data ?? []));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const parsed = createSchema.safeParse({
      ...form,
      bonusPct: Number(form.bonusPct),
    });
    if (!parsed.success) {
      setError('Completa todos los campos correctamente.');
      return;
    }
    if (parsed.data.type === 'CLUB' && !parsed.data.teamId && !isClubManager) {
      setError('El equipo es obligatorio para desafíos de tipo Club.');
      return;
    }
    setSubmitting(true);
    const res = await fetch('/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...parsed.data,
        conditionsJson: {},
        rewardJson: {},
        startDate: new Date(parsed.data.startDate).toISOString(),
        endDate: new Date(parsed.data.endDate).toISOString(),
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ type: isClubManager ? 'CLUB' : 'INTERNAL', title: '', description: '', bonusPct: 0, startDate: '', endDate: '', teamId: '' });
      loadChallenges();
    } else {
      const d = await res.json() as { error: unknown };
      setError(typeof d.error === 'string' ? d.error : 'Error al crear desafío');
    }
  }

  async function handleStatus(id: string, status: string) {
    await fetch(`/api/challenges/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    loadChallenges();
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">{isClubManager ? 'Mis Activaciones' : 'Desafíos'}</h1>
          <p className="text-gray-500 text-sm mt-1">{challenges.length} desafíos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + Crear Desafío
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
        >
          <option value="">Todos los estados</option>
          <option value="DRAFT">Borrador</option>
          <option value="ACTIVE">Activo</option>
          <option value="COMPLETED">Completado</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
        {!isClubManager && (
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
          >
            <option value="">Todos los tipos</option>
            <option value="INTERNAL">Interno</option>
            <option value="CLUB">Club</option>
            <option value="BRAND">Marca</option>
          </select>
        )}
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-black mb-4">Crear Desafío</h2>
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Tipo</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    disabled={isClubManager}
                    className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 disabled:opacity-50"
                  >
                    {!isClubManager && <option value="INTERNAL">Interno</option>}
                    <option value="CLUB">Club</option>
                    {!isClubManager && <option value="BRAND">Marca</option>}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Bonus %</label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={form.bonusPct}
                    onChange={(e) => setForm({ ...form, bonusPct: Number(e.target.value) })}
                    className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Título</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  minLength={3}
                  maxLength={100}
                  required
                  className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  minLength={10}
                  required
                  rows={3}
                  className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Fecha inicio</label>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    required
                    className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Fecha fin</label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    required
                    className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
              {(form.type === 'CLUB' || form.type === 'BRAND') && !isClubManager && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Equipo {form.type === 'CLUB' ? '(obligatorio)' : '(opcional)'}</label>
                  <select
                    value={form.teamId}
                    onChange={(e) => setForm({ ...form, teamId: e.target.value })}
                    required={form.type === 'CLUB'}
                    className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                  >
                    <option value="">— Sin equipo —</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creando...' : 'Crear Desafío'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError(''); }}
                  className="flex-1 bg-surface-elevated border border-surface-border text-gray-300 font-semibold py-2 rounded-lg text-sm transition-colors hover:bg-surface-card"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-600">Cargando desafíos...</div>
      ) : challenges.length === 0 ? (
        <div className="text-center py-16 text-gray-600">No hay desafíos con estos filtros.</div>
      ) : (
        <div className="bg-surface-card border border-surface-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Título</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Tipo</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Estado</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Bonus</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Inicio</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Fin</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Parts.</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {challenges.map((c) => (
                <tr key={c.id} className="border-b border-surface-border last:border-0 hover:bg-surface-elevated transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.title}</p>
                    {c.teamId && <p className="text-xs text-gray-500">Equipo asignado</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${TYPE_COLORS[c.type]}`}>{c.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-brand-400 font-bold">{c.bonusPct}%</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(c.startDate).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(c.endDate).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-4 py-3 text-gray-300">{c._count.participations}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {c.status === 'DRAFT' && (
                        <button
                          onClick={() => handleStatus(c.id, 'ACTIVE')}
                          className="text-xs text-green-400 hover:text-green-300 bg-green-400/10 px-2 py-1 rounded transition-colors"
                        >
                          Activar
                        </button>
                      )}
                      {c.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleStatus(c.id, 'COMPLETED')}
                          className="text-xs text-purple-400 hover:text-purple-300 bg-purple-400/10 px-2 py-1 rounded transition-colors"
                        >
                          Completar
                        </button>
                      )}
                      {(c.status === 'DRAFT' || c.status === 'ACTIVE') && (
                        <button
                          onClick={() => handleStatus(c.id, 'CANCELLED')}
                          className="text-xs text-red-400 hover:text-red-300 bg-red-400/10 px-2 py-1 rounded transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
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
