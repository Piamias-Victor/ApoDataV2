'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Info, TrendingUp, BarChart3, Package } from 'lucide-react';
import { useProductsList } from '@/hooks/products/useProductsList';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { Card } from '@/components/atoms/Card/Card';
import { KpisSection } from '@/components/organisms/KpisSection/KpisSection';
import { MemoizedMetricsEvolutionChart as MetricsEvolutionChart } from '@/components/organisms/MetricsEvolutionChart/MetricsEvolutionChart';
import { ProductsTable } from '@/components/organisms/ProductsTable/ProductsTable';

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
 * Dashboard Page AMÉLIORÉE avec descriptions + tooltips
 */
export default function DashboardPage() {
  // Hook existant pour récupérer les données produits
  const { 
    products, 
    isLoading, 
    error,
    refetch
  } = useProductsList();

  // Filtres depuis le store Zustand
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const comparisonDateRange = useFiltersStore((state) => state.comparisonDateRange);
  const productsFilter = useFiltersStore((state) => state.products);
  const laboratoriesFilter = useFiltersStore((state) => state.laboratories);
  const categoriesFilter = useFiltersStore((state) => state.categories);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // Fusion des codes produits : products + laboratories + categories
  const allProductCodes = useMemo(() => {
    const codes = Array.from(new Set([
      ...productsFilter,
      ...laboratoriesFilter,
      ...categoriesFilter
    ]));
    
    console.log('🔄 [Dashboard] Merged product codes:', {
      totalCodes: codes.length,
      fromProducts: productsFilter.length,
      fromLaboratories: laboratoriesFilter.length,
      fromCategories: categoriesFilter.length
    });
    
    return codes;
  }, [productsFilter, laboratoriesFilter, categoriesFilter]);

  // Filtres formatés pour KipsSection
  const filters = {
    products: productsFilter,
    laboratories: laboratoriesFilter,
    categories: categoriesFilter,
    pharmacies: pharmacyFilter
  };

  // Vérification si comparaison est active
  const hasComparison = comparisonDateRange.start !== null && comparisonDateRange.end !== null;

  const renderCount = useRef(0);
  renderCount.current += 1;

  console.log('🏠 Dashboard render #', renderCount.current, {
    productsCount: products.length,
    filtersHash: {
      products: productsFilter.length,
      labs: laboratoriesFilter.length,
      categories: categoriesFilter.length,
      pharmacy: pharmacyFilter.length
    }
  });

  // Track les changements de filtres
  useEffect(() => {
    console.log('🔄 Filters changed in Dashboard');
  }, [productsFilter, laboratoriesFilter, categoriesFilter, pharmacyFilter]);

  // Contenu des tooltips simplifiés
  const tooltips = {
    kpis: `Indicateurs clés pour analyser vos performances :

- Sell-out : Ventes vers les patients (CA + quantités)
- Sell-in : Achats auprès des laboratoires  
- Marge : Rentabilité de chaque produit
- Stock : Gestion de votre inventaire

Les comparaisons montrent l'évolution vs la période précédente.`,

    evolution: `Graphique d'évolution temporelle de vos métriques :

- Visualisez les tendances de CA sur la période
- Identifiez les pics et creux de ventes
- Comparez avec les périodes précédentes

Survolez les points pour voir les détails précis.`,

    products: `Tableau détaillé de tous vos produits :

- Performance individuelle par produit
- Données complètes : ventes, achats, stock, marge
- Tri par colonne et recherche instantanée
- Export Excel pour analyses externes

Cliquez sur les en-têtes pour trier les données.`
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Section titre dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard ApoData
            </h1>
            <Tooltip 
              content="Tableau de bord pharmaceutique pour analyser vos performances sell-out, sell-in, marges et stocks en temps réel"
              position="bottom"
            >
              <Info className="w-5 h-5 text-gray-400 hover:text-blue-600 cursor-help transition-colors" />
            </Tooltip>
          </div>
          <p className="text-gray-600 mt-1">
            Analyse des performances produits pharmaceutiques
          </p>
        </div>
        
      </div>

      {/* Section KPI avec description + tooltip */}
      <SectionWithHelp
        title="Indicateurs Clés de Performance"
        description="Analysez vos KPI sell-out (ventes), sell-in (achats), marges et stock en temps réel avec comparaisons période précédente"
        tooltipContent={tooltips.kpis}
        icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
      >
        <KpisSection
          dateRange={analysisDateRange}
          comparisonDateRange={comparisonDateRange}
          filters={filters}
          includeComparison={hasComparison}
          onRefresh={refetch}
        />
      </SectionWithHelp>

      {/* Graphique évolution avec description + tooltip */}
      
      {/* Tableau produits avec description + tooltip */}
      <SectionWithHelp
        title="Analyse Détaillée des Produits"
        description="Vue complète produit par produit avec tri, recherche et export pour analyses approfondies et prise de décisions"
        tooltipContent={tooltips.products}
        icon={<Package className="w-5 h-5 text-purple-600" />}
      >
        <ProductsTable 
          products={products}
          isLoading={isLoading}
          error={error}
          onRefresh={refetch}
          className="w-full"
        />
      </SectionWithHelp>

      {/* Message si aucune donnée */}
      {!isLoading && products.length === 0 && !error && (
        <Card variant="elevated" className="p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune donnée disponible
          </h3>
          <p className="text-gray-600 mb-4">
            Aucun produit ne correspond aux filtres sélectionnés.
            <br />
            Ajustez vos critères de recherche pour voir les données.
          </p>
          <div className="text-sm text-gray-500 space-y-1">
            <div>💡 Vérifiez que les filtres de dates et produits sont correctement configurés</div>
            {allProductCodes.length > 0 && (
              <div className="text-blue-600">
                🔍 {allProductCodes.length} codes EAN filtrés actuellement
              </div>
            )}
          </div>
        </Card>
      )}
    </motion.div>
  );
}