// src/app/comparisons/loading.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';
import { AnimatedBackground } from '@/components/atoms/AnimatedBackground/AnimatedBackground';
import { DashboardHeader } from '@/components/organisms/DashboardHeader/DashboardHeader';

/**
 * Loading State - Page comparaisons - DESIGN IDENTIQUE DASHBOARD
 * 
 * Structure exacte dashboard :
 * - AnimatedBackground
 * - DashboardHeader 
 * - Glassmorphism bg-white/50 backdrop-blur-sm
 * - Layout container-apodata + pt-[116px]
 */
export default function ComparisonsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background animé avec blobs - IDENTIQUE dashboard */}
      <AnimatedBackground />
      
      {/* Header dashboard avec FilterBar intégrée - IDENTIQUE dashboard */}
      <DashboardHeader />
      
      {/* Contenu principal avec padding pour header + filterbar - IDENTIQUE dashboard */}
      <main className="relative z-10 pt-[116px]">
        <div className="container-apodata py-8 space-y-6">
          
          {/* Skeleton Header - IDENTIQUE dashboard */}
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-gray-200 rounded-lg w-48 mb-2 animate-pulse" />
              <div className="h-5 bg-gray-200 rounded-lg w-96 animate-pulse" />
            </div>
          </div>

          {/* Skeleton Interface - GLASSMORPHISM IDENTIQUE dashboard */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
            <div className="space-y-6">
              {/* Skeleton Type Selector */}
              <div>
                <div className="h-6 bg-gray-200 rounded w-64 mb-4 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i}
                      className="h-24 bg-gray-100 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              </div>

              {/* Skeleton Cards A/B */}
              <div>
                <div className="h-6 bg-gray-200 rounded w-72 mb-4 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2].map((i) => (
                    <div 
                      key={i}
                      className="h-32 bg-gray-100 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              </div>

              {/* Skeleton Actions */}
              <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            </div>
          </div>

          {/* Skeleton Instructions - GLASSMORPHISM IDENTIQUE dashboard */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </div>

          {/* Loading indicator central - IDENTIQUE dashboard */}
          <div className="fixed inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm z-50">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chargement
              </h3>
              <p className="text-sm text-gray-600">
                Préparation de l'interface de comparaisons...
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}