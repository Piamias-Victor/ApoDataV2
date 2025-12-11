// src/components/organisms/KpiDashboard/KpiDashboard.tsx
'use client';

import React from 'react';
import { KpiCard } from '@/components/molecules/KpiCard/KpiCard';
import { Euro, Package, TrendingUp, TrendingDown, Calendar, Percent } from 'lucide-react';
import { useAchatsKpi } from '@/hooks/kpi/useAchatsKpi';
import { formatCurrency, formatNumber } from '@/lib/utils/formatters';

/**
 * KPI Dashboard section with key performance indicators
 * Displays real data from API with FilterStore integration
 */
export const KpiDashboard: React.FC = () => {
    // Fetch Achats KPI with real filters
    const { data: achatsData, isLoading: achatsLoading, error: achatsError } = useAchatsKpi();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Indicateurs clés
                </h2>
                <p className="text-gray-600">
                    Vue d'ensemble de vos performances commerciales et de stock
                </p>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Achats - Real Data */}
                <KpiCard
                    title="Achats HT"
                    primaryValue={achatsLoading ? 'Chargement...' : achatsError ? 'Erreur' : formatCurrency(achatsData?.montant_ht || 0)}
                    secondaryLabel="Quantité"
                    secondaryValue={achatsLoading ? '...' : formatNumber(achatsData?.quantite_achetee || 0)}
                    evolutionPercent={achatsData?.evolution_percent}
                    icon={<Euro className="w-5 h-5" />}
                    accentColor="blue"
                />

                {/* Ventes - Mock Data (TODO) */}
                <KpiCard
                    title="Ventes HT"
                    primaryValue="187 890 €"
                    secondaryLabel="Quantité"
                    secondaryValue="15 678"
                    evolutionPercent={8.3}
                    icon={<TrendingUp className="w-5 h-5" />}
                    accentColor="green"
                />

                {/* Marge - Mock Data (TODO) */}
                <KpiCard
                    title="Marge €"
                    primaryValue="62 440 €"
                    secondaryLabel="Marge %"
                    secondaryValue="33.2%"
                    evolutionPercent={-2.1}
                    icon={<Percent className="w-5 h-5" />}
                    accentColor="purple"
                />

                {/* Stock - Mock Data (TODO) */}
                <KpiCard
                    title="Stock €"
                    primaryValue="89 450 €"
                    secondaryLabel="Quantité"
                    secondaryValue="45 230"
                    evolutionPercent={5.7}
                    icon={<Package className="w-5 h-5" />}
                    accentColor="orange"
                />

                {/* Jours de stock - Mock Data (TODO) */}
                <KpiCard
                    title="Jours de stock"
                    primaryValue="45 jours"
                    secondaryLabel="Taux de réception"
                    secondaryValue="94.5%"
                    evolutionPercent={-3.2}
                    icon={<Calendar className="w-5 h-5" />}
                    accentColor="indigo"
                />

                {/* Évolution des prix - Mock Data (TODO) */}
                <KpiCard
                    title="Évolution prix d'achat"
                    primaryValue="+2.8%"
                    secondaryLabel="Évolution prix de vente"
                    secondaryValue="+3.1%"
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
