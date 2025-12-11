// src/components/organisms/FilterPanel/components/ProductList.tsx
import React from 'react';
import { Package } from 'lucide-react';
import { ProductCard } from './ProductCard';

interface Product {
    code_13_ref: string;
    name: string;
    brand_lab: string | null;
    universe: string | null;
    bcb_product_id: string;
    all_codes: string[];
}

interface ProductListProps {
    products: Product[];
    isLoading: boolean;
    selectedMap: Map<string, { bcb_product_id: string; name: string; all_codes: string[] }>;
    onToggle: (product: Product) => void;
}

export const ProductList: React.FC<ProductListProps> = ({
    products,
    isLoading,
    selectedMap,
    onToggle
}) => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center pt-8 text-gray-400 space-y-3 min-h-[200px]">
                <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">Recherche en cours...</span>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="text-center pt-8 opacity-60 min-h-[200px]">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="font-medium text-gray-500">Aucun produit trouvé</p>
                <p className="text-sm text-gray-400">Formats: nom, code, ou *fin (ex: *1234)</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {products.map(product => (
                <ProductCard
                    key={product.code_13_ref}
                    product={product}
                    isSelected={selectedMap.has(product.bcb_product_id)}
                    onToggle={onToggle}
                />
            ))}
        </div>
    );
};
