// src/app/(dashboard)/pharmacies/page.tsx
'use client';

import React from 'react';
import { redirect } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Info, TrendingUp, BarChart3, Building2 } from 'lucide-react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { PharmaciesKpisSection } from '@/components/organisms/PharmaciesKpisSection/PharmaciesKpisSection';
import { PharmaciesTableAnalytics } from '@/components/organisms/PharmaciesTable/PharmaciesTableAnalytics';
import { usePharmaciesAnalytics } from '@/hooks/pharmacies/usePharmaciesAnalytics';

/**
 * Composant Tooltip réutilisable
 */
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 ${positionClasses[position]}`}>
          <div className="bg-white/95 backdrop-blur-lg text-gray-800 text-sm rounded-xl px-6 py-4 w-[600px] shadow-2xl border border-white/20">
            <div className="whitespace-pre-line leading-relaxed">{content}</div>
            {/* Flèche du tooltip */}
            <div 
              className={`absolute w-3 h-3 bg-white/95 border border-white/20 transform rotate-45 ${
                position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1.5' :
                position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1.5' :
                position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1.5' :
                'right-full top-1/2 -translate-y-1/2 -mr-1.5'
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Composant Section avec description et tooltip
 */
interface SectionWithHelpProps {
  title: string;
  description: string;
  tooltipContent: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const SectionWithHelp: React.FC<SectionWithHelpProps> = ({
  title,
  description,
  tooltipContent,
  icon,
  children,
  className = ''
}) => {
  return (
    <div className={`bg-white/50 backdrop-blur-sm rounded-2xl p-6 ${className}`}>
      {/* Header avec titre, description et tooltip */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
              {icon}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <Tooltip content={tooltipContent} position="right">
              <Info className="w-4 h-4 text-gray-400 hover:text-blue-600 cursor-help transition-colors" />
            </Tooltip>
          </div>
        </div>
        
        {/* Description toujours visible */}
        <p className="text-sm text-gray-700 bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2 border-l-4 border-blue-300 shadow-sm">
          💡 {description}
        </p>
      </div>
      
      {children}
    </div>
  );
};

/**
 * Page Pharmacies - Accès Admin Uniquement avec descriptions et tooltips
 * 
 * SÉCURITÉ : Vérification côté client + serveur des droits admin
 * LAYOUT : Utilise le DashboardLayout partagé avec Header + FilterBar
 * FEATURES : KPIs d'analyse pharmacies avec filtres + Tableau analytics
 */
export default function PharmaciesPage() {
  const { data: session, status } = useSession();
  
  // Store filtres globaux
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const comparisonDateRange = useFiltersStore((state) => state.comparisonDateRange);
  const productsFilter = useFiltersStore((state) => state.products);
  const laboratoriesFilter = useFiltersStore((state) => state.laboratories);
  const categoriesFilter = useFiltersStore((state) => state.categories);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);
  
  // Hook analytics pharmacies
  const { 
    pharmacies, 
    count,
    isLoading: isLoadingAnalytics, 
    error: analyticsError, 
    refetch: refetchAnalytics,
    queryTime,
    cached 
  } = usePharmaciesAnalytics();
  
  // Protection admin - redirection si pas admin
  if (status === 'loading') {
    return (
      <div className="space-y-8">
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-soft animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }
  
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/dashboard');
    return null;
  }

  // Vérification comparaison active
  const hasComparison = comparisonDateRange?.start && comparisonDateRange?.end;

  const handleRefresh = () => {
    refetchAnalytics();
  };

  // Contenu des tooltips
  const tooltips = {
    kpis: `Indicateurs de performance du réseau pharmaceutique :

- CA Total Réseau : Chiffre d'affaires global de vos pharmacies
- Marge Moyenne : Rentabilité moyenne du réseau
- Parts de Marché : Répartition des ventes par officine
- Croissance : Évolution des performances vs période précédente

Analysez la performance globale et identifiez les pharmacies les plus performantes.`,

    table: `Tableau analytique détaillé par pharmacie :

- Performance individuelle : CA, quantités, marges par officine
- Évolution temporelle : Croissance vs période de comparaison
- Évolution relative : Positionnement vs médiane du réseau
- Parts de marché : Contribution de chaque pharmacie au total

Triez et filtrez pour identifier opportunités d'amélioration et bonnes pratiques.`,

    future: `Modules d'analyse avancée en développement :

- Géolocalisation : Cartographie des performances par zone
- Segmentation clients : Typologie de pharmacies performantes
- Prédictions : Modèles de forecast par officine
- Benchmarking : Comparaisons sectorielles approfondies

Ces fonctionnalités enrichiront votre analyse du réseau pharmaceutique.`
  };

  // Fusion codes produits pour affichage
  const allProductCodes = Array.from(new Set([
    ...productsFilter,
    ...laboratoriesFilter,
    ...categoriesFilter
  ]));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Header page */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900">
              Analyse Pharmacies
            </h1>
            <Tooltip 
              content="Module d'analyse des performances du réseau pharmaceutique avec comparaisons, évolutions et benchmarking inter-pharmacies"
              position="bottom"
            >
              <Info className="w-5 h-5 text-gray-400 hover:text-blue-600 cursor-help transition-colors" />
            </Tooltip>
          </div>
          <p className="text-gray-600 mt-1">
            Analysez la performance de vos produits à travers le réseau pharmaceutique
          </p>
        </div>
        
        {/* Indicateurs performance + Badge Admin */}
        <div className="flex items-center space-x-4">
          {/* Métriques performance */}
          {count > 0 && (
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              {cached && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Cache</span>
                </div>
              )}
              <span>{queryTime}ms</span>
              <span>{count} pharmacie{count > 1 ? 's' : ''}</span>
              
              {/* Indicateurs filtres appliqués */}
              {productsFilter.length > 0 && (
                <span className="text-blue-600 font-medium">
                  {productsFilter.length} produit{productsFilter.length > 1 ? 's' : ''}
                </span>
              )}
              {laboratoriesFilter.length > 0 && (
                <span className="text-purple-600 font-medium">
                  {laboratoriesFilter.length} labo{laboratoriesFilter.length > 1 ? 's' : ''}
                </span>
              )}
              {categoriesFilter.length > 0 && (
                <span className="text-green-600 font-medium">
                  {categoriesFilter.length} catégorie{categoriesFilter.length > 1 ? 's' : ''}
                </span>
              )}
              {pharmacyFilter.length > 0 && (
                <span className="text-orange-600 font-medium">
                  {pharmacyFilter.length} pharmacie{pharmacyFilter.length > 1 ? 's' : ''} filtrée{pharmacyFilter.length > 1 ? 's' : ''}
                </span>
              )}
              {allProductCodes.length > 0 && (
                <span className="text-gray-700 font-medium bg-gray-200 px-2 py-1 rounded">
                  {allProductCodes.length} codes EAN total
                </span>
              )}
            </div>
          )}
          
          {/* Badge Admin */}
          <div className="px-3 py-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-semibold rounded-full">
            Admin uniquement
          </div>
        </div>
      </div>

      {/* Section KPIs Pharmacies avec description + tooltip */}
      <SectionWithHelp
        title="Indicateurs de Performance Réseau"
        description="Analysez les KPI globaux du réseau pharmaceutique : CA total, marges moyennes et évolutions comparatives"
        tooltipContent={tooltips.kpis}
        icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
      >
        <PharmaciesKpisSection
          dateRange={analysisDateRange}
          comparisonDateRange={comparisonDateRange}
          includeComparison={!!hasComparison}
        />
      </SectionWithHelp>

      {/* Tableau Analytics Pharmacies avec description + tooltip */}
      <SectionWithHelp
        title="Tableau Détaillé des Performances"
        description="Analyse comparative complète par pharmacie avec métriques de performance, évolutions temporelles et positionnement relatif"
        tooltipContent={tooltips.table}
        icon={<Building2 className="w-5 h-5 text-green-600" />}
      >
        <PharmaciesTableAnalytics
          pharmacies={pharmacies}
          isLoading={isLoadingAnalytics}
          error={analyticsError}
          onRefresh={handleRefresh}
        />
      </SectionWithHelp>

      {/* Section placeholder pour modules futurs avec description + tooltip */}
      <SectionWithHelp
        title="Analyses Avancées"
        description="Modules d'analyse géographique, segmentation et prédictions en cours de développement pour enrichir votre vision du réseau"
        tooltipContent={tooltips.future}
        icon={<BarChart3 className="w-5 h-5 text-purple-600" />}
      >
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Modules à venir
            </h3>
            
            <p className="text-gray-600 text-sm mb-4">
              Cartographie géographique, segmentation avancée et analyses prédictives en cours de développement.
            </p>
            
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
              <div className="bg-white/40 rounded-lg p-3">
                <div className="font-medium text-green-600 mb-1">🗺️ Géolocalisation</div>
                <div>Cartographie des performances par zone géographique</div>
              </div>
              
              <div className="bg-white/40 rounded-lg p-3">
                <div className="font-medium text-blue-600 mb-1">🎯 Segmentation</div>
                <div>Typologie et clustering des pharmacies</div>
              </div>
              
              <div className="bg-white/40 rounded-lg p-3">
                <div className="font-medium text-purple-600 mb-1">📈 Prédictions</div>
                <div>Modèles de forecast par officine</div>
              </div>
              
              <div className="bg-white/40 rounded-lg p-3">
                <div className="font-medium text-orange-600 mb-1">⚖️ Benchmarking</div>
                <div>Comparaisons sectorielles approfondies</div>
              </div>
            </div>
          </div>
        </div>
      </SectionWithHelp>
    </motion.div>
  );
}