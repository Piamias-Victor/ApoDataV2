import React, { useState } from 'react';
import { useComparisonEvolution } from '@/hooks/comparison/useComparisonEvolution';
import { useComparisonStore } from '@/stores/useComparisonStore';
import { Card } from '@/components/atoms/Card/Card';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

type ChartTab = 'SALES' | 'MARGIN' | 'VOLUME';

// Slot Colors: Blue, Purple, Orange
const SLOT_COLORS = ['#2563eb', '#9333ea', '#ea580c'];

export const ComparisonCharts: React.FC = () => {
    const { data: evolutionResults, isLoading } = useComparisonEvolution();
    const { entities } = useComparisonStore();
    const [activeTab, setActiveTab] = useState<ChartTab>('SALES');

    if (entities.length === 0) return null;

    if (isLoading) {
        return (
            <Card variant="default" padding="lg" className="mt-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                    <div className="flex gap-2">
                        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                    </div>
                </div>
                <div className="h-[400px] w-full bg-gray-100 rounded-xl animate-pulse" />
            </Card>
        );
    }

    // Merge data for Recharts
    // Structure: { date: 'YYYY-MM-DD', [entityId_SALES]: value, ... }

    // 1. Collect all unique dates
    const allDates = new Set<string>();
    evolutionResults?.forEach(res => {
        res.evolution.forEach(pt => allDates.add(pt.date));
    });
    const sortedDates = Array.from(allDates).sort();

    // 2. Build data array
    const chartData = sortedDates.map(date => {
        const point: any = { date };
        evolutionResults?.forEach(res => {
            const pt = res.evolution.find(p => p.date === date);
            if (pt) {
                point[`${res.entityId}_SALES`] = pt.sales_ht;
                point[`${res.entityId}_MARGIN`] = pt.margin_eur;
                point[`${res.entityId}_VOLUME`] = pt.qty_sold;
            } else {
                point[`${res.entityId}_SALES`] = 0;
                point[`${res.entityId}_MARGIN`] = 0;
                point[`${res.entityId}_VOLUME`] = 0;
            }
        });
        return point;
    });

    const getEntityColor = (index: number): string => {
        return SLOT_COLORS[index % SLOT_COLORS.length] || '#2563eb';
    };

    const getTabConfig = () => {
        switch (activeTab) {
            case 'SALES': return { label: 'Chiffre d\'Affaires', keySuffix: '_SALES', formatter: (val: number) => `${Math.round(val).toLocaleString('fr-FR')} €` };
            case 'MARGIN': return { label: 'Marge', keySuffix: '_MARGIN', formatter: (val: number) => `${Math.round(val).toLocaleString('fr-FR')} €` };
            case 'VOLUME': return { label: 'Volume', keySuffix: '_VOLUME', formatter: (val: number) => val.toLocaleString('fr-FR') };
        }
    };

    const config = getTabConfig();

    return (
        <Card variant="default" padding="lg" className="mt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                <h3 className="text-lg font-bold text-gray-900">Évolution Comparative</h3>

                <div className="flex p-1 bg-gray-100 rounded-lg">
                    {(['SALES', 'MARGIN', 'VOLUME'] as ChartTab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === tab
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab === 'SALES' ? 'CA' : tab === 'MARGIN' ? 'Marge' : 'Volume'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            {entities.map((entity, index) => {
                                const color = getEntityColor(index);
                                return (
                                    <linearGradient key={entity.id} id={`color-${entity.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={color} stopOpacity={0.1} />
                                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                                    </linearGradient>
                                );
                            })}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(str) => format(parseISO(str), 'MMM yy', { locale: fr })}
                            stroke="#9CA3AF"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            tickFormatter={config.formatter}
                            stroke="#9CA3AF"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelFormatter={(label) => format(parseISO(label as string), 'MMMM yyyy', { locale: fr })}
                            formatter={(value: number, name: string, props: any) => {
                                // Clean up the name in tooltip ideally
                                return [config.formatter(value), props.payload[`${props.dataKey?.toString().split('_')[0]}_NAME`] || name];
                            }}
                        />
                        <Legend iconType="circle" />

                        {entities.map((entity, index) => {
                            const color = getEntityColor(index);
                            return (
                                <Area
                                    key={entity.id}
                                    type="monotone"
                                    dataKey={`${entity.id}${config.keySuffix}`}
                                    name={entity.label}
                                    stroke={color}
                                    fillOpacity={1}
                                    fill={`url(#color-${entity.id})`}
                                    strokeWidth={2}
                                />
                            );
                        })}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};
