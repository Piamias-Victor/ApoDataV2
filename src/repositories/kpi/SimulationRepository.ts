import { db } from '@/lib/db';
import { SimulationQueries } from '@/queries/kpi/SimulationQueries';
import { FilterQueryBuilder } from '../utils/FilterQueryBuilder';

export class SimulationRepository {
    static async getSimulationStats(year: number, currentMonth: number, filters: any = {}) {
        try {
            // Initialize Query Builder starting at param $3 (after year, month)
            // Custom mapping to match mv_product_stats_monthly (aliased as 'mv')
            const qb = new FilterQueryBuilder([], 3, filters.filterOperators, {
                pharmacyId: 'mv.pharmacy_id',
                productCode: 'mv.ean13',
            });

            // 1. Pharmacies
            if (filters.pharmacies?.length > 0) {
                qb.addPharmacies(filters.pharmacies.map((p: any) => p.id));
            }

            // 2. Products
            if (filters.products?.length > 0) {
                qb.addProducts(filters.products.map((p: any) => p.ean13 || p.code_13_ref));
            }

            // 3. Laboratories
            if (filters.laboratories?.length > 0) {
                qb.addLaboratories(filters.laboratories.map((l: any) => l.name || l));
            }

            // 4. Categories
            if (filters.categories?.length > 0) {
                qb.addCategories(filters.categories);
            }

            // 5. Groups (Market Ids)
            // If applicable? usually groups are lists of products.

            // 6. Settings (Generic, Reimbursable, TVA)
            if (filters.settings) {
                if (filters.settings.tvaRates?.length > 0) qb.addTvaRates(filters.settings.tvaRates);
                qb.addReimbursementStatus(filters.settings.reimbursementStatus);
                qb.addGenericStatus(filters.settings.isGeneric);
            }

            // 7. Exclusions
            if (filters.excludedPharmacies?.length > 0) qb.addExcludedPharmacies(filters.excludedPharmacies.map((p: any) => p.id));
            if (filters.excludedProducts?.length > 0) qb.addExcludedProducts(filters.excludedProducts.map((p: any) => p.ean13));
            if (filters.excludedLaboratories?.length > 0) qb.addExcludedLaboratories(filters.excludedLaboratories.map((l: any) => l.name));
            if (filters.excludedCategories?.length > 0) qb.addExcludedCategories(filters.excludedCategories);


            const conditions = qb.getConditions();
            const queryParams = [year, currentMonth, ...qb.getParams()];

            // We interpret the query as a function that takes the conditions string
            const queryText = SimulationQueries.getSimulationStats(conditions);

            const result = await db.query(queryText, queryParams);

            return result.rows[0] || {
                realized_sales_ttc: 0,
                realized_purchases_ht: 0,
                prev_total_sales_ttc: 0,
                prev_total_purchases_ht: 0,
                prev_remaining_sales_ttc: 0,
                prev_remaining_purchases_ht: 0
            };
        } catch (error) {
            console.error('Error fetching simulation stats:', error);
            throw error;
        }
    }
}
