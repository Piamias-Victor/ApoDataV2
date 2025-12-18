
import { useQuery } from '@tanstack/react-query';
import { useKpiRequest } from '@/hooks/kpi/useKpiRequest';
import { PharmacyAnalysisRow } from '@/repositories/kpi/PharmacyAnalysisRepository';

export const usePharmaciesAnalysis = () => {
    const request = useKpiRequest();

    const query = useQuery({
        queryKey: ['pharmacy-analysis', request],
        queryFn: async () => {
            const res = await fetch('/api/stats/pharmacies-detailed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            if (!res.ok) throw new Error('Failed to fetch pharmacy analysis');
            return res.json() as Promise<PharmacyAnalysisRow[]>;
        },
    });

    return query;
};
