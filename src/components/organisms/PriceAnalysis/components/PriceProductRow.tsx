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
                <TableCell>
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-900 truncate max-w-[200px]" title={row.product_name}>{row.product_name}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <span className="text-gray-500 font-mono text-xs">{row.ean13}</span>
                </TableCell>
                <TableCell>
                    <span className="text-gray-500 truncate max-w-[150px] block" title={row.laboratory_name}>{row.laboratory_name}</span>
                </TableCell>

                {/* Purchase Prices (Purple Variant) */}
                <TableCell align="right" variant="purple" className="border-l border-purple-100"><ValueCell value={row.group_min_purchase_price} isCurrency decimals={2} /></TableCell>
                <TableCell align="right" variant="purple"><ValueCell value={row.group_max_purchase_price} isCurrency decimals={2} /></TableCell>
                <TableCell align="right" variant="purple" className="bg-purple-100/50"><ValueCell value={row.my_avg_purchase_price} evolution={row.my_avg_purchase_price_evolution} isCurrency decimals={2} className="font-semibold text-purple-700" /></TableCell>
                <TableCell align="right" variant="purple"><ValueCell value={row.group_avg_purchase_price} isCurrency decimals={2} /></TableCell>

                {/* Sell Prices (Blue Variant) */}
                <TableCell align="right" variant="blue" className="border-l border-blue-100"><ValueCell value={row.group_min_sell_price} isCurrency decimals={2} /></TableCell>
                <TableCell align="right" variant="blue"><ValueCell value={row.group_max_sell_price} isCurrency decimals={2} /></TableCell>
                <TableCell align="right" variant="blue" className="bg-blue-100/50"><ValueCell value={row.my_avg_sell_price} evolution={row.my_avg_sell_price_evolution} isCurrency decimals={2} className="font-semibold text-blue-700" /></TableCell>
                <TableCell align="right" variant="blue"><ValueCell value={row.group_avg_sell_price} isCurrency decimals={2} /></TableCell>

                {/* Current Sell Price */}
                <TableCell align="right" className="border-l border-gray-200 bg-gray-50/50"><ValueCell value={row.my_current_sell_price} isCurrency decimals={2} className="font-bold text-gray-900" /></TableCell>

                {/* Margin (Orange) */}
                <TableCell align="right" variant="orange" className="border-l border-orange-100"><ValueCell value={row.my_margin_rate} evolution={row.my_margin_rate_evolution} suffix="%" className={`font-bold ${row.my_margin_rate > 25 ? "text-green-600" : "text-amber-600"}`} /></TableCell>
            </tr>

            {/* Simulation Row */}
            {isExpanded && (
                <tr className="bg-gray-50/50 animate-in fade-in zoom-in-95 duration-200">
                    <td colSpan={13} className="p-4 border-b border-gray-200">
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
