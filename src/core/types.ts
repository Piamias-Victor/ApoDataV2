
import { AchatsKpiRequest } from "@/types/kpi";

export interface KpiPeriods {
    current: {
        start: Date;
        end: Date;
    };
    previous: {
        start: Date;
        end: Date;
    };
}

export interface KpiContext {
    request: AchatsKpiRequest; // Keep original reference
    periods: KpiPeriods;
    strategy: 'GLOBAL' | 'COMPARATIVE'; // Single Pharmacy vs Global Group
    pagination?: {
        page: number;
        pageSize: number;
        offset: number;
    };
    durationMs: number;
}
