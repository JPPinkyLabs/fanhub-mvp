import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const adminRoles = ['SUPER_ADMIN', 'COUNTRY_MANAGER', 'SPORT_MANAGER', 'CLUB_MANAGER'];
  if (!adminRoles.includes(session.user.role)) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar role={session.user.role} />
      <div className="flex-1 lg:ml-64">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
