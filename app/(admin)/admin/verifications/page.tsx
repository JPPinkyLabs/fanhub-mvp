'use client';

import { useState, useEffect } from 'react';
import { cn, verificationStatusColor, verificationStatusLabel, verificationTypeLabel } from '@/lib/utils';

interface Verification {
  id: string; type: string; status: string; createdAt: string;
  evidenceUrl: string | null; geoLat: number | null; geoLng: number | null;
  pointsAwarded: number | null;
  user: { id: string; name: string | null; email: string; };
  match: { homeTeam: { name: string }; awayTeam: { name: string } } | null;
}

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [processing, setProcessing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ pageSize: '50' });
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`/api/verifications?${params}`);
    const data = await res.json() as { data: Verification[] };
    setVerifications(data.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessing(id);
    await fetch(`/api/verifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    await load();
    setProcessing(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Verificaciones</h1>
        <p className="text-gray-500 text-sm mt-1">Revisar y aprobar comprobantes de asistencia</p>
      </div>

      <div className="flex gap-3 mb-6">
        {(['PENDING', 'APPROVED', 'REJECTED', ''] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'text-sm font-medium px-4 py-2 rounded-lg transition-colors',
              statusFilter === s ? 'bg-brand-600 text-white' : 'bg-surface-card border border-surface-border text-gray-400 hover:text-white',
            )}
          >
            {s === '' ? 'Todas' : verificationStatusLabel(s)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-600">Cargando...</div>
      ) : verifications.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <p className="text-4xl mb-4">✅</p>
          <p className="font-semibold">Sin verificaciones {statusFilter === 'PENDING' ? 'pendientes' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {verifications.map((v) => (
            <div key={v.id} className="bg-surface-card border border-surface-border rounded-xl p-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm">{v.user.name ?? v.user.email}</span>
                    <span className="text-xs text-gray-500">{v.user.email}</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-1">
                    <span className="font-medium text-white">{verificationTypeLabel(v.type)}</span>
                    {v.match && ` · ${v.match.homeTeam.name} vs ${v.match.awayTeam.name}`}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{new Date(v.createdAt).toLocaleDateString('es-CL')}</span>
                    {v.geoLat && <span>📍 ({v.geoLat.toFixed(4)}, {v.geoLng?.toFixed(4)})</span>}
                    {v.pointsAwarded && <span className="text-brand-400">+{Math.round(v.pointsAwarded)} pts</span>}
                  </div>
                  {v.evidenceUrl && (
                    <a href={v.evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-400 hover:underline mt-1 block">
                      Ver comprobante →
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', verificationStatusColor(v.status))}>
                    {verificationStatusLabel(v.status)}
                  </span>
                  {v.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleAction(v.id, 'approve')}
                        disabled={processing === v.id}
                        className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleAction(v.id, 'reject')}
                        disabled={processing === v.id}
                        className="bg-red-600/50 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
