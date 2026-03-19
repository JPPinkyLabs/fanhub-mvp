'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';

const contentSchema = z.object({
  title: z.string().min(3, 'Mínimo 3 caracteres').max(120, 'Máximo 120 caracteres'),
  body: z.string().min(10, 'Mínimo 10 caracteres').max(2000, 'Máximo 2000 caracteres'),
  mediaUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});
type ContentForm = z.infer<typeof contentSchema>;

interface UserContent {
  id: string;
  title: string;
  body: string;
  mediaUrl: string | null;
  pointsAwarded: number;
  createdAt: string;
}

export default function ContentPage() {
  const [contents, setContents] = useState<UserContent[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ContentForm>({
    resolver: zodResolver(contentSchema),
  });

  const bodyValue = watch('body') ?? '';

  const loadContents = useCallback(async () => {
    setLoadingList(true);
    const res = await fetch('/api/content?pageSize=20');
    if (res.ok) {
      const data = await res.json() as { data: UserContent[] };
      setContents(data.data ?? []);
    }
    setLoadingList(false);
  }, []);

  useEffect(() => {
    loadContents();
  }, [loadContents]);

  const onSubmit = async (data: ContentForm) => {
    setSubmitting(true);
    setMessage(null);

    const res = await fetch('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title,
        body: data.body,
        mediaUrl: data.mediaUrl || undefined,
      }),
    });

    const body = await res.json() as {
      data?: UserContent;
      pointsAwarded?: number;
      message?: string;
      error?: unknown;
    };
    setSubmitting(false);

    if (!res.ok) {
      setMessage({ type: 'error', text: typeof body.error === 'string' ? body.error : 'Error al publicar' });
    } else {
      setMessage({ type: 'success', text: body.message ?? '¡Publicación creada!' });
      reset();
      await loadContents();
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-black mb-2">Publicaciones</h1>
      <p className="text-gray-500 text-sm mb-8">
        Comparte contenido y gana <span className="text-brand-400 font-semibold">10 pts</span> por publicación (máx 3/día).
      </p>

      {/* Form */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-6 mb-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Título</label>
            <input
              {...register('title')}
              placeholder="¿De qué trata tu publicación?"
              className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium">Contenido</label>
              <span className={cn('text-xs', bodyValue.length > 1800 ? 'text-red-400' : 'text-gray-600')}>
                {bodyValue.length}/2000
              </span>
            </div>
            <textarea
              {...register('body')}
              rows={5}
              placeholder="Cuenta tu experiencia como hincha..."
              className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors resize-none"
            />
            {errors.body && <p className="text-red-400 text-xs mt-1">{errors.body.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              URL de imagen{' '}
              <span className="text-gray-600 font-normal text-xs">(opcional — Imgur, etc.)</span>
            </label>
            <input
              {...register('mediaUrl')}
              type="url"
              placeholder="https://i.imgur.com/..."
              className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
            {errors.mediaUrl && <p className="text-red-400 text-xs mt-1">{errors.mediaUrl.message}</p>}
          </div>

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
            disabled={submitting}
            className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {submitting ? 'Publicando...' : 'Publicar'}
          </button>
        </form>
      </div>

      {/* Lista de publicaciones propias */}
      <div>
        <h2 className="font-bold mb-4">Mis publicaciones</h2>
        {loadingList ? (
          <p className="text-gray-600 text-sm text-center py-8">Cargando...</p>
        ) : contents.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-8">Aún no has publicado nada.</p>
        ) : (
          <div className="space-y-4">
            {contents.map((c) => (
              <div key={c.id} className="bg-surface-card border border-surface-border rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-semibold text-sm">{c.title}</h3>
                  {c.pointsAwarded > 0 && (
                    <span className="text-brand-400 font-bold text-sm flex-shrink-0">+{Math.round(c.pointsAwarded)} pts</span>
                  )}
                </div>
                <p className="text-sm text-gray-400 whitespace-pre-line leading-relaxed">{c.body}</p>
                {c.mediaUrl && (
                  <a
                    href={c.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-400 hover:text-brand-300 mt-2 inline-block"
                  >
                    Ver imagen →
                  </a>
                )}
                <p className="text-xs text-gray-600 mt-3">
                  {new Date(c.createdAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
