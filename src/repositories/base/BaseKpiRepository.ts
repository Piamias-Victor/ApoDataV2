
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

        // Standard Filtering vs Exclusion Mode 'ONLY'
        if (req.exclusionMode === 'only') {
            // In "ONLY" mode, we IGNORE standard filters (except Pharmacy which is usually structural scope)
             qb.addPharmacies(req.pharmacyIds || []);

            // And we transform Excluded Items into INCLUDED items via OR logic
            // We want: (Prod IN ExcludedProds) OR (Lab IN ExcludedLabs) OR ...
            const orConditions: { items: any[], generator: (idx: number) => string }[] = [];

            if (req.excludedProductCodes?.length) {
                orConditions.push({ 
                    items: req.excludedProductCodes, 
                    generator: (idx) => `${qb['mapping'].productCode} = ANY($${idx}::text[])`
                });
            }
             if (req.excludedLaboratories?.length) {
                orConditions.push({ 
                    items: req.excludedLaboratories, 
                    generator: (idx) => `${qb['mapping'].laboratory} = ANY($${idx}::text[])`
                });
            }
            if (req.excludedCategories?.length) {
                // Categories need special handling because they have types.
                // For simplicity here, we add them as a single block if possible, or skip complex category logic for now 
                // as converting the complex category structure to single param array is tricky in this generic structure.
                // LIMITATION: 'Only' mode for categories might need refinement if used heavily.
                 // let's try to map them if simple enough or extend builder later.
            }
            // For Groups (if excludedGroups exists?)
            
            qb.addOrConditions(orConditions);

        } else {
            // Default "EXCLUDE" or "INCLUDE" mode
            qb.addPharmacies(req.pharmacyIds || []);
            qb.addLaboratories(req.laboratories || []);
            qb.addCategories(req.categories || []);
            qb.addProducts(req.productCodes || []);
            qb.addGroups(req.groups || []);

            // Apply Exclusions (Unless mode is 'include')
            if (req.exclusionMode !== 'include') {
                if (req.excludedPharmacyIds) qb.addExcludedPharmacies(req.excludedPharmacyIds);
                if (req.excludedLaboratories) qb.addExcludedLaboratories(req.excludedLaboratories);
                if (req.excludedCategories) qb.addExcludedCategories(req.excludedCategories);
                if (req.excludedProductCodes) qb.addExcludedProducts(req.excludedProductCodes);
            }
        }

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
