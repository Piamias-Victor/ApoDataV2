'use client';

import React from 'react';
import { useStockDashboard } from '@/hooks/kpi/useStockDashboard';
import { StockKpiGrid } from './StockKpiGrid';
import { StockEvolutionChart } from './StockEvolutionChart';
import { ProductDiscrepancyTable } from './ProductDiscrepancyTable';
// import { RestockingTable } from './RestockingTable'; // Deprecated in favor of standardized ProductDiscrepancyTable
import { LaboratoryDiscrepancyTable } from './LaboratoryDiscrepancyTable';

export const StockDashboard = () => {
    const { reception, current, inventory, discrepancy, evolution } = useStockDashboard();

    return (
        <div className="space-y-6">
            {/* KPI Cards Grid */}
            <StockKpiGrid
                reception={reception}
                current={current}
                inventory={inventory}
                discrepancy={discrepancy}
            />

            {/* Evolution & Forecast Chart */}
            <div className="mt-6">
                <StockEvolutionChart
                    data={evolution.data || []}
                    isLoading={evolution.isLoading}
                />
            </div>

            {/* Laboratory Analysis Table (Aggregated) */}
            <div className="mt-6">
                <LaboratoryDiscrepancyTable />
            </div>

            {/* Product Analysis Table (Standardized) */}
            <div className="mt-6">
                <ProductDiscrepancyTable />
            </div>
        </div>
    );
};
