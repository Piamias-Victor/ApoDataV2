// src/app/admin/layout.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AnimatedBackground } from '@/components/atoms/AnimatedBackground/AnimatedBackground';
import { Header } from '@/components/organisms/Header/Header';


interface AdminLayoutProps {
  readonly children: React.ReactNode;
}

/**
 * Layout Admin - Protection des routes admin
 * Redirige automatiquement si non-admin
 */
export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions);
  
  // Vérification des droits admin
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/dashboard');
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/20">
      <AnimatedBackground />
      <Header />
      <div className="pt-16">
        {children}
      </div>
    </div>
  );
}