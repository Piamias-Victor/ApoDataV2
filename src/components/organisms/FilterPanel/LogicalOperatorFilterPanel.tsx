'use client';

import React, { useMemo } from 'react';
import { Settings, Info } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { useFilterStore } from '@/stores/useFilterStore';
import { useFilterGroups } from './components/logicalOperator/useFilterGroups';
import { OperatorGroupRow } from './components/logicalOperator/OperatorGroupRow';

interface LogicalOperatorFilterPanelProps {
    onClose?: () => void;
}

export const LogicalOperatorFilterPanel: React.FC<LogicalOperatorFilterPanelProps> = ({ onClose }) => {
    const {
        filterOperators,
        setFilterOperator,
        resetFilterOperators
    } = useFilterStore();

    const filterGroups = useFilterGroups();

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
                                <OperatorGroupRow
                                    key={group.id}
                                    group={group}
                                    index={index}
                                    isLast={index === filterGroups.length - 1}
                                    operator={filterOperators[index] || 'AND'}
                                    onSetOperator={setFilterOperator}
                                />
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
