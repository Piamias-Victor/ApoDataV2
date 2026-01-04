import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useFilterStore } from '@/stores/useFilterStore';
import { useFilterTooltips } from './useFilterTooltips';

export type DrawerType = 'pharmacy' | 'date' | 'laboratories' | 'categories' | 'products' | 'operators' | 'exclusions' | null;

export const useFilterBarLogic = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);
    const {
        pharmacies, dateRange, laboratories, categories, products,
        excludedProducts, excludedLaboratories, excludedCategories,
        settings,
        // Actions
        setPharmacies, setLaboratories, setCategories, setDateRange,
        setProducts, setProductType, setTvaRates, setPriceRange, setIsGeneric,
        setLppCodes, setRefundCodes, setReimbursementStatus,
        setPurchasePriceNetRange, setPurchasePriceGrossRange, setSellPriceRange,
        setDiscountRange, setMarginRange,
        resetExclusions, resetFilterOperators
    } = useFilterStore();

    const { data: session } = useSession();
    const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'ADMIN';
    const canEditPharmacies = isAdmin;

    const tooltips = useFilterTooltips({ pharmacies, laboratories, categories, products, dateRange });

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Enforce pharmacy filter for non-admins
    useEffect(() => {
        if (session?.user && !isAdmin && session.user.pharmacyId) {
            const userPharmacyId = session.user.pharmacyId;
            // Check if we need to update the store (avoid infinite loop)
            const currentIds = pharmacies.map(p => p.id);
            const isPharmacyCorrectlySet = currentIds.length === 1 && currentIds[0] === userPharmacyId;

            if (!isPharmacyCorrectlySet) {
                setPharmacies([{
                    id: userPharmacyId,
                    name: session.user.pharmacyName || 'Ma Pharmacie'
                }]);
            }
        }
    }, [session, isAdmin, pharmacies, setPharmacies]);

    const handleClose = () => setActiveDrawer(null);

    const exclusionsCount = excludedProducts.length + excludedLaboratories.length + excludedCategories.length;

    // Determine if Products filter is active (checking all sub-filters)
    const isProductsActive = products.length > 0 ||
        settings.isGeneric !== 'ALL' ||
        settings.reimbursementStatus !== 'ALL' ||
        settings.tvaRates.length > 0 ||
        !!(settings.purchasePriceNetRange && (settings.purchasePriceNetRange.min !== 0 || settings.purchasePriceNetRange.max !== 100000)) ||
        !!(settings.purchasePriceGrossRange && (settings.purchasePriceGrossRange.min !== 0 || settings.purchasePriceGrossRange.max !== 100000)) ||
        !!(settings.sellPriceRange && (settings.sellPriceRange.min !== 0 || settings.sellPriceRange.max !== 100000)) ||
        !!(settings.discountRange && (settings.discountRange.min !== 0 || settings.discountRange.max !== 100)) ||
        !!(settings.marginRange && (settings.marginRange.min !== 0 || settings.marginRange.max !== 100));

    const clearFilters = (type: DrawerType) => {
        const currentYear = new Date().getFullYear();
        switch (type) {
            case 'pharmacy':
                if (canEditPharmacies) setPharmacies([]);
                break;
            case 'laboratories':
                setLaboratories([]);
                break;
            case 'categories':
                setCategories([]);
                break;
            case 'date':
                setDateRange({ start: `${currentYear}-01-01`, end: `${currentYear}-12-31` });
                break;
            case 'exclusions':
                resetExclusions();
                break;
            case 'operators':
                resetFilterOperators();
                break;
            case 'products':
                setProducts([]);
                setProductType('ALL');
                setTvaRates([]);
                setPriceRange(null);
                setIsGeneric('ALL');
                setLppCodes([]);
                setRefundCodes([]);
                setReimbursementStatus('ALL');
                setPurchasePriceNetRange(null);
                setPurchasePriceGrossRange(null);
                setSellPriceRange(null);
                setDiscountRange(null);
                setMarginRange(null);
                break;
        }
    };

    return {
        isScrolled,
        activeDrawer,
        setActiveDrawer,
        handleClose,
        clearFilters,
        tooltips,
        storeState: { // Exposed state for UI
            pharmacies,
            dateRange,
            laboratories,
            categories,
            products
        },
        computedState: {
            exclusionsCount,
            isProductsActive
        },
        canEditPharmacies
    };
};
