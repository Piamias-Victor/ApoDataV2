// src/app/(dashboard)/generique/page.tsx
'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Info, Pill, Building2, Package, Truck } from 'lucide-react';
import { GenericGroupSelector } from '@/components/organisms/GenericGroupSelector/GenericGroupSelector';
import { GenericKpisSection } from '@/components/organisms/GenericKpisSection/GenericKpisSection';
import { LaboratoryMarketShareGenericSection } from '@/components/organisms/LaboratoryMarketShareGenericSection/LaboratoryMarketShareGenericSection';
import { ProductsTableGeneric } from '@/components/organisms/ProductsTableGeneric/ProductsTableGeneric';
import { SupplierAnalysisTable } from '@/components/organisms/SupplierAnalysisTable/SupplierAnalysisTable';
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
  const selectedProducts = useGenericGroupStore(state => state.selectedProducts);
  const selectedLaboratories = useGenericGroupStore(state => state.selectedLaboratories);
  const productCodes = useGenericGroupStore(state => state.productCodes);
  const analysisDateRange = useFiltersStore(state => state.analysisDateRange);
  const comparisonDateRange = useFiltersStore(state => state.comparisonDateRange);

  const hasSelection = productCodes.length > 0;
  const totalSelectionSources = selectedGroups.length + selectedProducts.length + selectedLaboratories.length;

  const selectionSummary = useMemo(() => {
    const parts: string[] = [];
    if (selectedGroups.length > 0) {
      parts.push(`${selectedGroups.length} groupe${selectedGroups.length > 1 ? 's' : ''}`);
    }
    if (selectedProducts.length > 0) {
      parts.push(`${selectedProducts.length} produit${selectedProducts.length > 1 ? 's' : ''}`);
    }
    if (selectedLaboratories.length > 0) {
      parts.push(`${selectedLaboratories.length} laboratoire${selectedLaboratories.length > 1 ? 's' : ''}`);
    }
    return parts.join(' + ');
  }, [selectedGroups.length, selectedProducts.length, selectedLaboratories.length]);

  const marketShareConfig = useMemo(() => ({
    title: hasSelection 
      ? `Parts de Marché ${totalSelectionSources > 1 ? `(${selectionSummary})` : ''}` 
      : 'Parts de Marché Génériques',
    description: hasSelection
      ? totalSelectionSources > 1
        ? `Analyse agrégée : ${selectionSummary} → ${productCodes.length} produits au total`
        : selectedGroups.length === 1
          ? 'Analyse achats/ventes par laboratoire pour ce groupe générique'
          : selectedProducts.length === 1
            ? 'Analyse d\'un produit générique individuel'
            : 'Analyse des produits d\'un laboratoire générique'
      : 'Sélectionnez des groupes, produits ou laboratoires pour voir les parts de marché',
    tooltip: hasSelection
      ? totalSelectionSources > 1
        ? `Analyse multi-sources :

- ${selectionSummary}
- ${productCodes.length} produits au total
- Colonnes achats : volume, CA, part de marché
- Colonnes ventes : volume, CA, part de marché
- Taux de marge moyen par laboratoire
- Tri par CA ventes décroissant

Gérez vos sélections via le drawer des filtres génériques.`
        : `Analyse détaillée :
      
- Volume achats : Quantités commandées/reçues
- CA Achats : Montant total des achats HT
- PM Achat : Part du laboratoire sur total achats
- Taux marge : Rentabilité moyenne (%)
- Volume ventes : Quantités vendues aux patients
- CA Ventes : Chiffre d'affaires TTC réalisé
- PM Vente : Part du laboratoire sur total ventes
- Badge Référent : Identifie le médicament de référence

Pagination : 10 laboratoires par page, triés par CA ventes.`
      : `Sélectionnez des éléments :

3 modes de sélection disponibles :
→ Groupes génériques (via recherche principale)
→ Produits individuels (via drawer filtres)
→ Laboratoires (via drawer filtres)

Les données incluront :
→ Volumes et CA d'achats par laboratoire
→ Volumes et CA de ventes par laboratoire
→ Parts de marché achats et ventes
→ Taux de marge moyens`
  }), [hasSelection, totalSelectionSources, selectionSummary, productCodes.length, selectedGroups.length, selectedProducts.length]);

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
            {hasSelection && (
              <span className="ml-2 text-indigo-600 font-medium">
                • {selectionSummary} • {productCodes.length} produits
              </span>
            )}
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
- Code produit : Code CIP13

Complétez avec le drawer des filtres pour :
- Ajouter des produits individuels
- Ajouter des laboratoires complets`}
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
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <SectionWithHelp
            title="Analyse par Fournisseur"
            description="Répartition des achats génériques par catégorie de fournisseur (OCP, ALLIANCE, CERP, AUTRE)"
            tooltipContent={`Analyse des achats par fournisseur :

- OCP : Commandes auprès des grossistes OCP
- ALLIANCE : Commandes auprès des grossistes ALLIANCE
- CERP : Commandes auprès des grossistes CERP
- AUTRE : Autres fournisseurs

Métriques affichées :
→ Nombre de commandes par fournisseur
→ Volume total acheté (quantités)
→ CA total des achats (€)
→ Nombre de produits distincts commandés
→ Pourcentages calculés automatiquement

Filtres appliqués :
→ Uniquement produits GÉNÉRIQUE/PRINCEPS
→ Période : ${analysisDateRange.start} → ${analysisDateRange.end}
→ Sélection active : ${productCodes.length} produits`}
            icon={<Truck className="w-5 h-5 text-orange-600" />}
          >
            <SupplierAnalysisTable 
              dateRange={analysisDateRange}
              productCodes={productCodes}
            />
          </SectionWithHelp>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <SectionWithHelp
            title={`Détail des Produits ${totalSelectionSources > 1 ? `(${selectionSummary})` : ''}`}
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

${totalSelectionSources > 1 ? `Produits agrégés depuis ${selectionSummary}.` : 'Vue détaillée de la sélection.'}`}
            icon={<Package className="w-5 h-5 text-indigo-600" />}
          >
            <ProductsTableGeneric 
              productCodes={productCodes}
              dateRange={analysisDateRange}
            />
          </SectionWithHelp>
        </motion.div>
      </>
    </motion.div>
  );
}