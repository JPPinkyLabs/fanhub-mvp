'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres').max(50, 'Máximo 50 caracteres'),
  teamId: z.string().min(1, 'Selecciona un equipo'),
  description: z.string().max(500).optional(),
});
type Form = z.infer<typeof schema>;

interface Team { id: string; name: string; }

export default function NewClanPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { teamId: session?.user.teamId ?? '' },
  });

  useEffect(() => {
    fetch('/api/teams').then((r) => r.json()).then((d: { data: Team[] }) => setTeams(d.data));
  }, []);

  const onSubmit = async (data: Form) => {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/clans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const body = await res.json() as { data?: { id: string }; error?: string };
    setLoading(false);
    if (!res.ok) { setError(body.error ?? 'Error al crear clan'); return; }
    router.push(`/clans/${body.data!.id}`);
  };

  return (
    <div className="p-4 md:p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-black mb-2">Crear Clan</h1>
      <p className="text-gray-500 text-sm mb-8">Funda tu clan y lidera a los tuyos</p>

      <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Nombre del clan</label>
            <input {...register('name')} className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500" placeholder="Los Guerreros del Sur" />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Equipo</label>
            <select {...register('teamId')} className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500">
              <option value="">Selecciona equipo...</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {errors.teamId && <p className="text-red-400 text-xs mt-1">{errors.teamId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Descripción <span className="text-gray-600 font-normal">(opcional)</span></label>
            <textarea {...register('description')} rows={3} className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 resize-none" placeholder="¿De qué trata tu clan?" />
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{error}</div>}

          <button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors">
            {loading ? 'Creando clan...' : 'Crear clan'}
          </button>
        </form>
      </div>
    </div>
  );
}
