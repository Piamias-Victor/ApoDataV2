// src/app/(dashboard)/generique/page.tsx
'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Info, Pill, Building2, Package } from 'lucide-react';
import { GenericGroupSelector } from '@/components/organisms/GenericGroupSelector/GenericGroupSelector';
import { GenericKpisSection } from '@/components/organisms/GenericKpisSection/GenericKpisSection';
import { LaboratoryMarketShareGenericSection } from '@/components/organisms/LaboratoryMarketShareGenericSection/LaboratoryMarketShareGenericSection';
import { ProductsTableGeneric } from '@/components/organisms/ProductsTableGeneric/ProductsTableGeneric';
import { useGenericGroupStore } from '@/stores/useGenericGroupStore';
import { useFiltersStore } from '@/stores/useFiltersStore';

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
          {description}
        </p>
      </div>
      
      {children}
    </div>
  );
};

export default function GeneriquesPage() {
  const selectedGroups = useGenericGroupStore(state => state.selectedGroups);
  const productCodes = useGenericGroupStore(state => state.productCodes);
  const analysisDateRange = useFiltersStore(state => state.analysisDateRange);
  const comparisonDateRange = useFiltersStore(state => state.comparisonDateRange);

  const hasSelection = selectedGroups.length > 0 && productCodes.length > 0;

  const marketShareConfig = useMemo(() => ({
    title: hasSelection 
      ? `Parts de Marché ${selectedGroups.length > 1 ? `(${selectedGroups.length} groupes)` : ''}` 
      : 'Parts de Marché Génériques',
    description: hasSelection
      ? selectedGroups.length > 1
        ? `Analyse agrégée des ${selectedGroups.length} groupes génériques sélectionnés avec ${productCodes.length} produits`
        : 'Analyse achats/ventes par laboratoire pour ce groupe générique'
      : 'Sélectionnez un ou plusieurs groupes pour voir les parts de marché',
    tooltip: hasSelection
      ? selectedGroups.length > 1
        ? `Analyse multi-groupes :

- Agrégation de ${selectedGroups.length} groupes génériques
- ${productCodes.length} produits au total
- Colonnes achats : volume, CA, part de marché
- Colonnes ventes : volume, CA, part de marché
- Taux de marge moyen par laboratoire
- Tri par CA ventes décroissant

Ajoutez ou retirez des groupes pour affiner l'analyse.`
        : `Analyse détaillée d'un groupe :
      
- Volume achats : Quantités commandées/reçues
- CA Achats : Montant total des achats HT
- PM Achat : Part du laboratoire sur total achats du groupe
- Taux marge : Rentabilité moyenne (%)
- Volume ventes : Quantités vendues aux patients
- CA Ventes : Chiffre d'affaires TTC réalisé
- PM Vente : Part du laboratoire sur total ventes du groupe
- Badge Référent : Identifie le médicament de référence

Pagination : 10 laboratoires par page, triés par CA ventes.`
      : `Sélectionnez des groupes :

- Utilisez la recherche ci-dessus pour trouver des groupes génériques
- Cliquez sur un groupe pour l'ajouter à la sélection
- Multi-sélection disponible pour analyses comparatives
- Les parts de marché se calculeront automatiquement

Les données incluront :
→ Volumes et CA d'achats par laboratoire
→ Volumes et CA de ventes par laboratoire
→ Parts de marché achats et ventes
→ Taux de marge moyens`
  }), [hasSelection, selectedGroups.length, productCodes.length]);

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
        description="Recherchez et sélectionnez un ou plusieurs groupes génériques pour une analyse comparative"
        tooltipContent={`Multi-sélection disponible :
        
- Cliquez sur un groupe pour l'ajouter à la sélection
- Cliquez à nouveau pour le retirer
- Analysez jusqu'à plusieurs groupes simultanément
- Les KPIs et parts de marché s'agrègent automatiquement

3 modes de recherche :
- Groupe : Nom du groupe générique BCB
- Molécule/DCI : Dénomination commune internationale  
- Code produit : Code CIP13`}
        icon={<Pill className="w-5 h-5 text-blue-600" />}
      >
        <GenericGroupSelector />
      </SectionWithHelp>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <SectionWithHelp
          title={marketShareConfig.title}
          description={marketShareConfig.description}
          tooltipContent={marketShareConfig.tooltip}
          icon={<Building2 className="w-5 h-5 text-purple-600" />}
        >
          <LaboratoryMarketShareGenericSection
            productCodes={productCodes}
            dateRange={analysisDateRange}
          />
        </SectionWithHelp>
      </motion.div>

      {hasSelection && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
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
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <SectionWithHelp
              title={`Détail des Produits ${selectedGroups.length > 1 ? `(${selectedGroups.length} groupes)` : ''}`}
              description={`${productCodes.length} produits au total dans la sélection`}
              tooltipContent={`Tableau détaillé des produits par laboratoire :
              
- Laboratoire : Fabricant du produit générique
- Prix Achat : Coût moyen d'achat HT
- Volume/CA Achats : Quantités et montants approvisionnés
- Volume/CA Ventes : Quantités et montants vendus patients
- % Marge : Rentabilité par produit
- Tri multi-colonnes : Toutes les colonnes triables
- Recherche : Par nom, laboratoire ou code EAN
- Export CSV : Téléchargez toutes les données
- Pagination : 50 produits par page

${selectedGroups.length > 1 ? 'Produits agrégés de tous les groupes sélectionnés.' : 'Vue détaillée du groupe sélectionné.'}`}
              icon={<Package className="w-5 h-5 text-indigo-600" />}
            >
              <ProductsTableGeneric 
                productCodes={productCodes}
                dateRange={analysisDateRange}
              />
            </SectionWithHelp>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}