
import { KpiPeriods } from "../types";

export class DateHelper {
    static getPeriods(startStr: string, endStr: string): KpiPeriods {
        const startDate = new Date(startStr);
        const endDate = new Date(endStr);
        const duration = endDate.getTime() - startDate.getTime();

        const prevStartDate = new Date(startDate.getTime() - duration);
        // Previous end date is typically the day before the current start date, usually 1 day gap?
        // In the original code it was: const prevEndDate = new Date(startDate.getTime() - 86400000);
        const prevEndDate = new Date(startDate.getTime() - 86400000);

        return {
            current: { start: startDate, end: endDate },
            previous: { start: prevStartDate, end: prevEndDate }
        };
    }
}
