// src/app/(dashboard)/pharmacies/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Page Pharmacies - Accès Admin Uniquement
 * 
 * SÉCURITÉ : Vérification côté serveur des droits admin
 * LAYOUT : Utilise le DashboardLayout partagé avec Header + FilterBar
 * STATUS : Page vide pour l'instant, prête pour développement futur
 */
export default async function PharmaciesPage() {
  const session = await getServerSession(authOptions);
  
  // Protection admin - redirection si pas admin
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-8">
      {/* Header page */}
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestion des Pharmacies
            </h1>
            <p className="text-gray-600">
              Administration des pharmacies du réseau ApoData
            </p>
          </div>
          
          {/* Badge Admin */}
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-semibold rounded-full">
              Admin uniquement
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal - Section vide pour le moment */}
      <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-12 border border-white/20 shadow-soft text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0v-4a2 2 0 011-1h1m0-6V9a2 2 0 011-1h1m0-3h4" />
            </svg>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Page Pharmacies
          </h3>
          
          <p className="text-gray-600 text-sm">
            Cette page est en cours de développement. Les fonctionnalités de gestion des pharmacies seront ajoutées prochainement.
          </p>
        </div>
      </div>
    </div>
  );
}