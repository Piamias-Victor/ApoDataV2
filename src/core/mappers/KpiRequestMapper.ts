
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
}
