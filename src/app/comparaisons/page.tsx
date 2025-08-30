// src/app/comparisons/page.tsx
import React from 'react';
import { Metadata } from 'next';
import { AnimatedBackground } from '@/components/atoms/AnimatedBackground/AnimatedBackground';
import { DashboardHeader } from '@/components/organisms/DashboardHeader/DashboardHeader';
import { ComparisonSelector } from '@/components/organisms/ComparisonSelector/ComparisonSelector';
import { ComparisonKpisSection } from '@/components/organisms/ComparisonKpisSection/ComparisonKpisSection';
import { ComparisonEvolutionChart } from '@/components/organisms/ComparisonEvolutionChart/ComparisonEvolutionChart';
import { ComparisonPriceAnalysis } from '@/components/organisms/ComparisonPriceAnalysis/ComparisonPriceAnalysis';

export const metadata: Metadata = {
  title: 'Comparaisons - ApoData Genesis',
  description: 'Interface de comparaison produits, laboratoires et catégories pharmaceutiques avec analyse KPI, évolution temporelle et positionnement prix',
};

/**
 * Page Comparaisons - Interface complète analyse comparative
 * 
 * Architecture workflow :
 * 1. ComparisonSelector - Sélection type + éléments A/B
 * 2. ComparisonKpisSection - Métriques KPI côte à côte
 * 3. ComparisonEvolutionChart - Évolution temporelle A vs B
 * 4. ComparisonPriceAnalysis - Positionnement concurrentiel prix
 * 5. Instructions - Guide utilisateur
 * 
 * Design cohérent :
 * - AnimatedBackground + DashboardHeader identiques
 * - Layout glassmorphism bg-white/50 backdrop-blur-sm
 * - Container container-apodata + espacement uniforme
 * - États loading/empty/error harmonisés
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
                Analyse comparative complète : KPI, évolution et positionnement prix
              </p>
            </div>
          </div>

          {/* 1. Interface de sélection - GLASSMORPHISM IDENTIQUE dashboard */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
            <ComparisonSelector />
          </div>

          {/* 2. Section KPI Comparaison - GLASSMORPHISM IDENTIQUE dashboard */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
            <ComparisonKpisSection />
          </div>

          {/* 3. Section Graphique Évolution - GLASSMORPHISM IDENTIQUE dashboard */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
            <ComparisonEvolutionChart />
          </div>

          {/* 4. Section Analyse Prix Concurrentielle - GLASSMORPHISM IDENTIQUE dashboard */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
            <ComparisonPriceAnalysis />
          </div>

          {/* Instructions d'utilisation - GLASSMORPHISM IDENTIQUE dashboard */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Guide d'utilisation
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Étapes workflow */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Étapes de comparaison
                </h3>
                <ol className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <span className="font-medium text-blue-600 mr-2">1.</span>
                    Sélectionnez le type d'éléments (produits, laboratoires, catégories)
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium text-blue-600 mr-2">2.</span>
                    Choisissez le premier élément A via la recherche
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium text-blue-600 mr-2">3.</span>
                    Choisissez le second élément B via la recherche
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium text-blue-600 mr-2">4.</span>
                    Analysez les métriques qui s'affichent automatiquement
                  </li>
                </ol>
              </div>

              {/* Sections d'analyse */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Sections d'analyse
                </h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <span className="font-medium text-emerald-600 mr-2">•</span>
                    <div>
                      <span className="font-medium">KPI Performance</span> - 
                      Métriques CA, marge, volumes, stock côte à côte
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium text-blue-600 mr-2">•</span>
                    <div>
                      <span className="font-medium">Évolution Temporelle</span> - 
                      Graphiques comparatifs sur la période sélectionnée
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium text-purple-600 mr-2">•</span>
                    <div>
                      <span className="font-medium">Positionnement Prix</span> - 
                      Analyse concurrentielle vs marché
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Notes techniques */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="text-sm text-blue-800">
                    <span className="font-medium">Période d'analyse :</span> Utilise 
                    automatiquement la période définie dans les filtres globaux.
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="text-sm text-emerald-800">
                    <span className="font-medium">Mise à jour :</span> Les données sont 
                    calculées en temps réel depuis votre base de données.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}