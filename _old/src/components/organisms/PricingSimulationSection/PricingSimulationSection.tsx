// src/components/organisms/PricingSimulationSection/PricingSimulationSection.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { RotateCcw, Search, X } from 'lucide-react';
import { usePricingCalculation, usePricingSimulations } from '@/hooks/pricing/usePricingCalculation';
import { useExportCsv } from '@/hooks/export/useExportCsv';
import { CurrentConditionsCard } from '@/components/molecules/CurrentConditionsCard/CurrentConditionsCard';
import { NewConditionsCard } from '@/components/molecules/NewConditionsCard/NewConditionsCard';
import { ImpactSimulationCard } from '@/components/molecules/ImpactSimulationCard/ImpactSimulationCard';
import { GlobalSimulationCard } from '@/components/molecules/GlobalSimulationCard/GlobalSimulationCard';
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
  
  const [newGlobalDiscount, setNewGlobalDiscount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { products, isLoading, calculateSimulation, refetch } = usePricingCalculation({
    productCodes
  });

  const { updateSimulation, getSimulation, simulations } = usePricingSimulations();
  const { exportToCsv, isExporting } = useExportCsv();

  // Calcul des données globales avec vérifications de sécurité
  const globalData = useMemo(() => {
    if (!products.length) return null;
    
    const totals = products.reduce((acc, product) => {
      const conditions = product.current_conditions;
      
      // Conversions sécurisées avec vérification des valeurs
      const quantity_sold = Number(conditions.quantity_sold) || 0;
      const quantity_bought = Number(conditions.quantity_bought) || 0;
      const total_ca_ttc = Number(conditions.total_ca_ttc) || 0;
      const total_purchase_amount = Number(conditions.total_purchase_amount) || 0;
      const current_margin_ht = Number(conditions.current_margin_ht) || 0;
      const current_margin_percent = Number(conditions.current_margin_percent) || 0;
      
      // Calcul de la marge totale pour ce produit
      const totalMarginProduct = current_margin_ht * quantity_sold;
      
      return {
        totalProducts: acc.totalProducts + 1,
        totalCA: acc.totalCA + total_ca_ttc,
        totalMargin: acc.totalMargin + totalMarginProduct,
        totalQuantitySold: acc.totalQuantitySold + quantity_sold,
        totalQuantityBought: acc.totalQuantityBought + quantity_bought,
        totalPurchaseAmount: acc.totalPurchaseAmount + total_purchase_amount,
        weightedMargin: acc.weightedMargin + (current_margin_percent * quantity_sold),
        avgDiscount: 0
      };
    }, {
      totalProducts: 0,
      totalCA: 0,
      totalMargin: 0,
      totalQuantitySold: 0,
      totalQuantityBought: 0,
      totalPurchaseAmount: 0,
      weightedMargin: 0,
      avgDiscount: 0
    });
    
    // Calcul de la marge moyenne pondérée avec vérification
    const avgMarginPercent = totals.totalQuantitySold > 0 
      ? totals.weightedMargin / totals.totalQuantitySold 
      : 0;
    
    // Retour avec vérifications isFinite pour éviter NaN et Infinity
    return {
      totalProducts: totals.totalProducts,
      avgDiscount: totals.avgDiscount,
      totalCA: isFinite(totals.totalCA) ? totals.totalCA : 0,
      totalMargin: isFinite(totals.totalMargin) ? totals.totalMargin : 0,
      totalQuantityBought: isFinite(totals.totalQuantityBought) ? totals.totalQuantityBought : 0,
      totalPurchaseAmount: isFinite(totals.totalPurchaseAmount) ? totals.totalPurchaseAmount : 0,
      avgMarginPercent: isFinite(avgMarginPercent) ? avgMarginPercent : 0
    };
  }, [products]);

  // Agrégation des simulations individuelles
  const aggregatedSimulation = useMemo(() => {
    let totalDeltaCA = 0;
    let totalDeltaMargin = 0;
    let totalNewMargin = 0;
    let totalQuantity = 0;

    products.forEach(product => {
      const simulation = getSimulation(product.code_ean);
      if (simulation) {
        const quantity_sold = Number(product.current_conditions.quantity_sold) || 0;
        const current_margin_ht = Number(product.current_conditions.current_margin_ht) || 0;
        const currentMargin = current_margin_ht * quantity_sold;
        
        totalDeltaCA += (Number(simulation.projected_ca_ttc) || 0) - (Number(product.current_conditions.total_ca_ttc) || 0);
        totalDeltaMargin += (Number(simulation.projected_total_margin) || 0) - currentMargin;
        totalNewMargin += (Number(simulation.new_margin_percent) || 0) * quantity_sold;
        totalQuantity += quantity_sold;
      }
    });

    return {
      totalDeltaCA: isFinite(totalDeltaCA) ? totalDeltaCA : 0,
      totalDeltaMargin: isFinite(totalDeltaMargin) ? totalDeltaMargin : 0,
      newAvgMargin: totalQuantity > 0 && isFinite(totalNewMargin / totalQuantity) 
        ? totalNewMargin / totalQuantity 
        : 0
    };
  }, [products, simulations, getSimulation]);

  // Calcul du gain de la remise globale
  const projectedGlobalGain = useMemo(() => {
    if (!newGlobalDiscount || !globalData) return 0;
    const discount = parseFloat(newGlobalDiscount.replace(',', '.'));
    if (isNaN(discount)) return 0;
    
    const totalBuyValue = products.reduce((acc, p) => {
      const buy_price = Number(p.current_conditions.avg_buy_price_ht) || 0;
      const quantity = Number(p.current_conditions.quantity_bought) || 0;
      return acc + (buy_price * quantity);
    }, 0);
    
    const gain = totalBuyValue * (discount / 100);
    return isFinite(gain) ? gain : 0;
  }, [newGlobalDiscount, products, globalData]);

  // Filtrage des produits
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
  }, [simulationInputs, products, calculateSimulation, updateSimulation]);

  const handleExport = useCallback(() => {
    const exportData = products.map(product => {
      const simulation = getSimulation(product.code_ean);
      const quantity_sold = Number(product.current_conditions.quantity_sold) || 0;
      const current_margin_ht = Number(product.current_conditions.current_margin_ht) || 0;
      const totalMarginCurrent = current_margin_ht * quantity_sold;
      
      return {
        'Produit': product.product_name,
        'EAN': product.code_ean,
        'Prix achat actuel HT': product.current_conditions.avg_buy_price_ht,
        'Prix vente actuel TTC': product.current_conditions.avg_sell_price_ttc,
        'Qté vendue': product.current_conditions.quantity_sold,
        'Qté achetée': product.current_conditions.quantity_bought,
        'Montant acheté': product.current_conditions.total_purchase_amount,
        'CA actuel TTC': product.current_conditions.total_ca_ttc,
        'Marge actuelle %': product.current_conditions.current_margin_percent,
        'Marge actuelle €': totalMarginCurrent,
        'Nouvelle marge %': simulation?.new_margin_percent || '',
        'Delta marge %': simulation?.delta_margin_percent || '',
        'CA projeté TTC': simulation?.projected_ca_ttc || '',
        'Delta CA €': simulation ? (Number(simulation.projected_ca_ttc) || 0) - (Number(product.current_conditions.total_ca_ttc) || 0) : '',
        'Marge projetée €': simulation?.projected_total_margin || '',
        'Delta marge €': simulation ? (Number(simulation.projected_total_margin) || 0) - totalMarginCurrent : ''
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
        <div className="h-32 bg-gray-100 rounded-lg"></div>
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
      {/* Header */}
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

      {/* Section Globale avec quantités et montants d'achat */}
      {globalData && (
        <GlobalSimulationCard
          globalData={globalData}
          aggregatedSimulation={aggregatedSimulation}
          newGlobalDiscount={newGlobalDiscount}
          onDiscountChange={setNewGlobalDiscount}
          projectedGain={projectedGlobalGain}
        />
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

      {/* Message si aucun résultat */}
      {searchQuery && filteredProducts.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Aucun produit ne correspond à "{searchQuery}"</p>
        </div>
      )}
    </section>
  );
};