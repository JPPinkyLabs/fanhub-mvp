'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  bio: z.string().max(200).optional(),
  city: z.string().optional(),
  teamId: z.string().min(1, 'Selecciona tu equipo principal'),
});

type SettingsForm = z.infer<typeof schema>;

interface Team { id: string; name: string; shortName: string; }

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SettingsForm>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const fetchData = async () => {
      const [teamsRes, meRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/me'),
      ]);
      const teamsData = await teamsRes.json() as { data: Team[] };
      const meData = await meRes.json() as { data: { name: string; bio: string; city: string; teamId: string } };
      setTeams(teamsData.data);
      reset({
        name: meData.data.name ?? '',
        bio: meData.data.bio ?? '',
        city: meData.data.city ?? '',
        teamId: meData.data.teamId ?? '',
      });
    };
    fetchData();
  }, [reset]);

  const onSubmit = async (data: SettingsForm) => {
    setLoading(true);
    await fetch('/api/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    await update();
    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push('/dashboard'), 1500);
  };

  return (
    <div className="p-4 md:p-8 max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black">Mi Perfil</h1>
        <p className="text-gray-500 text-sm mt-1">
          {!session?.user.teamId ? '¡Elige tu equipo para empezar!' : 'Actualiza tu información'}
        </p>
      </div>

      <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Nombre</label>
            <input {...register('name')} className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors" />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Equipo Principal <span className="text-brand-400">*</span></label>
            <select {...register('teamId')} className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors">
              <option value="">Selecciona tu equipo...</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {errors.teamId && <p className="text-red-400 text-xs mt-1">{errors.teamId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Ciudad</label>
            <input {...register('city')} className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors" placeholder="Tu ciudad" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Bio <span className="text-gray-600 font-normal">(200 chars)</span></label>
            <textarea {...register('bio')} rows={3} className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors resize-none" placeholder="Cuéntanos quién eres como hincha..." />
          </div>

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm text-center">
              ✅ Perfil actualizado correctamente
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors">
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}
