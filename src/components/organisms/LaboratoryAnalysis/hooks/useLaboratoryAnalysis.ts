import { useQuery } from '@tanstack/react-query';
import { useKpiRequest } from '@/hooks/kpi/useKpiRequest';
import { LaboratoryAnalysisRow } from '@/types/kpi';

export const useLaboratoryAnalysis = () => {
    const request = useKpiRequest();

    // Ensure we send pharmacyIds (Request Hook should already provide them from store)
    // and comparison ranges for evolution.

    const query = useQuery({
        queryKey: ['laboratory-analysis', request],
        queryFn: async () => {
            const res = await fetch('/api/stats/laboratories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            if (!res.ok) throw new Error('Failed to fetch laboratory analysis');
            return res.json() as Promise<LaboratoryAnalysisRow[]>;
        },
        // enabled: !!request.pharmacyIds?.length
    });


    return query;
};
