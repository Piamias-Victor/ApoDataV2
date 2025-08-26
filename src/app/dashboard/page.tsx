// src/app/dashboard/page.tsx
import React from 'react';
import { AnimatedBackground } from '@/components/atoms/AnimatedBackground/AnimatedBackground';
import { DashboardHeader } from '@/components/organisms/DashboardHeader/DashboardHeader';
import { ProductsListTest } from '@/components/test/ProductsListTest';

/**
 * Dashboard Page - Page principale du dashboard ApoData
 * 
 * Layout avec header dashboard + filterbar, background animé
 * Padding ajusté pour header (64px) + filterbar (52px) = 116px
 */
export default function DashboardPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background animé avec blobs */}
      <AnimatedBackground />
      
      {/* Header dashboard avec FilterBar intégrée */}
      <DashboardHeader />
      
      {/* Contenu principal avec padding pour header + filterbar */}
      <main className="relative z-10 pt-[116px]">
        <div className="container-apodata py-8">
          <div className="text-center text-gray-500">
            <p>Contenu du dashboard à venir...</p>
            <ProductsListTest/>
            <p className="text-sm mt-2">Padding ajusté pour Header + FilterBar</p>
          </div>
        </div>
      </main>
    </div>
  );
}