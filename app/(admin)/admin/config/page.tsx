'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Config {
  id: string; key: string; value: unknown; scope: string;
  description: string | null; editableByRole: string; dataType: string;
  updatedAt: string;
}

export default function ConfigPage() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [filter, setFilter] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const params = new URLSearchParams();
    if (scopeFilter) params.set('scope', scopeFilter);
    if (filter) params.set('search', filter);
    const res = await fetch(`/api/config?${params}`);
    const data = await res.json() as { data: Config[] };
    setConfigs(data.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter, scopeFilter]);

  const startEdit = (c: Config) => {
    setEditing(c.key);
    setEditValue(JSON.stringify(c.value));
  };

  const saveEdit = async (key: string) => {
    setSaving(true);
    try {
      const parsed = JSON.parse(editValue) as unknown;
      await fetch(`/api/config/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: parsed }),
      });
      setEditing(null);
      await load();
    } catch {
      alert('Valor JSON inválido');
    }
    setSaving(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Configuración</h1>
        <p className="text-gray-500 text-sm mt-1">Todos los parámetros globales de la plataforma</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Buscar por clave..."
          className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 w-64"
        />
        <select
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value)}
          className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
        >
          <option value="">Todos los scopes</option>
          <option value="GLOBAL">Global</option>
          <option value="COUNTRY">País</option>
          <option value="SPORT">Deporte</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-600">Cargando configuración...</div>
      ) : (
        <div className="bg-surface-card border border-surface-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Clave</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Valor</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Scope</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Tipo</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Descripción</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {configs.map((c) => (
                <tr key={c.key} className="border-b border-surface-border last:border-0 hover:bg-surface-elevated transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-brand-400">{c.key}</td>
                  <td className="px-4 py-3">
                    {editing === c.key ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="bg-surface-elevated border border-brand-500 rounded px-2 py-1 text-sm w-32 font-mono focus:outline-none"
                          onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(c.key); if (e.key === 'Escape') setEditing(null); }}
                          autoFocus
                        />
                        <button onClick={() => saveEdit(c.key)} disabled={saving} className="text-xs bg-brand-600 text-white px-2 py-1 rounded hover:bg-brand-500">
                          {saving ? '...' : '✓'}
                        </button>
                        <button onClick={() => setEditing(null)} className="text-xs text-gray-500 hover:text-white px-2 py-1">✕</button>
                      </div>
                    ) : (
                      <span className="font-mono text-white">{JSON.stringify(c.value)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-xs font-semibold px-2 py-0.5 rounded-full',
                      c.scope === 'GLOBAL' ? 'bg-brand-500/10 text-brand-400' :
                      c.scope === 'COUNTRY' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-purple-500/10 text-purple-400',
                    )}>
                      {c.scope}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{c.dataType}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{c.description ?? '—'}</td>
                  <td className="px-4 py-3">
                    {editing !== c.key && (
                      <button onClick={() => startEdit(c)} className="text-xs text-brand-400 hover:text-brand-300 font-medium">
                        Editar
                      </button>
                    )}
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
