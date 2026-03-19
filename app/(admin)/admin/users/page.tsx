'use client';

import { useState, useEffect } from 'react';
import { tierColor, tierLabel, roleLabel } from '@/lib/utils';

interface User {
  id: string; email: string; name: string | null; role: string;
  tier: string; createdAt: string; team: { name: string } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ pageSize: '50' });
    if (search) params.set('search', search);
    const timer = setTimeout(() => {
      fetch(`/api/users?${params}`)
        .then((r) => r.json())
        .then((d: { data: User[]; total: number }) => {
          setUsers(d.data);
          setTotal(d.total);
          setLoading(false);
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Usuarios</h1>
        <p className="text-gray-500 text-sm mt-1">{total} usuarios registrados</p>
      </div>

      <div className="mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="w-full max-w-md bg-surface-card border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500"
        />
      </div>

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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
