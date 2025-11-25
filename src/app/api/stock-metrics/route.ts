// src/app/api/stock-metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface StockMetricsRequest {
  dateRange: { start: string; end: string; };
  comparisonDateRange?: { start: string; end: string; };
  productCodes?: string[];
  laboratoryCodes?: string[];
  categoryCodes?: string[];
  pharmacyIds?: string[];
}

function validateStockMetricsRequest(body: any): StockMetricsRequest {
  if (!body.dateRange?.start || !body.dateRange?.end) {
    throw new Error('Date range is required');
  }

  const startDate = new Date(body.dateRange.start);
  const endDate = new Date(body.dateRange.end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Invalid date format');
  }

  return {
    dateRange: {
      start: body.dateRange.start,
      end: body.dateRange.end
    },
    ...(body.comparisonDateRange?.start && body.comparisonDateRange?.end && {
      comparisonDateRange: {
        start: body.comparisonDateRange.start,
        end: body.comparisonDateRange.end
      }
    }),
    ...(body.productCodes && Array.isArray(body.productCodes) && { productCodes: body.productCodes }),
    ...(body.laboratoryCodes && Array.isArray(body.laboratoryCodes) && { laboratoryCodes: body.laboratoryCodes }),
    ...(body.categoryCodes && Array.isArray(body.categoryCodes) && { categoryCodes: body.categoryCodes }),
    ...(body.pharmacyIds && Array.isArray(body.pharmacyIds) && { pharmacyIds: body.pharmacyIds })
  };
}

