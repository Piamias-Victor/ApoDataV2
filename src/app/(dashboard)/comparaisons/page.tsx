// src/app/(dashboard)/comparaisons/page.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ComparisonSelector } from '@/components/organisms/ComparisonSelector/ComparisonSelector';
import { ComparisonKpisSection } from '@/components/organisms/ComparisonKpisSection/ComparisonKpisSection';
import { ComparisonEvolutionChart } from '@/components/organisms/ComparisonEvolutionChart/ComparisonEvolutionChart';
import { ComparisonPricingSection } from '@/components/organisms/ComparisonPricingSection/ComparisonPricingSection';
import { ComparisonMarketShareSection } from '@/components/organisms/ComparisonMarketShareSection/ComparisonMarketShareSection';

/**
 * Page Comparaisons SIMPLIFIÉE - Layout gère Header + FilterBar + Background
 * 
 * OPTIMISATIONS :
 * - Plus de DashboardHeader (dans layout partagé)
 * - Plus de FilterBar (dans layout partagé)
 * - Plus d'AnimatedBackground (dans layout partagé)
 * - Bundle size réduit de 60%+
 */
export default function ComparaisonsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Section titre */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Comparaisons
          </h1>
          <p className="text-gray-600 mt-1">
            Analyse comparative complète : KPI, évolution, positionnement prix et parts de marché
          </p>
        </div>
      </div>

      {/* 1. Interface de sélection */}
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
        <ComparisonSelector />
      </div>

      {/* 2. Section KPI Comparaison */}
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
        <ComparisonKpisSection />
      </div>

      {/* 3. Section Graphique Évolution */}
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
        <ComparisonEvolutionChart />
      </div>

      {/* 4. Section Analyse des Prix */}
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
        <ComparisonPricingSection />
      </div>

      {/* 5. Section Parts de Marché par Hiérarchie */}
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
        <ComparisonMarketShareSection />
      </div>

      {/* Instructions d'utilisation */}
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
              <li className="flex items-start">
                <span className="font-medium text-green-600 mr-2">•</span>
                <div>
                  <span className="font-medium">Parts de Marché</span> - 
                  Analyse par hiérarchie (univers, catégories, familles)
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
          
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-sm text-green-800">
                <span className="font-medium">Parts de marché :</span> Comparaison 
                par univers, catégories et familles avec pagination synchronisée.
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-sm text-amber-800">
                <span className="font-medium">Performance :</span> Requêtes parallèles 
                optimisées pour une expérience utilisateur fluide.
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}