import React from 'react';
import { ProductAnalysisRow } from '@/types/kpi';
import { ValueCell } from '@/components/molecules/Table/ValueCell';
import { TableCell } from '@/components/atoms/Table/TableCell';
import { useChartFilterInteraction } from '@/hooks/useChartFilterInteraction';

interface TableRowProps {
    row: ProductAnalysisRow;
}

export const GenericProductTableRow: React.FC<TableRowProps> = ({ row }) => {
    const { handleInteraction } = useChartFilterInteraction({
        filterType: 'product'
    });

    return (
        <tr
            onClick={(e) => handleInteraction({ id: row.ean13, name: row.product_name }, e)}
            className="hover:bg-purple-50/30 transition-colors group border-b border-gray-50 last:border-0 cursor-pointer"
        >
            {/* Product Info (Merged: Labo + Produit + EAN) */}
            <TableCell isSticky>
                <div className="flex flex-col max-w-[220px]">
                    <span className="font-medium text-gray-900 truncate text-xs block" title={row.product_name}>
                        {row.product_name}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                            {row.ean13}
                        </span>
                        <span className="text-[10px] text-blue-600 truncate flex-1 block">
                            {row.laboratory_name}
                        </span>
                    </div>
                </div>
            </TableCell>

            {/* P.Brut - Pink */}
            <TableCell align="right" variant="pink">
                <div className="font-medium text-gray-700 text-xs">
                    {row.prix_brut?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </div>
            </TableCell>

            {/* P.Achat - Pink */}
            <TableCell align="right" variant="pink">
                <div className="font-medium text-gray-700 text-xs">
                    {row.avg_purchase_price?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </div>
            </TableCell>

            {/* %Remise - Pink */}
            <TableCell align="right" variant="pink">
                <div className="font-medium text-gray-700 text-xs">
                    {row.discount_pct?.toFixed(1)}%
                </div>
            </TableCell>

            {/* Vol.Achat - Purple */}
            <TableCell align="right" variant="purple">
                <ValueCell value={row.my_purchases_qty} evolution={row.my_purchases_qty_evolution} textSize="text-xs" />
            </TableCell>

            {/* CA.Achat - Purple */}
            <TableCell align="right" variant="purple">
                <ValueCell value={row.my_purchases_ht} evolution={row.my_purchases_evolution} isCurrency textSize="text-xs" />
            </TableCell>

            {/* Vol.Vente - Blue */}
            <TableCell align="right" variant="blue">
                <ValueCell value={row.my_sales_qty} evolution={row.my_sales_qty_evolution} textSize="text-xs" />
            </TableCell>

            {/* CA.Vente - Blue */}
            <TableCell align="right" variant="blue">
                <ValueCell value={row.my_sales_ttc} evolution={row.my_sales_evolution} isCurrency textSize="text-xs" />
            </TableCell>

            {/* %Marge - Orange */}
            <TableCell align="right" variant="orange">
                <ValueCell value={row.my_margin_rate} evolution={row.my_margin_rate_evolution} suffix="%" textSize="text-xs" />
            </TableCell>
        </tr>
    );
};
