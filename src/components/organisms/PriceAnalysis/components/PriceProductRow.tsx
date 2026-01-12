import React, { useState } from 'react';
import { PriceProductAnalysis } from '@/repositories/kpi/priceRepository';
import { ValueCell } from '@/components/molecules/Table/ValueCell';
import { useFilterStore } from '@/stores/useFilterStore';
import { TableCell } from '@/components/atoms/Table/TableCell';
import { PriceSimulator } from './PriceSimulator';

interface PriceProductRowProps {
    row: PriceProductAnalysis;
}

export const PriceProductRow: React.FC<PriceProductRowProps> = ({ row }) => {
    const { products, setProducts } = useFilterStore();
    const [isExpanded, setIsExpanded] = useState(false);

    // Check if product is selected in global filters
    const isSelected = products.some(p => p.code === row.ean13);

    const handleRowClick = (e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
            // Smart Click: Toggle Product Filter
            if (isSelected) {
                setProducts(products.filter(p => p.code !== row.ean13));
            } else {
                setProducts([...products, { code: row.ean13, name: row.product_name }]);
            }
        } else {
            // Standard Click: Toggle Simulator
            setIsExpanded(!isExpanded);
        }
    };

    return (
        <>
            <tr
                onClick={handleRowClick}
                className={`cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 ${isSelected ? "bg-purple-50 hover:bg-purple-100" : ""} ${isExpanded ? "bg-gray-50 border-gray-200" : ""}`}
            >
                <TableCell isSticky>
                    <div className="flex flex-col max-w-[300px]">
                        <span className="font-medium text-gray-900 truncate text-xs" title={row.product_name}>
                            {row.product_name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-mono text-[10px]">
                                {row.ean13}
                            </span>
                            <span className="text-blue-600 truncate max-w-[150px] text-[10px]" title={row.laboratory_name}>
                                {row.laboratory_name}
                            </span>
                        </div>
                    </div>
                </TableCell>
                <TableCell align="right" className="bg-gray-50 text-gray-900 border-l border-gray-200"><ValueCell value={row.manufacturer_price || 0} isCurrency decimals={2} className="text-xs font-medium text-gray-700" /></TableCell>


                {/* Purchase Prices (Purple Variant) */}
                <TableCell align="right" variant="purple" className="border-l border-purple-100"><ValueCell value={row.group_min_purchase_price} isCurrency decimals={2} className="text-xs" /></TableCell>
                <TableCell align="right" variant="purple"><ValueCell value={row.group_max_purchase_price} isCurrency decimals={2} className="text-xs" /></TableCell>
                <TableCell align="right" variant="purple"><ValueCell value={row.group_avg_purchase_price} isCurrency decimals={2} className="text-xs" /></TableCell>
                <TableCell align="right" variant="purple" className="bg-purple-100/50"><ValueCell value={row.my_avg_purchase_price} evolution={row.my_avg_purchase_price_evolution} isCurrency decimals={2} className="font-semibold text-purple-700 text-xs" /></TableCell>

                {/* Sell Prices (Blue Variant) */}
                <TableCell align="right" variant="blue" className="border-l border-blue-100"><ValueCell value={row.group_min_sell_price} isCurrency decimals={2} className="text-xs" /></TableCell>
                <TableCell align="right" variant="blue"><ValueCell value={row.group_max_sell_price} isCurrency decimals={2} className="text-xs" /></TableCell>
                <TableCell align="right" variant="blue"><ValueCell value={row.group_avg_sell_price} isCurrency decimals={2} className="text-xs" /></TableCell>
                <TableCell align="right" variant="blue" className="bg-blue-100/50"><ValueCell value={row.my_avg_sell_price} evolution={row.my_avg_sell_price_evolution} isCurrency decimals={2} className="font-semibold text-blue-700 text-xs" /></TableCell>

                {/* Current Sell Price */}
                <TableCell align="right" className="border-l border-gray-200 bg-gray-50/50"><ValueCell value={row.my_current_sell_price} isCurrency decimals={2} className="font-bold text-gray-900 text-xs" /></TableCell>

                {/* Margin (Orange) */}
                <TableCell align="right" variant="orange" className="border-l border-orange-100"><ValueCell value={row.my_margin_rate} evolution={row.my_margin_rate_evolution} suffix="%" className={`font-bold text-xs ${row.my_margin_rate > 25 ? "text-green-600" : "text-amber-600"}`} /></TableCell>
            </tr>

            {/* Simulation Row */}
            {isExpanded && (
                <tr className="bg-gray-50/50 animate-in fade-in zoom-in-95 duration-200">
                    <td colSpan={14} className="p-4 border-b border-gray-200">
                        <PriceSimulator
                            initialPurchasePrice={row.my_avg_purchase_price}
                            initialSellPrice={row.my_current_sell_price > 0 ? row.my_current_sell_price : row.my_avg_sell_price}
                            initialVatRate={row.vat_rate}
                        />
                    </td>
                </tr>
            )}
        </>
    );
};
