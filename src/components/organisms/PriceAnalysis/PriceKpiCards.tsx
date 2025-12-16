import React from 'react';
import { usePriceKpi } from '@/hooks/kpi/usePriceKpi';
import { KpiCard } from '@/components/molecules/KpiCard/KpiCard';
import { ShoppingCart, Tag, Percent } from 'lucide-react';

export const PriceKpiCards: React.FC = () => {
    const { data, isLoading } = usePriceKpi();

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Carte 1 : Prix Moyen Achat */}
            <KpiCard
                title="Prix Moyen Achat HT"
                icon={<ShoppingCart className="w-5 h-5" />}
                accentColor="purple"
                isLoading={isLoading}
                primaryValue={`${data?.my_avg_purchase_price?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0,00 €'}`}
                evolutionPercent={data?.my_avg_purchase_price_evolution}
                evolutionLabel="Moi vs N-1"

                secondaryLabel="Groupe"
                secondaryValue={`${data?.group_avg_purchase_price?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0,00 €'}`}
                secondaryEvolutionPercent={data?.group_avg_purchase_price_evolution}
                secondaryEvolutionLabel="Grp vs N-1"
            />

            {/* Carte 2 : Prix Moyen Vente */}
            <KpiCard
                title="Prix Moyen Vente TTC"
                icon={<Tag className="w-5 h-5" />}
                accentColor="blue"
                isLoading={isLoading}
                primaryValue={`${data?.my_avg_sell_price?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0,00 €'}`}
                evolutionPercent={data?.my_avg_sell_price_evolution}
                evolutionLabel="Moi vs N-1"

                secondaryLabel="Groupe"
                secondaryValue={`${data?.group_avg_sell_price?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0,00 €'}`}
                secondaryEvolutionPercent={data?.group_avg_sell_price_evolution}
                secondaryEvolutionLabel="Grp vs N-1"
            />

            {/* Carte 3 : Marge % */}
            <KpiCard
                title="Marge Moyenne %"
                icon={<Percent className="w-5 h-5" />}
                accentColor="orange"
                isLoading={isLoading}
                primaryValue={`${data?.my_avg_margin_rate?.toFixed(1) || '0.0'} %`}
                evolutionPercent={data?.my_avg_margin_rate_evolution} // Evolution in points
                evolutionLabel="Moi (pts)"

                secondaryLabel="Groupe"
                secondaryValue={`${data?.group_avg_margin_rate?.toFixed(1) || '0.0'} %`}
                secondaryEvolutionPercent={data?.group_avg_margin_rate_evolution}
                secondaryEvolutionLabel="Grp (pts)"
            />
        </div>
    );
};
