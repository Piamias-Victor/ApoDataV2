'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Building2, AlertCircle } from 'lucide-react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { usePharmacyGroupComparison } from '@/hooks/pharmacies/usePharmacyGroupComparison';
import { MemoizedPharmacyGroupComparisonSection as PharmacyGroupComparisonSection } from '@/components/organisms/PharmacyGroupComparisonSection/PharmacyGroupComparisonSection';
import { Card } from '@/components/atoms/Card/Card';

/**
 * Empty state component when no pharmacies are selected
 */
const EmptyState: React.FC = () => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
        <Card variant="elevated" className="p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">
                <Building2 className="w-24 h-24 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune pharmacie sélectionnée
            </h3>
            <p className="text-gray-600 mb-4">
                Pour afficher la comparaison avec le groupement Apothical,
                <br />
                veuillez sélectionner au moins une pharmacie dans les filtres.
            </p>
            <div className="text-sm text-gray-500 space-y-1">
                <div>💡 Utilisez le filtre "Pharmacies" dans la barre de filtres</div>
                <div>📊 Vous pourrez ensuite comparer vos performances avec la moyenne du groupement</div>
            </div>
        </Card>
    </motion.div>
);

/**
 * Pharmacy Group Comparison Page
 * 
 * Displays comparison of selected pharmacy metrics vs group average
 * Only visible when at least one pharmacy is selected
 */
export default function PharmacyGroupComparisonPage() {
    // Get filters from store
    const selectedPharmacies = useFiltersStore((state) => state.selectedPharmacies);
    const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
    const comparisonDateRange = useFiltersStore((state) => state.comparisonDateRange);
    const productCodes = useFiltersStore((state) => state.products);

    // Check if comparison period is active
    const hasComparison = !!(comparisonDateRange.start && comparisonDateRange.end);

    // Fetch data using the hook
    const { data, isLoading, error, refetch } = usePharmacyGroupComparison({
        enabled: selectedPharmacies.length > 0,
        dateRange: analysisDateRange,
        comparisonDateRange: hasComparison ? comparisonDateRange : undefined,
        pharmacyIds: selectedPharmacies.map((p) => p.id),
        productCodes: productCodes.length > 0 ? productCodes : undefined,
    });

    // Show empty state if no pharmacies selected
    if (selectedPharmacies.length === 0) {
        return (
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Comparaison Pharmacie vs Groupement
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Comparez vos performances avec la moyenne du groupement Apothical
                        </p>
                    </div>
                </div>

                <EmptyState />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Comparaison Pharmacie vs Groupement
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Analysez vos performances par rapport à la moyenne du groupement Apothical
                    </p>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl p-4 flex items-start space-x-3 shadow-soft">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">À propos de cette comparaison</p>
                    <p>
                        Les valeurs affichées dans "Ma Pharmacie" représentent les données agrégées de{' '}
                        <strong>{selectedPharmacies.length} pharmacie{selectedPharmacies.length > 1 ? 's' : ''}</strong> sélectionnée{selectedPharmacies.length > 1 ? 's' : ''}.
                        {' '}La "Moyenne Apothical" est calculée sur l'ensemble du groupement.
                        {hasComparison && ' Les évolutions sont calculées par rapport à la période de comparaison sélectionnée.'}
                    </p>
                </div>
            </div>

            {/* Selected Pharmacies List */}
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 shadow-soft border border-white/20">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Pharmacies sélectionnées ({selectedPharmacies.length})</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                    {selectedPharmacies.map((pharmacy) => (
                        <div
                            key={pharmacy.id}
                            className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-full text-sm border border-blue-200/50 shadow-sm"
                        >
                            <Building2 className="w-3 h-3 mr-1.5" />
                            {pharmacy.name}
                        </div>
                    ))}
                </div>
            </div>

            {/* Comparison Section */}
            <PharmacyGroupComparisonSection
                data={data}
                isLoading={isLoading}
                error={error}
                onRefresh={refetch}
            />

            {/* Additional Info */}
            {!isLoading && data && (
                <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 backdrop-blur-sm rounded-2xl p-4 text-sm text-gray-600 shadow-soft border border-gray-200/50">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                        <span className="text-lg">📊</span>
                        <span>Interprétation des écarts</span>
                    </h4>
                    <ul className="space-y-2">
                        <li className="flex items-start space-x-2">
                            <span className="text-green-600 font-bold mt-0.5">↑</span>
                            <span><strong className="text-green-600">Écart positif</strong> : Vos pharmacies performent mieux que la moyenne du groupement</span>
                        </li>
                        <li className="flex items-start space-x-2">
                            <span className="text-red-600 font-bold mt-0.5">↓</span>
                            <span><strong className="text-red-600">Écart négatif</strong> : Vos pharmacies sont en-dessous de la moyenne du groupement</span>
                        </li>
                        <li className="flex items-start space-x-2">
                            <span className="text-purple-600 font-bold mt-0.5">%</span>
                            <span>Pour le <strong>Taux de marge</strong>, l'écart est exprimé en points de pourcentage (pts)</span>
                        </li>
                        <li className="flex items-start space-x-2">
                            <span className="text-blue-600 font-bold mt-0.5">€</span>
                            <span>Pour les autres métriques, l'écart est exprimé en pourcentage (%)</span>
                        </li>
                    </ul>
                </div>
            )}
        </motion.div>
    );
}
