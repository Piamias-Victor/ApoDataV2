
import { AchatsKpiRequest } from "@/types/kpi";
import { KpiContext } from "../types";
import { DateHelper } from "../helpers/DateHelper";

export class KpiRequestMapper {
    static toContext(req: AchatsKpiRequest, page: number = 1, pageSize: number = 20): KpiContext {
        const { start, end } = req.dateRange;

        // Prioritize explicit comparison range if provided, otherwise fallback to sequential calculation
        let periods = DateHelper.getPeriods(start, end);

        if (req.comparisonDateRange && req.comparisonDateRange.start && req.comparisonDateRange.end) {
            periods = {
                current: periods.current,
                previous: {
                    start: new Date(req.comparisonDateRange.start),
                    end: new Date(req.comparisonDateRange.end)
                }
            };
        }

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
            dateRange: { start: start.toISOString(), end: end.toISOString() },
            pharmacyIds: filters.pharmacies?.map((p: any) => p.id) || [],
            productCodes: filters.products?.map((p: any) => p.ean13 || p.code_13_ref) || [],
            laboratories: filters.laboratories?.map((l: any) => l.name) || [],
            categories: filters.categories?.map((c: any) => c) || [],
            groups: filters.groups?.map((g: any) => g.id) || [],
            tvaRates: filters.settings?.tvaRates,
            reimbursementStatus: filters.settings?.reimbursementStatus,
            isGeneric: filters.settings?.isGeneric,
            productType: filters.settings?.productType,
            purchasePriceNetRange: filters.settings?.priceRange, // Using priceRange as purchasePriceNetRange often maps to it or generic price
            // Note: Check if filters.settings has distinct ranges. Usually it has 'priceRange' which might map to one of them.
            // Let's assume standard mapping or keep it simple for now. 
            // Better: Spread settings if we trust content, but explicit is safer.
            // Let's use spread with a cast or just mapped fields.
            ...filters.settings,
            excludedProductCodes: filters.excludedProducts?.map((p: any) => p.ean13) || [],
            excludedLaboratories: filters.excludedLaboratories?.map((l: any) => l.name) || [],
            excludedCategories: filters.excludedCategories || [],
            excludedPharmacyIds: filters.excludedPharmacies?.map((p: any) => p.id) || []
        };
    }
}
