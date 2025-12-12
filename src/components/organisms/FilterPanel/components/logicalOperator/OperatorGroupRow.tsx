import React from 'react';
import { ChevronDown } from 'lucide-react';
import { FilterGroup } from './types';

interface OperatorGroupRowProps {
    group: FilterGroup;
    index: number;
    isLast: boolean;
    operator?: 'AND' | 'OR';
    onSetOperator: (index: number, op: 'AND' | 'OR') => void;
}

export const OperatorGroupRow: React.FC<OperatorGroupRowProps> = ({
    group,
    index,
    isLast,
    operator = 'AND',
    onSetOperator
}) => {
    return (
        <div>
            {/* Filter Group Card */}
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4 border-2 border-yellow-200">
                <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900">{group.name}</div>
                    <div className="px-3 py-1 bg-yellow-500 text-white text-sm font-bold rounded-full">
                        {group.count}
                    </div>
                </div>
            </div>

            {/* Operator Selector (if not last item) */}
            {!isLast && (
                <div className="flex items-center justify-center py-3">
                    <div className="flex gap-2 bg-white rounded-xl p-1 border-2 border-yellow-200 shadow-sm">
                        <button
                            onClick={() => onSetOperator(index, 'AND')}
                            className={`
                                px-6 py-2 rounded-lg font-bold text-sm transition-all
                                ${operator === 'AND'
                                    ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }
                            `}
                        >
                            ET
                        </button>
                        <button
                            onClick={() => onSetOperator(index, 'OR')}
                            className={`
                                px-6 py-2 rounded-lg font-bold text-sm transition-all
                                ${operator === 'OR'
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
    );
};
