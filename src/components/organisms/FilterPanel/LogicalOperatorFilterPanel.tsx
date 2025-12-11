// src/components/organisms/FilterPanel/LogicalOperatorFilterPanel.tsx
'use client';

import React, { useMemo } from 'react';
import { Settings, Info, ChevronDown } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { useFilterStore } from '@/stores/useFilterStore';

interface FilterGroup {
    type: string;
    id: string;
    name: string;
    count: number;
    icon: string;
}

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

    // Build grouped filters by type
    const filterGroups = useMemo((): FilterGroup[] => {
        const groups: FilterGroup[] = [];

        if (pharmacies.length > 0) {
            groups.push({
                type: 'pharmacy',
                id: 'pharmacy-group',
                name: pharmacies.length === 1 ? '🏥 Pharmacie' : '🏥 Pharmacies',
                count: pharmacies.length,
                icon: '🏥'
            });
        }

        if (laboratories.length > 0) {
            groups.push({
                type: 'laboratory',
                id: 'laboratory-group',
                name: laboratories.length === 1 ? '🔬 Laboratoire' : '🔬 Laboratoires',
                count: laboratories.length,
                icon: '🔬'
            });
        }

        if (categories.length > 0) {
            groups.push({
                type: 'category',
                id: 'category-group',
                name: categories.length === 1 ? '🏷️ Catégorie' : '🏷️ Catégories',
                count: categories.length,
                icon: '🏷️'
            });
        }

        if (products.length > 0) {
            groups.push({
                type: 'product',
                id: 'product-group',
                name: products.length === 1 ? '📦 Produit' : '📦 Produits',
                count: products.length,
                icon: '📦'
            });
        }

        if (settings.tvaRates.length > 0) {
            groups.push({
                type: 'tva',
                id: 'tva-group',
                name: settings.tvaRates.length === 1 ? '💰 TVA' : '💰 TVA',
                count: settings.tvaRates.length,
                icon: '💰'
            });
        }

        if (settings.reimbursementStatus !== 'ALL') {
            groups.push({
                type: 'reimbursement',
                id: 'reimbursement-group',
                name: `💊 ${settings.reimbursementStatus === 'REIMBURSED' ? 'Remboursé' : 'Non remboursé'}`,
                count: 1,
                icon: '💊'
            });
        }

        if (settings.isGeneric !== undefined) {
            groups.push({
                type: 'generic',
                id: 'generic-group',
                name: `🧬 ${settings.isGeneric ? 'Générique' : 'Princeps'}`,
                count: 1,
                icon: '🧬'
            });
        }

        // Count price ranges
        let priceRangeCount = 0;
        if (settings.purchasePriceNetRange &&
            (settings.purchasePriceNetRange.min !== 0 || settings.purchasePriceNetRange.max !== 100000)) {
            priceRangeCount++;
        }
        if (settings.purchasePriceGrossRange &&
            (settings.purchasePriceGrossRange.min !== 0 || settings.purchasePriceGrossRange.max !== 100000)) {
            priceRangeCount++;
        }
        if (settings.sellPriceRange &&
            (settings.sellPriceRange.min !== 0 || settings.sellPriceRange.max !== 100000)) {
            priceRangeCount++;
        }
        if (settings.discountRange &&
            (settings.discountRange.min !== 0 || settings.discountRange.max !== 100)) {
            priceRangeCount++;
        }
        if (settings.marginRange &&
            (settings.marginRange.min !== 0 || settings.marginRange.max !== 100)) {
            priceRangeCount++;
        }

        if (priceRangeCount > 0) {
            groups.push({
                type: 'priceRange',
                id: 'price-range-group',
                name: priceRangeCount === 1 ? '💶 Plage de prix' : '💶 Plages de prix',
                count: priceRangeCount,
                icon: '💶'
            });
        }

        return groups;
    }, [pharmacies, laboratories, categories, products, settings]);

    // Generate query summary
    const querySummary = useMemo(() => {
        if (filterGroups.length === 0) return '';
        if (filterGroups.length === 1) {
            const group = filterGroups[0];
            return group ? `${group.name} (${group.count})` : '';
        }

        const firstGroup = filterGroups[0];
        if (!firstGroup) return '';

        let summary = `${firstGroup.name} (${firstGroup.count})`;
        for (let i = 0; i < filterGroups.length - 1; i++) {
            const operator = filterOperators[i] || 'AND';
            const operatorText = operator === 'AND' ? 'ET' : 'OU';
            const nextGroup = filterGroups[i + 1];
            if (nextGroup) {
                summary += ` ${operatorText} ${nextGroup.name} (${nextGroup.count})`;
            }
        }
        return summary;
    }, [filterGroups, filterOperators]);

    const handleReset = () => {
        resetFilterOperators();
    };

    const handleApply = () => {
        if (onClose) onClose();
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {filterGroups.length === 0 ? (
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

                        {/* Filter Groups with operators */}
                        <div className="space-y-0">
                            {filterGroups.map((group, index) => (
                                <div key={group.id}>
                                    {/* Filter Group */}
                                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4 border-2 border-yellow-200">
                                        <div className="flex items-center justify-between">
                                            <div className="font-semibold text-gray-900">{group.name}</div>
                                            <div className="px-3 py-1 bg-yellow-500 text-white text-sm font-bold rounded-full">
                                                {group.count}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Operator (if not last item) */}
                                    {index < filterGroups.length - 1 && (
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
            {filterGroups.length > 0 && (
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
