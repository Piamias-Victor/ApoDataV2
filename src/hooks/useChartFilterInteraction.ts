import { useCallback } from 'react';
import { useFilterStore } from '@/stores/useFilterStore';
// Types handled implicitly or via store
// import { SelectedCategory, SelectedLaboratory, SelectedPharmacy, SelectedProduct, SelectedGroup } from '@/types/filters';

type FilterType = 'category' | 'laboratory' | 'product' | 'pharmacy' | 'group';

interface UseChartFilterInteractionProps {
    filterType: FilterType;
    currentDepth?: number; // Logic for categories (0 = L0, 1 = L1...)
    onDefaultClick?: (data: any) => void;
}

/**
 * Hook to standardize "Smart Click" on charts.
 * - Click: Default action (e.g., Zoom/Drilldown)
 * - Ctrl/Cmd + Click: Add item to global filter
 */
export const useChartFilterInteraction = ({
    filterType,
    currentDepth = 0,
    onDefaultClick
}: UseChartFilterInteractionProps) => {

    const {
        categories, setCategories,
        laboratories, setLaboratories,
        products, setProducts,
        // pharmacies, setPharmacies,
        // groups, setGroups
    } = useFilterStore();

    const handleInteraction = useCallback((data: any, event?: React.MouseEvent) => {
        // Guard clause for missing data
        if (!data) return;

        // Check if event exists (some charts might not pass the event directly in the same arg)
        // Recharts usually passes (data, index, event) or (data, index) and event is somewhere else.
        // We assume the caller passes the strict React.MouseEvent if they want the feature.

        // However, Recharts `onClick` gives (data, index) and the event is inside data? No.
        // Recharts `onClick` signature is `(data, index, event)`.
        // BUT for standard SVG elements, specific handling might be needed.

        // Let's assume the caller will extract the native event and pass it here, 
        // OR we try to detect `ctrlKey` from the argument if it's mixed.

        // Recharts: onClick(data, index, event) -> We need to handle this signature spread in the component.
        // But here we just process "Is Modifier Key Pressed?".

        const isModifierPressed = event ? (event.ctrlKey || event.metaKey) : false;

        if (isModifierPressed) {
            // STOP Default Action (Zooom)
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }

            const name = data.name || data.id; // Fallback
            const id = data.id || data.name;

            // Logic per type
            switch (filterType) {
                case 'category': {
                    // Mapping depth to BCB levels
                    // Depth 0 (Root shown) -> Clicking adds L0
                    // Depth 1 (Inside L0) -> Clicking adds L1
                    // etc.
                    const mapping = ['bcb_segment_l0', 'bcb_segment_l1', 'bcb_segment_l2', 'bcb_segment_l3', 'bcb_segment_l4', 'bcb_segment_l5'];
                    const type = mapping[currentDepth] as any; // safe cast to SelectedCategory['type']

                    // Check duplicate
                    if (!categories.find(c => c.name === name)) {
                        setCategories([...categories, { id, name, type: type || 'bcb_segment_l0' }]);
                    }
                    break;
                }

                case 'laboratory': {
                    if (!laboratories.find(l => l.name === name)) {
                        setLaboratories([...laboratories, { id, name }]);
                    }
                    break;
                }

                case 'product': {
                    // id should be EAN
                    if (!products.find(p => p.code === id)) {
                        setProducts([...products, { code: id, name }]);
                    }
                    break;
                }
            }
            return; // EXIT
        }

        // Default Action (Zoom)
        if (onDefaultClick) {
            onDefaultClick(data);
        }

    }, [
        categories, setCategories,
        laboratories, setLaboratories,
        products, setProducts, // Added dependency
        filterType, currentDepth, onDefaultClick
    ]);

    return { handleInteraction };
};
