// src/components/organisms/KpiDashboard/KpiDashboard.tsx
'use client';

import React from 'react';
import { KpiCard } from '@/components/molecules/KpiCard/KpiCard';
import {
  Euro,
  Package,
  TrendingUp,
  TrendingDown,
  Percent,
  RotateCcw,
} from 'lucide-react';
import { useAchatsKpi } from '@/hooks/kpi/useAchatsKpi';
import { useVentesKpi } from '@/hooks/kpi/useVentesKpi';
import { useMargeKpi } from '@/hooks/kpi/useMargeKpi';
import { useStockKpi } from '@/hooks/kpi/useStockKpi';
import { useInventoryDaysKpi } from '@/hooks/kpi/useInventoryDaysKpi';
import { useReceptionRateKpi } from '@/hooks/kpi/useReceptionRateKpi';
import { usePriceEvolutionKpi } from '@/hooks/kpi/usePriceEvolutionKpi';
import { formatCurrency, formatNumber } from '@/lib/utils/formatters';
import { useFilterStore } from '@/stores/useFilterStore';
import { useState } from 'react';

/**
 * KPI Dashboard section with key performance indicators
 * Displays real data from API with FilterStore integration
 */

export const KpiDashboard: React.FC<{
  analysisType?: 'generic' | 'standard';
}> = ({ analysisType = 'standard' }) => {
  // Fetch Achats KPI with real filters
  const {
    data: achatsData,
    isLoading: achatsLoading,
    error: achatsError,
  } = useAchatsKpi();
  const {
    data: ventesData,
    isLoading: ventesLoading,
    error: ventesError,
  } = useVentesKpi();
  const {
    data: margeData,
    isLoading: margeLoading,
    error: margeError,
  } = useMargeKpi();
  const {
    data: stockData,
    isLoading: stockLoading,
    error: stockError,
  } = useStockKpi();
  const {
    data: inventoryData,
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useInventoryDaysKpi();
  const {
    data: receptionData,
    isLoading: receptionLoading,
    error: receptionError,
  } = useReceptionRateKpi();
  const {
    data: priceData,
    isLoading: priceLoading,
    error: priceError,
  } = usePriceEvolutionKpi();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Indicateurs clés
        </h2>
        <p className="text-gray-600">
          Vue d&apos;ensemble de vos performances commerciales et de stock
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Achats - Real Data */}
        {/* 1. Achats - Real Data */}
        <KpiCard
          title="Achats HT"
          isLoading={achatsLoading}
          primaryValue={
            achatsError ? 'Erreur' : formatCurrency(achatsData?.montant_ht || 0)
          }
          evolutionPercent={achatsData?.evolution_percent}
          evolutionLabel="vs N-1"
          secondaryLabel="Quantité"
          secondaryValue={formatNumber(achatsData?.quantite_achetee || 0)}
          secondaryEvolutionPercent={achatsData?.quantite_achetee_evolution}
          secondaryEvolutionLabel="Evol. Qte"
          icon={<Euro className="w-5 h-5" />}
          accentColor="blue"
        />

        {/* 2. Ventes - Real Data */}
        <KpiCard
          title="Ventes TTC"
          isLoading={ventesLoading}
          primaryValue={
            ventesError
              ? 'Erreur'
              : formatCurrency(ventesData?.montant_ttc || 0)
          }
          evolutionPercent={ventesData?.evolution_percent}
          evolutionLabel="vs N-1"
          secondaryLabel="Quantité"
          secondaryValue={formatNumber(ventesData?.quantite_vendue || 0)}
          secondaryEvolutionPercent={ventesData?.quantite_vendue_evolution}
          secondaryEvolutionLabel="Evol. Qte"
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor="green"
        />

        {/* 3. Marge - Real Data */}
        <KpiCard
          title="Marge €"
          isLoading={margeLoading}
          primaryValue={
            margeError
              ? 'Erreur'
              : formatCurrency(margeData?.montant_marge || 0)
          }
          evolutionPercent={margeData?.evolution_percent}
          evolutionLabel="vs N-1"
          secondaryLabel="Marge %"
          secondaryValue={
            margeData ? `${formatNumber(margeData.marge_percent)}%` : '0%'
          }
          secondaryEvolutionPercent={margeData?.marge_percent_evolution}
          secondaryEvolutionLabel="Evol. %"
          icon={<Percent className="w-5 h-5" />}
          accentColor="purple"
        />

        {/* 4. Stock - Real Data */}
        <KpiCard
          title="Stock €"
          isLoading={stockLoading}
          primaryValue={
            stockError
              ? 'Erreur'
              : formatCurrency(stockData?.stock_value_ht || 0)
          }
          evolutionPercent={stockData?.evolution_percent}
          evolutionLabel="Evol. Valeur"
          secondaryLabel="Quantité"
          secondaryValue={formatNumber(stockData?.stock_quantity || 0)}
          icon={<Package className="w-5 h-5" />}
          accentColor="orange"
        />

        {/* 5. Jours de Stock & Taux de réception - Combined */}
        <KpiCard
          title="Jours de Stock"
          isLoading={inventoryLoading || receptionLoading}
          primaryValue={
            inventoryError ? 'Erreur' : `${inventoryData?.days || 0} Jours`
          }
          evolutionPercent={inventoryData?.evolution_percent}
          evolutionLabel="vs N-1"
          secondaryLabel="Taux de réception"
          secondaryValue={
            receptionError
              ? 'Erreur'
              : `${receptionData?.rate ? receptionData.rate.toFixed(1) : 0}%`
          }
          secondaryEvolutionPercent={receptionData?.evolution_percent}
          secondaryEvolutionLabel="Evol. Taux"
          icon={<RotateCcw className="w-5 h-5" />}
          accentColor="indigo"
        />

        {/* 6. Prix Moyens */}
        <KpiCard
          title="Prix Achat Moyen"
          isLoading={priceLoading}
          primaryValue={
            priceError
              ? 'Erreur'
              : formatCurrency(priceData?.purchase_price || 0)
          }
          evolutionPercent={priceData?.purchase_evolution_percent}
          evolutionLabel="Evol. Achat"
          secondaryLabel="Prix Vente TTC"
          secondaryValue={
            priceError ? 'Erreur' : formatCurrency(priceData?.sell_price || 0)
          }
          secondaryEvolutionPercent={priceData?.sell_evolution_percent}
          secondaryEvolutionLabel="Evol. Vente"
          icon={<TrendingDown className="w-5 h-5" />}
          accentColor="red"
        />
      </div>

      {/* Error Display */}
      {achatsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">
            ⚠️ Erreur lors du chargement des données Achats
          </p>
        </div>
      )}

      {/* Exclusion Analysis Section */}
      <ExclusionAnalysisSection
        cleanVentes={ventesData}
        cleanVentesLoading={ventesLoading}
        analysisType={analysisType}
      />
    </div>
  );
};

