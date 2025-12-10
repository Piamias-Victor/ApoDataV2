// src/components/organisms/PharmacyGroupComparisonSection/PharmacyGroupComparisonSection.tsx
'use client';

import React from 'react';
import {
    ShoppingCart,
    TrendingUp,
    DollarSign,
    Percent,
    Package,
    RotateCcw,
    AlertCircle
} from 'lucide-react';
import { MemoizedComparisonMetricCard as ComparisonMetricCard } from '@/components/molecules/ComparisonMetricCard/ComparisonMetricCard';
import { Button } from '@/components/atoms/Button/Button';
import type { PharmacyGroupComparisonData } from '@/hooks/pharmacies/usePharmacyGroupComparison';

/**
 * Props for PharmacyGroupComparisonSection
 */
export interface PharmacyGroupComparisonSectionProps {
    readonly data: PharmacyGroupComparisonData | null;
    readonly isLoading: boolean;
    readonly error?: string | null;
    readonly onRefresh?: () => void;
    readonly className?: string;
}

/**
 * Loading skeleton for the comparison table
 */
const ComparisonSkeleton: React.FC = () => (
    <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-4 gap-4 py-4 px-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                    <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                    <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex justify-end">
                    <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
                </div>
            </div>
        ))}
    </div>
);

/**
 * Error state component
 */
const ErrorState: React.FC<{ error: string; onRefresh?: (() => void) | undefined }> = ({ error, onRefresh }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center bg-red-50 rounded-lg border border-red-200">
        <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">
            Erreur de chargement
        </h3>
        <p className="text-red-700 mb-4 max-w-md">
            {error || 'Une erreur est survenue lors du chargement des données.'}
        </p>
        {onRefresh && (
            <Button
                variant="secondary"
                size="md"
                onClick={onRefresh}
                iconLeft={<RotateCcw className="w-4 h-4" />}
            >
                Réessayer
            </Button>
        )}
    </div>
);

/**
 * PharmacyGroupComparisonSection - Main organism component
 * 
 * Displays a comparison table of pharmacy metrics vs group average
 */
export const PharmacyGroupComparisonSection: React.FC<PharmacyGroupComparisonSectionProps> = ({
    data,
    isLoading,
    error,
    onRefresh,
    className = ''
}) => {
    // Error state
    if (error) {
        return (
            <section className={`${className}`}>
                <ErrorState error={error} onRefresh={onRefresh} />
            </section>
        );
    }

    return (
        <section className={`${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Comparaison vs Groupement Apothical
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        {isLoading ? (
                            'Chargement...'
                        ) : data ? (
                            <>
                                {data.pharmacyCount} pharmacie{data.pharmacyCount > 1 ? 's' : ''} sélectionnée{data.pharmacyCount > 1 ? 's' : ''}
                                {' '} • {' '}
                                Comparé à {data.totalPharmaciesInGroup} pharmacies du groupement
                                {data.cached && ' • Données en cache'}
                            </>
                        ) : (
                            'Aucune donnée'
                        )}
                    </p>
                </div>

                {/* Refresh button */}
                {onRefresh && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRefresh}
                        disabled={isLoading}
                        iconLeft={
                            <RotateCcw
                                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                            />
                        }
                        className="text-gray-600 hover:text-gray-900"
                    >
                        {isLoading ? 'Actualisation...' : 'Actualiser'}
                    </Button>
                )}
            </div>

            {/* Comparison Table */}
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20 overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-4 gap-4 py-4 px-6 bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm border-b border-gray-200/50">
                    <div className="font-semibold text-sm text-gray-700">Indicateur</div>
                    <div className="font-semibold text-sm text-gray-700">Ma Pharmacie</div>
                    <div className="font-semibold text-sm text-gray-700">Moyenne Apothical</div>
                    <div className="font-semibold text-sm text-gray-700 text-right">Écart</div>
                </div>

                {/* Loading State */}
                {isLoading && <ComparisonSkeleton />}

                {/* Data State */}
                {!isLoading && data && (
                    <div>
                        {/* CA Sell-In */}
                        <ComparisonMetricCard
                            label="CA Sell-In"
                            icon={<TrendingUp className="w-5 h-5 text-green-600" />}
                            pharmacyValue={data.selectedPharmacies.ca_sell_in}
                            pharmacyEvolution={data.selectedPharmacies.evol_sell_in_pct}
                            groupValue={data.groupAverage.ca_sell_in}
                            groupEvolution={data.groupAverage.evol_sell_in_pct}
                            unit="€"
                        />

                        {/* CA Sell-Out */}
                        <ComparisonMetricCard
                            label="CA Sell-Out"
                            icon={<ShoppingCart className="w-5 h-5 text-blue-600" />}
                            pharmacyValue={data.selectedPharmacies.ca_sell_out}
                            pharmacyEvolution={data.selectedPharmacies.evol_sell_out_pct}
                            groupValue={data.groupAverage.ca_sell_out}
                            groupEvolution={data.groupAverage.evol_sell_out_pct}
                            unit="€"
                        />

                        {/* Marge */}
                        <ComparisonMetricCard
                            label="Marge"
                            icon={<DollarSign className="w-5 h-5 text-orange-600" />}
                            pharmacyValue={data.selectedPharmacies.marge}
                            pharmacyEvolution={data.selectedPharmacies.evol_marge_pct}
                            groupValue={data.groupAverage.marge}
                            groupEvolution={data.groupAverage.evol_marge_pct}
                            unit="€"
                        />

                        {/* Taux de Marge */}
                        <ComparisonMetricCard
                            label="Taux de marge"
                            icon={<Percent className="w-5 h-5 text-purple-600" />}
                            pharmacyValue={data.selectedPharmacies.taux_marge}
                            pharmacyEvolution={undefined} // No evolution for percentage
                            groupValue={data.groupAverage.taux_marge}
                            groupEvolution={undefined}
                            unit="%"
                            isPercentage={true}
                        />

                        {/* Stock */}
                        <ComparisonMetricCard
                            label="Stock"
                            icon={<Package className="w-5 h-5 text-indigo-600" />}
                            pharmacyValue={data.selectedPharmacies.stock}
                            pharmacyEvolution={undefined} // Stock doesn't have evolution
                            groupValue={data.groupAverage.stock}
                            groupEvolution={undefined}
                            unit="€"
                        />
                    </div>
                )}
            </div>

            {/* Query time info */}
            {!isLoading && data && (
                <div className="mt-4 text-xs text-gray-500 text-right">
                    Temps de requête : {data.queryTime}ms
                </div>
            )}
        </section>
    );
};

// Performance optimization
export const MemoizedPharmacyGroupComparisonSection = React.memo(PharmacyGroupComparisonSection);
