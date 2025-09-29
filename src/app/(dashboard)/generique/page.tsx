// src/app/(dashboard)/generiques/page.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Info, Pill, Building2, Package } from 'lucide-react';
import { GenericGroupSelector } from '@/components/organisms/GenericGroupSelector/GenericGroupSelector';
import { GenericKpisSection } from '@/components/organisms/GenericKpisSection/GenericKpisSection';
import { LaboratoryMarketShareSection } from '@/components/organisms/LaboratoryMarketShareSection/LaboratoryMarketShareSection';
import { ProductsTable } from '@/components/organisms/ProductsTable/ProductsTable';
import { useGenericGroupStore } from '@/stores/useGenericGroupStore';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useGenericGroupProducts } from '@/hooks/generic-groups/useGenericGroupProducts';

const Tooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ 
  content, 
  children
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2">
          <div className="bg-white/95 backdrop-blur-lg text-gray-800 text-sm rounded-xl px-6 py-4 w-[600px] shadow-2xl border border-white/20">
            <div className="whitespace-pre-line leading-relaxed">{content}</div>
          </div>
        </div>
      )}
    </div>
  );
};

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
            <Tooltip content={tooltipContent}>
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

export default function GeneriquesPage() {
  const selectedGroup = useGenericGroupStore(state => state.selectedGroup);
  const productCodes = useGenericGroupStore(state => state.productCodes);
  const analysisDateRange = useFiltersStore(state => state.analysisDateRange);
  const comparisonDateRange = useFiltersStore(state => state.comparisonDateRange);
  
  const { 
    products, 
    isLoading: isLoadingProducts, 
    error: productsError,
    refetch: refetchProducts 
  } = useGenericGroupProducts();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900">
              Groupes Génériques
            </h1>
            <Tooltip content="Module d'analyse des groupes génériques pour optimiser les substitutions et analyser les économies">
              <Info className="w-5 h-5 text-gray-400 hover:text-blue-600 cursor-help transition-colors" />
            </Tooltip>
          </div>
          <p className="text-gray-600 mt-1">
            Recherche et analyse des groupes génériques BCB
          </p>
        </div>
      </div>

      <SectionWithHelp
        title="Sélection du Groupe Générique"
        description="Recherchez par nom de groupe, molécule/DCI ou code produit pour sélectionner un groupe à analyser"
        tooltipContent={`3 modes de recherche disponibles :
        
- Groupe : Recherche directe par nom du groupe générique BCB
- Molécule/DCI : Recherche par dénomination commune internationale
- Code produit : Entrez un code CIP13 pour trouver son groupe générique

Le système affiche automatiquement le médicament référent et le nombre de génériques disponibles.`}
        icon={<Pill className="w-5 h-5 text-blue-600" />}
      >
        <GenericGroupSelector />
      </SectionWithHelp>

      {selectedGroup && productCodes.length > 0 && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl">
              <GenericKpisSection 
                dateRange={analysisDateRange}
                comparisonDateRange={comparisonDateRange}
                includeComparison={true}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <SectionWithHelp
              title="Parts de Marché par Laboratoire"
              description="Répartition du CA et des marges entre laboratoires pour ce groupe générique"
              tooltipContent={`Analyse des parts de marché par laboratoire :
              
- Part CA : % du chiffre d'affaires réalisé par chaque laboratoire
- Part Marge : % de la marge totale captée par chaque laboratoire  
- Badge Référent : Identifie le laboratoire du médicament référent
- Pagination : Navigation entre les laboratoires (10 par page)

Les laboratoires sont triés par CA décroissant.`}
              icon={<Building2 className="w-5 h-5 text-purple-600" />}
            >
              <LaboratoryMarketShareSection
                productCodes={productCodes}
                dateRange={analysisDateRange}
              />
            </SectionWithHelp>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <SectionWithHelp
              title="Détail des Produits du Groupe"
              description="Liste complète des produits du groupe générique avec leurs métriques détaillées"
              tooltipContent={`Tableau détaillé des produits :
              
- Modes d'affichage : Totaux ou Moyennes
- Tri multi-colonnes : CA, quantités, marges, stock
- Recherche : Par nom ou code produit
- Export CSV : Téléchargez toutes les données
- Pagination : 50 produits par page

Les produits référents et génériques sont affichés ensemble.`}
              icon={<Package className="w-5 h-5 text-indigo-600" />}
            >
              <ProductsTable 
                products={products}
                isLoading={isLoadingProducts}
                error={productsError}
                onRefresh={refetchProducts}
              />
            </SectionWithHelp>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}