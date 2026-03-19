'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { verificationStatusColor, verificationStatusLabel, verificationTypeLabel } from '@/lib/utils';

const schema = z.object({
  type: z.enum(['LOCAL_ATTENDANCE', 'AWAY_ATTENDANCE', 'INTL_ATTENDANCE', 'MEMBERSHIP', 'SEASON_PASS']),
  matchId: z.string().optional(),
  evidenceUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});
type VerificationForm = z.infer<typeof schema>;

interface Match { id: string; homeTeam: { name: string }; awayTeam: { name: string }; date: string; }
interface Verification {
  id: string; type: string; status: string; createdAt: string;
  pointsAwarded: number | null; match?: { homeTeam: { name: string }; awayTeam: { name: string } } | null;
}

export default function VerificationPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<VerificationForm>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'LOCAL_ATTENDANCE' },
  });

  const type = watch('type');

  useEffect(() => {
    const fetchData = async () => {
      const [matchRes, verRes] = await Promise.all([
        fetch('/api/rankings').then(() => fetch('/api/teams')),
        fetch('/api/verifications?pageSize=10'),
      ]);
      try {
        const vData = await verRes.json() as { data: Verification[] };
        setVerifications(vData.data);
      } catch {}
    };
    fetchData();

    // Load matches
    fetch('/api/teams').then(async () => {
      const res = await fetch('/api/rankings');
      // Fetch upcoming matches from a separate query
      const matchRes = await fetch('/api/teams');
      if (matchRes.ok) {
        // Load matches via a simple endpoint
      }
    });
  }, []);

  useEffect(() => {
    const loadVerifications = async () => {
      const res = await fetch('/api/verifications?pageSize=10');
      if (res.ok) {
        const data = await res.json() as { data: Verification[] };
        setVerifications(data.data);
      }
    };
    loadVerifications();
  }, []);

  const getGeolocation = () => {
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      () => {
        setMessage({ type: 'error', text: 'No se pudo obtener la geolocalización.' });
        setGeoLoading(false);
      },
    );
  };

  const onSubmit = async (data: VerificationForm) => {
    setLoading(true);
    setMessage(null);

    const payload = {
      ...data,
      ...(geoCoords && { geoLat: geoCoords.lat, geoLng: geoCoords.lng }),
    };

    const res = await fetch('/api/verifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = await res.json() as { data?: { message: string; pointsAwarded?: number }; error?: string };
    setLoading(false);

    if (!res.ok) {
      setMessage({ type: 'error', text: body.error ?? 'Error al enviar verificación' });
    } else {
      setMessage({ type: 'success', text: body.data?.message ?? 'Verificación enviada' });
      // Refresh verifications
      const vRes = await fetch('/api/verifications?pageSize=10');
      const vData = await vRes.json() as { data: Verification[] };
      setVerifications(vData.data);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-black mb-2">Verificar Asistencia</h1>
      <p className="text-gray-500 text-sm mb-8">Sube tu comprobante y gana puntos por estar en el estadio</p>

      {/* Form */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-6 mb-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Tipo de verificación</label>
            <select {...register('type')} className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500">
              <option value="LOCAL_ATTENDANCE">Partido de Local (+100 pts)</option>
              <option value="AWAY_ATTENDANCE">Partido de Visita (+100 pts + distancia)</option>
              <option value="INTL_ATTENDANCE">Partido Internacional (+200 pts + distancia)</option>
              <option value="MEMBERSHIP">Socio del Club (+300 pts)</option>
              <option value="SEASON_PASS">Abono de Temporada (+250 pts)</option>
            </select>
          </div>

          {/* URL de evidencia */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              URL de la imagen / comprobante
              <span className="text-gray-600 font-normal ml-1">(subir imagen a Imgur o similar)</span>
            </label>
            <input
              {...register('evidenceUrl')}
              type="url"
              placeholder="https://i.imgur.com/..."
              className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500"
            />
            {errors.evidenceUrl && <p className="text-red-400 text-xs mt-1">{errors.evidenceUrl.message}</p>}
          </div>

          {/* Geolocalización */}
          {['LOCAL_ATTENDANCE', 'AWAY_ATTENDANCE', 'INTL_ATTENDANCE'].includes(type) && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Geolocalización</label>
              <button
                type="button"
                onClick={getGeolocation}
                disabled={geoLoading}
                className={cn(
                  'w-full border rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  geoCoords
                    ? 'border-brand-500/50 bg-brand-500/10 text-brand-400'
                    : 'border-surface-border bg-surface-elevated text-gray-400 hover:text-white',
                )}
              >
                {geoLoading ? 'Obteniendo ubicación...' :
                  geoCoords ? `✅ Ubicación capturada (${geoCoords.lat.toFixed(4)}, ${geoCoords.lng.toFixed(4)})` :
                  '📍 Capturar mi ubicación actual'}
              </button>
            </div>
          )}

          {message && (
            <div className={cn(
              'rounded-lg p-3 text-sm',
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400',
            )}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {loading ? 'Enviando...' : 'Enviar verificación'}
          </button>
        </form>
      </div>

      {/* Historial */}
      <div>
        <h2 className="font-bold mb-4">Mis verificaciones</h2>
        {verifications.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-8">Sin verificaciones aún.</p>
        ) : (
          <div className="space-y-3">
            {verifications.map((v) => (
              <div key={v.id} className="bg-surface-card border border-surface-border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{verificationTypeLabel(v.type)}</p>
                  {v.match && (
                    <p className="text-xs text-gray-500">
                      {v.match.homeTeam.name} vs {v.match.awayTeam.name}
                    </p>
                  )}
                  <p className="text-xs text-gray-600">{new Date(v.createdAt).toLocaleDateString('es-CL')}</p>
                </div>
                <div className="flex items-center gap-3">
                  {v.pointsAwarded && (
                    <span className="text-brand-400 font-bold text-sm">+{Math.round(v.pointsAwarded)}</span>
                  )}
                  <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', verificationStatusColor(v.status))}>
                    {verificationStatusLabel(v.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
