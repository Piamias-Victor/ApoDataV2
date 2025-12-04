// src/app/(dashboard)/declaration-bri/page.tsx
'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Download, Building2, Package, Calendar, AlertCircle } from 'lucide-react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useExportBri } from '@/hooks/export/useExportBri';
import { Card } from '@/components/atoms/Card/Card';
import { Button } from '@/components/atoms/Button/Button';

/**
 * Page Declaration BRI
 * 
 * Permet d'exporter un fichier Excel avec les données de déclaration BRI
 */
export default function DeclarationBriPage() {
    const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);
    const selectedPharmacies = useFiltersStore((state) => state.selectedPharmacies);
    const products = useFiltersStore((state) => state.products);
    const selectedProducts = useFiltersStore((state) => state.selectedProducts);
    const selectedLaboratories = useFiltersStore((state) => state.selectedLaboratories);
    const selectedCategories = useFiltersStore((state) => state.selectedCategories);

    const { exportBri, isExporting, error } = useExportBri();

    // Vérifier si des filtres sont actifs
    const hasFilters = useMemo(() => {
        return (
            selectedPharmacies.length > 0 ||
            products.length > 0 ||
            selectedLaboratories.length > 0 ||
            selectedCategories.length > 0
        );
    }, [selectedPharmacies, products, selectedLaboratories, selectedCategories]);

    const handleExport = async () => {
        try {
            await exportBri({
                analysisDateRange,
                pharmacyIds: selectedPharmacies.map(p => p.id),
                // Inclure productCodes seulement s'il y en a
                ...(products.length > 0 && { productCodes: products }),
            });
        } catch (err) {
            console.error('Export failed:', err);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                            <FileSpreadsheet className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Déclaration BRI
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Export Excel des données de vente pour déclaration BRI
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl p-6 shadow-soft">
                <div className="flex items-start space-x-4">
                    <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">
                            À propos de l'export BRI
                        </h3>
                        <p className="text-sm text-blue-800 leading-relaxed">
                            Le fichier Excel généré contient 3 types de feuilles :
                        </p>
                        <ul className="mt-3 space-y-2 text-sm text-blue-800">
                            <li className="flex items-start">
                                <span className="font-semibold mr-2">•</span>
                                <span><strong>Feuille "Total"</strong> : Quantités vendues par pharmacie (Nom, IDNAT, Qté totale)</span>
                            </li>
                            <li className="flex items-start">
                                <span className="font-semibold mr-2">•</span>
                                <span><strong>Feuille "Produit"</strong> : Quantités vendues par produit (Code EAN 13, Nom, Laboratoire, Qté totale)</span>
                            </li>
                            <li className="flex items-start">
                                <span className="font-semibold mr-2">•</span>
                                <span><strong>Feuilles par produit</strong> : Une feuille par produit avec le détail par pharmacie (Nom, IDNAT, Qté)</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Filtres actifs */}
            <Card variant="elevated" className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span>Période d'analyse</span>
                </h2>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200/50">
                    <p className="text-sm text-gray-700">
                        <strong>Du</strong> {new Date(analysisDateRange.start).toLocaleDateString('fr-FR')}
                        {' '}<strong>au</strong> {new Date(analysisDateRange.end).toLocaleDateString('fr-FR')}
                    </p>
                </div>

                {/* Pharmacies sélectionnées */}
                {selectedPharmacies.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                            <Building2 className="w-4 h-4 text-green-600" />
                            <span>Pharmacies sélectionnées ({selectedPharmacies.length})</span>
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {selectedPharmacies.map((pharmacy) => (
                                <div
                                    key={pharmacy.id}
                                    className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-full text-sm border border-green-200/50 shadow-sm"
                                >
                                    <Building2 className="w-3 h-3 mr-1.5" />
                                    {pharmacy.name}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Produits/Labos/Catégories */}
                {(selectedProducts.length > 0 || selectedLaboratories.length > 0 || selectedCategories.length > 0) && (
                    <div className="mt-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                            <Package className="w-4 h-4 text-purple-600" />
                            <span>Filtres produits</span>
                        </h3>
                        <div className="space-y-2 text-sm text-gray-600">
                            {selectedProducts.length > 0 && (
                                <p>• <strong>{selectedProducts.length}</strong> produit{selectedProducts.length > 1 ? 's' : ''} sélectionné{selectedProducts.length > 1 ? 's' : ''}</p>
                            )}
                            {selectedLaboratories.length > 0 && (
                                <p>• <strong>{selectedLaboratories.length}</strong> laboratoire{selectedLaboratories.length > 1 ? 's' : ''} sélectionné{selectedLaboratories.length > 1 ? 's' : ''}</p>
                            )}
                            {selectedCategories.length > 0 && (
                                <p>• <strong>{selectedCategories.length}</strong> catégorie{selectedCategories.length > 1 ? 's' : ''} sélectionnée{selectedCategories.length > 1 ? 's' : ''}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                                Total : <strong>{products.length}</strong> code{products.length > 1 ? 's' : ''} produit{products.length > 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                )}

                {!hasFilters && (
                    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                            ℹ️ Aucun filtre actif. L'export contiendra toutes les données de la période sélectionnée.
                        </p>
                    </div>
                )}
            </Card>

            {/* Bouton d'export */}
            <Card variant="elevated" className="p-8">
                <div className="text-center space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Générer le fichier Excel
                        </h2>
                        <p className="text-gray-600">
                            Cliquez sur le bouton ci-dessous pour télécharger votre déclaration BRI
                        </p>
                    </div>

                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleExport}
                        disabled={isExporting}
                        iconLeft={
                            isExporting ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                            ) : (
                                <Download className="w-5 h-5" />
                            )
                        }
                        className="mx-auto"
                    >
                        {isExporting ? 'Génération en cours...' : 'Télécharger le fichier Excel'}
                    </Button>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
                            <p className="text-sm text-red-800">
                                ❌ Erreur : {error}
                            </p>
                        </div>
                    )}

                    <div className="text-xs text-gray-500 max-w-md mx-auto">
                        <p>
                            Le fichier sera téléchargé automatiquement dans votre dossier de téléchargements.
                            La génération peut prendre quelques secondes selon le volume de données.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Informations complémentaires */}
            <Card variant="elevated" className="p-6 bg-gradient-to-r from-gray-50 to-blue-50/30">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    💡 Informations utiles
                </h3>
                <ul className="space-y-3 text-sm text-gray-700">
                    <li className="flex items-start space-x-2">
                        <span className="text-blue-600 font-bold mt-0.5">•</span>
                        <span>Les données sont filtrées selon vos sélections actives (pharmacies, produits, laboratoires, catégories)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                        <span className="text-blue-600 font-bold mt-0.5">•</span>
                        <span>Seuls les produits avec des ventes sur la période sont inclus dans l'export</span>
                    </li>
                    <li className="flex items-start space-x-2">
                        <span className="text-blue-600 font-bold mt-0.5">•</span>
                        <span>Les feuilles Excel sont formatées avec en-têtes en gras et filtres automatiques</span>
                    </li>
                    <li className="flex items-start space-x-2">
                        <span className="text-blue-600 font-bold mt-0.5">•</span>
                        <span>Le nom de chaque feuille produit correspond au code EAN 13 du produit</span>
                    </li>
                </ul>
            </Card>
        </motion.div>
    );
}
