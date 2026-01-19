import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { FilterQueryBuilder } from '@/repositories/utils/FilterQueryBuilder';
import { FilterState } from '@/types/filters';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const filters = body as FilterState;

        const {
            dateRange,
            pharmacies = [],
            laboratories = [],
            categories = [],
            products = [],
            filterOperators = [],
            settings,
            excludedPharmacies = [],
            excludedLaboratories = [],
            excludedCategories = [],
            excludedProducts = []
        } = filters;

        const pharmacyIds = pharmacies.map(p => p.id);
        const productCodes = products.map(p => p.code);

        const initialParams = [dateRange.start, dateRange.end];

        // Match mapping from Sales Repository
        const qb = new FilterQueryBuilder(initialParams, 3, filterOperators, {
            pharmacyId: 'mv.pharmacy_id',
            laboratory: 'mv.laboratory_name',
            productCode: 'mv.code_13_ref',
            cat_l1: 'mv.category_name',
            tva: 'mv.tva_rate',
            reimbursable: 'mv.is_reimbursable',
            genericStatus: 'mv.bcb_generic_status',
        });

        // Apply Filters
        qb.addPharmacies(pharmacyIds);
        qb.addLaboratories(laboratories.map(l => l.name));
        qb.addCategories(categories.map(c => ({ code: c.name, type: c.type }))); // FIX: Use name instead of ID
        qb.addProducts(productCodes);

        // Exclusions
        if (excludedPharmacies.length) qb.addExcludedPharmacies(excludedPharmacies.map(p => p.id));
        if (excludedLaboratories.length) qb.addExcludedLaboratories(excludedLaboratories.map(l => l.name));
        if (excludedCategories.length) qb.addExcludedCategories(excludedCategories.map(c => ({ code: c.name, type: c.type }))); // FIX: Use name instead of ID
        if (excludedProducts.length) qb.addExcludedProducts(excludedProducts.map(p => p.code));

        // Settings
        if (settings?.tvaRates) qb.addTvaRates(settings.tvaRates);
        if (settings?.reimbursementStatus) qb.addReimbursementStatus(settings.reimbursementStatus);
        if (settings?.isGeneric) qb.addGenericStatus(settings.isGeneric);

        const conditions = qb.getConditions();
        const params = qb.getParams();

        const regionalSql = `
            SELECT 
                p.area as region,
                COUNT(DISTINCT p.id) as pharmacy_count,
                SUM(mv.montant_ht * (1 + COALESCE(mv.tva_rate, 0) / 100.0)) as total_sales
            FROM mv_sales_enriched mv
            JOIN data_pharmacy p ON mv.pharmacy_id = p.id
            WHERE mv.sale_date >= $1::date 
              AND mv.sale_date <= $2::date
              AND p.area IS NOT NULL
              ${conditions}
            GROUP BY p.area
            ORDER BY total_sales DESC
        `;

        const nationalSql = `
            SELECT 
                COUNT(DISTINCT p.id) as pharmacy_count,
                SUM(mv.montant_ht * (1 + COALESCE(mv.tva_rate, 0) / 100.0)) as total_sales
            FROM mv_sales_enriched mv
            JOIN data_pharmacy p ON mv.pharmacy_id = p.id
            WHERE mv.sale_date >= $1::date 
              AND mv.sale_date <= $2::date
              AND p.area IS NOT NULL
              ${conditions}
        `;

        const [regionalResult, nationalResult] = await Promise.all([
            query(regionalSql, params),
            query(nationalSql, params)
        ]);

        const nationalData = nationalResult.rows[0];
        const nationalTotalSales = Number(nationalData.total_sales || 0);
        const nationalPharmacyCount = Number(nationalData.pharmacy_count || 0);
        const nationalAverage = nationalPharmacyCount > 0 ? nationalTotalSales / nationalPharmacyCount : 0;

        const regions = regionalResult.rows.map((row: any) => {
            const regionAverage = Number(row.pharmacy_count) > 0 ? Number(row.total_sales) / Number(row.pharmacy_count) : 0;
            const deviation = nationalAverage > 0 ? ((regionAverage - nationalAverage) / nationalAverage) * 100 : 0;

            return {
                region: row.region,
                value: Number(row.total_sales),
                pharmacyCount: Number(row.pharmacy_count),
                averageSales: regionAverage,
                comparison: {
                    nationalAverage: nationalAverage,
                    deviation: deviation,
                    label: "Vs Moyenne Nationale"
                }
            };
        });

        return NextResponse.json(regions);

    } catch (error) {
        console.error('Error fetching region stats:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
