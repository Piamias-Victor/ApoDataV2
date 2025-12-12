import React, { useState } from 'react';
import { ResponsiveContainer, ComposedChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { EvolutionDataPoint, DataType } from '../hooks/useEvolutionData';

interface EvolutionChartProps {
    data: EvolutionDataPoint[];
    dataType: DataType;
}

export const EvolutionChart: React.FC<EvolutionChartProps> = ({ data, dataType }) => {
    // Visibility State
    const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);

    const toggleSeries = (dataKey: string) => {
        setHiddenSeries(prev =>
            prev.includes(dataKey)
                ? prev.filter(k => k !== dataKey)
                : [...prev, dataKey]
        );
    };

    // Series Definitions
    const series = [
        { key: dataType === 'value' ? 'achat_ht' : 'achat_ht_cumul', name: 'Achat HT', color: '#6366f1', type: 'area' }, // Indigo
        { key: dataType === 'value' ? 'vente_ttc' : 'vente_ttc_cumul', name: 'Vente TTC', color: '#10b981', type: 'area' }, // Emerald
        { key: 'stock_qte', name: 'Stock Qte', color: '#f59e0b', type: 'line' }, // Amber (Stock always distinct)
        { key: dataType === 'value' ? 'marge_eur' : 'marge_eur_cumul', name: 'Marge €', color: '#ec4899', type: 'bar' }, // Pink
    ];

    return (
        <div className="h-[400px] w-full bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl p-4">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <defs>
                        <linearGradient id="colorAchat" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorVente" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val}`} />
                    <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />

                    <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                        formatter={(value: any) => Number(value).toFixed(2)}
                    />
                    <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="circle"
                        onClick={(e) => toggleSeries(String(e.dataKey))} // Recharts logic
                        formatter={(value, entry: any) => (
                            <span className={`cursor-pointer ${hiddenSeries.includes(entry.dataKey) ? 'opacity-40 line-through' : ''} text-sm font-medium text-slate-600 ml-2`}>{value}</span>
                        )}
                    />

                    {/* Series Rendering */}
                    {series.map((s) => {
                        const isHidden = hiddenSeries.includes(s.key);

                        if (s.type === 'area') {
                            return (
                                <Area
                                    key={s.key}
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey={s.key}
                                    name={s.name}
                                    stroke={s.color}
                                    fillOpacity={1}
                                    fill={s.key.includes('achat') ? "url(#colorAchat)" : "url(#colorVente)"}
                                    hide={isHidden}
                                />
                            );
                        }
                        if (s.type === 'bar') {
                            return (
                                <Bar
                                    key={s.key}
                                    yAxisId="left"
                                    dataKey={s.key}
                                    name={s.name}
                                    fill={s.color}
                                    radius={[4, 4, 0, 0]}
                                    opacity={0.6}
                                    barSize={20}
                                    hide={isHidden}
                                />
                            );
                        }
                        if (s.type === 'line') {
                            return (
                                <Line
                                    key={s.key}
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey={s.key}
                                    name={s.name}
                                    stroke={s.color}
                                    strokeWidth={3}
                                    dot={false}
                                    hide={isHidden}
                                />
                            );
                        }
                        return null;
                    })}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};
