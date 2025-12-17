import React, { useState } from 'react';
import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TrendingUp } from 'lucide-react';

interface StockEvolutionChartProps {
    data: any[];
    isLoading: boolean;
}

export const StockEvolutionChart: React.FC<StockEvolutionChartProps> = ({ data, isLoading }) => {
    // Hidden Series State
    const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);

    const toggleSeries = (dataKey: string) => {
        setHiddenSeries(prev =>
            prev.includes(dataKey)
                ? prev.filter(k => k !== dataKey)
                : [...prev, dataKey]
        );
    };

    if (isLoading) {
        return (
            <div className="h-[400px] w-full bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl p-4 animate-pulse">
                <div className="h-full w-full bg-slate-200/50 rounded-xl"></div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="w-full h-96 bg-white/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <span className="text-gray-400 font-medium">Aucune donnée disponible</span>
            </div>
        );
    }

    // Custom Tooltip (Styled matching EvolutionChart)
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '12px' }}>
                    <p className="font-bold text-gray-700 mb-2 capitalize text-xs">
                        {label ? format(new Date(label), 'MMMM yyyy', { locale: fr }) : ''}
                    </p>
                    <div className="space-y-1">
                        {payload.map((entry: any, index: number) => {
                            if (entry.value === null || entry.value === undefined) return null;
                            return (
                                <div key={index} className="flex items-center gap-2 text-xs">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-gray-500 font-medium">{entry.name}:</span>
                                    <span className="text-gray-900 font-bold ml-auto">{Math.round(entry.value).toLocaleString()}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <section className="mt-8 mb-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-indigo-500" />
                        Évolution du Stock & Prévisions
                    </h2>
                    <p className="text-slate-500 mt-1">
                        Historique sur 12 mois et projection sur 3 mois (basée sur vélocité et commandes)
                    </p>
                </div>
            </div>

            <div className="h-[400px] w-full bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={data}
                        margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                    >
                        <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorReception" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(str) => {
                                try {
                                    return format(new Date(str), 'MMM yy', { locale: fr });
                                } catch (e) { return str; }
                            }}
                            stroke="#64748b"
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#64748b"
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F6' }} />
                        <Legend
                            wrapperStyle={{ paddingTop: '20px' }}
                            iconType="circle"
                            onClick={(e) => toggleSeries(String(e.dataKey))}
                            formatter={(value, entry: any) => (
                                <span className={`cursor - pointer ${hiddenSeries.includes(entry.dataKey) ? 'opacity-40 line-through' : ''} text - sm font - medium text - slate - 600 ml - 2`}>
                                    {value}
                                </span>
                            )}
                        />

                        {/* --- BARS (Activity) --- */}
                        <Bar
                            name="Ventes (Réel)"
                            dataKey="sales_real"
                            barSize={12}
                            fill="#EF4444"
                            radius={[4, 4, 0, 0]}
                            fillOpacity={0.8}
                            hide={hiddenSeries.includes('sales_real')}
                        />
                        <Bar
                            name="Réception (Réel)"
                            dataKey="reception_real"
                            barSize={12}
                            fill="#10B981"
                            radius={[4, 4, 0, 0]}
                            fillOpacity={0.8}
                            hide={hiddenSeries.includes('reception_real')}
                        />

                        <Bar
                            name="Ventes (Prév)"
                            dataKey="sales_forecast"
                            barSize={12}
                            fill="#FCA5A5"
                            radius={[4, 4, 0, 0]}
                            fillOpacity={0.6}
                            hide={hiddenSeries.includes('sales_forecast')}
                        />
                        <Bar
                            name="Réception (Prév)"
                            dataKey="reception_forecast"
                            barSize={12}
                            fill="#6EE7B7"
                            radius={[4, 4, 0, 0]}
                            fillOpacity={0.6}
                            hide={hiddenSeries.includes('reception_forecast')}
                        />

                        {/* --- LINES (Stock Level) --- */}
                        <Line
                            type="monotone"
                            name="Stock (Réel)"
                            dataKey="stock_real"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            dot={{ fill: '#3B82F6', r: 4, strokeWidth: 0 }}
                            activeDot={{ r: 6 }}
                            hide={hiddenSeries.includes('stock_real')}
                        />
                        <Line
                            type="monotone"
                            name="Stock (Prév)"
                            dataKey="stock_forecast"
                            stroke="#93C5FD"
                            strokeWidth={3}
                            strokeDasharray="5 5"
                            dot={{ fill: '#93C5FD', r: 4, strokeWidth: 0 }}
                            hide={hiddenSeries.includes('stock_forecast')}
                        />

                        <ReferenceLine x={format(new Date(), 'yyyy-MM')} stroke="#6366F1" strokeDasharray="3 3" label="Aujourd'hui" />

                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
};
