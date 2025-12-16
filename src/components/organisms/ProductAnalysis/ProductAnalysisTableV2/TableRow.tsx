import React from 'react';
import { ProductAnalysisRow } from '@/types/kpi';
import { ValueCell } from '@/components/molecules/Table/ValueCell';
import { TableCell } from '@/components/atoms/Table/TableCell';
import { useChartFilterInteraction } from '@/hooks/useChartFilterInteraction';

interface TableRowProps {
    row: ProductAnalysisRow;
}

export const TableRow: React.FC<TableRowProps> = ({ row }) => {
    const { handleInteraction } = useChartFilterInteraction({
        filterType: 'product'
    });

    return (
        <tr
            onClick={(e) => handleInteraction({ id: row.ean13, name: row.product_name }, e)}
            className="hover:bg-purple-50/30 transition-colors group border-b border-gray-50 last:border-0 cursor-pointer"
        >
            {/* Product Info */}
            <TableCell>
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900 line-clamp-1 text-xs" title={row.product_name}>
                        {row.product_name}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                            {row.ean13}
                        </span>
                        <span className="text-[10px] text-blue-600 truncate max-w-[150px]">
                            {row.laboratory_name}
                        </span>
                    </div>
                </div>
            </TableCell>

            {/* Rank */}
            <TableCell align="center">
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${row.my_rank <= 10 ? 'bg-gradient-to-br from-purple-100 to-purple-50 text-purple-700 shadow-sm' : 'bg-gray-100 text-gray-500'}`}>
                    #{row.my_rank}
                </span>
            </TableCell>

            {/* Achat HT & Qty - Purple */}
            <TableCell align="right" variant="purple">
                <ValueCell value={row.my_purchases_ht} evolution={row.my_purchases_evolution} isCurrency textSize="text-xs" />
            </TableCell>
            <TableCell align="right" variant="purple">
                <ValueCell value={row.my_purchases_qty} evolution={row.my_purchases_qty_evolution} textSize="text-xs" />
            </TableCell>
            <TableCell align="right" variant="green">
                <ValueCell value={row.my_pdm_purchases_pct} evolution={null} suffix="%" textSize="text-xs" />
            </TableCell>

            {/* Vente TTC & Qty - Blue */}
            <TableCell align="right" variant="blue">
                <ValueCell value={row.my_sales_ttc} evolution={row.my_sales_evolution} isCurrency textSize="text-xs" />
            </TableCell>
            <TableCell align="right" variant="blue">
                <ValueCell value={row.my_sales_qty} evolution={row.my_sales_qty_evolution} textSize="text-xs" />
            </TableCell>
            <TableCell align="right" variant="green">
                <ValueCell value={row.my_pdm_pct} evolution={row.my_pdm_evolution} suffix="%" textSize="text-xs" />
            </TableCell>

            {/* Marge - Orange */}
            <TableCell align="right" variant="orange">
                <ValueCell value={row.my_margin_ht} evolution={row.my_margin_ht_evolution} isCurrency textSize="text-xs" />
            </TableCell>
            <TableCell align="right" variant="orange">
                <ValueCell value={row.my_margin_rate} evolution={row.my_margin_rate_evolution} suffix="%" textSize="text-xs" />
            </TableCell>

            {/* Prix - Neutral */}
            <TableCell align="right">
                <div className="font-medium text-gray-700 text-xs">
                    {row.avg_purchase_price?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </div>
            </TableCell>
            <TableCell align="right">
                <div className="font-medium text-gray-700 text-xs">
                    {row.avg_sell_price?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </div>
            </TableCell>

            {/* Stock - Red */}
            <TableCell align="right" variant="red">
                <ValueCell value={row.my_stock_value_ht} evolution={row.my_stock_value_ht_evolution} isCurrency textSize="text-xs" />
            </TableCell>
            <TableCell align="right" variant="red">
                <ValueCell value={row.my_stock_qty} evolution={row.my_stock_qty_evolution} textSize="text-xs" />
            </TableCell>
            <TableCell align="right" variant="red">
                <span className={`font-bold text-xs ${(row.my_days_of_stock || 0) > 90 ? 'text-red-600' :
                    (row.my_days_of_stock || 0) > 60 ? 'text-orange-600' : 'text-gray-800'
                    }`}>
                    {row.my_days_of_stock?.toFixed(0)}j
                </span>
            </TableCell>
        </tr>
    );
};
