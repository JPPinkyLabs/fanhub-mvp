import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  const [userCount, pendingVerifications, activeChallenges, clanCount] = await Promise.all([
    prisma.user.count(),
    prisma.verification.count({ where: { status: 'PENDING' } }),
    prisma.challenge.count({ where: { status: 'ACTIVE' } }),
    prisma.clan.count({ where: { status: 'ACTIVE' } }),
  ]);

  const cards = [
    { label: 'Usuarios', value: userCount, href: '/admin/users', icon: '👥', accent: false },
    { label: 'Verificaciones Pendientes', value: pendingVerifications, href: '/admin/verifications', icon: '⏳', accent: pendingVerifications > 0 },
    { label: 'Desafíos Activos', value: activeChallenges, href: '/admin/challenges', icon: '⚡', accent: false },
    { label: 'Clanes Activos', value: clanCount, href: '/dashboard', icon: '🛡️', accent: false },
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black">Panel Admin</h1>
        <p className="text-gray-500 text-sm mt-1">Bienvenido, {session?.user.name ?? session?.user.email} · {session?.user.role}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className={`bg-surface-card border rounded-xl p-5 hover:border-brand-500/30 transition-colors ${c.accent ? 'border-yellow-500/30' : 'border-surface-border'}`}>
            <div className="text-2xl mb-2">{c.icon}</div>
            <div className={`text-3xl font-black ${c.accent ? 'text-yellow-400' : 'text-white'}`}>{c.value}</div>
            <div className="text-xs text-gray-500 mt-1">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { href: '/admin/config', title: 'Configuración', desc: 'Editar parámetros globales de la plataforma (puntajes, multiplicadores, cooldowns)', icon: '⚙️' },
          { href: '/admin/verifications', title: 'Verificaciones', desc: 'Revisar y aprobar/rechazar verificaciones de asistencia pendientes', icon: '✅' },
          { href: '/admin/users', title: 'Gestión de Usuarios', desc: 'Ver, buscar y gestionar roles y tiers de los usuarios', icon: '👥' },
          { href: '/admin/challenges', title: 'Desafíos', desc: 'Crear y gestionar desafíos internos, de club y de marca', icon: '⚡' },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="bg-surface-card border border-surface-border hover:border-brand-500/30 rounded-xl p-5 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">{item.icon}</span>
              <h2 className="font-bold">{item.title}</h2>
            </div>
            <p className="text-sm text-gray-400">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
