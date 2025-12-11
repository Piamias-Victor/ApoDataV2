// src/components/organisms/FilterBar/hooks/useFilterTooltips.ts
import { useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SelectedPharmacy, SelectedLaboratory, SelectedCategory, SelectedProduct } from '@/types/filters';

interface UseFilterTooltipsProps {
    pharmacies: SelectedPharmacy[];
    laboratories: SelectedLaboratory[];
    categories: SelectedCategory[];
    products: SelectedProduct[];
    dateRange: { start: string | null; end: string | null };
}

/**
 * Hook to generate tooltip text for filter buttons
 */
export const useFilterTooltips = ({
    pharmacies,
    laboratories,
    categories,
    products,
    dateRange
}: UseFilterTooltipsProps) => {
    const formatDateRange = (dateRange: { start: string | null; end: string | null }) => {
        if (!dateRange.start) return 'Aucune période';
        try {
            const start = format(new Date(dateRange.start), 'MMM yyyy', { locale: fr });
            const end = dateRange.end ? format(new Date(dateRange.end), 'MMM yyyy', { locale: fr }) : 'Aujourd\'hui';
            return `${start} - ${end}`;
        } catch { return 'Période invalide'; }
    };

    const getListTooltip = (items: Array<{ name?: string }>, defaultText: string) => {
        if (items.length === 0) return defaultText;
        if (items.length === 1) return items[0]?.name || '';
        return `${items.slice(0, 3).map(i => i?.name || '').filter(Boolean).join(', ')}${items.length > 3 ? '...' : ''}`;
    };

    return useMemo(() => ({
        pharmacyTooltip: getListTooltip(pharmacies, 'Toutes les pharmacies'),
        laboratoryTooltip: getListTooltip(laboratories, 'Tous les laboratoires'),
        categoryTooltip: getListTooltip(categories, 'Toutes les catégories'),
        productTooltip: getListTooltip(products, 'Tous les produits'),
        dateTooltip: formatDateRange(dateRange)
    }), [pharmacies, laboratories, categories, products, dateRange]);
};
