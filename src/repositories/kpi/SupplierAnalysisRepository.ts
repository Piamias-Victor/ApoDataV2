import { db } from '@/lib/db';
import { AchatsKpiRequest } from '@/types/kpi';
import { KpiRequestMapper } from '@/core/mappers/KpiRequestMapper';
import { BaseKpiRepository } from '@/repositories/base/BaseKpiRepository';

export interface SupplierAnalysisRow {
    supplier_category: string;

    // N
    nb_commandes: number;
    quantity_bought: number;
    ca_achats: number;      // HT
    nb_produits_distincts: number;

    // N-1
    nb_commandes_prev: number;
    quantity_bought_prev: number;
    ca_achats_prev: number; // HT
    nb_produits_distincts_prev: number;
}

export class SupplierAnalysisRepository extends BaseKpiRepository {

    async execute(request: AchatsKpiRequest): Promise<SupplierAnalysisRow[]> {
        const context = KpiRequestMapper.toContext(request);

        // 1. Fetch Current Period Data
        const currentData = await this.fetchPeriodData(context, context.periods.current.start.toISOString(), context.periods.current.end.toISOString());

        // 2. Fetch Previous Period Data
        const prevData = await this.fetchPeriodData(context, context.periods.previous.start.toISOString(), context.periods.previous.end.toISOString());

        // 3. Merge Data
        // Categories are fixed: OCP, ALLIANCE, CERP, AUTRE
        const categories = ['OCP', 'ALLIANCE', 'CERP', 'AUTRE'];

        return categories.map(cat => {
            const current = currentData.find(d => d.supplier_category === cat);
            const prev = prevData.find(d => d.supplier_category === cat);

            return {
                supplier_category: cat,
                nb_commandes: Number(current?.nb_commandes) || 0,
                quantity_bought: Number(current?.quantity_bought) || 0,
                ca_achats: Number(current?.ca_achats) || 0,
                nb_produits_distincts: Number(current?.nb_produits_distincts) || 0,

                nb_commandes_prev: Number(prev?.nb_commandes) || 0,
                quantity_bought_prev: Number(prev?.quantity_bought) || 0,
                ca_achats_prev: Number(prev?.ca_achats) || 0,
                nb_produits_distincts_prev: Number(prev?.nb_produits_distincts) || 0,
            };
        });
    }

    private async fetchPeriodData(context: any, start: string, end: string) {
        const baseParams = [start, end];

        // Use Builder for filters (Products, Labs, Groups...)
        const qb = this.createBuilder(context, baseParams, {
            pharmacyId: 'ip.pharmacy_id',
            laboratory: 'gp.bcb_lab', // Assuming filtering on Global Product properties
            productCode: 'ip.code_13_ref_id',
            // Custom mapping for Groups if necessary, but BaseKpiRepository handles defaults via FilterQueryBuilder
            // which usually maps group to gp.bcb_generic_group
        });

        const conditions = qb.getConditions();
        const params = qb.getParams();

        // Check if we need to join GlobalProduct (usually yes for generics/groups)
        // Similar logic to AchatsRepository: needsGlobalProductJoin
        // Always join for supplier analysis on generics to ensure status filter

        const query = `
            WITH supplier_orders AS (
                SELECT 
                    o.id as order_id,
                    CASE 
                        WHEN s.name ILIKE '%OCP%' OR s.name ILIKE '%OCR%' THEN 'OCP'
                        WHEN s.name ILIKE '%ALLIANCE%' THEN 'ALLIANCE'
                        WHEN s.name ILIKE '%CERP%' THEN 'CERP'
                        ELSE 'AUTRE'
                    END as supplier_category,
                    po.product_id,
                    po.qte_r,
                    -- Use weighted_average_price from latest inventory snapshot logic or similar?
                    -- The user snippet used a LATERAL join on data_inventorysnapshot.
                    -- HOWEVER, usually for Achats CA we use 'po.qte_r * CA_UNIT'.
                    -- Ideally CA Achat = qte_r * Prix Achat (Manufacturer or Weighted).
                    -- The user snippet used: 
                    /*
                    LEFT JOIN LATERAL (
                        SELECT weighted_average_price ...
                    ) closest_snap
                    */
                    -- Let's try to stick to standards. 'mv_latest_product_prices' (lp) is faster if it's "Latest Known".
                    -- But user specifically gave the LATERAL logic. I will use the USER'S logic to be safe,
                    -- OR stick to 'mv_latest_product_prices' if I want speed. 
                    -- User said: "c'est un peut technique pour ca inspiure toi de ca".
                    -- So I will use the LATERAL join as requested.
                    COALESCE(closest_snap.weighted_average_price, 0) as unit_price
                FROM data_order o
                INNER JOIN data_supplier s ON o.supplier_id = s.id
                INNER JOIN data_productorder po ON po.order_id = o.id
                INNER JOIN data_internalproduct ip ON po.product_id = ip.id
                INNER JOIN data_globalproduct gp ON ip.code_13_ref_id = gp.code_13_ref
                LEFT JOIN LATERAL (
                  SELECT weighted_average_price
                  FROM data_inventorysnapshot ins
                  WHERE ins.product_id = po.product_id
                    AND ins.weighted_average_price > 0
                  ORDER BY ins.date DESC
                  LIMIT 1
                ) closest_snap ON true
                WHERE o.delivery_date >= $1::date 
                  AND o.delivery_date <= $2::date
                  AND o.delivery_date IS NOT NULL
                  AND po.qte_r > 0
                  AND gp.bcb_generic_status IN ('GÉNÉRIQUE', 'RÉFÉRENT') -- Hardcoded generic scope? or derived from filter?
                  -- User asked for "Analyse Générique", so we usually filter by generic status.
                  -- But 'context' might already have isGeneric filter.
                  -- Use Builder conditions.
                  ${conditions}
            )
            SELECT 
                supplier_category,
                COUNT(DISTINCT order_id) as nb_commandes,
                SUM(qte_r) as quantity_bought,
                SUM(qte_r * unit_price) as ca_achats,
                COUNT(DISTINCT product_id) as nb_produits_distincts
            FROM supplier_orders
            GROUP BY supplier_category
        `;

        try {
            const result = await db.query(query, params);
            return result.rows;
        } catch (error) {
            console.error('❌ [Repository] Supplier Analysis query failed:', error);
            throw error;
        }
    }
}
