// src/components/organisms/FilterPanel/hooks/useLaboratoryFilter.ts
import { useState, useEffect, useCallback } from 'react';
import { useFilterStore } from '@/stores/useFilterStore';
import { SelectedLaboratory } from '@/types/filters';

export type SearchMode = 'laboratory' | 'product';
export type LabOrBrandMode = 'laboratory' | 'brand';

export interface Laboratory {
    readonly laboratory_name: string;
    readonly product_count: number;
    readonly product_codes: string[];
    readonly matching_products?: Array<{ name: string; code_13_ref: string }>;
    readonly source_type?: 'laboratory' | 'brand';
}

interface SearchResponse {
    readonly laboratories: Laboratory[];
    readonly count: number;
    readonly queryTime: number;
    readonly mode: SearchMode;
    readonly labOrBrandMode: LabOrBrandMode;
}

export const useLaboratoryFilter = (onClose?: () => void) => {
    // Global Store
    const { laboratories: storedLaboratories, setLaboratories: setStoredLaboratories } = useFilterStore();

    // Local State
    const [searchQuery, setSearchQuery] = useState('');
    // const [searchMode, setSearchMode] = useState<SearchMode>('laboratory'); // Unused as we only do lab/brand search for now in this panel
    const searchMode: SearchMode = 'laboratory';

    const [labOrBrandMode, setLabOrBrandMode] = useState<LabOrBrandMode>('laboratory');

    const [results, setResults] = useState<Laboratory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Temporary selection state
    const [selectedMap, setSelectedMap] = useState<Map<string, SelectedLaboratory>>(new Map());

    // Initialize selectedMap from store
    useEffect(() => {
        const initialMap = new Map<string, SelectedLaboratory>();
        storedLaboratories.forEach(lab => {
            initialMap.set(lab.name, lab);
        });
        setSelectedMap(initialMap);
    }, [storedLaboratories]);

    // Search Effect - Triggered on Mount (empty query) AND on query change
    useEffect(() => {
        const fetchLaboratories = async () => {
            // No minimum length check anymore for default list
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch('/api/laboratories/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: searchQuery.trim(),
                        mode: searchMode,
                        labOrBrandMode: labOrBrandMode
                    }),
                });

                if (!response.ok) throw new Error('Erreur réseau');

                const data: SearchResponse = await response.json();
                setResults(data.laboratories);
            } catch (err) {
                console.error('Error fetching laboratories:', err);
                setError('Erreur lors de la recherche');
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchLaboratories, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, searchMode, labOrBrandMode]);

    // Handlers
    const handleToggle = (lab: Laboratory) => {
        setSelectedMap(prev => {
            const next = new Map(prev);
            if (next.has(lab.laboratory_name)) {
                next.delete(lab.laboratory_name);
            } else {
                next.set(lab.laboratory_name, {
                    id: lab.laboratory_name,
                    name: lab.laboratory_name,
                    productCodes: lab.product_codes
                });
            }
            return next;
        });
    };

    const handleRemoveSelection = (name: string) => {
        setSelectedMap(prev => {
            const next = new Map(prev);
            next.delete(name);
            return next;
        });
    };

    const handleApply = () => {
        setStoredLaboratories(Array.from(selectedMap.values()));
        if (onClose) onClose();
    };

    const handleClearAll = () => {
        setSelectedMap(new Map());
    };

    return {
        searchQuery, setSearchQuery,
        labOrBrandMode, setLabOrBrandMode,
        results,
        isLoading,
        selectedMap,
        handleToggle,
        handleRemoveSelection,
        handleApply,
        handleClearAll
    };
};
