// src/app/(dashboard)/ventes/page.tsx
'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Info, TrendingUp, PieChart, List, Building2 } from 'lucide-react';
import { SalesTable } from '@/components/organisms/SalesTable/SalesTable';
import { SalesKpisSection } from '@/components/organisms/SalesKpisSection/SalesKpisSection';
import { MarketShareSection } from '@/components/organisms/MarketShareSection/MarketShareSection';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { LaboratoryMarketShare } from '@/components/organisms/LaboratoryMarketShareSection/LaboratoryMarketShare';

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
        
        <p className="text-sm text-gray-700 bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2 border-l-4 border-blue-300 shadow-sm">
          💡 {description}
        </p>
      </div>
      
      {children}
    </div>
  );
};

/**
 * Page Ventes AMÉLIORÉE avec descriptions + tooltips
 */
export default function VentesPage() {
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const comparisonDateRange = useFiltersStore((state) => state.comparisonDateRange);
  const productsFilter = useFiltersStore((state) => state.products);
  const laboratoriesFilter = useFiltersStore((state) => state.laboratories);
  const categoriesFilter = useFiltersStore((state) => state.categories);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  const filters = useMemo(() => ({
    products: productsFilter,
    laboratories: laboratoriesFilter,
    categories: categoriesFilter,
    pharmacies: pharmacyFilter
  }), [productsFilter, laboratoriesFilter, categoriesFilter, pharmacyFilter]);

  const hasFilters = useMemo(() => {
    return productsFilter.length > 0 || 
           laboratoriesFilter.length > 0 || 
           categoriesFilter.length > 0;
  }, [productsFilter, laboratoriesFilter, categoriesFilter]);

  const hasComparison = comparisonDateRange.start !== null && comparisonDateRange.end !== null;

  const handleRefresh = () => {
    console.log('Refresh ventes page');
  };

  const tooltips = {
    kpis: `Indicateurs spécialisés pour l'analyse des ventes :

- 4 DualKpiCard : Quantités/CA, Parts marché, Références, Marge
- Parts de marché CA et Marge avec pourcentages précis
- Nombre de références sélectionnées vs total
- Comparaisons période précédente disponibles

Hook useSalesKpiMetrics dédié pour ces métriques spécifiques ventes.`,

    marketshare: `Analyse parts de marché par niveaux hiérarchiques :

- 3 niveaux d'analyse : Univers, Catégories, Familles
- Barres de progression avec CA + Marge par segment
- Pagination 5 segments par niveau
- Top 3 laboratoires par segment avec CA détaillé

Utilisez les onglets pour naviguer entre les niveaux hiérarchiques.`,

    laboratoryshare: `Analyse des parts de marché par laboratoire :

- Part CA : % du chiffre d'affaires réalisé par chaque laboratoire
- Part Marge : % de la marge totale captée par chaque laboratoire
- Nombre de produits par laboratoire dans la sélection
- Identification des laboratoires référents
- Pagination : Navigation entre les laboratoires (10 par page)

Les laboratoires sont triés par CA décroissant.`,

    salesdetail: `Tableau détaillé des ventes avec expansion :

- Recherche par nom ou code EAN avec filtrage avancé
- Tri par colonnes : quantités, prix, marges, parts de marché
- Expansion par produit avec graphique évolution temporelle
- Pagination 50 lignes avec navigation complète

Cliquez sur l'icône œil pour voir l'évolution d'un produit spécifique.`
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900">
              Analyse des Ventes
            </h1>
            <Tooltip 
              content="Module d'analyse sell-out complet : KPIs spécialisés ventes, parts de marché hiérarchiques et par laboratoire, tableau détaillé avec expansion graphique"
              position="bottom"
            >
              <Info className="w-5 h-5 text-gray-400 hover:text-blue-600 cursor-help transition-colors" />
            </Tooltip>
          </div>
          <p className="text-gray-600 mt-1">
            Suivi des performances sell-out et évolutions
          </p>
        </div>
      </div>

      <SectionWithHelp
        title="KPI Spécialisés Ventes"
        description="Indicateurs dédiés aux ventes : quantités/CA, parts de marché CA/marge, références vendues et rentabilité avec comparaisons"
        tooltipContent={tooltips.kpis}
        icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
      >
        <SalesKpisSection
          dateRange={analysisDateRange}
          comparisonDateRange={comparisonDateRange}
          filters={filters}
          includeComparison={hasComparison}
          onRefresh={handleRefresh}
        />
      </SectionWithHelp>

      <SectionWithHelp
        title="Parts de Marché par Hiérarchie"
        description="Analyse votre positionnement par univers, catégories et familles avec barres de progression et top laboratoires par segment"
        tooltipContent={tooltips.marketshare}
        icon={<PieChart className="w-5 h-5 text-green-600" />}
      >
        <MarketShareSection
          dateRange={analysisDateRange}
          filters={filters}
          onRefresh={handleRefresh}
        />
      </SectionWithHelp>

      {hasFilters && (
        <SectionWithHelp
          title="Parts de Marché par Laboratoire"
          description="Répartition du CA et des marges entre laboratoires pour votre sélection de produits avec identification des référents"
          tooltipContent={tooltips.laboratoryshare}
          icon={<Building2 className="w-5 h-5 text-purple-600" />}
        >
          <LaboratoryMarketShare />
        </SectionWithHelp>
      )}
      
      <SectionWithHelp
        title="Tableau Détaillé des Ventes"
        description="Vue complète produit par produit avec recherche, tri avancé, expansion graphique et export pour analyses approfondies"
        tooltipContent={tooltips.salesdetail}
        icon={<List className="w-5 h-5 text-purple-600" />}
      >
        <SalesTable 
          onRefresh={handleRefresh}
        />
      </SectionWithHelp>
    </motion.div>
  );
}