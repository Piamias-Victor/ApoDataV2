// src/components/organisms/FilterPanel/components/ProductCard.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Package, Check, Tag, Layers } from 'lucide-react';

interface Product {
    code_13_ref: string;
    name: string;
    brand_lab: string | null;
    universe: string | null;
    bcb_product_id: string;
    all_codes: string[];
}

interface ProductCardProps {
    product: Product;
    isSelected: boolean;
    onToggle: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, isSelected, onToggle }) => {
    return (
        <motion.div
            layoutId={product.code_13_ref}
            onClick={() => onToggle(product)}
            className={`
                group relative p-4 rounded-xl cursor-pointer transition-all duration-200 border
                ${isSelected
                    ? 'bg-green-50/50 border-green-200 shadow-sm'
                    : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-md'
                }
            `}
        >
            <div className="flex items-start gap-4">
                {/* Visual Icon */}
                <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors
                    ${isSelected
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600'
                    }
                `}>
                    <Package className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-start">
                        <h4 className={`font-bold text-base truncate pr-2 ${isSelected ? 'text-gray-900' : 'text-gray-800'}`}>
                            {product.name}
                        </h4>

                        {/* Checkmark Indicator */}
                        <div className={`
                            w-5 h-5 rounded-full border flex items-center justify-center transition-all shrink-0
                            ${isSelected
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-200 bg-transparent'
                            }
                        `}>
                            {isSelected && <Check className="w-3 h-3" strokeWidth={3} />}
                        </div>
                    </div>

                    {/* Code */}
                    <p className="text-xs font-mono text-gray-500">{product.code_13_ref}</p>

                    {/* Metadata Row */}
                    {(product.brand_lab || product.universe) && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            {product.brand_lab && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                    <Tag className="w-3 h-3" />
                                    {product.brand_lab}
                                </span>
                            )}
                            {product.universe && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                    <Layers className="w-3 h-3" />
                                    {product.universe}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
