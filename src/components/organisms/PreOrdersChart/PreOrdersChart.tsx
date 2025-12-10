import React from 'react';
import {
    ResponsiveContainer,
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import { PreOrderMetric } from '@/types/pre-orders';
import { formatCurrency } from '@/hooks/utils/formatters';

interface PreOrdersChartProps {
    data: PreOrderMetric[];
    isLoading: boolean;
}

export const PreOrdersChart: React.FC<PreOrdersChartProps> = ({ data, isLoading }) => {
    if (isLoading) {
        return (
            <div className="h-[400px] w-full flex items-center justify-center bg-gray-50/50 rounded-xl animate-pulse">
                <div className="text-gray-400">Chargement des données...</div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="h-[400px] w-full flex items-center justify-center bg-gray-50/50 rounded-xl">
                <div className="text-gray-500">Aucune donnée sur la période</div>
            </div>
        );
    }

    return (
        <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                        dataKey="date"
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        axisLine={{ stroke: '#E5E7EB' }}
                        tickLine={false}
                        tickFormatter={(value) => {
                            // Convert YYYY-MM to readable format (e.g. "Nov 2025")
                            const [year, month] = value.split('-');
                            const date = new Date(parseInt(year), parseInt(month) - 1);
                            return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
                        }}
                    />
                    <YAxis
                        yAxisId="left"
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `${value}`}
                        label={{ value: 'Quantité', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280' } }}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `${value / 1000}k€`}
                        label={{ value: 'Montant HT', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#6B7280' } }}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any, name: string) => {
                            if (name === 'Quantité') return [value, name];
                            if (name === 'Montant HT') return [formatCurrency(value), name];
                            return [value, name];
                        }}
                        labelFormatter={(label) => {
                            const [year, month] = label.split('-');
                            const date = new Date(parseInt(year), parseInt(month) - 1);
                            return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                        }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar
                        yAxisId="left"
                        dataKey="quantite"
                        name="Quantité"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="montant_achat_ht"
                        name="Montant HT"
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};
