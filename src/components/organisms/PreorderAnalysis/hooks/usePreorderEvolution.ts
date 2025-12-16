import { useQuery } from '@tanstack/react-query';
import { useFilterStore } from '@/stores/useFilterStore';
import { Grain } from '@/types/kpi';

export interface PreorderDataPoint {
    date: string;
    achat_ht: number;
    achat_qty: number;
}

export const usePreorderEvolution = (grain: Grain) => {
    const {
        dateRange,
        pharmacies,
        laboratories,
        categories,
        products,
        excludedPharmacies,
        excludedLaboratories,
        excludedCategories,
        excludedProducts,
        filterOperators
    } = useFilterStore();

    return useQuery({
        queryKey: ['preorder-evolution', grain, dateRange, pharmacies, laboratories, categories, products, excludedPharmacies, excludedLaboratories, excludedCategories, excludedProducts, filterOperators],
        queryFn: async () => {
            const response = await fetch('/api/stats/preorder-evolution', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    request: {
                        dateRange,
                        pharmacyIds: pharmacies.map(p => p.id),
                        laboratories: laboratories.map(l => l.name),
                        categories: categories.map(c => c.name),
                        productCodes: products.map(p => p.code),
                        excludedPharmacyIds: excludedPharmacies.map(p => p.id),
                        excludedLaboratories: excludedLaboratories.map(l => l.name),
                        excludedCategories: excludedCategories.map(c => c.name),
                        excludedProductCodes: excludedProducts.map(p => p.code),
                        filterOperators
                    },
                    grain
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch preorder evolution data');
            }

            const data: PreorderDataPoint[] = await response.json();

            // Format dates based on grain
            return data.map(point => ({
                ...point,
                date: new Date(point.date).toLocaleDateString('fr-FR', {
                    day: grain === 'day' ? '2-digit' : undefined,
                    month: 'short',
                    year: grain !== 'day' ? '2-digit' : undefined
                })
            }));
        },
        enabled: !!dateRange.start && !!dateRange.end
    });
};
