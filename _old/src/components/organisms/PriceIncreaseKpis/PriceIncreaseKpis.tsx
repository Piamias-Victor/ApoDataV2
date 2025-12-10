// src/components/organisms/PriceIncreaseKpis/PriceIncreaseKpis.tsx
'use client';

import React from 'react';
import { Card } from '@/components/atoms/Card/Card';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import type { PriceIncreaseAnalysis } from '@/types/priceIncrease';

interface PriceIncreaseKpisProps {
    readonly analysis: PriceIncreaseAnalysis;
}

export const PriceIncreaseKpis: React.FC<PriceIncreaseKpisProps> = ({ analysis }) => {
    const {
        hmp_globale,
        nb_produits,
        impact_marge_total_euros,
        top10_hausses_pourcent,
        top10_hausses_euros
    } = analysis;

    const formatPercent = (value: number) => {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    };

    const formatEuros = (value: number) => {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(2)} €`;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* HMP Globale */}
            <Card variant="elevated" padding="lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700">HMP Globale</h3>
                    <div className={`p-2 rounded-lg ${hmp_globale >= 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                        {hmp_globale >= 0 ? (
                            <TrendingUp className="w-5 h-5 text-red-600" />
                        ) : (
                            <TrendingDown className="w-5 h-5 text-green-600" />
                        )}
                    </div>
                </div>
                <div className="space-y-2">
                    <p className={`text-3xl font-bold ${hmp_globale >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatPercent(hmp_globale)}
                    </p>
                    <p className="text-xs text-gray-500">
                        Sur {nb_produits} produits
                    </p>
                </div>
            </Card>

            {/* Top 10 Hausses % */}
            <Card variant="elevated" padding="lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700">Top 10 Hausses %</h3>
                    <div className="p-2 rounded-lg bg-orange-100">
                        <Percent className="w-5 h-5 text-orange-600" />
                    </div>
                </div>
                <div className="space-y-2">
                    {top10_hausses_pourcent.length > 0 ? (
                        <>
                            <p className="text-3xl font-bold text-orange-600">
                                {formatPercent(top10_hausses_pourcent[0]!.hausse_pourcent)}
                            </p>
                            <p className="text-xs text-gray-500">
                                Max : {top10_hausses_pourcent[0]!.code_ean}
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-gray-500">Aucune donnée</p>
                    )}
                </div>
            </Card>

            {/* Top 10 Hausses € */}
            <Card variant="elevated" padding="lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700">Top 10 Hausses €</h3>
                    <div className="p-2 rounded-lg bg-purple-100">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                    </div>
                </div>
                <div className="space-y-2">
                    {top10_hausses_euros.length > 0 ? (
                        <>
                            <p className="text-3xl font-bold text-purple-600">
                                {formatEuros(top10_hausses_euros[0]!.hausse_euros)}
                            </p>
                            <p className="text-xs text-gray-500">
                                Max : {top10_hausses_euros[0]!.code_ean}
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-gray-500">Aucune donnée</p>
                    )}
                </div>
            </Card>

            {/* Impact Marge */}
            <Card variant="elevated" padding="lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700">Impact Marge Total</h3>
                    <div className={`p-2 rounded-lg ${impact_marge_total_euros < 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                        {impact_marge_total_euros < 0 ? (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                        ) : (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        )}
                    </div>
                </div>
                <div className="space-y-2">
                    <p className={`text-3xl font-bold ${impact_marge_total_euros < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatEuros(impact_marge_total_euros)}
                    </p>
                    <p className="text-xs text-gray-500">
                        {impact_marge_total_euros < 0 ? 'Perte estimée' : 'Gain estimé'}
                    </p>
                </div>
            </Card>
        </div>
    );
};
