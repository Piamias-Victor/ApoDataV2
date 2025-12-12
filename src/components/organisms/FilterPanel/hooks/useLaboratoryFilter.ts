// src/components/organisms/FilterPanel/hooks/useLaboratoryFilter.ts
import { useState, useEffect } from 'react';
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
        const controller = new AbortController();

        const fetchLaboratories = async () => {
            // No minimum length check anymore for default list
            setIsLoading(true);

            try {
                const response = await fetch('/api/laboratories/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: searchQuery.trim(),
                        mode: searchMode,
                        labOrBrandMode: labOrBrandMode
                    }),
                    signal: controller.signal // 👈 Add AbortSignal
                });

                if (!response.ok) throw new Error('Erreur réseau');

                const data: SearchResponse = await response.json();
                setResults(data.laboratories);
            } catch (err) {
                // Ignore AbortError - it's expected when query changes
                if ((err as Error).name === 'AbortError') {
                    return;
                }
                console.error('Error fetching laboratories:', err);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchLaboratories, 300);

        // Cleanup: cancel timeout and abort ongoing request
        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
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
                    name: lab.laboratory_name
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

    const handleSelectAll = () => {
        setSelectedMap(prev => {
            const next = new Map(prev);
            results.forEach(lab => {
                next.set(lab.laboratory_name, {
                    id: lab.laboratory_name,
                    name: lab.laboratory_name
                });
            });
            return next;
        });
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
        handleClearAll,
        handleSelectAll
    };
};
