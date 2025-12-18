'use client';

import React from 'react';
import { useStockDashboard } from '@/hooks/kpi/useStockDashboard';
import { StockKpiGrid } from './StockKpiGrid';
import { StockEvolutionChart } from './StockEvolutionChart';
import { RestockingTable } from './RestockingTable';
import { LaboratoryDiscrepancyTable } from './LaboratoryDiscrepancyTable';
import { ProductDiscrepancyTable } from './ProductDiscrepancyTable';

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
