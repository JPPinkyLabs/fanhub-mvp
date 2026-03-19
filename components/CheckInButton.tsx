'use client';

import { useState, useEffect } from 'react';

export default function CheckInButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'already'>('idle');
  const [points, setPoints] = useState(0);

  useEffect(() => {
    setStatus('loading');
    fetch('/api/checkin', { method: 'POST' })
      .then((r) => r.json())
      .then((d: { data?: { alreadyCheckedIn: boolean; points: number } }) => {
        if (d.data?.alreadyCheckedIn) {
          setStatus('already');
        } else {
          setPoints(d.data?.points ?? 0);
          setStatus('done');
        }
      })
      .catch(() => setStatus('idle'));
  }, []);

  if (status === 'loading') return null;

  if (status === 'already') {
    return (
      <div className="bg-surface-card border border-surface-border rounded-xl px-5 py-4 flex items-center gap-3">
        <span className="text-xl">✅</span>
        <div>
          <p className="font-semibold text-sm">Check-in de hoy completado</p>
          <p className="text-xs text-gray-500">Vuelve mañana para seguir sumando puntos</p>
        </div>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="bg-brand-600/10 border border-brand-500/30 rounded-xl px-5 py-4 flex items-center gap-3 animate-pulse-once">
        <span className="text-xl">🎉</span>
        <div>
          <p className="font-semibold text-sm text-brand-400">+{Math.round(points)} pts — ¡Check-in del día!</p>
          <p className="text-xs text-gray-500">Puntos añadidos a tu puntaje total</p>
        </div>
      </div>
    );
  }

  return null;
}
