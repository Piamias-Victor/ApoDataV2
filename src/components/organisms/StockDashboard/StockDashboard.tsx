'use client';

import React from 'react';
import { useStockDashboard } from '@/hooks/kpi/useStockDashboard';
import { KpiCard } from '@/components/molecules/KpiCard/KpiCard';
import { StockEvolutionChart } from './StockEvolutionChart';
import { RestockingTable } from './RestockingTable';
import { LaboratoryDiscrepancyTable } from './LaboratoryDiscrepancyTable';
import { ProductDiscrepancyTable } from './ProductDiscrepancyTable';
import { Package, Truck, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { formatNumber, formatCurrency } from '@/lib/utils/formatters';
import { useFilterStore } from '@/stores/useFilterStore';

export const StockDashboard = () => {
    const { reception, current, inventory, discrepancy, evolution } = useStockDashboard();
    const { setProducts } = useFilterStore();

    const handleDiscrepancyClick = () => {
        if (discrepancy.data?.discrepancy_product_codes) {
            // Map to SelectedProduct format { code, name }
            const productsToSelect = discrepancy.data.discrepancy_product_codes.map(p => ({
                code: p.code,
                name: p.label
            }));

            setProducts(productsToSelect);
        }
    };

    return (
        <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. Volume Commandes vs Réception */}
                <KpiCard
                    title="Volume Commandes vs Réception"
                    icon={<Package className="w-5 h-5" />}
                    accentColor="blue"
                    isLoading={reception.isLoading}
                    primaryValue={formatNumber(reception.data?.qte_commandee || 0)}
                    secondaryLabel="Reçu / Taux"
                    secondaryValue={`${formatNumber(reception.data?.qte_receptionnee || 0)} (${(reception.data?.taux_reception || 0).toFixed(1)}%)`}
                    evolutionPercent={reception.data?.evolution_percent || undefined}
                />

                {/* 2. Montants Commandes vs Réception */}
                <KpiCard
                    title="Montants Commandes vs Réception"
                    icon={<Truck className="w-5 h-5" />}
                    accentColor="green"
                    isLoading={reception.isLoading}
                    primaryValue={formatCurrency(reception.data?.montant_commande_ht || 0)}
                    secondaryLabel="Reçu"
                    secondaryValue={formatCurrency(reception.data?.montant_receptionne_ht || 0)}
                // Tertiary (Ecart) omitted or could be added to secondaryValue
                />

                {/* 3. État du Stock Actuel */}
                <KpiCard
                    title="État du Stock Actuel"
                    icon={<TrendingUp className="w-5 h-5" />}
                    accentColor="purple"
                    isLoading={current.isLoading}
                    primaryValue={formatCurrency(current.data?.stock_value_ht || 0)}
                    secondaryLabel="Quantité / Refs"
                    secondaryValue={`${formatNumber(current.data?.stock_qte || 0)} / ${formatNumber(current.data?.nb_references || 0)} refs`}
                />

                {/* 4. Rotation & Historique */}
                <KpiCard
                    title="Rotation & Historique"
                    icon={<Clock className="w-5 h-5" />}
                    accentColor="indigo"
                    isLoading={inventory.isLoading}
                    primaryValue={`${Math.round(inventory.data?.days_of_stock || 0)}j`}
                    secondaryLabel="Moyen 12 Mois"
                    secondaryValue={formatCurrency(inventory.data?.avg_stock_value_12m || 0)}
                />

                {/* 5. Ruptures & Écarts */}
                <div title="Ctrl + Clic pour filtrer" className="contents" onClick={handleDiscrepancyClick}>
                    <KpiCard
                        title="Ruptures & Écarts"
                        icon={<AlertTriangle className="w-5 h-5" />}
                        accentColor="red"
                        isLoading={discrepancy.isLoading}
                        primaryValue={formatNumber(discrepancy.data?.nb_references_with_discrepancy || 0)}
                        secondaryLabel="% Écart"
                        secondaryValue={`${(discrepancy.data?.percent_references_with_discrepancy || 0).toFixed(1)}%`}
                    // KpiCard doesn't support onClick directly on root div in legacy code?? 
                    // Wait, looking at legacy code:
                    // export const KpiCard... ({ ... }) => { ... return <div className="group relative"> ... }
                    // It DOES NOT have onClick prop in the interface provided !!
                    // But I need it for the click handler.
                    // I will wrap it in a div that handles click, which I already did <div className="contents" onClick...>
                    />
                </div>
            </div>

            {/* Evolution & Forecast Chart */}
            <div className="mt-6">
                <StockEvolutionChart
                    data={evolution.data || []}
                    isLoading={evolution.isLoading}
                />
            </div>

            {/* Restocking Table */}
            <div className="mt-6">
                <RestockingTable />
            </div>


            {/* Laboratory Discrepancy Table */}
            <div className="mt-6">
                <LaboratoryDiscrepancyTable />
            </div>

            {/* Product Discrepancy Table */}
            <div className="mt-6">
                <ProductDiscrepancyTable />
            </div>
        </div>
    );
};
