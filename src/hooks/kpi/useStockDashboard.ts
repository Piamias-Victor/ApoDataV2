import { useQuery } from '@tanstack/react-query';
import { useKpiRequest } from './useKpiRequest';
import { StockReceptionKpiResponse, StockCurrentKpiResponse, StockInventoryKpiResponse, StockDiscrepancyKpiResponse } from '@/types/kpi';

async function fetcher<T>(url: string, body: any): Promise<T> {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    return res.json();
}

const fetchStockEvolution = async (filters: any) => {
    const response = await fetch('/api/stock-dashboard/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
    });
    if (!response.ok) throw new Error('Failed to fetch evolution');
    return response.json();
};

export const useStockDashboard = () => {
    const request = useKpiRequest();

    const reception = useQuery({
        queryKey: ['stock-reception', request],
        queryFn: () => fetcher<StockReceptionKpiResponse>('/api/stock-dashboard/reception', request),
        enabled: !!request.dateRange,
    });

    const current = useQuery({
        queryKey: ['stock-current', request],
        queryFn: () => fetcher<StockCurrentKpiResponse>('/api/stock-dashboard/current', request),
        enabled: !!request.dateRange,
    });

    const inventory = useQuery({
        queryKey: ['stock-inventory', request],
        queryFn: () => fetcher<StockInventoryKpiResponse>('/api/stock-dashboard/inventory', request),
        enabled: !!request.dateRange,
    });

    const discrepancy = useQuery({
        queryKey: ['stock-discrepancy', request],
        queryFn: () => fetcher<StockDiscrepancyKpiResponse>('/api/stock-dashboard/discrepancy', request),
        enabled: !!request.dateRange,
    });
    const evolution = useQuery({
        queryKey: ['stock-evolution', request],
        queryFn: () => fetchStockEvolution(request),
        enabled: !!request.dateRange,
    });

    return {
        reception,
        current,
        inventory,
        discrepancy,
        evolution
    };
};
