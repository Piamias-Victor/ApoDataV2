import { useMemo } from 'react';
import { useFilterStore } from '@/stores/useFilterStore';
import { FilterGroup } from './types';

export const useFilterGroups = () => {
    const {
        pharmacies,
        laboratories,
        categories,
        products,
        settings
    } = useFilterStore();

    return useMemo((): FilterGroup[] => {
        const groups: FilterGroup[] = [];

        if (pharmacies.length > 0) {
            groups.push({
                type: 'pharmacy',
                id: 'pharmacy-group',
                name: pharmacies.length === 1 ? '🏥 Pharmacie' : '🏥 Pharmacies',
                count: pharmacies.length,
                icon: '🏥'
            });
        }

        if (laboratories.length > 0) {
            groups.push({
                type: 'laboratory',
                id: 'laboratory-group',
                name: laboratories.length === 1 ? '🔬 Laboratoire' : '🔬 Laboratoires',
                count: laboratories.length,
                icon: '🔬'
            });
        }

        if (categories.length > 0) {
            groups.push({
                type: 'category',
                id: 'category-group',
                name: categories.length === 1 ? '🏷️ Catégorie' : '🏷️ Catégories',
                count: categories.length,
                icon: '🏷️'
            });
        }

        if (products.length > 0) {
            groups.push({
                type: 'product',
                id: 'product-group',
                name: products.length === 1 ? '📦 Produit' : '📦 Produits',
                count: products.length,
                icon: '📦'
            });
        }

        if (settings.tvaRates.length > 0) {
            groups.push({
                type: 'tva',
                id: 'tva-group',
                name: '💰 TVA',
                count: settings.tvaRates.length,
                icon: '💰'
            });
        }

        if (settings.reimbursementStatus !== 'ALL') {
            groups.push({
                type: 'reimbursement',
                id: 'reimbursement-group',
                name: `💊 ${settings.reimbursementStatus === 'REIMBURSED' ? 'Remboursé' : 'Non remboursé'}`,
                count: 1,
                icon: '💊'
            });
        }

        if (settings.isGeneric !== 'ALL') {
            let name = '🧬 Statut';
            if (settings.isGeneric === 'GENERIC') name = '🧬 Générique';
            if (settings.isGeneric === 'PRINCEPS') name = '🧬 Princeps';
            if (settings.isGeneric === 'PRINCEPS_GENERIC') name = '🧬 Princeps & Générique';

            groups.push({
                type: 'generic',
                id: 'generic-group',
                name,
                count: 1,
                icon: '🧬'
            });
        }

        if (settings.productType !== 'ALL') {
            let name = '💊 Type';
            if (settings.productType === 'MEDICAMENT') name = '💊 Médicament';
            if (settings.productType === 'PARAPHARMACIE') name = '🧴 Parapharmacie';

            groups.push({
                type: 'productType',
                id: 'product-type-group',
                name,
                count: 1,
                icon: settings.productType === 'MEDICAMENT' ? '💊' : '🧴'
            });
        }

        // Count price ranges
        let priceRangeCount = 0;
        if (settings.purchasePriceNetRange &&
            (settings.purchasePriceNetRange.min !== 0 || settings.purchasePriceNetRange.max !== 100000)) {
            priceRangeCount++;
        }
        if (settings.purchasePriceGrossRange &&
            (settings.purchasePriceGrossRange.min !== 0 || settings.purchasePriceGrossRange.max !== 100000)) {
            priceRangeCount++;
        }
        if (settings.sellPriceRange &&
            (settings.sellPriceRange.min !== 0 || settings.sellPriceRange.max !== 100000)) {
            priceRangeCount++;
        }
        if (settings.discountRange &&
            (settings.discountRange.min !== 0 || settings.discountRange.max !== 100)) {
            priceRangeCount++;
        }
        if (settings.marginRange &&
            (settings.marginRange.min !== 0 || settings.marginRange.max !== 100)) {
            priceRangeCount++;
        }

        if (priceRangeCount > 0) {
            groups.push({
                type: 'priceRange',
                id: 'price-range-group',
                name: priceRangeCount === 1 ? '💶 Plage de prix' : '💶 Plages de prix',
                count: priceRangeCount,
                icon: '💶'
            });
        }

        return groups;
    }, [pharmacies, laboratories, categories, products, settings]);
};
