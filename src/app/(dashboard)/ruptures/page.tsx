// src/app/(app)/pharmacy/ruptures/page.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Info, ShoppingCart, AlertTriangle } from 'lucide-react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { MemoizedOrderReceptionSection as OrderReceptionSection } from '@/components/organisms/OrderReceptionSection/OrderReceptionSection';
import { RupturesProductsTable } from '@/components/organisms/RupturesProductsTable/RupturesProductsTable';

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
            <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg">
              {icon}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <Tooltip content={tooltipContent} position="right">
              <Info className="w-4 h-4 text-gray-400 hover:text-red-600 cursor-help transition-colors" />
            </Tooltip>
          </div>
        </div>
        
        <p className="text-sm text-gray-700 bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2 border-l-4 border-red-300 shadow-sm">
          ⚠️ {description}
        </p>
      </div>
      
      {children}
    </div>
  );
};

/**
 * Page Ruptures - Avec analyse globale et détail par produit
 */
export default function RupturesPage() {
  // Filtres depuis le store Zustand
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const comparisonDateRange = useFiltersStore((state) => state.comparisonDateRange);
  const productsFilter = useFiltersStore((state) => state.products);
  const laboratoriesFilter = useFiltersStore((state) => state.laboratories);
  const categoriesFilter = useFiltersStore((state) => state.categories);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // Vérification si comparaison est active
  const hasComparison = comparisonDateRange.start !== null && comparisonDateRange.end !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900">
              Gestion des Ruptures
            </h1>
            <Tooltip 
              content="Module de gestion des ruptures de stock - Analyse des écarts entre commandes et réceptions"
              position="bottom"
            >
              <Info className="w-5 h-5 text-gray-400 hover:text-red-600 cursor-help transition-colors" />
            </Tooltip>
          </div>
          <p className="text-gray-600 mt-1">
            Anticipez et gérez vos ruptures de stock pharmaceutiques
          </p>
        </div>
      </div>

      {/* Section 1 : Analyse Commandes & Réceptions */}
      <SectionWithHelp
        title="Analyse Commandes & Réceptions"
        description="Suivi des écarts entre quantités commandées et réceptionnées pour identifier les anomalies"
        tooltipContent={`Analyse des écarts commandes/réceptions :

- Quantités commandées vs réceptionnées
- Montants commandés vs réceptionnés
- Taux de réception en %
- Identification des anomalies fournisseurs

Permet d'identifier les problèmes de livraison récurrents.`}
        icon={<ShoppingCart className="w-5 h-5 text-orange-600" />}
      >
        <OrderReceptionSection
          dateRange={analysisDateRange}
          comparisonDateRange={comparisonDateRange}
          filters={{
            products: productsFilter,
            laboratories: laboratoriesFilter,
            categories: categoriesFilter,
            pharmacies: pharmacyFilter
          }}
          includeComparison={hasComparison}
          onRefresh={() => console.log('Refresh')}
        />
      </SectionWithHelp>

      {/* Section 2 : Détail par Produit */}
      <SectionWithHelp
        title="Détail par Produit"
        description="Analyse détaillée des écarts entre commandes et réceptions par produit"
        tooltipContent={`Détails par produit :

- Quantités vendues sur la période
- Quantités commandées vs réceptionnées  
- Delta et taux de réception
- Prix d'achat moyen
- Évolution temporelle des écarts

Permet d'identifier précisément les produits problématiques.`}
        icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
      >
        <RupturesProductsTable
          onRefresh={() => console.log('Refresh products table')}
        />
      </SectionWithHelp>
    </motion.div>
  );
}