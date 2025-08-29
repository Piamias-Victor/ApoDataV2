// src/app/comparisons/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { AnimatedBackground } from '@/components/atoms/AnimatedBackground/AnimatedBackground';
import { DashboardHeader } from '@/components/organisms/DashboardHeader/DashboardHeader';
import { ComparisonSelector } from '@/components/organisms/ComparisonSelector/ComparisonSelector';

export const metadata: Metadata = {
  title: 'Comparaisons - ApoData Genesis',
  description: 'Interface de comparaison produits, laboratoires et catégories pharmaceutiques',
};

/**
 * Page Comparaisons - Design identique dashboard
 * 
 * Structure exacte :
 * - AnimatedBackground
 * - DashboardHeader avec filtres
 * - Layout glassmorphism bg-white/50 backdrop-blur-sm
 * - Padding pt-[116px] pour header
 * - Container container-apodata cohérent
 */
export default function ComparisonsPage() {
  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background animé avec blobs - IDENTIQUE dashboard */}
      <AnimatedBackground />
      
      {/* Header dashboard avec FilterBar intégrée - IDENTIQUE dashboard */}
      <DashboardHeader />
      
      {/* Contenu principal avec padding pour header + filterbar - IDENTIQUE dashboard */}
      <main className="relative z-10 pt-[116px]">
        <div className="container-apodata py-8 space-y-6">
          
          {/* Section titre - IDENTIQUE dashboard */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Comparaisons
              </h1>
              <p className="text-gray-600 mt-1">
                Comparez facilement 2 produits, laboratoires ou catégories
              </p>
            </div>
          </div>

          {/* Interface de sélection - GLASSMORPHISM IDENTIQUE dashboard */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
            <ComparisonSelector />
          </div>

          {/* Instructions d'utilisation - GLASSMORPHISM IDENTIQUE dashboard */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Comment ça fonctionne
              </h2>
            </div>
            <ol className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <span className="font-medium text-gray-900 mr-2">1.</span>
                Sélectionnez le type d'éléments à comparer
              </li>
              <li className="flex items-start">
                <span className="font-medium text-gray-900 mr-2">2.</span>
                Choisissez le premier élément via la recherche
              </li>
              <li className="flex items-start">
                <span className="font-medium text-gray-900 mr-2">3.</span>
                Choisissez le second élément via la recherche
              </li>
              <li className="flex items-start">
                <span className="font-medium text-gray-900 mr-2">4.</span>
                Cliquez sur "Comparer" pour voir les résultats détaillés
              </li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}