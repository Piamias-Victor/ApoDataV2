// src/components/organisms/FilterPanel/hooks/usePharmacyFilter.ts
import { useState, useEffect } from 'react';
import { useFilterStore } from '@/stores/useFilterStore';
import { SelectedPharmacy } from '@/types/filters';

export interface Pharmacy {
    id: string;
    name: string;
    address: string;
    ca: number;
    region: string;
    id_nat: string;
    cip: string;
}

export type Tab = 'search' | 'cluster';

export const usePharmacyFilter = (onClose?: () => void) => {
    const setPharmaciesGlobal = useFilterStore(state => state.setPharmacies);
    const storedPharmacies = useFilterStore(state => state.pharmacies);

    // UI State
    const [activeTab, setActiveTab] = useState<Tab>('search');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
    const [caRange, setCaRange] = useState<[number, number]>([0, 70000000]);

    // Data & Selection
    const [pharmacies, setPharmaciesList] = useState<Pharmacy[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMap, setSelectedMap] = useState<Map<string, SelectedPharmacy>>(new Map());

    // Init Logic
    useEffect(() => {
        const initialMap = new Map<string, SelectedPharmacy>();
        storedPharmacies.forEach(p => initialMap.set(p.id, p));
        setSelectedMap(initialMap);
    }, [storedPharmacies]);

    // Fetch Logic
    useEffect(() => {
        const controller = new AbortController();

        const fetchPharmacies = async () => {
            setIsLoading(true);
            try {
                const payload: any = {};
                if (activeTab === 'search') {
                    payload.query = searchQuery.trim();
                } else {
                    payload.regions = selectedRegions;
                    payload.minCa = caRange[0];
                    payload.maxCa = caRange[1];
                }

                const response = await fetch('/api/pharmacies/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    signal: controller.signal // 👈 Add AbortSignal
                });

                if (!response.ok) throw new Error('Erreur réseau');

                const data = await response.json();
                setPharmaciesList(data.pharmacies || []);
            } catch (err) {
                // Ignore AbortError - it's expected when query changes
                if ((err as Error).name === 'AbortError') {
                    return;
                }
                console.error('Error fetching pharmacies:', err);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchPharmacies, 300);

        // Cleanup: cancel timeout and abort ongoing request
        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [activeTab, searchQuery, selectedRegions, caRange]);

    // Actions
    const handleToggle = (pharmacy: Pharmacy) => {
        const newMap = new Map(selectedMap);
        newMap.has(pharmacy.id) ? newMap.delete(pharmacy.id) : newMap.set(pharmacy.id, pharmacy);
        setSelectedMap(newMap);
    };

    const handleBatchAction = (action: 'all' | 'none') => {
        if (action === 'none') setSelectedMap(new Map());
        else {
            const newMap = new Map(selectedMap);
            pharmacies.forEach(p => newMap.set(p.id, p));
            setSelectedMap(newMap);
        }
    };

    const handleApply = () => {
        setPharmaciesGlobal(Array.from(selectedMap.values()));
        if (onClose) onClose();
    };

    return {
        activeTab, setActiveTab,
        searchQuery, setSearchQuery,
        selectedRegions, setSelectedRegions,
        caRange, setCaRange,
        pharmacies, isLoading,
        selectedMap,
        handleToggle,
        handleBatchAction,
        handleApply
    };
};