interface StockMetricsResponse {
  readonly quantite_stock_actuel_total: number;
  readonly montant_stock_actuel_total: number;
  readonly stock_moyen_12_mois: number;
  readonly jours_de_stock_actuels: number | null;
  readonly nb_references_produits: number;
  readonly nb_pharmacies: number;
  readonly quantite_commandee: number;
  readonly quantite_receptionnee: number;
  readonly montant_commande_ht: number;
  readonly montant_receptionne_ht: number;
  readonly comparison?: {
    readonly quantite_stock_actuel_total: number;
    readonly montant_stock_actuel_total: number;
    readonly stock_moyen_12_mois: number;
    readonly jours_de_stock_actuels: number | null;
    readonly quantite_commandee: number;
    readonly quantite_receptionnee: number;
    readonly montant_commande_ht: number;
    readonly montant_receptionne_ht: number;
  } | undefined;
  readonly queryTime: number;
  readonly cached: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse<StockMetricsResponse | { error: string }>> {
  const startTime = Date.now();
  console.log('🔥 [API] Stock Metrics Request started');

  try {
    const body = await request.json();
    console.log('📝 [API] Request body received:', JSON.stringify(body, null, 2));

    const validatedRequest = validateStockMetricsRequest(body);

    console.log('✅ [API] Request validated:', {
      dateRange: validatedRequest.dateRange,
      hasComparison: !!validatedRequest.comparisonDateRange,
      filtersCount: {
        products: validatedRequest.productCodes?.length || 0,
        laboratories: validatedRequest.laboratoryCodes?.length || 0,
        categories: validatedRequest.categoryCodes?.length || 0,
        pharmacies: validatedRequest.pharmacyIds?.length || 0
      }
    });

    const stockMetrics = await calculateStockMetrics(validatedRequest);

    let comparison: {
      quantite_stock_actuel_total: number;
      montant_stock_actuel_total: number;
      stock_moyen_12_mois: number;
      jours_de_stock_actuels: number | null;
      quantite_commandee: number;
      quantite_receptionnee: number;
      montant_commande_ht: number;
      montant_receptionne_ht: number;
    } | undefined;

    if (validatedRequest.comparisonDateRange) {
      console.log('📊 [API] Calculating comparison period stock metrics');
      const comparisonRequest: StockMetricsRequest = {
        dateRange: validatedRequest.comparisonDateRange,
        ...(validatedRequest.productCodes && { productCodes: validatedRequest.productCodes }),
        ...(validatedRequest.laboratoryCodes && { laboratoryCodes: validatedRequest.laboratoryCodes }),
        ...(validatedRequest.categoryCodes && { categoryCodes: validatedRequest.categoryCodes }),
        ...(validatedRequest.pharmacyIds && { pharmacyIds: validatedRequest.pharmacyIds })
      };
      const comparisonMetrics = await calculateStockMetrics(comparisonRequest);
      comparison = {
        quantite_stock_actuel_total: comparisonMetrics.quantite_stock_actuel_total,
        montant_stock_actuel_total: comparisonMetrics.montant_stock_actuel_total,
        stock_moyen_12_mois: comparisonMetrics.stock_moyen_12_mois,
        jours_de_stock_actuels: comparisonMetrics.jours_de_stock_actuels,
        quantite_commandee: comparisonMetrics.quantite_commandee,
        quantite_receptionnee: comparisonMetrics.quantite_receptionnee,
        montant_commande_ht: comparisonMetrics.montant_commande_ht,
        montant_receptionne_ht: comparisonMetrics.montant_receptionne_ht
      };
    }

    const response: StockMetricsResponse = {
      ...stockMetrics,
      comparison,
      queryTime: Date.now() - startTime,
      cached: false
    };

    console.log('✅ [API] Stock metrics calculation completed', {
      quantite_stock: response.quantite_stock_actuel_total,
      montant_stock: response.montant_stock_actuel_total,
      jours_stock: response.jours_de_stock_actuels,
      quantite_commandee: response.quantite_commandee,
      quantite_receptionnee: response.quantite_receptionnee,
      queryTime: response.queryTime,
      hasComparison: !!comparison
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [API] Stock metrics calculation failed:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

async function calculateStockMetrics(request: StockMetricsRequest): Promise<Omit<StockMetricsResponse, 'queryTime' | 'cached' | 'comparison'>> {
  const { dateRange, productCodes = [], laboratoryCodes = [], categoryCodes = [], pharmacyIds } = request;

  const allProductCodes = Array.from(new Set([
    ...productCodes,
    ...laboratoryCodes,
    ...categoryCodes
  ]));

  const hasProductFilter = allProductCodes.length > 0;
  const hasPharmacyFilter = pharmacyIds && pharmacyIds.length > 0;

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
    params.push(pharmacyIds);
  }

  const query = `
    WITH current_stock AS (
      SELECT 
        SUM(latest_stock.stock) as quantite_stock_total,
        SUM(latest_stock.stock * latest_stock.weighted_average_price) as valeur_stock_ht_total
      FROM data_internalproduct ip
      JOIN LATERAL (
        SELECT DISTINCT ON (ins.product_id)
          ins.stock, 
          ins.weighted_average_price
        FROM data_inventorysnapshot ins
        WHERE ins.product_id = ip.id
          AND ins.weighted_average_price > 0
        ORDER BY ins.product_id, ins.date DESC
      ) latest_stock ON true
      WHERE 1=1
        ${productFilter}
        ${pharmacyFilter}
    ),
    stock_by_product AS (
      SELECT 
        ip.code_13_ref_id,
        latest_stock.stock as quantite_stock_actuel
      FROM data_internalproduct ip
      JOIN LATERAL (
        SELECT DISTINCT ON (ins.product_id)
          ins.stock
        FROM data_inventorysnapshot ins
        WHERE ins.product_id = ip.id
          AND ins.weighted_average_price > 0
        ORDER BY ins.product_id, ins.date DESC
      ) latest_stock ON true
      WHERE 1=1
        ${productFilter}
        ${pharmacyFilter}
    ),
    average_monthly_sales AS (
      SELECT 
        ip.code_13_ref_id,
        SUM(COALESCE(sales_data.quantite_vendue, 0)) as ventes_12_mois_total
      FROM data_internalproduct ip
      LEFT JOIN (
        SELECT 
          ip2.code_13_ref_id,
          SUM(s.quantity) as quantite_vendue
        FROM data_sales s
        JOIN data_inventorysnapshot ins ON s.product_id = ins.id
        JOIN data_internalproduct ip2 ON ins.product_id = ip2.id
        WHERE s.date >= CURRENT_DATE - interval '12 months'
          AND s.date <= CURRENT_DATE
          ${productFilter.replace('ip.', 'ip2.')}
          ${pharmacyFilter.replace('ip.', 'ip2.')}
        GROUP BY ip2.code_13_ref_id
      ) sales_data ON ip.code_13_ref_id = sales_data.code_13_ref_id
      WHERE 1=1
        ${productFilter}
        ${pharmacyFilter}
      GROUP BY ip.code_13_ref_id
    ),
    order_reception_data AS (
      SELECT 
        SUM(po.qte) as quantite_commandee,
        SUM(po.qte_r) as quantite_receptionnee,
        SUM(po.qte * COALESCE(latest_price.weighted_average_price, 0)) as montant_commande_ht,
        SUM(po.qte_r * COALESCE(latest_price.weighted_average_price, 0)) as montant_receptionne_ht
      FROM data_order o
      INNER JOIN data_productorder po ON po.order_id = o.id
      INNER JOIN data_internalproduct ip ON po.product_id = ip.id
      LEFT JOIN LATERAL (
        SELECT weighted_average_price
        FROM data_inventorysnapshot ins
        WHERE ins.product_id = po.product_id
          AND ins.weighted_average_price > 0
        ORDER BY ins.date DESC
        LIMIT 1
      ) latest_price ON true
      WHERE o.delivery_date >= $1::date
        AND o.delivery_date <= $2::date
        AND o.delivery_date IS NOT NULL
        ${productFilter}
        ${pharmacyFilter.replace('ip.', 'o.')}
    )
    SELECT
      (SELECT COALESCE(quantite_stock_total, 0) FROM current_stock) as quantite_stock_actuel_total,
      (SELECT COALESCE(valeur_stock_ht_total, 0) FROM current_stock) as montant_stock_actuel_total,
      COALESCE(ROUND(AVG(sbp.quantite_stock_actuel), 0), 0) as stock_moyen_12_mois,
      CASE
        WHEN SUM(ams.ventes_12_mois_total) > 0
        THEN ROUND(
          (SELECT COALESCE(quantite_stock_total, 0) FROM current_stock) / (SUM(ams.ventes_12_mois_total) / 365.0),
          1
        )
        ELSE NULL
      END as jours_de_stock_actuels,
      COUNT(DISTINCT sbp.code_13_ref_id) as nb_references_produits,
      COUNT(DISTINCT ip_meta.pharmacy_id) as nb_pharmacies,
      COALESCE((SELECT quantite_commandee FROM order_reception_data), 0) as quantite_commandee,
      COALESCE((SELECT quantite_receptionnee FROM order_reception_data), 0) as quantite_receptionnee,
      COALESCE((SELECT montant_commande_ht FROM order_reception_data), 0) as montant_commande_ht,
      COALESCE((SELECT montant_receptionne_ht FROM order_reception_data), 0) as montant_receptionne_ht
    FROM stock_by_product sbp
    LEFT JOIN average_monthly_sales ams ON sbp.code_13_ref_id = ams.code_13_ref_id
    LEFT JOIN data_internalproduct ip_meta ON sbp.code_13_ref_id = ip_meta.code_13_ref_id
    WHERE ip_meta.id IS NOT NULL
      ${productFilter.replace('ip.', 'ip_meta.')}
      ${pharmacyFilter.replace('ip.', 'ip_meta.')};
  `;

  console.log('🔍 [API] Executing Stock metrics query');

  try {
    const result = await db.query(query, params);

    if (result.length === 0) {
      console.log('⚠️ [API] No stock data found');
      return {
        quantite_stock_actuel_total: 0,
        montant_stock_actuel_total: 0,
        stock_moyen_12_mois: 0,
        jours_de_stock_actuels: null,
        nb_references_produits: 0,
        nb_pharmacies: 0,
        quantite_commandee: 0,
        quantite_receptionnee: 0,
        montant_commande_ht: 0,
        montant_receptionne_ht: 0
      };
    }

    const row = result[0];

    return {
      quantite_stock_actuel_total: Number(row.quantite_stock_actuel_total) || 0,
      montant_stock_actuel_total: Number(row.montant_stock_actuel_total) || 0,
      stock_moyen_12_mois: Number(row.stock_moyen_12_mois) || 0,
      jours_de_stock_actuels: row.jours_de_stock_actuels ? Number(row.jours_de_stock_actuels) : null,
      nb_references_produits: Number(row.nb_references_produits) || 0,
      nb_pharmacies: Number(row.nb_pharmacies) || 0,
      quantite_commandee: Number(row.quantite_commandee) || 0,
      quantite_receptionnee: Number(row.quantite_receptionnee) || 0,
      montant_commande_ht: Number(row.montant_commande_ht) || 0,
      montant_receptionne_ht: Number(row.montant_receptionne_ht) || 0
    };

  } catch (error) {
    console.error('❌ [API] Database query failed:', error);
    throw error;
  }
}