// --- Sub-component for Exclusion Analysis ---

const ExclusionAnalysisSection = ({
  cleanVentes,
  cleanVentesLoading,
  analysisType = 'standard',
}: {
  cleanVentes: any;
  cleanVentesLoading: boolean;
  analysisType?: 'generic' | 'standard';
}) => {
  const {
    excludedLaboratories,
    excludedCategories,
    excludedProducts,
    excludedPharmacies,
  } = useFilterStore();
  const hasExclusions =
    excludedLaboratories.length > 0 ||
    excludedCategories.length > 0 ||
    excludedProducts.length > 0 ||
    excludedPharmacies.length > 0;

  // Simulation State
  const [simulationDiscount, setSimulationDiscount] = useState<number>(40);

  // Fetch Special Data if exclusions exist
  // 1. Total Ventes (Included + Excluded)
  const { data: ventesTotal, isLoading: salesTotalLoading } = useVentesKpi(
    { exclusionMode: 'include' },
    { enabled: hasExclusions && analysisType === 'standard' }
  );

  // 2. Excluded Ventes (Only Excluded)
  const { data: ventesExcluded, isLoading: salesExcludedLoading } = useVentesKpi(
    { exclusionMode: 'only' },
    { enabled: hasExclusions && analysisType === 'standard' }
  );

  // 3. Excluded Achats (For Simulation - Need Manufacturer Price)
  const { data: achatsExcluded, isLoading: achatsExcludedLoading } =
    useAchatsKpi({ exclusionMode: 'only' }, { enabled: hasExclusions });

  // GENERIC MODE: Clean Achats (Included)
  const { data: cleanAchats, isLoading: cleanAchatsLoading } = useAchatsKpi(
    {}, 
    { enabled: hasExclusions && analysisType === 'generic' }
  );

  // GENERIC MODE: Total Achats (Included + Excluded)
  const { data: achatsTotal, isLoading: achatsTotalLoading } = useAchatsKpi(
    { exclusionMode: 'include' },
    { enabled: hasExclusions && analysisType === 'generic' }
  );

  if (!hasExclusions) return null;

  // Simulation Calculation
  const manufacturerCosTotal = achatsExcluded?.montant_tarif || 0;
  const potentialSavings = manufacturerCosTotal * (simulationDiscount / 100);

  // Determine values based on analysisType
  const kpi1 = analysisType === 'generic' 
      ? {
          title: "Achats HT (Net)",
          value: cleanAchats?.montant_ht,
          loading: cleanAchatsLoading,
          evolution: cleanAchats?.evolution_percent,
          secLabel: "Qte Net",
          secValue: cleanAchats?.quantite_achetee,
          icon: Euro
      }
      : {
          title: "Ventes TTC (Net)",
          value: cleanVentes?.montant_ttc,
          loading: cleanVentesLoading,
          evolution: cleanVentes?.evolution_percent,
          secLabel: "Qte Net",
          secValue: cleanVentes?.quantite_vendue,
          icon: TrendingUp
      };

  const kpi2 = analysisType === 'generic'
      ? {
          title: "Achats HT (Total)",
          value: achatsTotal?.montant_ht,
          loading: achatsTotalLoading,
          evolution: achatsTotal?.evolution_percent,
          secLabel: "Qte Total",
          secValue: achatsTotal?.quantite_achetee,
          icon: Euro
      }
      : {
          title: "Ventes TTC (Total)",
          value: ventesTotal?.montant_ttc,
          loading: salesTotalLoading,
          evolution: ventesTotal?.evolution_percent,
          secLabel: "Qte Total",
          secValue: ventesTotal?.quantite_vendue,
          icon: TrendingUp
      };
  
  const kpi3 = analysisType === 'generic'
      ? {
          title: "Achat HT Exclus",
          value: achatsExcluded?.montant_ht,
          loading: achatsExcludedLoading,
          evolution: achatsExcluded?.evolution_percent,
          secLabel: "Qte Exclue",
          secValue: achatsExcluded?.quantite_achetee,
          icon: TrendingDown
      }
      : {
          title: "Vente TTC Exclusions",
          value: ventesExcluded?.montant_ttc,
          loading: salesExcludedLoading,
          evolution: ventesExcluded?.evolution_percent,
          secLabel: "Qte Exclue",
          secValue: ventesExcluded?.quantite_vendue,
          icon: TrendingDown
      };

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <span className="bg-orange-100 text-orange-700 p-2 rounded-lg">
            <TrendingDown className="w-5 h-5" />
          </span>
          Analyse des Exclusions
        </h2>
        <p className="text-gray-600">
          Impact des produits exclus sur votre performance globale
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. CA TTC (Hors Exclusions) - Reference */}
        <KpiCard
            title={kpi1.title}
            isLoading={kpi1.loading}
            primaryValue={formatCurrency(kpi1.value || 0)}
            evolutionPercent={kpi1.evolution}
            secondaryLabel={kpi1.secLabel}
            secondaryValue={formatNumber(kpi1.secValue || 0)}
            icon={<kpi1.icon className="w-5 h-5" />}
            accentColor={analysisType === 'generic' ? 'blue' : 'green'}
        />

        {/* 2. CA TTC (Total: Net + Excluded) */}
        <KpiCard
            title={kpi2.title}
            isLoading={kpi2.loading}
            primaryValue={formatCurrency(kpi2.value || 0)}
            evolutionPercent={kpi2.evolution}
            secondaryLabel={kpi2.secLabel}
            secondaryValue={formatNumber(kpi2.secValue || 0)}
            icon={<kpi2.icon className="w-5 h-5" />}
            accentColor="blue"
        />

        {/* 3. Impact Exclusions (Values) */}
        <KpiCard
            title={kpi3.title}
            isLoading={kpi3.loading}
            primaryValue={formatCurrency(kpi3.value || 0)}
            evolutionPercent={kpi3.evolution}
            secondaryLabel={kpi3.secLabel}
            secondaryValue={formatNumber(kpi3.secValue || 0)}
            icon={<kpi3.icon className="w-5 h-5" />}
            accentColor="red"
        />

        {/* 4. Simulation Card - Styled like KpiCard */}
        <div className="group relative">
          {/* Glassmorphism Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 p-6 h-full relative overflow-hidden">
            {/* Loading Overlay */}
            {achatsExcludedLoading && (
              <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            )}

            {/* Top Right Decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 -z-10" />

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Perte Estimée
                </h3>
              </div>
              <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl transition-transform group-hover:scale-110">
                <Euro className="w-5 h-5" />
              </div>
            </div>

            {/* Primary Value */}
            <div className="mb-4">
              <p className="text-3xl font-bold text-gray-900 tracking-tight">
                {formatCurrency(potentialSavings)}
              </p>
            </div>

            {/* Simulation Inputs & Secondary Values */}
            <div className="space-y-4">
              {/* Slider + Input */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  <span>Remise manquante:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={simulationDiscount}
                      onChange={(e) =>
                        setSimulationDiscount(
                          Math.min(100, Math.max(0, Number(e.target.value)))
                        )
                      }
                      className="w-12 text-right bg-transparent border-b border-gray-300 focus:border-orange-500 outline-none text-orange-600 font-bold"
                    />
                    <span className="text-orange-600 font-bold">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={simulationDiscount}
                  onChange={(e) =>
                    setSimulationDiscount(Number(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>

              {/* Secondary Stats */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                    Base Tarif (Fab)
                  </p>
                  <p className="text-sm font-bold text-gray-700">
                    {formatCurrency(manufacturerCosTotal)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                    Qte Achetée Exclue
                  </p>
                  <p className="text-sm font-bold text-gray-700">
                    {formatNumber(achatsExcluded?.quantite_achetee || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Subtle Glow Effect on Hover */}
          <div className="absolute inset-0 -z-10 shadow-orange-200 opacity-0 group-hover:opacity-20 blur-xl rounded-2xl transition-opacity duration-300" />
        </div>
      </div>

      {/* Detailed Exclusion Table */}
      {/* <ExclusionProductTable simulationDiscount={simulationDiscount} /> */}
    </div>
  );
};
