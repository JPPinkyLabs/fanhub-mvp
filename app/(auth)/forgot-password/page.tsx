'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Email inválido'),
});
type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (_data: Form) => {
    // TODO: Implementar envío de email de reset (NextAuth email provider / SendGrid)
    setSent(true);
  };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black">Recuperar contraseña</h1>
        <p className="text-gray-500 text-sm mt-1">Te enviaremos un enlace para restablecer tu contraseña</p>
      </div>

      <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
        {sent ? (
          <div className="text-center py-4">
            <p className="text-4xl mb-4">📧</p>
            <p className="font-semibold">¡Revisa tu email!</p>
            <p className="text-sm text-gray-400 mt-2">Te enviamos un enlace de recuperación (si el email está registrado).</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                {...register('email')}
                type="email"
                className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="tu@email.com"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <button type="submit" className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-lg transition-colors">
              Enviar enlace
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-sm text-gray-600 mt-6">
        <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium">← Volver al login</Link>
      </p>
    </div>
  );
}
