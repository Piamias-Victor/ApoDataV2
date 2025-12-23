import React, { useEffect, useState } from 'react';
import { useKpiRequest } from '@/hooks/kpi/useKpiRequest';
import { TableHeaderCell } from '@/components/atoms/Table/TableHeaderCell';
import { ValueCell } from '@/components/molecules/Table/ValueCell';
import { EvolutionBadge } from '@/components/atoms/EvolutionBadge';
import { SupplierAnalysisRow } from '@/repositories/kpi/SupplierAnalysisRepository';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const SupplierAnalysisTable = () => {
    const kpiRequest = useKpiRequest();
    const [data, setData] = useState<SupplierAnalysisRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hiddenSuppliers, setHiddenSuppliers] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/generic/suppliers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(kpiRequest),
                });
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
            } catch (error) {
                console.error('Failed to fetch supplier analysis', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [kpiRequest]); // Re-fetch when filters change (including groups)

    // Calculate totals for footer
    const totals = data.reduce((acc: any, row: SupplierAnalysisRow) => ({
        nb_commandes: acc.nb_commandes + row.nb_commandes,
        quantity_bought: acc.quantity_bought + row.quantity_bought,
        ca_achats: acc.ca_achats + row.ca_achats,
        nb_produits_distincts: acc.nb_produits_distincts + row.nb_produits_distincts,
    }), { nb_commandes: 0, quantity_bought: 0, ca_achats: 0, nb_produits_distincts: 0 });

    const getEvolution = (current: number, previous: number) => {
        if (!previous) return 0;
        return ((current - previous) / previous) * 100;
    };

    const toggleSupplier = (payload: any) => {
        const supplier = payload.value;
        setHiddenSuppliers(prev =>
            prev.includes(supplier)
                ? prev.filter(s => s !== supplier)
                : [...prev, supplier]
        );
    };

    const chartData = data.map(d => ({
        name: d.supplier_category,
        value: hiddenSuppliers.includes(d.supplier_category) ? 0 : d.ca_achats
    }));

    const legendPayload = data.map((d, index) => ({
        value: d.supplier_category,
        type: 'square' as const,
        id: d.supplier_category,
        color: hiddenSuppliers.includes(d.supplier_category) ? '#e5e7eb' : COLORS[index % COLORS.length]
    }));

    return (
        <div className="mt-8 space-y-4">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        📦 Analyse par Fournisseur
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Performance par grossiste pour les produits sélectionnés.
                    </p>
                </div>
            </div>

            {/* Content Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section */}
                <div className="lg:col-span-1 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4 ring-1 ring-black/5 min-h-[300px] flex flex-col">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Répartition CA Achats</h4>
                    <div className="flex-1 w-full min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => {
                                        const originalIndex = data.findIndex(d => d.supplier_category === entry.name);
                                        return <Cell key={`cell-${index}`} fill={COLORS[originalIndex % COLORS.length]} />;
                                    })}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)}
                                />
                                <Legend
                                    onClick={toggleSupplier}
                                    wrapperStyle={{ cursor: 'pointer' }}
                                    {...({ payload: legendPayload } as any)}
                                    formatter={(value) => {
                                        const isHidden = hiddenSuppliers.includes(value);
                                        return (
                                            <span style={{
                                                textDecoration: isHidden ? 'line-through' : 'none',
                                                color: isHidden ? '#9ca3af' : '#374151',
                                                marginLeft: '5px'
                                            }}>
                                                {value}
                                            </span>
                                        );
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Table Section */}
                <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden ring-1 ring-black/5 flex flex-col">
                    {isLoading ? (
                        <div className="p-8 space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-12 w-full bg-gray-50 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fournisseur</th>
                                        <TableHeaderCell align="right">Commandes</TableHeaderCell>
                                        <TableHeaderCell align="right">Volume Acheté</TableHeaderCell>
                                        <TableHeaderCell align="right">CA Achats HT</TableHeaderCell>
                                        <TableHeaderCell align="right">Produits Distincts</TableHeaderCell>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100/50">
                                    {data.map((row) => {
                                        const isHidden = hiddenSuppliers.includes(row.supplier_category);
                                        const colorIndex = data.indexOf(row) % COLORS.length;
                                        return (
                                            <tr
                                                key={row.supplier_category}
                                                className={`transition-colors ${isHidden ? 'opacity-40 grayscale bg-gray-50' : 'hover:bg-gray-50/50'}`}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 border-l-4" style={{ borderLeftColor: isHidden ? 'transparent' : COLORS[colorIndex] }}>
                                                    {row.supplier_category}
                                                </td>

                                                {/* Nb Commandes */}
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-medium text-gray-900">{row.nb_commandes.toLocaleString()}</span>
                                                        <EvolutionBadge value={getEvolution(row.nb_commandes, row.nb_commandes_prev)} />
                                                    </div>
                                                </td>

                                                {/* Volume Bought */}
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-medium text-gray-900">{row.quantity_bought.toLocaleString()}</span>
                                                        <EvolutionBadge value={getEvolution(row.quantity_bought, row.quantity_bought_prev)} />
                                                    </div>
                                                </td>

                                                {/* CA Achats */}
                                                <td className="px-6 py-4 text-right">
                                                    <ValueCell
                                                        value={row.ca_achats}
                                                        evolution={getEvolution(row.ca_achats, row.ca_achats_prev)}
                                                        isCurrency
                                                        className="justify-end font-medium text-gray-900"
                                                    />
                                                </td>

                                                {/* Nb Produits Distincts */}
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-medium text-gray-900">{row.nb_produits_distincts.toLocaleString()}</span>
                                                        <EvolutionBadge value={getEvolution(row.nb_produits_distincts, row.nb_produits_distincts_prev)} />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {/* Total Row */}
                                    <tr className="bg-gray-50 font-semibold border-t-2 border-gray-100">
                                        <td className="px-6 py-4 text-gray-900 border-l-4 border-transparent">TOTAL</td>
                                        <td className="px-6 py-4 text-right">{totals.nb_commandes.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">{totals.quantity_bought.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totals.ca_achats)}
                                        </td>
                                        <td className="px-6 py-4 text-right">{totals.nb_produits_distincts.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                            {data.length === 0 && (
                                <div className="p-12 text-center">
                                    <p className="text-gray-500">Aucune donnée fournisseur.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
