// src/app/api/ventes/market-share-hierarchy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface MarketShareHierarchyRequest {
  dateRange: { start: string; end: string; };
  productCodes?: string[];
  bcbSegmentCodes?: string[];
  pharmacyIds?: string[];
  hierarchyLevel: 'bcb_segment_l0' | 'bcb_segment_l1' | 'bcb_segment_l2' | 'bcb_segment_l3' | 'bcb_segment_l4' | 'bcb_segment_l5' | 'bcb_family';
  page?: number;
  limit?: number;
}

interface HierarchySegment {
  readonly segment_name: string;
  readonly ca_selection: number;
  readonly part_marche_ca_pct: number;
  readonly marge_selection: number;
  readonly part_marche_marge_pct: number;
  readonly ca_total_segment: number;
  readonly marge_total_segment: number;
  readonly top_brand_labs: {
    readonly brand_lab: string;
    readonly ca_brand_lab: number;
    readonly marge_brand_lab: number;
  }[];
}

interface MarketShareHierarchyResponse {
  readonly segments: HierarchySegment[];
  readonly hierarchyLevel: string;
  readonly pagination: {
    readonly currentPage: number;
    readonly totalPages: number;
    readonly totalSegments: number;
  };
  readonly queryTime: number;
  readonly cached: boolean;
}

