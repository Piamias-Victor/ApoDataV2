
import { AchatsKpiRequest } from "@/types/kpi";
import { KpiContext } from "../types";
import { DateHelper } from "../helpers/DateHelper";

export class KpiRequestMapper {
    static toContext(req: AchatsKpiRequest, page: number = 1, pageSize: number = 20): KpiContext {
        const { start, end } = req.dateRange;
        const periods = DateHelper.getPeriods(start, end);

        // Logic from repositories: usually pharmacyIds[0] determines 'COMPARATIVE' (single pharmacy) vs 'GLOBAL'
        const hasPharmacy = req.pharmacyIds && req.pharmacyIds.length > 0;
        const strategy = hasPharmacy ? 'COMPARATIVE' : 'GLOBAL';

        return {
            request: req,
            periods: periods,
            strategy: strategy,
            pagination: {
                page,
                pageSize,
                offset: (page - 1) * pageSize
            },
            durationMs: periods.current.end.getTime() - periods.current.start.getTime()
        };
    }

    static fromSearchParams(searchParams: URLSearchParams): AchatsKpiRequest {
        const filtersJson = searchParams.get('filters');
        const filters = filtersJson ? JSON.parse(filtersJson) : {};
        
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate) : new Date();

        return {
            dateRange: { start, end },
            pharmacyIds: filters.pharmacies?.map((p: any) => p.id) || [],
            productCodes: filters.products?.map((p: any) => p.ean13 || p.code_13_ref) || [],
            laboratories: filters.laboratories?.map((l: any) => l.name) || [],
            categories: filters.categories?.map((c: any) => c) || [],
            groups: filters.groups?.map((g: any) => g.id) || [],
            settings: filters.settings || {},
            excludedProductCodes: filters.excludedProducts?.map((p: any) => p.ean13) || [],
            excludedLaboratories: filters.excludedLaboratories?.map((l: any) => l.name) || [],
            excludedCategories: filters.excludedCategories || [],
            excludedPharmacyIds: filters.excludedPharmacies?.map((p: any) => p.id) || []
        };
    }
}
