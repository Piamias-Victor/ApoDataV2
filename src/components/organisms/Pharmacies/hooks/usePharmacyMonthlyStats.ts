import { useQuery } from '@tanstack/react-query';
import { useKpiRequest } from '@/hooks/kpi/useKpiRequest';
import { PharmacyMonthlyStat } from '@/repositories/kpi/PharmacyMonthlyRepository';

export const usePharmacyMonthlyStats = () => {
    const request = useKpiRequest();

    const query = useQuery({
        queryKey: ['pharmacy-monthly-stats', request],
        queryFn: async () => {
            const res = await fetch('/api/stats/pharmacies/monthly', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            if (!res.ok) throw new Error('Failed to fetch pharmacy monthly stats');
            return res.json() as Promise<PharmacyMonthlyStat[]>;
        },
    });

    return query;
};
