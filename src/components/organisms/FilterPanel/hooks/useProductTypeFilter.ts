import { useState, useEffect, useCallback } from 'react';
import { useFilterStore } from '@/stores/useFilterStore';

export const useProductTypeFilter = () => {
    const { settings } = useFilterStore();

    const [selectedTvaRates, setSelectedTvaRates] = useState<number[]>([]);
    const [reimbursementStatus, setReimbursementStatus] = useState<'ALL' | 'REIMBURSED' | 'NOT_REIMBURSED'>('ALL');
    const [isGeneric, setIsGeneric] = useState<'ALL' | 'PRINCEPS_GENERIC' | 'GENERIC' | 'PRINCEPS'>('ALL');

    // Sync with global store on mount/update
    useEffect(() => {
        if (settings) {
            setSelectedTvaRates(settings.tvaRates);
            setReimbursementStatus(settings.reimbursementStatus);
            setIsGeneric(settings.isGeneric);
        }
    }, [settings]);

    const handleToggleTva = useCallback((rate: number) => {
        setSelectedTvaRates(prev =>
            prev.includes(rate) ? prev.filter(r => r !== rate) : [...prev, rate]
        );
    }, []);

    const handleToggleReimbursement = useCallback((status: 'ALL' | 'REIMBURSED' | 'NOT_REIMBURSED') => {
        setReimbursementStatus(status);
    }, []);

    return {
        selectedTvaRates,
        handleToggleTva,
        reimbursementStatus,
        handleToggleReimbursement, // Exposed as is because it's just a setter wrapper in original code
        isGeneric,
        setIsGeneric
    };
};
