// src/app/(dashboard)/stock/page.tsx
'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Info, Package, BarChart3, List } from 'lucide-react';
import { ProductsMonthlyTable } from '@/components/organisms/ProductsMonthlyTable/ProductsMonthlyTable';
import { StockMetricsSection } from '@/components/organisms/StockMetricsSection/StockMetricsSection';
import { StockChartsEvolution } from '@/components/organisms/StockChartsEvolution/StockChartsEvolution';
import { useFiltersStore } from '@/stores/useFiltersStore';

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
 * Page Stock AMÉLIORÉE avec descriptions + tooltips
 */
export default function StockPage() {
  // Store filtres
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const comparisonDateRange = useFiltersStore((state) => state.comparisonDateRange);
  const productsFilter = useFiltersStore((state) => state.products);
  const laboratoriesFilter = useFiltersStore((state) => state.laboratories);
  const categoriesFilter = useFiltersStore((state) => state.categories);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // Filtres pour les composants
  const filters = {
    products: productsFilter,
    laboratories: laboratoriesFilter,
    categories: categoriesFilter,
    pharmacies: pharmacyFilter
  };

  // Fusion codes produits pour graphique : products + laboratories + categories
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

  // Comparaison active si dates définies
  const includeComparison = comparisonDateRange.start !== null && comparisonDateRange.end !== null;

  const handleRefresh = () => {
    console.log('Refresh stock page');
  };

  // Contenu des tooltips
  const tooltips = {
    metrics: `Indicateurs de gestion des stocks :

- Quantité stock actuel : Unités disponibles aujourd'hui
- Valeur stock HT : Inventaire valorisé hors taxes
- Stock moyen 12M : Moyenne des stocks sur l'année
- Jours de stock : Nombre de jours de vente couverts

Optimisez vos niveaux de stock pour éviter ruptures et surstockage.`,

    evolution: `Graphiques d'évolution temporelle du stock :

- Quantité en stock : Évolution mensuelle des inventaires
- Quantité vendue : Sorties de stock par mois
- Jours de stock : Rotation mensuelle des stocks

Analysez les tendances pour anticiper vos besoins de réapprovisionnement.`,

    monthly: `Tableau détaillé avec recommandations de commande :

- Analyse 12 mois : Historique complet par produit
- Stock idéal calculé : Basé sur vos ventes réelles
- Quantités à commander : Recommandations personnalisées
- Calculs de rotation : Optimisation des niveaux de stock

Utilisez ces données pour planifier vos commandes efficacement.`
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
              Gestion Stock
            </h1>
            <Tooltip 
              content="Module de gestion intelligente des stocks avec calculs de stock idéal et recommandations de commande automatiques"
              position="bottom"
            >
              <Info className="w-5 h-5 text-gray-400 hover:text-blue-600 cursor-help transition-colors" />
            </Tooltip>
          </div>
          <p className="text-gray-600 mt-1">
            Analyse 12 mois, stock idéal et quantités à commander par produit
          </p>
        </div>
      </div>

      {/* Section KPI Stock avec description + tooltip */}
      <SectionWithHelp
        title="Métriques de Stock"
        description="Suivez vos indicateurs stock essentiels : quantités actuelles, valeurs, moyennes 12 mois et jours de couverture"
        tooltipContent={tooltips.metrics}
        icon={<Package className="w-5 h-5 text-blue-600" />}
      >
        <StockMetricsSection
          dateRange={analysisDateRange}
          comparisonDateRange={includeComparison ? comparisonDateRange : undefined}
          filters={filters}
          includeComparison={includeComparison}
          onRefresh={handleRefresh}
        />
      </SectionWithHelp>

      {/* Graphique évolution stock avec description + tooltip */}
      <SectionWithHelp
        title="Évolution du Stock"
        description="Visualisez les tendances mensuelles de vos stocks, ventes et rotations pour anticiper vos besoins de réapprovisionnement"
        tooltipContent={tooltips.evolution}
        icon={<BarChart3 className="w-5 h-5 text-green-600" />}
      >
        <StockChartsEvolution
          dateRange={analysisDateRange}
          filters={chartFilters}
          onRefresh={handleRefresh}
        />
      </SectionWithHelp>

      {/* Tableau principal avec description + tooltip */}
      <SectionWithHelp
        title="Détail par Produit"
        description="Analyse complète 12 mois avec calculs de stock idéal et recommandations de commande personnalisées par produit"
        tooltipContent={tooltips.monthly}
        icon={<List className="w-5 h-5 text-purple-600" />}
      >
        <ProductsMonthlyTable 
          onRefresh={handleRefresh}
          className="w-full"
        />
      </SectionWithHelp>
    </motion.div>
  );
}