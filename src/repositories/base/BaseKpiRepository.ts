
import { FilterQueryBuilder } from '../../repositories/utils/FilterQueryBuilder';
import { KpiContext } from '@/core/types';

export abstract class BaseKpiRepository {

    /**
     * Initializes a FilterQueryBuilder with standard properties and applies common filters.
     * @param context The KPI Context
     * @param baseParams The initial parameters list (e.g. dates)
     * @param mapping The column mapping for the SQL query
     * @param operatorsOverride Optional override for filter operators
     */
    protected createBuilder(
        context: KpiContext,
        baseParams: any[],
        mapping: Record<string, string>,
        operatorsOverride?: ('AND' | 'OR')[]
    ): FilterQueryBuilder {

        const nextIdx = baseParams.length + 1;
        const operators = operatorsOverride || context.request.filterOperators || [];

        const qb = new FilterQueryBuilder(
            baseParams,
            nextIdx,
            operators,
            mapping
        );

        this.applyCommonFilters(qb, context);
        return qb;
    }

    private applyCommonFilters(qb: FilterQueryBuilder, context: KpiContext) {
        const req = context.request;

        qb.addPharmacies(req.pharmacyIds || []);
        qb.addLaboratories(req.laboratories || []);
        qb.addCategories(req.categories || []);
        qb.addProducts(req.productCodes || []);

        // Exclusions
        if (req.excludedPharmacyIds) qb.addExcludedPharmacies(req.excludedPharmacyIds);
        if (req.excludedLaboratories) qb.addExcludedLaboratories(req.excludedLaboratories);
        if (req.excludedCategories) qb.addExcludedCategories(req.excludedCategories);
        if (req.excludedProductCodes) qb.addExcludedProducts(req.excludedProductCodes);

        // Settings
        if (req.tvaRates) qb.addTvaRates(req.tvaRates);
        qb.addReimbursementStatus(req.reimbursementStatus);

        // Generic Status Logic handled in builder but we need to map the enum
        let genericValue: 'ALL' | 'GENERIC' | 'PRINCEPS' | 'PRINCEPS_GENERIC' = 'ALL';
        if ((req.isGeneric as any) === 'YES') genericValue = 'GENERIC';
        else if ((req.isGeneric as any) === 'NO') genericValue = 'PRINCEPS';
        else if (req.isGeneric && req.isGeneric !== 'ALL') genericValue = req.isGeneric;

        qb.addGenericStatus(genericValue);
    }
}
