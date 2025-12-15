import React from 'react';
import { ProductAnalysisRow } from '@/types/kpi';
import { CustomValueCell } from '@/components/molecules/CustomValueCell';

interface TableRowProps {
    row: ProductAnalysisRow;
}

export const TableRow: React.FC<TableRowProps> = ({ row }) => {
    return (
        <tr className="hover:bg-purple-50/30 transition-colors group">
            {/* Product Info */}
            <td className="px-2 py-3">
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900 line-clamp-2 md:line-clamp-1" title={row.product_name}>
                        {row.product_name}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                            {row.ean13}
                        </span>
                        <span className="text-[10px] text-blue-600 truncate max-w-[120px]" title={row.laboratory_name}>
                            {row.laboratory_name}
                        </span>
                    </div>
                </div>
            </td>

            {/* Rank */}
            <td className="px-2 py-3 text-center">
                <div className="flex flex-col items-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${row.my_rank <= 10 ? 'bg-gradient-to-br from-purple-100 to-purple-50 text-purple-700 shadow-sm' : 'bg-gray-100 text-gray-600'}`}>
                        #{row.my_rank}
                    </span>
                </div>
            </td>

            {/* Achat HT */}
            <td className="px-2 py-3 text-right bg-purple-50/5 group-hover:bg-purple-50/10">
                <CustomValueCell value={row.my_purchases_ht} evolution={row.my_purchases_evolution} isCurrency />
            </td>
            {/* Achat Qte */}
            <td className="px-2 py-3 text-right">
                <CustomValueCell value={row.my_purchases_qty} evolution={row.my_purchases_qty_evolution} />
            </td>
            {/* PDM Achat */}
            <td className="px-2 py-3 text-right bg-purple-50/5 group-hover:bg-purple-50/10">
                <CustomValueCell value={row.my_pdm_purchases_pct} evolution={row.my_pdm_purchases_evolution} suffix="%" decimals={1} />
            </td>

            {/* Vente TTC */}
            <td className="px-2 py-3 text-right bg-blue-50/5 group-hover:bg-blue-50/10">
                <CustomValueCell value={row.my_sales_ttc} evolution={row.my_sales_evolution} isCurrency />
            </td>
            {/* Vente Qte */}
            <td className="px-2 py-3 text-right">
                <CustomValueCell value={row.my_sales_qty} evolution={row.my_sales_qty_evolution} />
            </td>
            {/* PDM Vente */}
            <td className="px-2 py-3 text-right bg-blue-50/5 group-hover:bg-blue-50/10">
                <CustomValueCell value={row.my_pdm_pct} evolution={row.my_pdm_evolution} suffix="%" decimals={1} />
            </td>

            {/* Marge € */}
            <td className="px-2 py-3 text-right bg-orange-50/5 group-hover:bg-orange-50/10">
                <CustomValueCell value={row.my_margin_ht} evolution={row.my_margin_ht_evolution} isCurrency />
            </td>
            {/* Marge % */}
            <td className="px-2 py-3 text-right">
                <CustomValueCell value={row.my_margin_rate} evolution={row.my_margin_rate_evolution} suffix="%" decimals={1} />
            </td>

            {/* Prix Achat Moy */}
            <td className="px-2 py-3 text-right">
                <div className="font-medium text-gray-700 text-sm">
                    {row.avg_purchase_price ? row.avg_purchase_price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '-'}
                </div>
            </td>
            {/* Prix Vente Moy */}
            <td className="px-2 py-3 text-right">
                <div className="font-medium text-gray-700 text-sm">
                    {row.avg_sell_price ? row.avg_sell_price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : '-'}
                </div>
            </td>

            {/* Stock € */}
            <td className="px-2 py-3 text-right bg-gray-50/30 group-hover:bg-gray-50/50">
                <CustomValueCell value={row.my_stock_value_ht} evolution={row.my_stock_value_ht_evolution} isCurrency />
            </td>
            {/* Stock Qte */}
            <td className="px-2 py-3 text-right">
                <CustomValueCell value={row.my_stock_qty} evolution={row.my_stock_qty_evolution} />
            </td>
            {/* J.Stock */}
            <td className="px-2 py-3 text-right">
                <span className={`font-bold ${(row.my_days_of_stock || 0) > 90 ? 'text-red-600' :
                        (row.my_days_of_stock || 0) > 60 ? 'text-orange-600' :
                            'text-gray-800'
                    }`}>
                    {row.my_days_of_stock ? row.my_days_of_stock.toFixed(0) + 'j' : '-'}
                </span>
            </td>
        </tr>
    );
};
