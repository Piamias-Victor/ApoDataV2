'use client';

import React, { useState, useEffect } from 'react';
import {
    Calculator,
    Target,
    ArrowRight,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

interface SimulationCardProps {
    title: string;
    realized: number;
    prevTotal: number;
    prevRemaining: number;
    color: 'blue' | 'purple';
}

export const SimulationCard: React.FC<SimulationCardProps> = ({
    title,
    realized,
    prevTotal,
    prevRemaining,
    color
}) => {
    // Calculated Projection (Realized N + Remaining N-1)
    const projectedTotal = realized + prevRemaining;

    // State for User Inputs
    // We initialize target as the prevTotal (0% growth) by default
    const [targetAmount, setTargetAmount] = useState<number>(Math.round(prevTotal || 0));
    const [targetPercent, setTargetPercent] = useState<number>(0);

    // Initial sync when data loads
    useEffect(() => {
        if (prevTotal > 0) {
            // Only update if fundamentally different to avoid loop
            // We use a small epsilon for float comparison if needed, but prevTotal is usually int or stable float
            if (Math.abs(targetAmount - prevTotal) > 0.01) {
                setTargetAmount(prevTotal);
                setTargetPercent(0);
            }
        }
    }, [prevTotal]);

    // Handlers
    const handleAmountChange = (val: string) => {
        // Allow typing decimals
        const amount = parseFloat(val);
        if (isNaN(amount)) {
            setTargetAmount(0);
            return;
        }
        setTargetAmount(amount);

        // Recalculate %
        if (prevTotal > 0) {
            const pct = ((amount - prevTotal) / prevTotal) * 100;
            setTargetPercent(parseFloat(pct.toFixed(2)));
        }
    };

    const handlePercentChange = (val: string) => {
        const pct = parseFloat(val);
        if (isNaN(pct)) {
            setTargetPercent(0);
            return;
        }
        setTargetPercent(pct);

        // Recalculate €
        if (prevTotal > 0) {
            const amount = prevTotal * (1 + pct / 100);
            // Limit to 2 decimals
            setTargetAmount(parseFloat(amount.toFixed(2)));
        }
    };

    // Analysis
    const gap = projectedTotal - targetAmount;
    const isAhead = gap >= 0;
    const progress = targetAmount > 0 ? (projectedTotal / targetAmount) * 100 : 0;
    const cappedProgress = Math.min(Math.max(progress, 0), 100);

    // Formatting
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

    const theme = color === 'blue' ? {
        bg: 'bg-blue-50',
        border: 'border-blue-100',
        text: 'text-blue-900',
        subtext: 'text-blue-600',
        accent: 'bg-blue-500',
        ring: 'focus:ring-blue-500',
        icon: 'text-blue-500'
    } : {
        bg: 'bg-purple-50',
        border: 'border-purple-100',
        text: 'text-purple-900',
        subtext: 'text-purple-600',
        accent: 'bg-purple-500',
        ring: 'focus:ring-purple-500',
        icon: 'text-purple-500'
    };

    return (
        <div className={`rounded-xl border ${theme.border} bg-white shadow-sm overflow-hidden flex flex-col`}>
            {/* Header */}
            <div className={`px-6 py-4 ${theme.bg} border-b ${theme.border} flex justify-between items-center`}>
                <h3 className={`font-bold text-lg ${theme.text} flex items-center gap-2`}>
                    <Calculator className={`w-5 h-5 ${theme.icon}`} />
                    {title}
                </h3>
                <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500 uppercase font-semibold">Réalisé N-1</span>
                    <span className="font-mono font-medium text-gray-700">{formatCurrency(prevTotal)}</span>
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col gap-6">
                {/* 1. Status Section */}
                <div className="flex flex-col sm:flex-row gap-6">
                    {/* Current Realized */}
                    <div className="flex-1 p-4 rounded-lg bg-gray-50 border border-gray-100">
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Réalisé (Jan - Ce mois)</span>
                        <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(realized)}</div>
                        <div className="mt-2 text-xs flex items-center gap-1 text-gray-500">
                            <span className="bg-white px-1.5 py-0.5 rounded border border-gray-200">Actuel</span>
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className="hidden sm:flex items-center justify-center text-gray-300">
                        <ArrowRight className="w-6 h-6" />
                    </div>

                    {/* Projection */}
                    <div className={`flex-1 p-4 rounded-lg border ${isAhead ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
                        <span className={`text-xs font-medium uppercase tracking-wide ${isAhead ? 'text-green-700' : 'text-amber-700'}`}>
                            Atterrissage Estimé
                        </span>
                        <div className={`text-2xl font-bold mt-1 ${isAhead ? 'text-green-800' : 'text-amber-800'}`}>
                            {formatCurrency(projectedTotal)}
                        </div>
                        <div className={`mt-2 text-xs flex items-center gap-1 ${isAhead ? 'text-green-600' : 'text-amber-600'}`}>
                            <span>Basé sur historique N-1</span>
                        </div>
                    </div>
                </div>

                {/* 2. Objectives Inputs */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                        <Target className="w-4 h-4" />
                        Définir vos Objectifs
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        <div className="relative">
                            <label className="absolute -top-2.5 left-3 bg-white px-1 text-[11px] text-gray-500 font-medium z-10">Evolution %</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={targetPercent}
                                    onChange={(e) => handlePercentChange(e.target.value)}
                                    className={`w-full pl-4 pr-8 py-2.5 rounded-lg border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent font-medium transition-all`}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                            </div>
                        </div>

                        <div className="relative">
                            <label className="absolute -top-2.5 left-3 bg-white px-1 text-[11px] text-gray-500 font-medium z-10">Objectif €</label>
                            <input
                                type="number"
                                step="0.01"
                                value={targetAmount}
                                onChange={(e) => handleAmountChange(e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-lg border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent font-medium transition-all`}
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Visual Gap Analysis */}
                <div className="mt-2 pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-medium text-gray-700">Progression vers l&apos;objectif</span>
                        <span className={`text-sm font-bold ${isAhead ? 'text-green-600' : 'text-amber-600'}`}>
                            {progress.toFixed(1)}%
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${isAhead ? 'bg-green-500' : 'bg-amber-500'}`}
                            style={{ width: `${cappedProgress}%` }}
                        />
                    </div>

                    {/* Footer Stats */}
                    <div className="mt-4 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            {isAhead ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-amber-500" />
                            )}
                            <span className="text-gray-600">
                                {isAhead ? (
                                    "Objectif dépassé ! Félicitations."
                                ) : (
                                    <>
                                        Effort requis sur la période restante :
                                        <span className="font-bold text-amber-600 ml-1">
                                            {/* Formula: (Gap / PrevRemaining) * 100 = % increase needed on the logical 'remaining' to fill the gap */}
                                            +{(prevRemaining > 0 ? (Math.abs(gap) / prevRemaining) * 100 : 0).toFixed(1)}% / mois
                                        </span>
                                    </>
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