function validateRequest(body: any): MarketShareHierarchyRequest {
  if (!body.dateRange?.start || !body.dateRange?.end) {
    throw new Error('Date range is required');
  }
  
  const validHierarchyLevels = ['bcb_segment_l0', 'bcb_segment_l1', 'bcb_segment_l2', 'bcb_segment_l3', 'bcb_segment_l4', 'bcb_segment_l5', 'bcb_family'];
  if (!validHierarchyLevels.includes(body.hierarchyLevel)) {
    throw new Error('Invalid hierarchy level');
  }
  
  return {
    dateRange: {
      start: body.dateRange.start,
      end: body.dateRange.end
    },
    hierarchyLevel: body.hierarchyLevel,
    page: Math.max(1, parseInt(body.page) || 1),
    limit: Math.min(20, Math.max(5, parseInt(body.limit) || 5)),
    ...(body.productCodes && Array.isArray(body.productCodes) && { productCodes: body.productCodes }),
    ...(body.bcbSegmentCodes && Array.isArray(body.bcbSegmentCodes) && { bcbSegmentCodes: body.bcbSegmentCodes }),
    ...(body.pharmacyIds && Array.isArray(body.pharmacyIds) && { pharmacyIds: body.pharmacyIds })
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  console.log('🎯 [API] Market Share Hierarchy BCB Request started');

  try {
    const body = await request.json();
    const validatedRequest = validateRequest(body);
    
    console.log('✅ [API] Request validated:', {
      hierarchyLevel: validatedRequest.hierarchyLevel,
      dateRange: validatedRequest.dateRange,
      page: validatedRequest.page,
      limit: validatedRequest.limit,
      hasFilters: !!(validatedRequest.productCodes?.length || validatedRequest.bcbSegmentCodes?.length || validatedRequest.pharmacyIds?.length)
    });

    const segments = await calculateMarketShareHierarchyBCB(validatedRequest);
    
    const response: MarketShareHierarchyResponse = {
      segments: segments.segments,
      hierarchyLevel: validatedRequest.hierarchyLevel,
      pagination: segments.pagination,
      queryTime: Date.now() - startTime,
      cached: false
    };
    
    console.log('✅ [API] Market Share Hierarchy BCB completed:', {
      segmentsCount: segments.segments.length,
      hierarchyLevel: validatedRequest.hierarchyLevel,
      queryTime: response.queryTime
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [API] Market Share Hierarchy BCB failed:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

async function calculateMarketShareHierarchyBCB(
  request: MarketShareHierarchyRequest
): Promise<{
  segments: HierarchySegment[];
  pagination: { currentPage: number; totalPages: number; totalSegments: number; };
}> {
  const { 
    dateRange, 
    hierarchyLevel, 
    productCodes = [], 
    bcbSegmentCodes = [], 
    pharmacyIds,
    page = 1,
    limit = 5
  } = request;

  // Construction filtres produits
  const allProductCodes = Array.from(new Set([
    ...productCodes,
    ...bcbSegmentCodes
  ]));

  const hasProductFilter = allProductCodes.length > 0;
  const hasPharmacyFilter = pharmacyIds && pharmacyIds.length > 0;

  // Champ hiérarchique BCB
  const hierarchyField = `dgp.${hierarchyLevel}`;
  
  // Paramètres de base : [start_date, end_date]
  const params: any[] = [dateRange.start, dateRange.end];
  let paramIndex = 3; // Prochain paramètre sera $3

  // Construction conditionnelle des filtres
  let productFilterSelection = '';
  let pharmacyFilterSelection = '';
  let pharmacyFilterTotal = '';

  if (hasProductFilter) {
    productFilterSelection = `AND ip.code_13_ref_id = ANY($${paramIndex}::text[])`;
    params.push(allProductCodes);
    paramIndex++;
  }

  if (hasPharmacyFilter) {
    pharmacyFilterSelection = `AND ip.pharmacy_id = ANY($${paramIndex}::uuid[])`;
    pharmacyFilterTotal = `AND ip.pharmacy_id = ANY($${paramIndex}::uuid[])`;
    params.push(pharmacyIds);
    paramIndex++;
  }

  // Pagination
  const offset = (page - 1) * limit;
  const limitParamIndex = paramIndex;     // Pour LIMIT
  const offsetParamIndex = paramIndex + 1; // Pour OFFSET
  
  params.push(limit, offset);

  const query = `
    WITH selection_by_hierarchy AS (
      SELECT 
        ${hierarchyField} as segment_name,
        SUM(s.quantity * ins.price_with_tax) as ca_selection,
        SUM(s.quantity * (
          (ins.price_with_tax / (1 + COALESCE(ip."TVA", 0) / 100.0)) - ins.weighted_average_price
        )) as marge_selection
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
      WHERE s.date >= $1::date AND s.date <= $2::date
        AND ins.weighted_average_price > 0
        AND ${hierarchyField} IS NOT NULL
        ${productFilterSelection}
        ${pharmacyFilterSelection}
      GROUP BY ${hierarchyField}
      HAVING SUM(s.quantity * ins.price_with_tax) > 0
    ),
    total_by_hierarchy AS (
      SELECT 
        ${hierarchyField} as segment_name,
        SUM(s.quantity * ins.price_with_tax) as ca_total_segment,
        SUM(s.quantity * (
          (ins.price_with_tax / (1 + COALESCE(ip."TVA", 0) / 100.0)) - ins.weighted_average_price
        )) as marge_total_segment
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
      WHERE s.date >= $1::date AND s.date <= $2::date
        AND ins.weighted_average_price > 0
        AND ${hierarchyField} IS NOT NULL
        ${pharmacyFilterTotal}
      GROUP BY ${hierarchyField}
      HAVING SUM(s.quantity * ins.price_with_tax) > 0
    ),
    brand_labs_by_segment AS (
      SELECT 
        ${hierarchyField} as segment_name,
        dgp.bcb_lab,
        SUM(s.quantity * ins.price_with_tax) as ca_brand_lab,
        SUM(s.quantity * (
          (ins.price_with_tax / (1 + COALESCE(ip."TVA", 0) / 100.0)) - ins.weighted_average_price
        )) as marge_brand_lab,
        ROW_NUMBER() OVER (
          PARTITION BY ${hierarchyField} 
          ORDER BY SUM(s.quantity * ins.price_with_tax) DESC
        ) as rank_in_segment
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      JOIN data_globalproduct dgp ON ip.code_13_ref_id = dgp.code_13_ref
      WHERE s.date >= $1::date AND s.date <= $2::date
        AND ins.weighted_average_price > 0
        AND ${hierarchyField} IS NOT NULL
        AND dgp.bcb_lab IS NOT NULL
        ${pharmacyFilterTotal}
      GROUP BY ${hierarchyField}, dgp.bcb_lab
      HAVING SUM(s.quantity * ins.price_with_tax) > 0
    ),
    top_3_brand_labs AS (
      SELECT 
        segment_name,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'brand_lab', bcb_lab,
            'ca_brand_lab', ca_brand_lab,
            'marge_brand_lab', marge_brand_lab
          ) ORDER BY ca_brand_lab DESC
        ) as top_brand_labs
      FROM brand_labs_by_segment
      WHERE rank_in_segment <= 3
      GROUP BY segment_name
    ),
    market_share_calculation AS (
      SELECT 
        sel.segment_name,
        sel.ca_selection,
        sel.marge_selection,
        tot.ca_total_segment,
        tot.marge_total_segment,
        CASE 
          WHEN tot.ca_total_segment > 0 
          THEN (sel.ca_selection / tot.ca_total_segment) * 100
          ELSE 0
        END as part_marche_ca_pct,
        CASE 
          WHEN tot.marge_total_segment > 0 
          THEN (sel.marge_selection / tot.marge_total_segment) * 100
          ELSE 0
        END as part_marche_marge_pct,
        COALESCE(bl.top_brand_labs, '[]'::json) as top_brand_labs
      FROM selection_by_hierarchy sel
      JOIN total_by_hierarchy tot ON sel.segment_name = tot.segment_name
      LEFT JOIN top_3_brand_labs bl ON sel.segment_name = bl.segment_name
      WHERE sel.ca_selection > 0
    ),
    paginated_results AS (
      SELECT *,
        COUNT(*) OVER() as total_count
      FROM market_share_calculation
      ORDER BY ca_selection DESC
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    )
    SELECT 
      segment_name,
      ca_selection,
      part_marche_ca_pct,
      marge_selection,
      part_marche_marge_pct,
      ca_total_segment,
      marge_total_segment,
      top_brand_labs,
      total_count
    FROM paginated_results;
  `;

  console.log('🔍 [API] Executing Market Share Hierarchy BCB query:', {
    hierarchyLevel,
    hierarchyField,
    dateRange,
    hasProductFilter,
    hasPharmacyFilter,
    page,
    limit,
    paramsLength: params.length
  });

  try {
    const result = await db.query(query, params);

    if (result.length === 0) {
      return {
        segments: [],
        pagination: { currentPage: page, totalPages: 0, totalSegments: 0 }
      };
    }

    const totalSegments = Number(result[0]?.total_count) || 0;
    const totalPages = Math.ceil(totalSegments / limit);

    const segments: HierarchySegment[] = result.map(row => ({
      segment_name: row.segment_name || 'Non défini',
      ca_selection: Number(row.ca_selection) || 0,
      part_marche_ca_pct: Number(row.part_marche_ca_pct) || 0,
      marge_selection: Number(row.marge_selection) || 0,
      part_marche_marge_pct: Number(row.part_marche_marge_pct) || 0,
      ca_total_segment: Number(row.ca_total_segment) || 0,
      marge_total_segment: Number(row.marge_total_segment) || 0,
      top_brand_labs: Array.isArray(row.top_brand_labs) ? row.top_brand_labs.map((bl: any) => ({
        brand_lab: bl.brand_lab || 'Non défini',
        ca_brand_lab: Number(bl.ca_brand_lab) || 0,
        marge_brand_lab: Number(bl.marge_brand_lab) || 0
      })) : []
    }));

    console.log('📊 [API] Market Share Hierarchy BCB results:', {
      segmentsCount: segments.length,
      totalSegments,
      totalPages,
      topSegment: segments[0]?.segment_name,
      topSegmentCA: segments[0]?.ca_selection
    });

    return {
      segments,
      pagination: { currentPage: page, totalPages, totalSegments }
    };

  } catch (error) {
    console.error('❌ [API] Database query failed:', error);
    throw error;
  }
}