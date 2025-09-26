// src/components/organisms/PricingSimulationSection/PricingSimulationSection.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { RotateCcw, Search, X } from 'lucide-react';
import { usePricingCalculation, usePricingSimulations } from '@/hooks/pricing/usePricingCalculation';
import { useExportCsv } from '@/hooks/export/useExportCsv';
import { CurrentConditionsCard } from '@/components/molecules/CurrentConditionsCard/CurrentConditionsCard';
import { NewConditionsCard } from '@/components/molecules/NewConditionsCard/NewConditionsCard';
import { ImpactSimulationCard } from '@/components/molecules/ImpactSimulationCard/ImpactSimulationCard';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { ExportButton } from '@/components/molecules/ExportButton/ExportButton';
import type { PricingSimulationSectionProps } from './types';

export const PricingSimulationSection: React.FC<PricingSimulationSectionProps> = ({
  productCodes,
  onRefresh,
  className = ''
}) => {
  const [simulationInputs, setSimulationInputs] = useState<Record<string, {
    newBuyPrice: string;
    newDiscount: string;
    newSellPrice: string;
  }>>({});
  
  const [globalInputs, setGlobalInputs] = useState({
    newBuyPrice: '',
    newDiscount: '',
    newSellPrice: ''
  });
  
  const [searchQuery, setSearchQuery] = useState('');

  const { products, isLoading, calculateSimulation, refetch } = usePricingCalculation({
    productCodes
  });

  const { updateSimulation, getSimulation } = usePricingSimulations();
  const { exportToCsv, isExporting } = useExportCsv();

  // Calcul des données globales
  const globalData = useMemo(() => {
    if (!products.length) return null;
    
    const total = products.reduce((acc, product) => ({
      avg_buy_price_ht: acc.avg_buy_price_ht + (product.current_conditions.avg_buy_price_ht * product.current_conditions.quantity_sold),
      quantity_bought: acc.quantity_bought + product.current_conditions.quantity_bought,
      quantity_sold: acc.quantity_sold + product.current_conditions.quantity_sold,
      total_ca_ttc: acc.total_ca_ttc + product.current_conditions.total_ca_ttc,
      total_ca_ht: acc.total_ca_ht + product.current_conditions.total_ca_ht,
      weighted_sell_price: acc.weighted_sell_price + (product.current_conditions.avg_sell_price_ttc * product.current_conditions.quantity_sold)
    }), {
      avg_buy_price_ht: 0,
      quantity_bought: 0,
      quantity_sold: 0,
      total_ca_ttc: 0,
      total_ca_ht: 0,
      weighted_sell_price: 0
    });
    
    const avgBuyPrice = total.quantity_sold > 0 ? total.avg_buy_price_ht / total.quantity_sold : 0;
    const avgSellPrice = total.quantity_sold > 0 ? total.weighted_sell_price / total.quantity_sold : 0;
    const avgSellPriceHT = avgSellPrice / 1.055; // TVA moyenne 5.5%
    const marginHT = avgSellPriceHT - avgBuyPrice;
    const marginPercent = avgSellPriceHT > 0 ? (marginHT / avgSellPriceHT) * 100 : 0;
    const coefficient = avgBuyPrice > 0 ? avgSellPrice / avgBuyPrice : 0;
    
    return {
      product_name: `Global - ${products.length} produits`,
      code_ean: 'GLOBAL',
      current_conditions: {
        avg_buy_price_ht: avgBuyPrice,
        pharmacy_count: Math.max(...products.map(p => p.current_conditions.pharmacy_count)),
        quantity_bought: total.quantity_bought,
        quantity_sold: total.quantity_sold,
        avg_sell_price_ttc: avgSellPrice,
        avg_sell_price_ht: avgSellPriceHT,
        tva_rate: 5.5,
        current_margin_percent: marginPercent,
        current_margin_ht: marginHT,
        current_coefficient: coefficient,
        total_ca_ttc: total.total_ca_ttc,
        total_ca_ht: total.total_ca_ht
      }
    };
  }, [products]);

  // Filtrage des produits par recherche
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      p.product_name.toLowerCase().includes(query) || 
      p.code_ean.includes(query)
    );
  }, [products, searchQuery]);

  const handleInputChange = useCallback((
    productCode: string,
    field: 'newBuyPrice' | 'newDiscount' | 'newSellPrice',
    value: string
  ) => {
    const isGlobal = productCode === 'GLOBAL';
    
    if (isGlobal) {
      setGlobalInputs(prev => ({
        ...prev,
        [field]: value
      }));
      
      if (globalData) {
        const simulation = calculateSimulation({
          product: globalData,
          newBuyPrice: parseFloat(field === 'newBuyPrice' ? value : globalInputs.newBuyPrice) || undefined,
          newDiscount: parseFloat(field === 'newDiscount' ? value : globalInputs.newDiscount) || undefined,
          newSellPrice: parseFloat(field === 'newSellPrice' ? value : globalInputs.newSellPrice) || undefined
        });
        updateSimulation('GLOBAL', simulation);
      }
    } else {
      const currentInputs = simulationInputs[productCode] || {
        newBuyPrice: '',
        newDiscount: '',
        newSellPrice: ''
      };
      
      const newInputs = {
        ...currentInputs,
        [field]: value
      };
      
      setSimulationInputs(prev => ({
        ...prev,
        [productCode]: newInputs
      }));

      const product = products.find(p => p.code_ean === productCode);
      if (product) {
        const simulation = calculateSimulation({
          product,
          newBuyPrice: parseFloat(newInputs.newBuyPrice) || undefined,
          newDiscount: parseFloat(newInputs.newDiscount) || undefined,
          newSellPrice: parseFloat(newInputs.newSellPrice) || undefined
        });
        updateSimulation(productCode, simulation);
      }
    }
  }, [simulationInputs, globalInputs, products, globalData, calculateSimulation, updateSimulation]);

  const handleExport = useCallback(() => {
    const exportData = products.map(product => {
      const simulation = getSimulation(product.code_ean);
      const totalMarginCurrent = product.current_conditions.current_margin_ht * 
                                product.current_conditions.quantity_sold;
      
      return {
        'Produit': product.product_name,
        'EAN': product.code_ean,
        'Prix achat actuel HT': product.current_conditions.avg_buy_price_ht,
        'Prix vente actuel TTC': product.current_conditions.avg_sell_price_ttc,
        'CA actuel TTC': product.current_conditions.total_ca_ttc,
        'Marge actuelle %': product.current_conditions.current_margin_percent,
        'Marge actuelle €': totalMarginCurrent,
        'Nouvelle marge %': simulation?.new_margin_percent || '',
        'Delta marge %': simulation?.delta_margin_percent || '',
        'CA projeté TTC': simulation?.projected_ca_ttc || '',
        'Delta CA €': simulation ? simulation.projected_ca_ttc - product.current_conditions.total_ca_ttc : '',
        'Marge projetée €': simulation?.projected_total_margin || '',
        'Delta marge €': simulation ? simulation.projected_total_margin - totalMarginCurrent : ''
      };
    });

    exportToCsv({
      filename: `simulation_prix_${new Date().toISOString().split('T')[0]}`,
      data: exportData,
      headers: Object.keys(exportData[0] || {})
    });
  }, [products, getSimulation, exportToCsv]);

  const handleRefresh = useCallback(async () => {
    await refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-96 bg-gray-100 rounded-lg"></div>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Sélectionnez des produits pour commencer la simulation</p>
      </div>
    );
  }

  return (
    <section className={`space-y-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Simulation tarifaire</h2>
        <div className="flex gap-2">
          <ExportButton onClick={handleExport} isExporting={isExporting} />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            iconLeft={<RotateCcw className="w-4 h-4" />}
          >
            Actualiser
          </Button>
        </div>
      </div>

      {/* Section Globale */}
      {globalData && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vue d'ensemble</h3>
          <div className="grid grid-cols-3 gap-6">
            <CurrentConditionsCard
              productName={globalData.product_name}
              conditions={globalData.current_conditions}
            />
            <NewConditionsCard
              values={globalInputs}
              placeholders={{
                buyPrice: globalData.current_conditions.avg_buy_price_ht,
                sellPrice: globalData.current_conditions.avg_sell_price_ttc,
                tvaRate: globalData.current_conditions.tva_rate
              }}
              onChange={(field, value) => handleInputChange('GLOBAL', field, value)}
              netPrice={getSimulation('GLOBAL')?.new_buy_price_ht}
            />
            <ImpactSimulationCard
              simulation={getSimulation('GLOBAL')}
              currentConditions={globalData.current_conditions}
            />
          </div>
        </div>
      )}

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher par nom ou code EAN..."
          className="pl-10 pr-10 w-full"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Indicateur de filtrage */}
      {searchQuery && (
        <div className="text-sm text-gray-600">
          {filteredProducts.length} produit(s) trouvé(s) sur {products.length}
        </div>
      )}

      {/* Liste des produits */}
      <div className="space-y-6">
        {filteredProducts.map(product => {
          const inputs = simulationInputs[product.code_ean] || {
            newBuyPrice: '',
            newDiscount: '',
            newSellPrice: ''
          };
          const simulation = getSimulation(product.code_ean);
          
          return (
            <div key={product.code_ean} className="grid grid-cols-3 gap-6">
              <CurrentConditionsCard
                productName={product.product_name}
                conditions={product.current_conditions}
              />
              <NewConditionsCard
                values={inputs}
                placeholders={{
                  buyPrice: product.current_conditions.avg_buy_price_ht,
                  sellPrice: product.current_conditions.avg_sell_price_ttc,
                  tvaRate: product.current_conditions.tva_rate
                }}
                onChange={(field, value) => handleInputChange(product.code_ean, field, value)}
                netPrice={simulation?.new_buy_price_ht}
              />
              <ImpactSimulationCard
                simulation={simulation}
                currentConditions={product.current_conditions}
              />
            </div>
          );
        })}
      </div>

      {/* Message si aucun résultat de recherche */}
      {searchQuery && filteredProducts.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Aucun produit ne correspond à "{searchQuery}"</p>
        </div>
      )}
    </section>
  );
};