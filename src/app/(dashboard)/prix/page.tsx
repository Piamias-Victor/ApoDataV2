// src/app/(dashboard)/prix/page.tsx
'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Info, TrendingUp, BarChart3, Target } from 'lucide-react';
import { PriceEvolutionChart } from '@/components/organisms/PriceEvolutionChart/PriceEvolutionChart';
import { CompetitiveTable } from '@/components/organisms/CompetitiveTable/CompetitiveTable';
import { PriceEvolutionKpis } from '@/components/organisms/PriceEvolutionKpis/PriceEvolutionKpis';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useCompetitiveAnalysis } from '@/hooks/competitive/useCompetitiveAnalysis';

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
 * Page Prix AMÉLIORÉE avec descriptions + tooltips
 */
export default function PrixPage() {
  // Récupération filtres store global
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const productsFilter = useFiltersStore((state) => state.products);
  const laboratoriesFilter = useFiltersStore((state) => state.laboratories);
  const categoriesFilter = useFiltersStore((state) => state.categories);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // Fusion codes produits : products + laboratories + categories
  const allProductCodes = useMemo(() => {
    const codes = Array.from(new Set([
      ...productsFilter,
      ...laboratoriesFilter,
      ...categoriesFilter
    ]));
    return codes;
  }, [productsFilter, laboratoriesFilter, categoriesFilter]);

  // Construction filtres pour graphique
  const chartFilters = {
    productCodes: allProductCodes,
    ...(pharmacyFilter.length > 0 && { pharmacyId: pharmacyFilter[0] })
  };

  // Hook analyse concurrentielle
  const {
    products: competitiveProducts,
    isLoading: isCompetitiveLoading,
    error: competitiveError,
    refetch: refetchCompetitive,
    hasData: hasCompetitiveData
  } = useCompetitiveAnalysis({
    enabled: true
  });

  // Contenu des tooltips
  const tooltips = {
    kpis: `Indicateurs d'évolution tarifaire :

- Prix moyen : Évolution des tarifs sur la période
- Écart marché : Positionnement vs concurrence
- Volatilité : Stabilité de vos prix
- Index compétitivité : Score global de positionnement

Analysez votre stratégie pricing pour optimiser marges et compétitivité.`,

    evolution: `Graphique d'évolution mensuelle des prix :

- Visualisez les variations tarifaires dans le temps
- Identifiez les hausses et baisses significatives
- Comparez avec les tendances du marché
- Détectez les anomalies de pricing

Cliquez sur les courbes pour isoler des produits spécifiques.`,

    competitive: `Analyse comparative avec le groupement :

- Écart prix vs marché pour chaque produit
- Positionnement concurrentiel détaillé
- Opportunités d'optimisation tarifaire

Triez par écart pour identifier les ajustements prioritaires.`
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Section titre */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900">
              Analyse des Prix et Concurrence
            </h1>
            <Tooltip 
              content="Module d'analyse tarifaire pour optimiser vos prix, analyser la concurrence et maximiser votre compétitivité"
              position="bottom"
            >
              <Info className="w-5 h-5 text-gray-400 hover:text-blue-600 cursor-help transition-colors" />
            </Tooltip>
          </div>
          <p className="text-gray-600 mt-1">
            Évolutions tarifaires, positionnement marché et analyse concurrentielle
          </p>
        </div>
        
        {/* Indicateurs filtres appliqués */}
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          {productsFilter.length > 0 && (
            <span className="text-blue-600 font-medium">
              {productsFilter.length} produit{productsFilter.length > 1 ? 's' : ''} sélectionné{productsFilter.length > 1 ? 's' : ''}
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
              {pharmacyFilter.length} pharmacie{pharmacyFilter.length > 1 ? 's' : ''}
            </span>
          )}
          {allProductCodes.length > 0 && (
            <span className="text-gray-700 font-medium bg-gray-200 px-2 py-1 rounded">
              {allProductCodes.length} codes EAN total
            </span>
          )}
        </div>
      </div>

      {/* KPIs évolutions prix avec description + tooltip */}
      <SectionWithHelp
        title="Indicateurs d'Évolution Tarifaire"
        description="Suivez l'évolution de vos prix moyens, écarts marché et indices de compétitivité pour optimiser votre stratégie pricing"
        tooltipContent={tooltips.kpis}
        icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
      >
        <PriceEvolutionKpis />
      </SectionWithHelp>

      {/* Graphique évolution prix avec description + tooltip */}
      <SectionWithHelp
        title="Évolution des Prix Mensuels"
        description="Visualisez les variations tarifaires dans le temps pour identifier tendances, hausses significatives et opportunités d'ajustement"
        tooltipContent={tooltips.evolution}
        icon={<BarChart3 className="w-5 h-5 text-green-600" />}
      >
        <PriceEvolutionChart
          dateRange={analysisDateRange}
          filters={chartFilters}
          className="w-full"
        />
      </SectionWithHelp>
      
      {/* Analyse concurrentielle avec description + tooltip */}
      <SectionWithHelp
        title="Analyse Concurrentielle"
        description="Comparez vos prix avec le groupement pour identifier produits sur/sous-tarifés et optimiser votre positionnement marché"
        tooltipContent={tooltips.competitive}
        icon={<Target className="w-5 h-5 text-purple-600" />}
      >
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600 text-sm">
            Comparaison de vos prix avec le groupement
          </p>
          
          {/* Métriques résumé */}
          {hasCompetitiveData && (
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {competitiveProducts.length}
                </div>
                <div className="text-gray-500">Produits analysés</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {competitiveProducts.filter(p => p.ecart_prix_vs_marche_pct < -2).length}
                </div>
                <div className="text-gray-500">Prix compétitifs</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">
                  {competitiveProducts.filter(p => p.ecart_prix_vs_marche_pct > 5).length}
                </div>
                <div className="text-gray-500">Prix élevés</div>
              </div>
            </div>
          )}
        </div>
        
        <CompetitiveTable
          products={competitiveProducts}
          isLoading={isCompetitiveLoading}
          error={competitiveError}
          onRefresh={refetchCompetitive}
          className="w-full"
        />
      </SectionWithHelp>
    </motion.div>
  );
}