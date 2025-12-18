'use client';

import React from 'react';
import { useSimulationStats } from './hooks/useSimulationStats';
import { SimulationCard } from './SimulationCard';
import { Loader2 } from 'lucide-react';

export const SimulationDashboard: React.FC = () => {
    const { data, isLoading } = useSimulationStats();

    if (isLoading) {
        return (
            <div className="w-full h-64 flex items-center justify-center bg-white/50 rounded-xl border border-gray-100 animate-pulse">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <SimulationCard
                title="Simulation Achats HT"
                realized={data.realized_purchases_ht}
                prevTotal={data.prev_total_purchases_ht}
                prevRemaining={data.prev_remaining_purchases_ht}
                color="purple"
            />

            <SimulationCard
                title="Simulation Ventes TTC"
                realized={data.realized_sales_ttc}
                prevTotal={data.prev_total_sales_ttc}
                prevRemaining={data.prev_remaining_sales_ttc}
                color="blue"
            />
        </div>
    );
};
