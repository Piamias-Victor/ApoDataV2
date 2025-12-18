import React from 'react';
import { Package, Truck, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { KpiCard } from '@/components/molecules/KpiCard/KpiCard';
import { StockDashboardData } from '@/hooks/kpi/useStockDashboard';
import { formatNumber, formatCurrency } from '@/lib/utils/formatters';
import { useFilterStore } from '@/stores/useFilterStore';

interface StockKpiGridProps {
    reception: StockDashboardData['reception'];
    current: StockDashboardData['current'];
    inventory: StockDashboardData['inventory'];
    discrepancy: StockDashboardData['discrepancy'];
}

export const StockKpiGrid: React.FC<StockKpiGridProps> = ({
    reception,
    current,
    inventory,
    discrepancy
}) => {
    const { setProducts } = useFilterStore();

    const handleDiscrepancyClick = (e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
            if (discrepancy.data?.discrepancy_product_codes) {
                setProducts(discrepancy.data.discrepancy_product_codes.map((p: { code: string; label: string }) => ({
                    code: p.code,
                    name: p.label
                })));
            }
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

            <KpiCard
                title="Montants Commandes vs Réception"
                icon={<Truck className="w-5 h-5" />}
                accentColor="green"
                isLoading={reception.isLoading}
                primaryValue={formatCurrency(reception.data?.montant_commande_ht || 0)}
                secondaryLabel="Reçu"
                secondaryValue={formatCurrency(reception.data?.montant_receptionne_ht || 0)}
            />

            <KpiCard
                title="État du Stock Actuel"
                icon={<TrendingUp className="w-5 h-5" />}
                accentColor="purple"
                isLoading={current.isLoading}
                primaryValue={formatCurrency(current.data?.stock_value_ht || 0)}
                secondaryLabel="Quantité / Refs"
                secondaryValue={`${formatNumber(current.data?.stock_qte || 0)} / ${formatNumber(current.data?.nb_references || 0)} refs`}
            />

            <KpiCard
                title="Rotation & Historique"
                icon={<Clock className="w-5 h-5" />}
                accentColor="indigo"
                isLoading={inventory.isLoading}
                primaryValue={`${Math.round(inventory.data?.days_of_stock || 0)}j`}
                secondaryLabel="Moyen 12 Mois"
                secondaryValue={formatCurrency(inventory.data?.avg_stock_value_12m || 0)}
            />

            <KpiCard
                title="Ruptures & Écarts"
                icon={<AlertTriangle className="w-5 h-5" />}
                accentColor="red"
                isLoading={discrepancy.isLoading}
                primaryValue={formatNumber(discrepancy.data?.nb_references_with_discrepancy || 0)}
                secondaryLabel="% Écart"
                secondaryValue={`${(discrepancy.data?.percent_references_with_discrepancy || 0).toFixed(1)}%`}
                hint={
                    <span className="inline-flex items-center text-[10px] font-semibold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-100 whitespace-nowrap">
                        Astuce : Ctrl + Clic
                    </span>
                }
                onClick={handleDiscrepancyClick}
            />
        </div>
    );
};
