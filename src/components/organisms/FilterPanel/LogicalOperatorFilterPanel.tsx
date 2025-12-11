// src/components/organisms/FilterPanel/LogicalOperatorFilterPanel.tsx
'use client';

import React, { useMemo } from 'react';
import { Settings, Info, ChevronDown } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { useFilterStore } from '@/stores/useFilterStore';
import { FilterItem } from '@/types/filters';

interface LogicalOperatorFilterPanelProps {
    onClose?: () => void;
}

export const LogicalOperatorFilterPanel: React.FC<LogicalOperatorFilterPanelProps> = ({ onClose }) => {
    const {
        pharmacies,
        laboratories,
        categories,
        products,
        settings,
        filterOperators,
        setFilterOperator,
        resetFilterOperators
    } = useFilterStore();

    // Build ordered list of all active filters
    const activeFilters = useMemo((): FilterItem[] => {
        const filters: FilterItem[] = [];

        // Pharmacies
        pharmacies.forEach(p => {
            filters.push({
                type: 'pharmacy',
                id: `pharmacy-${p.id}`,
                name: `🏥 ${p.name}`,
                value: p
            });
        });

        // Laboratories
        laboratories.forEach(l => {
            filters.push({
                type: 'laboratory',
                id: `laboratory-${l.id}`,
                name: `🔬 ${l.name}`,
                value: l
            });
        });

        // Categories
        categories.forEach(c => {
            filters.push({
                type: 'category',
                id: `category-${c.id}`,
                name: `🏷️ ${c.name}`,
                value: c
            });
        });

        // Products
        products.forEach(p => {
            filters.push({
                type: 'product',
                id: `product-${p.code}`,
                name: `📦 ${p.name}`,
                value: p
            });
        });

        // TVA Rates
        settings.tvaRates.forEach(rate => {
            filters.push({
                type: 'tva',
                id: `tva-${rate}`,
                name: `💰 TVA ${rate}%`,
                value: rate
            });
        });

        // Reimbursement
        if (settings.reimbursementStatus !== 'ALL') {
            filters.push({
                type: 'reimbursement',
                id: 'reimbursement',
                name: `💊 ${settings.reimbursementStatus === 'REIMBURSED' ? 'Remboursé' : 'Non remboursé'}`,
                value: settings.reimbursementStatus
            });
        }

        // Generic
        if (settings.isGeneric !== undefined) {
            filters.push({
                type: 'generic',
                id: 'generic',
                name: `🧬 ${settings.isGeneric ? 'Générique' : 'Princeps'}`,
                value: settings.isGeneric
            });
        }

        // Price Ranges (only non-default values)
        if (settings.purchasePriceNetRange &&
            (settings.purchasePriceNetRange.min !== 0 || settings.purchasePriceNetRange.max !== 100000)) {
            filters.push({
                type: 'priceRange',
                id: 'purchasePriceNet',
                name: `💶 Prix HT Net: ${settings.purchasePriceNetRange.min}€ - ${settings.purchasePriceNetRange.max}€`,
                value: settings.purchasePriceNetRange
            });
        }

        if (settings.purchasePriceGrossRange &&
            (settings.purchasePriceGrossRange.min !== 0 || settings.purchasePriceGrossRange.max !== 100000)) {
            filters.push({
                type: 'priceRange',
                id: 'purchasePriceGross',
                name: `💶 Prix HT Brut: ${settings.purchasePriceGrossRange.min}€ - ${settings.purchasePriceGrossRange.max}€`,
                value: settings.purchasePriceGrossRange
            });
        }

        if (settings.sellPriceRange &&
            (settings.sellPriceRange.min !== 0 || settings.sellPriceRange.max !== 100000)) {
            filters.push({
                type: 'priceRange',
                id: 'sellPrice',
                name: `💶 Prix TTC: ${settings.sellPriceRange.min}€ - ${settings.sellPriceRange.max}€`,
                value: settings.sellPriceRange
            });
        }

        if (settings.discountRange &&
            (settings.discountRange.min !== 0 || settings.discountRange.max !== 100)) {
            filters.push({
                type: 'priceRange',
                id: 'discount',
                name: `📊 Remise: ${settings.discountRange.min}% - ${settings.discountRange.max}%`,
                value: settings.discountRange
            });
        }

        if (settings.marginRange &&
            (settings.marginRange.min !== 0 || settings.marginRange.max !== 100)) {
            filters.push({
                type: 'priceRange',
                id: 'margin',
                name: `📊 Marge: ${settings.marginRange.min}% - ${settings.marginRange.max}%`,
                value: settings.marginRange
            });
        }

        return filters;
    }, [pharmacies, laboratories, categories, products, settings]);

    // Generate query summary
    const querySummary = useMemo(() => {
        if (activeFilters.length === 0) return '';
        if (activeFilters.length === 1) return activeFilters[0]?.name || '';

        let summary = activeFilters[0]?.name || '';
        for (let i = 0; i < activeFilters.length - 1; i++) {
            const operator = filterOperators[i] || 'AND';
            const operatorText = operator === 'AND' ? 'ET' : 'OU';
            const nextFilter = activeFilters[i + 1];
            if (nextFilter) {
                summary += ` ${operatorText} ${nextFilter.name}`;
            }
        }
        return summary;
    }, [activeFilters, filterOperators]);

    const handleReset = () => {
        resetFilterOperators();
    };

    const handleApply = () => {
        if (onClose) onClose();
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {activeFilters.length === 0 ? (
                    <div className="text-center pt-12 opacity-60">
                        <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="font-medium text-gray-500">Aucun filtre actif</p>
                        <p className="text-sm text-gray-400 mt-1">Sélectionnez des filtres pour configurer les opérateurs</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Info Box */}
                        <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                            <Info className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                            <div className="text-sm text-yellow-800">
                                <p className="font-semibold mb-1">Configurez les opérateurs entre vos filtres</p>
                                <p className="text-xs text-yellow-700">
                                    <strong>ET</strong> : Les deux conditions doivent être vraies
                                    <br />
                                    <strong>OU</strong> : Au moins une condition doit être vraie
                                </p>
                            </div>
                        </div>

                        {/* Filters with operators */}
                        <div className="space-y-0">
                            {activeFilters.map((filter, index) => (
                                <div key={filter.id}>
                                    {/* Filter Item */}
                                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4 border-2 border-yellow-200">
                                        <div className="font-semibold text-gray-900">{filter.name}</div>
                                    </div>

                                    {/* Operator (if not last item) */}
                                    {index < activeFilters.length - 1 && (
                                        <div className="flex items-center justify-center py-3">
                                            <div className="flex gap-2 bg-white rounded-xl p-1 border-2 border-yellow-200 shadow-sm">
                                                <button
                                                    onClick={() => setFilterOperator(index, 'AND')}
                                                    className={`
                                                        px-6 py-2 rounded-lg font-bold text-sm transition-all
                                                        ${(filterOperators[index] || 'AND') === 'AND'
                                                            ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-md'
                                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                                        }
                                                    `}
                                                >
                                                    ET
                                                </button>
                                                <button
                                                    onClick={() => setFilterOperator(index, 'OR')}
                                                    className={`
                                                        px-6 py-2 rounded-lg font-bold text-sm transition-all
                                                        ${(filterOperators[index] || 'AND') === 'OR'
                                                            ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-md'
                                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                                        }
                                                    `}
                                                >
                                                    OU
                                                </button>
                                            </div>
                                            <ChevronDown className="w-5 h-5 text-yellow-500 ml-2" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Query Summary */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border-2 border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Settings className="w-4 h-4 text-gray-600" />
                                <h3 className="text-sm font-bold text-gray-700">Requête résultante</h3>
                            </div>
                            <div className="text-sm text-gray-900 font-mono bg-white rounded-lg p-3 border border-gray-200 break-words">
                                {querySummary}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            {activeFilters.length > 0 && (
                <div className="p-6 bg-white border-t-2 border-yellow-200 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] shrink-0">
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            fullWidth
                            size="lg"
                            onClick={handleReset}
                            className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
                        >
                            Réinitialiser
                        </Button>
                        <Button
                            variant="primary"
                            fullWidth
                            size="lg"
                            onClick={handleApply}
                            className="shadow-xl shadow-yellow-500/20 rounded-xl h-12 !bg-gradient-to-r !from-yellow-500 !to-amber-500 hover:!from-yellow-600 hover:!to-amber-600"
                        >
                            Appliquer
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
