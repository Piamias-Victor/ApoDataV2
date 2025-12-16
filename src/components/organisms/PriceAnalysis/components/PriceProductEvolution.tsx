
import React from 'react';
import { usePriceEvolution } from '@/hooks/kpi/usePriceEvolution';
import { EvolutionChart } from '@/components/organisms/TemporalEvolution/components/EvolutionChart';
import { SeriesConfig } from '@/components/organisms/TemporalEvolution/components/EvolutionChart';

interface PriceProductEvolutionProps {
    ean13: string;
}

export const PriceProductEvolution: React.FC<PriceProductEvolutionProps> = ({ ean13 }) => {
    const { data, isLoading } = usePriceEvolution(ean13);

    // Reuse the same series configuration as PriceEvolutionSection
    const seriesConfig: SeriesConfig[] = [
        { key: 'avg_sell_price', name: 'Prix Vente Moyen MA PHARMA', color: '#10B981', yAxisId: 'left', type: 'line' },
        { key: 'avg_purchase_price', name: 'Prix Achat Moyen MA PHARMA', color: '#6366F1', yAxisId: 'left', type: 'line' },
        { key: 'margin_rate', name: 'Marge %', color: '#F59E0B', yAxisId: 'right', type: 'line' },
        { key: 'margin_eur', name: 'Marge €', color: '#EC4899', yAxisId: 'amount', type: 'area' },
        { key: 'sales_qty', name: 'Qté Ventes', color: '#3B82F6', yAxisId: 'volume', type: 'bar' },
        { key: 'purchases_qty', name: 'Qté Achats', color: '#8B5CF6', yAxisId: 'volume', type: 'bar' }
    ];

    if (isLoading) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center bg-gray-50 rounded-lg animate-pulse">
                <div className="text-gray-400">Chargement de l&apos;évolution...</div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="h-[200px] w-full flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-gray-400">Aucune donnée d&apos;évolution disponible pour ce produit.</div>
            </div>
        );
    }

    return (
        <div className="h-[400px] w-full bg-white p-4 rounded-lg shadow-inner">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Évolution Temporelle Du Prix</h4>
            <EvolutionChart
                data={data}
                seriesConfig={seriesConfig}
            />
        </div>
    );
};
