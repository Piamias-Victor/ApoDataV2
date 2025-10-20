// src/app/api/pharmacies/geographic/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface GeographicRequest {
  dateRange: { start: string; end: string; };
  comparisonDateRange?: { start: string; end: string; };
  productCodes?: string[];
  laboratoryCodes?: string[];
  categoryCodes?: string[];
  pharmacyIds?: string[];
}

interface RegionData {
  readonly regionCode: string;
  readonly regionName: string;
  readonly ca_total: number;
  readonly quantite_totale: number;
  readonly nb_pharmacies: number;
  readonly ca_moyen_pharmacie: number;
  readonly part_marche_pct: number;
}

interface GeographicDataResponse {
  readonly regions: RegionData[];
  readonly queryTime: number;
  readonly cached: boolean;
  readonly comparison?: {
    readonly regions: RegionData[];
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const validatedRequest = validateGeographicRequest(body);
    
    const regionsData = await calculateGeographicData(validatedRequest);
    
    let comparison;
    if (validatedRequest.comparisonDateRange) {
      const comparisonRequest: GeographicRequest = {
        dateRange: validatedRequest.comparisonDateRange,
        ...(validatedRequest.productCodes && { productCodes: validatedRequest.productCodes }),
        ...(validatedRequest.laboratoryCodes && { laboratoryCodes: validatedRequest.laboratoryCodes }),
        ...(validatedRequest.categoryCodes && { categoryCodes: validatedRequest.categoryCodes }),
        ...(validatedRequest.pharmacyIds && { pharmacyIds: validatedRequest.pharmacyIds })
      };
      const comparisonData = await calculateGeographicData(comparisonRequest);
      comparison = { regions: comparisonData };
    }

    const response: GeographicDataResponse = {
      regions: regionsData,
      queryTime: Date.now() - startTime,
      cached: false,
      ...(comparison && { comparison })
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Geographic data calculation failed:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

function validateGeographicRequest(body: any): GeographicRequest {
  if (!body.dateRange?.start || !body.dateRange?.end) {
    throw new Error('Date range is required');
  }
  
  return {
    dateRange: { start: body.dateRange.start, end: body.dateRange.end },
    ...(body.comparisonDateRange?.start && body.comparisonDateRange?.end && {
      comparisonDateRange: { start: body.comparisonDateRange.start, end: body.comparisonDateRange.end }
    }),
    ...(body.productCodes && Array.isArray(body.productCodes) && { productCodes: body.productCodes }),
    ...(body.laboratoryCodes && Array.isArray(body.laboratoryCodes) && { laboratoryCodes: body.laboratoryCodes }),
    ...(body.categoryCodes && Array.isArray(body.categoryCodes) && { categoryCodes: body.categoryCodes }),
    ...(body.pharmacyIds && Array.isArray(body.pharmacyIds) && { pharmacyIds: body.pharmacyIds })
  };
}

async function calculateGeographicData(request: GeographicRequest): Promise<RegionData[]> {
  const { dateRange, productCodes = [], laboratoryCodes = [], categoryCodes = [], pharmacyIds } = request;

  const allProductCodes = Array.from(new Set([...productCodes, ...laboratoryCodes, ...categoryCodes]));
  const hasProductFilter = allProductCodes.length > 0;
  const hasPharmacyFilter = pharmacyIds && pharmacyIds.length > 0;

  const buildFilters = (prefix: string, paramIndex: number) => {
    let filters = '';
    let paramCount = paramIndex;
    
    if (hasProductFilter) {
      filters += ` AND ${prefix}.code_13_ref_id = ANY($${paramCount}::text[])`;
      paramCount++;
    }
    
    if (hasPharmacyFilter) {
      filters += ` AND ${prefix}.pharmacy_id = ANY($${paramCount}::uuid[])`;
    }
    
    return filters;
  };

  const productFilterSales = buildFilters('ip', 3);
  
  const params: any[] = [dateRange.start, dateRange.end];
  
  if (hasProductFilter) {
    params.push(allProductCodes);
  }
  
  if (hasPharmacyFilter) {
    params.push(pharmacyIds);
  }

  const query = `
    WITH 
    ventes_par_region AS (
      SELECT 
        dp.area as region_code,
        dp.area as region_name,
        dp.id as pharmacy_id,
        SUM(s.quantity * s.unit_price_ttc) as ca_pharmacie,
        SUM(s.quantity) as quantite_pharmacie
      FROM data_sales s
      JOIN data_inventorysnapshot ins ON s.product_id = ins.id
      JOIN data_internalproduct ip ON ins.product_id = ip.id
      JOIN data_pharmacy dp ON ip.pharmacy_id = dp.id
      WHERE s.date >= $1::date 
        AND s.date <= $2::date
        AND s.quantity > 0
        AND s.unit_price_ttc IS NOT NULL
        AND s.unit_price_ttc > 0
        AND dp.area IS NOT NULL
        ${productFilterSales}
      GROUP BY dp.area, dp.id
      HAVING SUM(s.quantity * s.unit_price_ttc) > 0
    ),
    
    regions_aggregated AS (
      SELECT 
        region_code,
        region_name,
        SUM(ca_pharmacie) as ca_total,
        SUM(quantite_pharmacie) as quantite_totale,
        COUNT(DISTINCT pharmacy_id) as nb_pharmacies,
        AVG(ca_pharmacie) as ca_moyen_pharmacie
      FROM ventes_par_region
      GROUP BY region_code, region_name
    ),
    
    total_ca AS (
      SELECT SUM(ca_total) as ca_total_global
      FROM regions_aggregated
    )
    
    SELECT 
      ra.region_code,
      ra.region_name,
      ROUND(ra.ca_total, 2) as ca_total,
      ra.quantite_totale,
      ra.nb_pharmacies,
      ROUND(ra.ca_moyen_pharmacie, 2) as ca_moyen_pharmacie,
      ROUND(
        ra.ca_total * 100.0 / NULLIF(tc.ca_total_global, 0), 2
      ) as part_marche_pct
    FROM regions_aggregated ra
    CROSS JOIN total_ca tc
    ORDER BY ra.ca_total DESC;
  `;

  const result = await db.query(query, params);
  
  return result.map((row: any): RegionData => ({
    regionCode: row.region_code,
    regionName: row.region_name,
    ca_total: Number(row.ca_total) || 0,
    quantite_totale: Number(row.quantite_totale) || 0,
    nb_pharmacies: Number(row.nb_pharmacies) || 0,
    ca_moyen_pharmacie: Number(row.ca_moyen_pharmacie) || 0,
    part_marche_pct: Number(row.part_marche_pct) || 0
  }));
}