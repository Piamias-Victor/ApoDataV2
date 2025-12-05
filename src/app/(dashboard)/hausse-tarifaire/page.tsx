// src/app/(dashboard)/hausse-tarifaire/page.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, FileSpreadsheet, Loader2 } from 'lucide-react';
import { CsvDropZone } from '@/components/molecules/CsvDropZone/CsvDropZone';
import { PriceIncreaseKpis } from '@/components/organisms/PriceIncreaseKpis/PriceIncreaseKpis';
import { PriceComparisonTable } from '@/components/organisms/PriceComparisonTable/PriceComparisonTable';
import { useCsvParser } from '@/hooks/priceIncrease/useCsvParser';
import { usePriceComparison } from '@/hooks/priceIncrease/usePriceComparison';
import { useSalesData } from '@/hooks/priceIncrease/useSalesData';
import { useFiltersStore } from '@/stores/useFiltersStore';
import type { CatalogProduct, PriceComparison, PriceIncreaseAnalysis } from '@/types/priceIncrease';

export default function HausseTarifairePage() {
    const [catalog2025, setCatalog2025] = useState<CatalogProduct[] | null>(null);
    const [catalog2026, setCatalog2026] = useState<CatalogProduct[] | null>(null);
    const [analysis, setAnalysis] = useState<PriceIncreaseAnalysis | null>(null);

    const { parseCsv, isLoading: isParsingCsv, error: csvError } = useCsvParser();
    const { comparisons } = usePriceComparison(catalog2025, catalog2026);
    const { fetchSalesData, isLoading: isLoadingSales, error: salesError } = useSalesData();
    const analysisDateRange = useFiltersStore((state) => state.analysisDateRange);

    const handle2025Upload = useCallback(async (file: File) => {
        try {
            const products = await parseCsv(file);
            setCatalog2025(products);
            setAnalysis(null); // Reset analysis
        } catch (err) {
            console.error('Erreur import 2025:', err);
        }
    }, [parseCsv]);

    const handle2026Upload = useCallback(async (file: File) => {
        try {
            const products = await parseCsv(file);
            setCatalog2026(products);
            setAnalysis(null); // Reset analysis
        } catch (err) {
            console.error('Erreur import 2026:', err);
        }
    }, [parseCsv]);

    // Lancer l'analyse quand les 2 catalogues sont chargés
    useEffect(() => {
        if (comparisons.size === 0 || analysis !== null) return;

        const runAnalysis = async () => {
            try {
                console.log('🔄 Starting analysis...', {
                    comparisons: comparisons.size,
                    dateRange: analysisDateRange
                });

                // Récupérer les codes EAN
                const codeEans = Array.from(comparisons.keys());

                // Récupérer les données de vente
                const salesMap = await fetchSalesData(
                    codeEans,
                    analysisDateRange.start,
                    analysisDateRange.end
                );

                // Construire les comparaisons complètes
                const fullComparisons: PriceComparison[] = [];

                comparisons.forEach((priceData, codeEan) => {
                    const salesData = salesMap.get(codeEan);

                    if (!salesData) {
                        // Produit sans ventes
                        fullComparisons.push({
                            code_ean: codeEan,
                            nom_produit: 'Produit inconnu',
                            laboratoire: '-',
                            prix_2025: priceData.prix_2025,
                            prix_2026: priceData.prix_2026,
                            hausse_pourcent: priceData.hausse_pourcent,
                            hausse_euros: priceData.hausse_euros,
                            quantite_vendue: 0,
                            ca_ttc: 0,
                            prix_vente_moyen_ttc: 0,
                            marge_actuelle_euros: 0,
                            marge_actuelle_pourcent: 0,
                            nouvelle_marge_euros: 0,
                            nouvelle_marge_pourcent: 0,
                            perte_gain_marge_euros: 0,
                            perte_gain_marge_pourcent: 0
                        });
                        return;
                    }

                    // Calculs de marge
                    const prix_vente_ht = salesData.prix_vente_moyen_ttc / 1.2; // Approximation TVA 20%
                    const marge_actuelle_euros = prix_vente_ht - priceData.prix_2025;
                    const marge_actuelle_pourcent = prix_vente_ht > 0 ? (marge_actuelle_euros / prix_vente_ht) * 100 : 0;

                    const nouvelle_marge_euros = prix_vente_ht - priceData.prix_2026;
                    const nouvelle_marge_pourcent = prix_vente_ht > 0 ? (nouvelle_marge_euros / prix_vente_ht) * 100 : 0;

                    const perte_gain_marge_euros = (nouvelle_marge_euros - marge_actuelle_euros) * salesData.quantite_vendue;
                    const perte_gain_marge_pourcent = nouvelle_marge_pourcent - marge_actuelle_pourcent;

                    fullComparisons.push({
                        code_ean: codeEan,
                        nom_produit: salesData.nom_produit,
                        laboratoire: salesData.laboratoire || '-',
                        prix_2025: priceData.prix_2025,
                        prix_2026: priceData.prix_2026,
                        hausse_pourcent: priceData.hausse_pourcent,
                        hausse_euros: priceData.hausse_euros,
                        quantite_vendue: salesData.quantite_vendue,
                        ca_ttc: salesData.ca_ttc,
                        prix_vente_moyen_ttc: salesData.prix_vente_moyen_ttc,
                        marge_actuelle_euros,
                        marge_actuelle_pourcent,
                        nouvelle_marge_euros,
                        nouvelle_marge_pourcent,
                        perte_gain_marge_euros,
                        perte_gain_marge_pourcent
                    });
                });

                // Calculer HMP globale
                const hmp_globale = fullComparisons.reduce((sum, c) => sum + c.hausse_pourcent, 0) / fullComparisons.length;

                // Top 10 hausses %
                const top10_hausses_pourcent = [...fullComparisons]
                    .sort((a, b) => b.hausse_pourcent - a.hausse_pourcent)
                    .slice(0, 10);

                // Top 10 hausses €
                const top10_hausses_euros = [...fullComparisons]
                    .sort((a, b) => b.hausse_euros - a.hausse_euros)
                    .slice(0, 10);

                // Impact marge total
                const impact_marge_total_euros = fullComparisons.reduce((sum, c) => sum + c.perte_gain_marge_euros, 0);

                const analysisResult: PriceIncreaseAnalysis = {
                    hmp_globale,
                    nb_produits: fullComparisons.length,
                    impact_marge_total_euros,
                    top10_hausses_pourcent,
                    top10_hausses_euros,
                    all_comparisons: fullComparisons
                };

                setAnalysis(analysisResult);
                console.log('✅ Analysis complete:', analysisResult);
            } catch (err) {
                console.error('💥 Analysis error:', err);
            }
        };

        runAnalysis();
    }, [comparisons, analysisDateRange, fetchSalesData, analysis]);

    const canCompare = catalog2025 && catalog2026;
    const isAnalyzing = isLoadingSales;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                Hausse Tarifaire
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Analysez l'impact des hausses de prix sur vos marges
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-gradient-to-r from-orange-50/80 to-red-50/80 backdrop-blur-sm border border-orange-200/50 rounded-2xl p-6 shadow-soft">
                <div className="flex items-start space-x-4">
                    <FileSpreadsheet className="w-6 h-6 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-orange-900 mb-2">
                            Comment ça marche ?
                        </h3>
                        <ol className="text-sm text-orange-800 space-y-2 list-decimal list-inside">
                            <li>Importez votre catalogue 2025 (CSV sans en-tête)</li>
                            <li>Importez votre catalogue 2026 (CSV sans en-tête)</li>
                            <li>Visualisez les hausses de prix et leur impact sur vos marges</li>
                        </ol>
                        <div className="mt-4 p-3 bg-orange-100/50 rounded-lg border border-orange-300">
                            <p className="text-xs font-semibold text-orange-900 mb-1">📋 Format CSV requis :</p>
                            <ul className="text-xs text-orange-800 space-y-1">
                                <li>• <strong>Pas d'en-tête</strong> (pas de ligne de titre)</li>
                                <li>• <strong>Colonne 1</strong> : Code EAN 13</li>
                                <li>• <strong>Colonne 2</strong> : Prix HT (en euros)</li>
                                <li>• Exemple : <code className="bg-white px-1 rounded">3400123456789,10.50</code></li>
                            </ul>
                        </div>
                        <p className="text-xs text-orange-700 mt-3">
                            📅 Période d'analyse : {new Date(analysisDateRange.start).toLocaleDateString('fr-FR')} au {new Date(analysisDateRange.end).toLocaleDateString('fr-FR')}
                        </p>
                    </div>
                </div>
            </div>

            {/* CSV Import Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CsvDropZone
                    label="📅 Catalogue 2025"
                    onFileSelect={handle2025Upload}
                    isLoading={isParsingCsv}
                    error={csvError}
                    {...(catalog2025 && { productCount: catalog2025.length })}
                />
                <CsvDropZone
                    label="📅 Catalogue 2026"
                    onFileSelect={handle2026Upload}
                    isLoading={isParsingCsv}
                    error={csvError}
                    {...(catalog2026 && { productCount: catalog2026.length })}
                />
            </div>

            {/* Analysis Section */}
            {canCompare && (
                <>
                    {isAnalyzing ? (
                        <div className="text-center py-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
                            <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-3 animate-spin" />
                            <p className="text-lg font-semibold text-gray-900">Analyse en cours...</p>
                            <p className="text-sm text-gray-600 mt-2">
                                Récupération des données de vente et calcul des impacts
                            </p>
                        </div>
                    ) : analysis ? (
                        <>
                            {/* KPIs */}
                            <PriceIncreaseKpis analysis={analysis} />

                            {/* Table */}
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                    Détail des Comparaisons ({analysis.all_comparisons.length} produits)
                                </h2>
                                <PriceComparisonTable comparisons={analysis.all_comparisons} />
                            </div>
                        </>
                    ) : null}
                </>
            )}

            {/* Errors */}
            {salesError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">❌ Erreur : {salesError}</p>
                </div>
            )}
        </motion.div>
    );
}
