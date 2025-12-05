// src/components/organisms/PriceComparisonTable/PriceComparisonTable.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/atoms/Card/Card';
import { ArrowUpDown } from 'lucide-react';
import type { PriceComparison } from '@/types/priceIncrease';

interface PriceComparisonTableProps {
    readonly comparisons: PriceComparison[];
}

type SortField = 'code_ean' | 'hausse_pourcent' | 'hausse_euros' | 'quantite_vendue' | 'perte_gain_marge_euros';
type SortDirection = 'asc' | 'desc';

export const PriceComparisonTable: React.FC<PriceComparisonTableProps> = ({ comparisons }) => {
    const [sortField, setSortField] = useState<SortField>('hausse_pourcent');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const sortedData = useMemo(() => {
        return [...comparisons].sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];
            const multiplier = sortDirection === 'asc' ? 1 : -1;
            return (aVal > bVal ? 1 : -1) * multiplier;
        });
    }, [comparisons, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const SortButton: React.FC<{ field: SortField; label: string }> = ({ field, label }) => (
        <button
            onClick={() => handleSort(field)}
            className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
        >
            <span>{label}</span>
            <ArrowUpDown className="w-3 h-3" />
        </button>
    );

    return (
        <Card variant="elevated" padding="none">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                                <SortButton field="code_ean" label="Code EAN" />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Nom Produit</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Prix 2025</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Prix 2026</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                                <SortButton field="hausse_pourcent" label="Hausse %" />
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                                <SortButton field="hausse_euros" label="Hausse €" />
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                                <SortButton field="quantite_vendue" label="Qté Vendue" />
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                                <SortButton field="perte_gain_marge_euros" label="Impact Marge" />
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sortedData.map((row) => (
                            <tr key={row.code_ean} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-sm font-mono text-gray-900">{row.code_ean}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{row.nom_produit}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-700">{row.prix_2025.toFixed(2)} €</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-700">{row.prix_2026.toFixed(2)} €</td>
                                <td className={`px-4 py-3 text-sm text-right font-semibold ${row.hausse_pourcent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {row.hausse_pourcent >= 0 ? '+' : ''}{row.hausse_pourcent.toFixed(2)}%
                                </td>
                                <td className={`px-4 py-3 text-sm text-right font-semibold ${row.hausse_euros >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {row.hausse_euros >= 0 ? '+' : ''}{row.hausse_euros.toFixed(2)} €
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-gray-700">{row.quantite_vendue}</td>
                                <td className={`px-4 py-3 text-sm text-right font-bold ${row.perte_gain_marge_euros < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {row.perte_gain_marge_euros < 0 ? '' : '+'}{row.perte_gain_marge_euros.toFixed(2)} €
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {sortedData.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    Aucune donnée à afficher
                </div>
            )}
        </Card>
    );
};
