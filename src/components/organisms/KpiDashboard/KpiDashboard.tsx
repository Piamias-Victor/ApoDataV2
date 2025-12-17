// src/components/organisms/KpiDashboard/KpiDashboard.tsx
'use client';

import React from 'react';
import { KpiCard } from '@/components/molecules/KpiCard/KpiCard';
import { Euro, Package, TrendingUp, TrendingDown, Percent, RotateCcw } from 'lucide-react';
import { useAchatsKpi } from '@/hooks/kpi/useAchatsKpi';
import { useVentesKpi } from '@/hooks/kpi/useVentesKpi';
import { useMargeKpi } from '@/hooks/kpi/useMargeKpi';
import { useStockKpi } from '@/hooks/kpi/useStockKpi';
import { useInventoryDaysKpi } from '@/hooks/kpi/useInventoryDaysKpi';
import { useReceptionRateKpi } from '@/hooks/kpi/useReceptionRateKpi';
import { usePriceEvolutionKpi } from '@/hooks/kpi/usePriceEvolutionKpi';
import { formatCurrency, formatNumber } from '@/lib/utils/formatters';

/**
 * KPI Dashboard section with key performance indicators
 * Displays real data from API with FilterStore integration
 */
export const KpiDashboard: React.FC = () => {
    // Fetch Achats KPI with real filters
    const { data: achatsData, isLoading: achatsLoading, error: achatsError } = useAchatsKpi();
    const { data: ventesData, isLoading: ventesLoading, error: ventesError } = useVentesKpi();
    const { data: margeData, isLoading: margeLoading, error: margeError } = useMargeKpi();
    const { data: stockData, isLoading: stockLoading, error: stockError } = useStockKpi();
    const { data: inventoryData, isLoading: inventoryLoading, error: inventoryError } = useInventoryDaysKpi();
    const { data: receptionData, isLoading: receptionLoading, error: receptionError } = useReceptionRateKpi();
    const { data: priceData, isLoading: priceLoading, error: priceError } = usePriceEvolutionKpi();

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
                    title="Achats TTC"
                    isLoading={achatsLoading}
                    primaryValue={achatsError ? 'Erreur' : formatCurrency(achatsData?.montant_ttc || 0)}
                    evolutionPercent={achatsData?.evolution_percent}
                    evolutionLabel="vs N-1"
                    secondaryLabel="Quantité"
                    secondaryValue={formatNumber(achatsData?.quantite_achetee || 0)}
                    icon={<Euro className="w-5 h-5" />}
                    accentColor="blue"
                />

                {/* 2. Ventes - Real Data */}
                <KpiCard
                    title="Ventes TTC"
                    isLoading={ventesLoading}
                    primaryValue={ventesError ? 'Erreur' : formatCurrency(ventesData?.montant_ttc || 0)}
                    evolutionPercent={ventesData?.evolution_percent}
                    evolutionLabel="vs N-1"
                    secondaryLabel="Quantité"
                    secondaryValue={formatNumber(ventesData?.quantite_vendue || 0)}
                    icon={<TrendingUp className="w-5 h-5" />}
                    accentColor="green"
                />

                {/* 3. Marge - Real Data */}
                <KpiCard
                    title="Marge €"
                    isLoading={margeLoading}
                    primaryValue={margeError ? 'Erreur' : formatCurrency(margeData?.montant_marge || 0)}
                    evolutionPercent={margeData?.evolution_percent}
                    evolutionLabel="vs N-1"
                    secondaryLabel="Marge %"
                    secondaryValue={margeData ? `${formatNumber(margeData.marge_percent)}%` : '0%'}
                    icon={<Percent className="w-5 h-5" />}
                    accentColor="purple"
                />

                {/* 4. Stock - Real Data */}
                <KpiCard
                    title="Stock €"
                    isLoading={stockLoading}
                    primaryValue={stockError ? 'Erreur' : formatCurrency(stockData?.stock_value_ht || 0)}
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
                    primaryValue={inventoryError ? 'Erreur' : `${inventoryData?.days || 0} Jours`}
                    evolutionPercent={inventoryData?.evolution_percent}
                    evolutionLabel="vs N-1"

                    secondaryLabel="Taux de réception"
                    secondaryValue={receptionError ? 'Erreur' : `${receptionData?.rate ? receptionData.rate.toFixed(1) : 0}%`}
                    secondaryEvolutionPercent={receptionData?.evolution_percent}
                    secondaryEvolutionLabel="Evol. Taux"

                    icon={<RotateCcw className="w-5 h-5" />}
                    accentColor="indigo"
                />

                {/* 6. Prix Moyens */}
                <KpiCard
                    title="Prix Achat Moyen"
                    isLoading={priceLoading}
                    primaryValue={priceError ? 'Erreur' : formatCurrency(priceData?.purchase_price || 0)}
                    evolutionPercent={priceData?.purchase_evolution_percent}
                    evolutionLabel="Evol. Achat"

                    secondaryLabel="Prix Vente TTC"
                    secondaryValue={priceError ? 'Erreur' : formatCurrency(priceData?.sell_price || 0)}
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
        </div>
    );
};
