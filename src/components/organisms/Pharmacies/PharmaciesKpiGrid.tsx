
import React from 'react';
import { useFilterStore } from '@/stores/useFilterStore';
import { formatNumber, formatCurrency } from '@/lib/utils/formatters';
import { KpiCard } from '@/components/molecules/KpiCard/KpiCard';

// Hooks
import { useAchatsKpi } from '@/hooks/kpi/useAchatsKpi';
import { useVentesKpi } from '@/hooks/kpi/useVentesKpi';
import { useMargeKpi } from '@/hooks/kpi/useMargeKpi';
import { useStockKpi } from '@/hooks/kpi/useStockKpi';
import { useInventoryDaysKpi } from '@/hooks/kpi/useInventoryDaysKpi';
import { useReceptionRateKpi } from '@/hooks/kpi/useReceptionRateKpi';
import { usePriceEvolutionKpi } from '@/hooks/kpi/usePriceEvolutionKpi';
import { useNetworkHealthKpi } from '@/hooks/kpi/useNetworkHealthKpi';

// Icons
import { ShoppingCart, TrendingUp, Package, Truck, DollarSign, Activity, Users, Target } from 'lucide-react';

export const PharmaciesKpiGrid: React.FC = () => {
    const { setPharmacies } = useFilterStore();

    // -- 1. Local Data (Selected Pharmacies)
    const achats = useAchatsKpi();
    const ventes = useVentesKpi();
    const marge = useMargeKpi();
    const stock = useStockKpi();
    const days = useInventoryDaysKpi();
    const reception = useReceptionRateKpi();
    const price = usePriceEvolutionKpi();
    const health = useNetworkHealthKpi();

    // -- 2. Global Data (Benchmarking - Ignoring Pharmacy Filter)
    const globalRequest = React.useMemo(() => ({ pharmacyIds: [] }), []);
    const globalAchats = useAchatsKpi(globalRequest);
    const globalVentes = useVentesKpi(globalRequest);
    const globalHealth = useNetworkHealthKpi(globalRequest);


    // -- Derived Metrics --

    // Achats
    const achatsAmount = achats.data?.montant_ht || 0;
    const achatsQty = achats.data?.quantite_achetee || 0;

    // Global Average Calculation
    const globalActiveCount = globalHealth.data?.active_count || 1;
    const globalAchatsAvg = (globalAchats.data?.montant_ht || 0) / globalActiveCount;

    // Ventes
    const ventesAmount = ventes.data?.montant_ttc || 0;
    const ventesQty = ventes.data?.quantite_vendue || 0;

    // Global Average Calculation
    const globalVentesAvg = (globalVentes.data?.montant_ttc || 0) / globalActiveCount;

    // 3. Marge
    const margeAmount = marge.data?.montant_marge || 0;
    const margeRate = marge.data?.marge_percent || 0;

    // 4. Stock
    const stockVal = stock.data?.stock_value_ht || 0;
    const stockQty = stock.data?.stock_quantity || 0;

    // 5. Logistique
    const inventoryDays = days.data?.days || 0;
    const receptionRate = reception.data?.rate || 0;

    // 6. Prix
    const priceData = price.data as any;
    const buyPrice = priceData?.purchase_price || 0;
    const sellPrice = priceData?.sell_price || 0;
    const buyEvolution = priceData?.purchase_evolution_percent || 0;

    // -- Interactions --
    const handleDnClick = (e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
            if (health.data?.active_pharmacies) {
                setPharmacies(health.data.active_pharmacies);
            }
        }
    };

    const handleParetoClick = (e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
            if (health.data?.pareto_pharmacies) {
                setPharmacies(health.data.pareto_pharmacies);
            }
        }
    };



    const HintBadge = (
        <span className="inline-flex items-center text-[10px] font-semibold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-100 whitespace-nowrap">
            Astuce : Ctrl + Clic
        </span>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. ACHATS */}
            <KpiCard
                title="Achats HT"
                primaryValue={formatCurrency(achatsAmount)}
                secondaryLabel="Qte / Moy. du Groupe"
                secondaryValue={
                    <div className="flex items-center gap-2">
                        <span>{formatNumber(achatsQty)}</span>
                        <span className="text-xs font-normal text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                            Grp: {formatCurrency(globalAchatsAvg)}
                        </span>
                    </div>
                }
                evolutionPercent={achats.data?.evolution_percent}
                secondaryEvolutionPercent={achats.data?.quantite_achetee_evolution}
                secondaryEvolutionLabel="Evol. Qte"
                icon={<ShoppingCart className="w-5 h-5" />}
                accentColor="purple"
                isLoading={achats.isLoading || globalAchats.isLoading}
            />

            {/* 2. VENTES */}
            <KpiCard
                title="Ventes TTC"
                primaryValue={formatCurrency(ventesAmount)}
                secondaryLabel="Qte / Moy. du Groupe"
                secondaryValue={
                    <div className="flex items-center gap-2">
                        <span>{formatNumber(ventesQty)}</span>
                        <span className="text-xs font-normal text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                            Grp: {formatCurrency(globalVentesAvg)}
                        </span>
                    </div>
                }
                evolutionPercent={ventes.data?.evolution_percent}
                secondaryEvolutionPercent={ventes.data?.quantite_vendue_evolution}
                secondaryEvolutionLabel="Evol. Qte"
                icon={<TrendingUp className="w-5 h-5" />}
                accentColor="blue"
                isLoading={ventes.isLoading || globalVentes.isLoading}
            />

            {/* 3. MARGE */}
            <KpiCard
                title="Marge Globale"
                primaryValue={formatCurrency(margeAmount)}
                secondaryLabel="Taux de Marge"
                secondaryValue={`${margeRate.toFixed(1)}%`}
                evolutionPercent={marge.data?.evolution_percent}
                secondaryEvolutionPercent={marge.data?.marge_percent_evolution}
                secondaryEvolutionLabel="Evol. %"
                icon={<DollarSign className="w-5 h-5" />}
                accentColor="orange"
                isLoading={marge.isLoading}
            />

            {/* 4. STOCK */}
            <KpiCard
                title="Stock Valorisé"
                primaryValue={formatCurrency(stockVal)}
                secondaryLabel="Volume Pièces"
                secondaryValue={formatNumber(stockQty)}
                evolutionPercent={stock.data?.evolution_percent}
                icon={<Package className="w-5 h-5" />}
                accentColor="red"
                isLoading={stock.isLoading}
            />

            {/* 5. LOGISTIQUE */}
            <KpiCard
                title="Logistique"
                primaryValue={`${Math.round(inventoryDays)}j Stock`}
                secondaryLabel="Taux Réception"
                secondaryValue={`${receptionRate.toFixed(1)}%`}
                evolutionPercent={days.data?.evolution_percent}
                secondaryEvolutionPercent={reception.data?.evolution_percent}
                secondaryEvolutionLabel="Evol. Taux"
                icon={<Truck className="w-5 h-5" />}
                accentColor="indigo"
                isLoading={days.isLoading}
            />

            {/* 6. PRIX */}
            <KpiCard
                title="Prix Achat Moyen"
                primaryValue={formatCurrency(buyPrice)}
                secondaryLabel="Prix Vente Moyen"
                secondaryValue={formatCurrency(sellPrice)}
                evolutionPercent={buyEvolution}
                secondaryEvolutionPercent={priceData?.sell_evolution_percent} // Added
                secondaryEvolutionLabel="Evol. Vente"
                icon={<Activity className="w-5 h-5" />}
                accentColor="green"
                isLoading={price.isLoading}
            />

            {/* 7. DN (Distribution) */}
            <div className="relative group">
                <KpiCard
                    title="Distribution (DN)"
                    primaryValue={`${(health.data?.dn_percent || 0).toFixed(1)}%`}
                    secondaryLabel="Pharmacies Actives"
                    secondaryValue={`${health.data?.active_count || 0} / ${health.data?.total_count || 0}`}
                    hint={HintBadge}
                    onClick={handleDnClick}
                    icon={<Users className="w-5 h-5" />}
                    accentColor="pink"
                    isLoading={health.isLoading}
                />

                {/* TOOLTIP: Missing Pharmacies */}
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 hidden group-hover:block transition-opacity opacity-0 group-hover:opacity-100 pointer-events-none">
                    <div className="bg-slate-800 text-white text-xs rounded-md shadow-lg p-3">
                        <div className="font-semibold mb-1 border-b border-slate-600 pb-1">Pharmacies Manquantes:</div>
                        {health.data?.missing_pharmacy_names?.length ? (
                            <ul className="max-h-40 overflow-y-auto pl-3 list-disc space-y-0.5">
                                {health.data.missing_pharmacy_names.map((name, i) => (
                                    <li key={i}>{name}</li>
                                ))}
                            </ul>
                        ) : (
                            <div className="italic text-slate-400">Toutes les pharmacies sont actives</div>
                        )}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                    </div>
                </div>
            </div>

            {/* 8. CONCENTRATION */}
            <div className="relative group">
                <KpiCard
                    title="Concentration (80/20)"
                    primaryValue={`${(health.data?.concentration_percent || 0).toFixed(1)}% CA`}
                    secondaryLabel="Réalisé par Top 20%"
                    secondaryValue={`${(health.data?.pareto_pharmacies?.length || 0)} Pharmas`}
                    hint={HintBadge}
                    onClick={handleParetoClick}
                    icon={<Target className="w-5 h-5" />}
                    accentColor="gray"
                    isLoading={health.isLoading}
                />
                {/* TOOLTIP: Top Performers */}
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 hidden group-hover:block transition-opacity opacity-0 group-hover:opacity-100 pointer-events-none">
                    <div className="bg-slate-800 text-white text-xs rounded-md shadow-lg p-3">
                        <div className="font-semibold mb-1 border-b border-slate-600 pb-1">Top Performers (20%):</div>
                        {health.data?.pareto_pharmacies?.length ? (
                            <ul className="max-h-40 overflow-y-auto pl-3 list-disc space-y-0.5">
                                {health.data.pareto_pharmacies.map((p, i) => (
                                    <li key={i}>{p.name}</li>
                                ))}
                            </ul>
                        ) : (
                            <div className="italic text-slate-400">Données insuffisantes</div>
                        )}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                    </div>
                </div>
            </div>


        </div>
    );
};
