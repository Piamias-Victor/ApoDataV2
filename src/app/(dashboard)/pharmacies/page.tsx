// src/app/(dashboard)/pharmacies/page.tsx
'use client';

import React from 'react';
import { redirect } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Info, TrendingUp, Building2, Map } from 'lucide-react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { PharmaciesKpisSection } from '@/components/organisms/PharmaciesKpisSection/PharmaciesKpisSection';
import { PharmaciesTableAnalytics } from '@/components/organisms/PharmaciesTable/PharmaciesTableAnalytics';
import { PharmaciesGeographicSection } from '@/components/organisms/PharmaciesGeographicSection/PharmaciesGeographicSection';
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
 * FEATURES : KPIs d'analyse pharmacies avec filtres + Tableau analytics + Cartographie géographique
 */
export default function PharmaciesPage() {
  const { data: session, status } = useSession();
  
  // Store filtres globaux
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const comparisonDateRange = useFiltersStore((state) => state.comparisonDateRange);
  
  // Hook analytics pharmacies
  const { 
    pharmacies, 
    isLoading: isLoadingAnalytics, 
    error: analyticsError, 
    refetch: refetchAnalytics,
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

    geographic: `Cartographie interactive des performances par région française :

- Visualisation géographique : Intensité couleur basée sur métriques sélectionnées
- Métriques disponibles : CA total, nombre de pharmacies, CA moyen par pharmacie
- Hover interactif : Détails instantanés au survol des régions
- Classement régional : Top 10 des régions les plus performantes

Identifiez rapidement les zones géographiques prioritaires pour vos actions commerciales.`
  };

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

      {/* Section Cartographie Géographique */}
      <SectionWithHelp
        title="Répartition Géographique"
        description="Visualisez la performance de vos produits par région française avec cartographie interactive et métriques détaillées"
        tooltipContent={tooltips.geographic}
        icon={<Map className="w-5 h-5 text-purple-600" />}
      >
        <PharmaciesGeographicSection
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
    </motion.div>
  );
}