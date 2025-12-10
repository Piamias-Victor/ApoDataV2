// src/app/(dashboard)/comparaisons/page.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Info, Search, BarChart3, TrendingUp, DollarSign } from 'lucide-react';
import { ComparisonSelector } from '@/components/organisms/ComparisonSelector/ComparisonSelector';
import { ComparisonKpisSection } from '@/components/organisms/ComparisonKpisSection/ComparisonKpisSection';
import { ComparisonEvolutionChart } from '@/components/organisms/ComparisonEvolutionChart/ComparisonEvolutionChart';
import { ComparisonPricingSection } from '@/components/organisms/ComparisonPricingSection/ComparisonPricingSection';

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
 * Page Comparaisons AMÉLIORÉE avec descriptions + tooltips
 */
export default function ComparaisonsPage() {
  // Contenu des tooltips
  const tooltips = {
    selector: `Interface de sélection pour créer vos comparaisons :

- Choisissez le type d'éléments à comparer (produits, laboratoires, catégories)
- Sélectionnez l'élément A via la recherche intelligente
- Sélectionnez l'élément B via la recherche intelligente
- Utilisez les boutons Swap/Clear pour ajuster votre sélection

Les analyses se mettent à jour automatiquement dès que A et B sont sélectionnés.`,

    kpis: `Comparaison side-by-side des indicateurs clés :

- KPIs Performance : CA TTC, montant marge, taux de marge
- KPIs Volumes : Quantités vendues/achetées, montant achats
- KPIs Stock : Valeur stock, quantité, jours de rotation
- Gagnant automatique : Déterminé par score global sur 3 critères

Identifiez rapidement quel élément performe le mieux sur chaque métrique.`,

    evolution: `Graphiques d'évolution temporelle comparative :

- Courbes A vs B sur la période sélectionnée
- 3 métriques disponibles : CA TTC, marge, quantité vendue
- Agrégation quotidienne/hebdomadaire/mensuelle
- Tooltip comparatif avec écarts entre A et B

Analysez les tendances et performances relatives dans le temps.`,

    pricing: `Analyse comparative des prix et positionnement marché :

- Prix de vente moyens : Comparaison directe A vs B
- Taux de marge : Rentabilité relative de chaque élément
- Écart vs apothical : Positionnement concurrentiel individuel
- Synthèse avantages : Qui a le meilleur pricing strategy

Optimisez votre stratégie tarifaire en comparant avec la concurrence.`,

    marketshare: `Parts de marché comparatives par niveau hiérarchique :

- 3 niveaux d'analyse : Univers, Catégories, Familles
- Parts de marché CA et Marge pour A et B
- Barres de progression visuelles side-by-side
- Top 3 laboratoires par segment analysé

Comprenez votre positionnement relatif sur chaque segment de marché.`
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Section titre */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900">
              Comparaisons
            </h1>
            <Tooltip 
              content="Module d'analyse comparative avancée pour comparer produits, laboratoires ou catégories sur tous les indicateurs clés"
              position="bottom"
            >
              <Info className="w-5 h-5 text-gray-400 hover:text-blue-600 cursor-help transition-colors" />
            </Tooltip>
          </div>
          <p className="text-gray-600 mt-1">
            Analyse comparative complète : KPI, évolution, positionnement prix et parts de marché
          </p>
        </div>
      </div>

      {/* 1. Interface de sélection avec description + tooltip */}
      <SectionWithHelp
        title="Sélection des Éléments à Comparer"
        description="Choisissez le type d'éléments puis sélectionnez deux éléments A et B via la recherche pour lancer l'analyse comparative"
        tooltipContent={tooltips.selector}
        icon={<Search className="w-5 h-5 text-blue-600" />}
      >
        <ComparisonSelector />
      </SectionWithHelp>

      {/* 2. Section KPI Comparaison avec description + tooltip */}
      <SectionWithHelp
        title="Comparaison des KPI"
        description="Indicateurs clés side-by-side : performances, volumes et stock avec calcul automatique du gagnant sur chaque métrique"
        tooltipContent={tooltips.kpis}
        icon={<BarChart3 className="w-5 h-5 text-green-600" />}
      >
        <ComparisonKpisSection />
      </SectionWithHelp>

      {/* 3. Section Graphique Évolution avec description + tooltip */}
      <SectionWithHelp
        title="Évolution Temporelle Comparative"
        description="Graphiques d'évolution A vs B dans le temps pour analyser les tendances et performances relatives sur la période"
        tooltipContent={tooltips.evolution}
        icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
      >
        <ComparisonEvolutionChart />
      </SectionWithHelp>

      {/* 4. Section Analyse des Prix avec description + tooltip */}
      <SectionWithHelp
        title="Analyse Comparative des Prix"
        description="Positionnement tarifaire A vs B : prix moyens, marges et écarts marché pour optimiser votre stratégie pricing"
        tooltipContent={tooltips.pricing}
        icon={<DollarSign className="w-5 h-5 text-orange-600" />}
      >
        <ComparisonPricingSection />
      </SectionWithHelp>

      {/* 5. Section Parts de Marché avec description + tooltip */}
      {/* <SectionWithHelp
        title="Parts de Marché par Hiérarchie"
        description="Comparaison des positions marché A vs B par univers, catégories et familles avec barres de progression visuelles"
        tooltipContent={tooltips.marketshare}
        icon={<PieChart className="w-5 h-5 text-indigo-600" />}
      >
        <ComparisonMarketShareSection />
      </SectionWithHelp> */}

      {/* Instructions d'utilisation simplifiées */}
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Guide d'utilisation
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Étapes workflow */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Étapes de comparaison
            </h3>
            <ol className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <span className="font-medium text-blue-600 mr-2">1.</span>
                Sélectionnez le type d'éléments (produits, laboratoires, catégories)
              </li>
              <li className="flex items-start">
                <span className="font-medium text-blue-600 mr-2">2.</span>
                Choisissez le premier élément A via la recherche
              </li>
              <li className="flex items-start">
                <span className="font-medium text-blue-600 mr-2">3.</span>
                Choisissez le second élément B via la recherche
              </li>
              <li className="flex items-start">
                <span className="font-medium text-blue-600 mr-2">4.</span>
                Analysez les métriques qui s'affichent automatiquement
              </li>
            </ol>
          </div>

          {/* Sections d'analyse */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Sections d'analyse
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <span className="font-medium text-emerald-600 mr-2">•</span>
                <div>
                  <span className="font-medium">KPI Performance</span> - 
                  Métriques CA, marge, volumes, stock côte à côte
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-medium text-blue-600 mr-2">•</span>
                <div>
                  <span className="font-medium">Évolution Temporelle</span> - 
                  Graphiques comparatifs sur la période sélectionnée
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-medium text-purple-600 mr-2">•</span>
                <div>
                  <span className="font-medium">Positionnement Prix</span> - 
                  Analyse concurrentielle vs marché
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-medium text-green-600 mr-2">•</span>
                <div>
                  <span className="font-medium">Parts de Marché</span> - 
                  Analyse par hiérarchie (univers, catégories, familles)
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}