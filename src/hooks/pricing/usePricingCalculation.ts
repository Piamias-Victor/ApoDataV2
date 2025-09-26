// src/hooks/pricing/usePricingCalculation.ts
'use client';

import { useState } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useStandardFetch } from '@/hooks/common/useStandardFetch';
import type { BaseHookOptions, BaseHookReturn, StandardFilters } from '@/hooks/common/types';

// Types pour les données de pricing
interface ProductConditions {
  readonly avg_buy_price_ht: number;
  readonly pharmacy_count: number;
  readonly quantity_bought: number;
  readonly quantity_sold: number;
  readonly avg_sell_price_ttc: number;
  readonly avg_sell_price_ht: number;
  readonly tva_rate: number;
  readonly current_margin_percent: number;
  readonly current_margin_ht: number;
  readonly current_coefficient: number;
  readonly total_ca_ttc: number;
  readonly total_ca_ht: number;
}

export interface ProductPricingData {
  readonly product_name: string;
  readonly code_ean: string;
  readonly current_conditions: ProductConditions;
}

interface PricingCalculationResponse {
  readonly products: ProductPricingData[];
  readonly count: number;
  readonly queryTime: number;
}

interface UsePricingCalculationOptions extends BaseHookOptions {
  readonly productCodes?: string[];
  readonly pharmacyId?: string;
}

interface UsePricingCalculationReturn extends BaseHookReturn<PricingCalculationResponse> {
  readonly products: ProductPricingData[];
  readonly count: number;
  readonly calculateSimulation: (params: SimulationParams) => SimulationResult;
}

export interface SimulationParams {
  readonly product: ProductPricingData;
  readonly newBuyPrice?: number | undefined;
  readonly newDiscount?: number | undefined;
  readonly newSellPrice?: number | undefined;
}

export interface SimulationResult {
  readonly new_buy_price_ht: number;
  readonly new_sell_price_ttc: number;
  readonly new_sell_price_ht: number;
  readonly new_margin_percent: number;
  readonly new_margin_ht: number;
  readonly new_coefficient: number;
  readonly delta_margin_percent: number;
  readonly delta_margin_ht: number;
  readonly projected_ca_ttc: number;
  readonly projected_ca_ht: number;
  readonly projected_total_margin: number;
}

export function usePricingCalculation(
  options: UsePricingCalculationOptions = {}
): UsePricingCalculationReturn {
  const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
  const productsFilter = useFiltersStore((state) => state.products);
  const laboratoriesFilter = useFiltersStore((state) => state.laboratories);
  const categoriesFilter = useFiltersStore((state) => state.categories);
  const pharmacyFilter = useFiltersStore((state) => state.pharmacy);

  // CORRECTION: Inclure laboratoires et catégories comme dans useProductsList
  const standardFilters: StandardFilters & Record<string, any> = {
    productCodes: options.productCodes || productsFilter,
    laboratoryCodes: laboratoriesFilter,
    categoryCodes: categoriesFilter,
    ...(pharmacyFilter.length > 0 && { pharmacyIds: pharmacyFilter })
  };

  const {
    data,
    isLoading,
    error,
    isError,
    queryTime,
    cached,
    refetch,
    hasData
  } = useStandardFetch<PricingCalculationResponse>('/api/pricing/calculate', {
    enabled: options.enabled !== false && 
             (productsFilter.length > 0 || laboratoriesFilter.length > 0 || categoriesFilter.length > 0),
    dateRange: options.dateRange || analysisDateRange,
    filters: standardFilters
  });

  const calculateSimulation = (params: SimulationParams): SimulationResult => {
    const { product, newBuyPrice, newDiscount, newSellPrice } = params;
    const conditions = product.current_conditions;
    
    let new_buy_price_ht = conditions.avg_buy_price_ht;
    if (newBuyPrice !== undefined && newBuyPrice > 0) {
      if (newDiscount !== undefined && newDiscount >= 0) {
        new_buy_price_ht = newBuyPrice * (1 - newDiscount / 100);
      } else {
        new_buy_price_ht = newBuyPrice;
      }
    }

    let new_sell_price_ttc = conditions.avg_sell_price_ttc;
    let new_sell_price_ht = conditions.avg_sell_price_ht;
    
    if (newSellPrice !== undefined && newSellPrice > 0) {
      new_sell_price_ttc = newSellPrice;
      new_sell_price_ht = newSellPrice / (1 + conditions.tva_rate / 100);
    }

    const new_margin_ht = new_sell_price_ht - new_buy_price_ht;
    const new_margin_percent = new_sell_price_ht > 0 
      ? (new_margin_ht / new_sell_price_ht) * 100 
      : 0;

    const new_coefficient = new_buy_price_ht > 0 
      ? new_sell_price_ttc / new_buy_price_ht 
      : 0;

    const delta_margin_percent = new_margin_percent - conditions.current_margin_percent;
    const delta_margin_ht = new_margin_ht - conditions.current_margin_ht;

    const projected_ca_ttc = new_sell_price_ttc * conditions.quantity_sold;
    const projected_ca_ht = new_sell_price_ht * conditions.quantity_sold;
    const projected_total_margin = new_margin_ht * conditions.quantity_sold;

    return {
      new_buy_price_ht,
      new_sell_price_ttc,
      new_sell_price_ht,
      new_margin_percent,
      new_margin_ht,
      new_coefficient,
      delta_margin_percent,
      delta_margin_ht,
      projected_ca_ttc,
      projected_ca_ht,
      projected_total_margin
    };
  };

  return {
    data,
    isLoading,
    error,
    isError,
    queryTime,
    cached,
    refetch,
    hasData,
    products: data?.products || [],
    count: data?.count || 0,
    calculateSimulation
  };
}

export function usePricingSimulations() {
  const [simulations, setSimulations] = useState<Map<string, SimulationResult>>(new Map());

  const updateSimulation = (productCode: string, simulation: SimulationResult | null) => {
    setSimulations(prev => {
      const next = new Map(prev);
      if (simulation === null) {
        next.delete(productCode);
      } else {
        next.set(productCode, simulation);
      }
      return next;
    });
  };

  const clearSimulations = () => {
    setSimulations(new Map());
  };

  const getSimulation = (productCode: string) => {
    return simulations.get(productCode);
  };

  return {
    simulations,
    updateSimulation,
    clearSimulations,
    getSimulation,
    hasSimulations: simulations.size > 0
  };
}