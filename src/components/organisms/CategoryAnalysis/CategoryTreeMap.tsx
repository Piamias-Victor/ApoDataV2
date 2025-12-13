'use client';

import React, { useState, useMemo } from 'react';
import { useCategoryTree } from './hooks/useCategoryTree';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';
import { ArrowRight, Box, Layers, Loader2 } from 'lucide-react';
import { TreeMapBreadcrumbs } from './components/TreeMapBreadcrumbs';
import { TreeMapLegend } from './components/TreeMapLegend';
import { TreeMapNode } from './components/TreeMapNode';

export const CategoryTreeMap: React.FC = () => {
    const [path, setPath] = useState<string[]>([]);
    const [showOthers, setShowOthers] = useState(false);
    const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);

    const { data, isFetching } = useCategoryTree(path, showOthers);

    // Handlers
    const handleNodeClick = (node: any) => {
        if (!node) return;
        const name = node.name;

        if (name && name.startsWith('Autres')) {
            setShowOthers(true);
            return;
        }

        if (path.length >= 5) return;

        setPath((prev) => [...prev, name]);
        setShowOthers(false);
        setHiddenSeries([]);
    };

    const handleBreadcrumbClick = (index: number) => {
        if (index === -1) {
            setPath([]);
            setShowOthers(false);
        } else {
            setPath(prev => prev.slice(0, index + 1));
            setShowOthers(false);
        }
        setHiddenSeries([]);
    };

    const toggleSeries = (name: string) => {
        setHiddenSeries(prev =>
            prev.includes(name)
                ? prev.filter(s => s !== name)
                : [...prev, name]
        );
    };

    const visibleData = useMemo(() => {
        return data.filter(item => !hiddenSeries.includes(item.name));
    }, [data, hiddenSeries]);

    return (
        <section className="mt-8 mb-12 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 flex items-center gap-2">
                        <Layers className="w-6 h-6 text-indigo-500" />
                        Analyse des Catégories
                    </h2>
                    <p className="text-slate-500 mt-1">
                        Exploration hiérarchique de votre Chiffre d&apos;Affaires par segment.
                    </p>
                </div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 shadow-xl p-4 md:p-6 min-h-[400px] md:min-h-[500px] flex flex-col relative overflow-hidden">

                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />

                <TreeMapBreadcrumbs
                    path={path}
                    showOthers={showOthers}
                    onBreadcrumbClick={handleBreadcrumbClick}
                    onCloseOthers={() => setShowOthers(false)}
                />

                <div className="relative z-10 w-full h-[400px] md:h-[600px]">
                    {isFetching && (
                        <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-xl transition-opacity duration-300">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                                <span className="text-sm font-medium text-indigo-600 animate-pulse">Chargement des données...</span>
                            </div>
                        </div>
                    )}

                    {(!isFetching && data.length === 0) ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                            <Box className="w-12 h-12 mb-3 text-slate-300" />
                            <p className="font-medium">Aucune donnée disponible.</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <Treemap
                                data={visibleData}
                                dataKey="value"
                                nameKey="name"
                                aspectRatio={4 / 3}
                                stroke="#fff"
                                isAnimationActive={true}
                                animationDuration={500}
                                content={<TreeMapNode />}
                                onClick={handleNodeClick}
                            >
                                <Tooltip
                                    cursor={false}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const d = payload[0].payload;
                                            return (
                                                <div className="bg-white/95 backdrop-blur-xl p-3 rounded-xl shadow-xl border border-slate-100 ring-1 ring-slate-900/5">
                                                    <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">{d.name}</p>
                                                    <div className="flex items-center justify-between gap-6 text-sm mb-1">
                                                        <span className="text-slate-500">Chiffre d&apos;Affaires</span>
                                                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                            {Number(d.value).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-6 text-sm">
                                                        <span className="text-slate-500">Part de marché</span>
                                                        <span className="font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md">
                                                            {Number(d.percentage).toFixed(2)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </Treemap>
                        </ResponsiveContainer>
                    )}
                </div>

                <TreeMapLegend
                    data={data}
                    hiddenSeries={hiddenSeries}
                    onToggleSeries={toggleSeries}
                />

                {!showOthers && data.length > 0 && path.length < 5 && (
                    <div className="relative z-10 mt-4 text-xs text-center text-slate-400 flex items-center justify-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-3 h-3" />
                        <span>Cliquez sur une case pour explorer ou filtrer via la légende</span>
                    </div>
                )}
            </div>
        </section>
    );
};
