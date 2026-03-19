'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  // Pre-fill referral code from ?ref= query param
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setValue('referralCode', ref);
  }, [searchParams, setValue]);

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError(null);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
        referralCode: data.referralCode || undefined,
      }),
    });

    if (!res.ok) {
      const body = await res.json() as { error?: string };
      setError(body.error ?? 'Error al registrar');
      setLoading(false);
      return;
    }

    // Auto-login after register
    await signIn('credentials', { email: data.email, password: data.password, redirect: false });
    router.push('/dashboard');
  };

  const handleGoogle = () => signIn('google', { callbackUrl: '/dashboard' });

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black">Únete a FanHub</h1>
        <p className="text-gray-500 text-sm mt-1">Crea tu cuenta y empieza a sumar puntos hoy</p>
      </div>

      <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 border border-surface-border rounded-lg py-3 text-sm font-medium hover:bg-surface-elevated transition-colors mb-6"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Registrarse con Google
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-surface-border" />
          <span className="text-xs text-gray-600">o con email</span>
          <div className="flex-1 h-px bg-surface-border" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Nombre</label>
            <input
              {...register('name')}
              className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors"
              placeholder="Tu nombre de hincha"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

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

          <div>
            <label className="block text-sm font-medium mb-1.5">Contraseña</label>
            <input
              {...register('password')}
              type="password"
              className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Confirmar contraseña</label>
            <input
              {...register('confirmPassword')}
              type="password"
              className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors"
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Código de referido{' '}
              <span className="text-gray-600 font-normal text-xs">(opcional)</span>
            </label>
            <input
              {...register('referralCode')}
              className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-colors font-mono uppercase"
              placeholder="ABC123"
            />
            {errors.referralCode && <p className="text-red-400 text-xs mt-1">{errors.referralCode.message}</p>}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-gray-600 mt-6">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium">Iniciar sesión</Link>
      </p>
    </div>
  );
}

// useSearchParams must be inside a Suspense boundary
export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-sm text-center py-8 text-gray-500">Cargando...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
