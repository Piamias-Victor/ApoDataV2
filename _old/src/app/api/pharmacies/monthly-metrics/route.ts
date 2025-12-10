import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MonthlyMetricsResponse, PharmacyMonthlyData } from '@/types/monthly-metrics';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest): Promise<NextResponse<MonthlyMetricsResponse | { error: string }>> {
    const startTime = Date.now();
    console.log('🔥 [API] Monthly Metrics Request started');

    try {
        const body = await request.json();
        const { dateRange, pharmacyIds, productCodes, categoryCodes, laboratoryCodes } = body;

        if (!dateRange?.start || !dateRange?.end) {
            return NextResponse.json({ error: 'Date range required' }, { status: 400 });
        }

        const allProductCodes = Array.from(new Set([
            ...(productCodes || []),
            ...(laboratoryCodes || []),
            ...(categoryCodes || [])
        ]));

        // Extract pharmacy IDs from objects
        const pharmacyIdsList = Array.isArray(pharmacyIds)
            ? pharmacyIds.map(p => typeof p === 'string' ? p : p?.id).filter(Boolean)
            : [];

        const hasProductFilter = allProductCodes.length > 0;
        const hasPharmacyFilter = pharmacyIdsList.length > 0;

        const productFilter = hasProductFilter
            ? 'AND ip.code_13_ref_id = ANY($3::text[])'
            : '';

        const pharmacyFilter = hasPharmacyFilter
            ? (hasProductFilter ? 'AND ip.pharmacy_id = ANY($4::uuid[])' : 'AND ip.pharmacy_id = ANY($3::uuid[])')
            : '';

        const params: any[] = [dateRange.start, dateRange.end];

        if (hasProductFilter) {
            params.push(allProductCodes);
        }

        if (hasPharmacyFilter) {
            params.push(pharmacyIdsList);
        }

        // Query for monthly sales data
        const salesQuery = `
            SELECT 
                p.id as pharmacy_id,
                p.name as pharmacy_name,
                TO_CHAR(s.date, 'YYYY-MM') as month,
                SUM(s.quantity) as quantite_vendue,
                SUM(s.quantity * s.unit_price_ttc) as montant_ventes_ttc
            FROM data_sales s
            JOIN data_inventorysnapshot ins ON s.product_id = ins.id
            JOIN data_internalproduct ip ON ins.product_id = ip.id
            JOIN data_pharmacy p ON ip.pharmacy_id = p.id
            WHERE s.date >= $1::date 
            AND s.date <= $2::date
            AND s.quantity > 0
            AND s.unit_price_ttc IS NOT NULL
            AND s.unit_price_ttc > 0
            ${productFilter}
            ${pharmacyFilter}
            GROUP BY p.id, p.name, TO_CHAR(s.date, 'YYYY-MM')
            ORDER BY p.name, month
        `;

        // Query for monthly purchase data
        const purchasesQuery = `
            SELECT 
                p.id as pharmacy_id,
                p.name as pharmacy_name,
                TO_CHAR(o.delivery_date, 'YYYY-MM') as month,
                SUM(po.qte_r) as quantite_achetee,
                SUM(po.qte_r * COALESCE(closest_snap.weighted_average_price, 0)) as montant_achats_ht
            FROM data_productorder po
            INNER JOIN data_order o ON po.order_id = o.id
            INNER JOIN data_internalproduct ip ON po.product_id = ip.id
            INNER JOIN data_pharmacy p ON ip.pharmacy_id = p.id
            LEFT JOIN LATERAL (
                SELECT weighted_average_price
                FROM data_inventorysnapshot ins2
                WHERE ins2.product_id = po.product_id
                AND ins2.weighted_average_price > 0
                ORDER BY ins2.date DESC
                LIMIT 1
            ) closest_snap ON true
            WHERE o.delivery_date >= $1::date 
            AND o.delivery_date <= $2::date
            AND o.delivery_date IS NOT NULL
            AND po.qte_r > 0
            ${productFilter}
            ${pharmacyFilter}
            GROUP BY p.id, p.name, TO_CHAR(o.delivery_date, 'YYYY-MM')
            ORDER BY p.name, month
        `;

        console.log('🔍 [API] Executing monthly queries...');
        const [salesRows, purchasesRows] = await Promise.all([
            db.query(salesQuery, params),
            db.query(purchasesQuery, params)
        ]);

        // Combine data by pharmacy and month
        const pharmaciesMap = new Map<string, PharmacyMonthlyData>();
        const monthsSet = new Set<string>();

        // Process sales data
        salesRows.forEach(row => {
            const pharmacyId = row.pharmacy_id;
            const month = row.month;
            if (!pharmacyId || !month) return;

            if (!pharmaciesMap.has(pharmacyId)) {
                pharmaciesMap.set(pharmacyId, {
                    pharmacy_id: pharmacyId,
                    pharmacy_name: row.pharmacy_name || '',
                    months: {}
                });
            }

            const pharmacy = pharmaciesMap.get(pharmacyId)!;
            monthsSet.add(month);

            if (!pharmacy.months[month]) {
                pharmacy.months[month] = {
                    quantite_vendue: 0,
                    montant_ventes_ttc: 0,
                    quantite_achetee: 0,
                    montant_achats_ht: 0,
                    evol_ventes_pct: null,
                    evol_achats_pct: null
                };
            }

            pharmacy.months[month].quantite_vendue = Number(row.quantite_vendue) || 0;
            pharmacy.months[month].montant_ventes_ttc = Number(row.montant_ventes_ttc) || 0;
        });

        // Process purchases data
        purchasesRows.forEach(row => {
            const pharmacyId = row.pharmacy_id;
            const month = row.month;
            if (!pharmacyId || !month) return;

            if (!pharmaciesMap.has(pharmacyId)) {
                pharmaciesMap.set(pharmacyId, {
                    pharmacy_id: pharmacyId,
                    pharmacy_name: row.pharmacy_name || '',
                    months: {}
                });
            }

            const pharmacy = pharmaciesMap.get(pharmacyId)!;
            monthsSet.add(month);

            if (!pharmacy.months[month]) {
                pharmacy.months[month] = {
                    quantite_vendue: 0,
                    montant_ventes_ttc: 0,
                    quantite_achetee: 0,
                    montant_achats_ht: 0,
                    evol_ventes_pct: null,
                    evol_achats_pct: null
                };
            }

            pharmacy.months[month].quantite_achetee = Number(row.quantite_achetee) || 0;
            pharmacy.months[month].montant_achats_ht = Number(row.montant_achats_ht) || 0;
        });

        // Calculate evolutions (vs previous month)
        const months = Array.from(monthsSet).sort();
        pharmaciesMap.forEach(pharmacy => {
            months.forEach((month, index) => {
                if (index > 0 && month && pharmacy.months[month]) {
                    const prevMonth = months[index - 1];
                    if (prevMonth !== undefined && pharmacy.months[prevMonth]) {
                        const prevVentes = pharmacy.months[prevMonth].montant_ventes_ttc;
                        const currVentes = pharmacy.months[month].montant_ventes_ttc;
                        if (prevVentes > 0) {
                            pharmacy.months[month].evol_ventes_pct = ((currVentes - prevVentes) / prevVentes) * 100;
                        }

                        const prevAchats = pharmacy.months[prevMonth].montant_achats_ht;
                        const currAchats = pharmacy.months[month].montant_achats_ht;
                        if (prevAchats > 0) {
                            pharmacy.months[month].evol_achats_pct = ((currAchats - prevAchats) / prevAchats) * 100;
                        }
                    }
                }
            });
        });

        const response: MonthlyMetricsResponse = {
            pharmacies: Array.from(pharmaciesMap.values()),
            months,
            queryTime: Date.now() - startTime
        };

        console.log('✅ [API] Monthly metrics completed', {
            pharmaciesCount: response.pharmacies.length,
            monthsCount: response.months.length,
            queryTime: response.queryTime
        });

        return NextResponse.json(response);

    } catch (error) {
        console.error('❌ [API] Monthly metrics failed:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}
