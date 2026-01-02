
import React from 'react';
import { useComparisonData, ComparisonStats } from '@/hooks/comparison/useComparisonData';
import { useComparisonStore } from '@/stores/useComparisonStore';
import { Card } from '@/components/atoms/Card/Card';
import { ValueCell } from '@/components/molecules/Table/ValueCell';
import { Package, TestTube, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

export const ComparisonTable: React.FC = () => {
    const { data: statsResults, isLoading } = useComparisonData();
    const { entities } = useComparisonStore();

    if (entities.length === 0) return null;

    if (isLoading) {
        return (
            <Card variant="glass" padding="lg">
                <div className="space-y-4 animate-pulse">
                    <div className="flex justify-between items-center mb-6">
                        <div className="h-6 w-32 bg-gray-200 rounded" />
                        <div className="flex gap-4">
                            <div className="h-10 w-32 bg-gray-200 rounded" />
                            <div className="h-10 w-32 bg-gray-200 rounded" />
                        </div>
                    </div>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex gap-4 items-center h-12 border-b border-gray-100 last:border-0">
                            <div className="w-1/4 h-4 bg-gray-100 rounded" />
                            <div className="flex-1 h-4 bg-gray-100 rounded" />
                            <div className="flex-1 h-4 bg-gray-100 rounded" />
                        </div>
                    ))}
                </div>
            </Card>
        );
    }

    // Map results to entities order
    const dataMap = new Map<string, ComparisonStats>();
    statsResults?.forEach(r => dataMap.set(r.entityId, r.stats));

    const getIcon = (type: string) => {
        switch (type) {
            case 'PRODUCT': return <Package className="w-4 h-4" />;
            case 'LABORATORY': return <TestTube className="w-4 h-4" />;
            case 'CATEGORY': return <Tag className="w-4 h-4" />;
            default: return null;
        }
    };

    interface Row {
        label: string;
        key: keyof ComparisonStats;
        isCurrency?: boolean;
        suffix?: string;
        decimals?: number;
    }

    const sections: { title: string; rows: Row[] }[] = [
        {
            title: "Commercial",
            rows: [
                { label: "Vente HT", key: 'sales_ht', isCurrency: true },
                { label: "Marge €", key: 'margin_eur', isCurrency: true },
                { label: "% Marge", key: 'margin_rate', suffix: ' %', decimals: 1 },
            ]
        },
        {
            title: "Volume",
            rows: [
                { label: "Qté Vendue", key: 'qty_sold' },
                { label: "Qté Achetée", key: 'qty_bought' },
                { label: "Montant Achat", key: 'purchases_ht', isCurrency: true },
            ]
        },
        {
            title: "Stock",
            rows: [
                { label: "Valeur Stock", key: 'stock_value', isCurrency: true },
                { label: "Quantité Stock", key: 'stock_quantity' },
                // { label: "J. Stock", key: 'days_stock' }, // Still 0
                { label: "Nb Réf", key: 'nb_refs' },
            ]
        }
    ];

    return (
        <Card variant="glass" padding="lg" className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className="text-left w-1/4 pb-6">
                                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Indicateurs</span>
                            </th>
                            {entities.map((entity, index) => {
                                // Dynamic colors based on slot index
                                const SLOT_STYLES = [
                                    'text-blue-600 bg-blue-50',
                                    'text-purple-600 bg-purple-50',
                                    'text-orange-600 bg-orange-50'
                                ];
                                const colorClass = SLOT_STYLES[index % SLOT_STYLES.length];

                                return (
                                    <th key={entity.id} className="pb-6 px-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-gray-900 line-clamp-1">{entity.label}</div>
                                                <div className="text-xs text-gray-500 font-medium">{entity.sourceIds.length} éléments</div>
                                            </div>
                                            <div className={`p-2 rounded-lg ${colorClass}`}>
                                                {getIcon(entity.type)}
                                            </div>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sections.map((section, sectionIdx) => (
                            <React.Fragment key={section.title}>
                                <tr className="bg-gray-50/50">
                                    <td colSpan={entities.length + 1} className="py-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        {section.title}
                                    </td>
                                </tr>
                                {section.rows.map((row, rowIdx) => (
                                    <motion.tr
                                        key={row.key}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: (sectionIdx * 3 + rowIdx) * 0.05 }}
                                        className="hover:bg-gray-50/30 transition-colors group"
                                    >
                                        <td className="py-4 font-medium text-gray-600 pl-2 group-hover:text-gray-900 transition-colors">
                                            {row.label}
                                        </td>
                                        {entities.map((entity, index) => {
                                            const stats = dataMap.get(entity.id);
                                            const value = stats ? (stats as any)[row.key] : undefined;

                                            // Comparison Logic:
                                            // 1. Vertical: Evolution N vs N-1 (Standard)
                                            const evolutionN1 = stats ? (stats as any)[`${row.key}_evolution`] : undefined;

                                            // 2. Horizontal: Diff vs Index 0 (Base)
                                            let comparisonDiff = undefined;
                                            const comparisonLabel = (index > 0 && entities[0]) ? `vs ${entities[0].label.substring(0, 3)}` : undefined;

                                            if (index > 0 && entities[0]) {
                                                const baseStats = dataMap.get(entities[0].id);
                                                const baseValue = baseStats ? (baseStats as any)[row.key] : 0;
                                                const currentValue = value || 0;

                                                if (baseValue !== 0 && currentValue !== 0) {
                                                    comparisonDiff = ((currentValue - baseValue) / baseValue) * 100;
                                                } else if (baseValue === 0 && currentValue !== 0) {
                                                    comparisonDiff = 100;
                                                } else if (currentValue === 0 && baseValue !== 0) {
                                                    comparisonDiff = -100;
                                                }
                                            }

                                            return (
                                                <td key={entity.id} className="py-4 px-4 align-top">
                                                    <ValueCell
                                                        value={value}
                                                        evolution={evolutionN1}
                                                        comparisonDiff={comparisonDiff}
                                                        comparisonLabel={comparisonLabel}
                                                        isCurrency={row.isCurrency}
                                                        suffix={row.suffix}
                                                        decimals={row.decimals}
                                                        textSize="text-base"
                                                    />
                                                </td>
                                            );
                                        })}
                                    </motion.tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
