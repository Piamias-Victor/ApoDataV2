import React, { useCallback } from 'react';
import { MonthlyMetricsResponse } from '@/types/monthly-metrics';
import { useFiltersStore } from '@/stores/useFiltersStore';

interface PharmaciesMonthlyTableProps {
    data: MonthlyMetricsResponse | null;
    isLoading: boolean;
}

export const PharmaciesMonthlyTable: React.FC<PharmaciesMonthlyTableProps> = ({ data, isLoading }) => {
    const formatNumber = (value: number | null | undefined): string => {
        if (value === null || value === undefined || value === 0) return '-';
        return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value);
    };

    const formatCurrency = (value: number | null | undefined): string => {
        if (value === null || value === undefined || value === 0) return '-';
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatMonthHeader = (month: string): string => {
        if (!month || !month.includes('-')) return month;
        const parts = month.split('-');
        if (parts.length !== 2) return month;
        const year = parts[0];
        const monthNum = parts[1];
        if (!year || !monthNum) return month;
        const date = new Date(parseInt(year), parseInt(monthNum) - 1);
        return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    };

    // Store integration for pharmacy selection
    const selectedPharmacies = useFiltersStore(state => state.selectedPharmacies);
    const setPharmacyFiltersWithNames = useFiltersStore(state => state.setPharmacyFiltersWithNames);

    // Handle pharmacy row click - REPLACE selection instead of toggle
    const handlePharmacyClick = useCallback((pharmacy: NonNullable<typeof data>['pharmacies'][0]) => {
        // Replace entire selection with just this pharmacy
        const newSelectedPharmacies = [
            {
                id: pharmacy.pharmacy_id,
                name: pharmacy.pharmacy_name,
                address: '',
                ca: 0,
                area: '',
                employees_count: 0,
                id_nat: pharmacy.pharmacy_id
            }
        ];

        const ids = newSelectedPharmacies.map(p => p.id);
        setPharmacyFiltersWithNames(ids, newSelectedPharmacies);
    }, [setPharmacyFiltersWithNames]);

    if (isLoading) {
        return (
            <div className="h-[400px] w-full flex items-center justify-center bg-gray-50/50 rounded-xl animate-pulse">
                <div className="text-gray-400">Chargement des données mensuelles...</div>
            </div>
        );
    }

    if (!data || data.pharmacies.length === 0) {
        return (
            <div className="h-[400px] w-full flex items-center justify-center bg-gray-50/50 rounded-xl">
                <div className="text-gray-500">Aucune donnée sur la période</div>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
            <table className="w-full text-xs border-collapse">
                <thead>
                    {/* Main header row - Months */}
                    <tr className="bg-gradient-to-r from-blue-600 to-indigo-600">
                        <th
                            rowSpan={2}
                            className="px-3 py-3 text-left font-semibold text-white border-r-2 border-white sticky left-0 bg-gradient-to-r from-blue-600 to-indigo-600 z-20 min-w-[200px]"
                        >
                            Pharmacie
                        </th>
                        {data.months.map(month => (
                            <th
                                key={month}
                                colSpan={4}
                                className="px-2 py-2 text-center font-semibold text-white border-r-2 border-white"
                            >
                                {formatMonthHeader(month)}
                            </th>
                        ))}
                    </tr>
                    {/* Sub-header row - Metrics */}
                    <tr className="bg-gradient-to-r from-blue-500 to-indigo-500">
                        {data.months.map(month => (
                            <React.Fragment key={`${month}-headers`}>
                                <th className="px-2 py-2 text-center font-medium text-white border-r border-blue-400 min-w-[90px]">
                                    Mt. Ventes
                                </th>
                                <th className="px-2 py-2 text-center font-medium text-white border-r border-blue-400 min-w-[70px]">
                                    Qté Ventes
                                </th>
                                <th className="px-2 py-2 text-center font-medium text-white border-r border-blue-400 min-w-[90px]">
                                    Mt. Achats
                                </th>
                                <th className="px-2 py-2 text-center font-medium text-white border-r-2 border-white min-w-[70px]">
                                    Qté Achats
                                </th>
                            </React.Fragment>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.pharmacies.map((pharmacy, index) => {
                        const isSelected = selectedPharmacies.some(p => p.id === pharmacy.pharmacy_id);
                        return (
                            <tr
                                key={pharmacy.pharmacy_id}
                                className={`${isSelected ? 'bg-blue-50 ring-2 ring-blue-400' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors cursor-pointer`}
                                onClick={() => handlePharmacyClick(pharmacy)}
                            >
                                <td className="px-3 py-3 font-medium text-gray-900 border-r border-gray-300 sticky left-0 bg-inherit z-10">
                                    {pharmacy.pharmacy_name}
                                </td>
                                {data.months.map(month => {
                                    const monthData = pharmacy.months[month];
                                    return (
                                        <React.Fragment key={`${pharmacy.pharmacy_id}-${month}`}>
                                            <td className="px-2 py-3 text-right border-r border-gray-200">
                                                <span className="font-semibold text-gray-900">
                                                    {formatCurrency(monthData?.montant_ventes_ttc)}
                                                </span>
                                            </td>
                                            <td className="px-2 py-3 text-right border-r border-gray-200">
                                                <span className="text-gray-700">
                                                    {formatNumber(monthData?.quantite_vendue)}
                                                </span>
                                            </td>
                                            <td className="px-2 py-3 text-right border-r border-gray-200">
                                                <span className="font-semibold text-gray-900">
                                                    {formatCurrency(monthData?.montant_achats_ht)}
                                                </span>
                                            </td>
                                            <td className="px-2 py-3 text-right border-r border-gray-300">
                                                <span className="text-gray-700">
                                                    {formatNumber(monthData?.quantite_achetee)}
                                                </span>
                                            </td>
                                        </React.Fragment>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Legend */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
                <div className="flex items-center gap-6">
                    <span className="font-medium">Légende:</span>
                    <span>Mt. = Montant</span>
                    <span>Qté = Quantité</span>
                    <span>Ventes = TTC</span>
                    <span>Achats = HT</span>
                </div>
            </div>
        </div>
    );
};
