import React from 'react';
import { Building2, TestTube, Tag, Package, Ban, Calendar, Percent, Pill, FileText } from 'lucide-react';
import { useFilterStore } from '@/stores/useFilterStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ActiveFiltersDisplayProps {
    onClose: () => void;
}

export const ActiveFiltersDisplay: React.FC<ActiveFiltersDisplayProps> = () => {
    const store = useFilterStore();
    const { settings } = store;
    
    // Check for active main filters
    const hasPharmacies = store.pharmacies.length > 0;
    const hasLaboratories = store.laboratories.length > 0;
    const hasCategories = store.categories.length > 0;
    const hasProducts = store.products.length > 0;
    const hasExclusions = store.excludedProducts.length > 0 || store.excludedLaboratories.length > 0 || store.excludedCategories.length > 0;
    const hasDate = !!store.dateRange.start;

    // Check for active product settings filters
    const hasProductType = settings.productType !== 'ALL';
    const hasTva = settings.tvaRates.length > 0;
    const hasGeneric = settings.isGeneric !== 'ALL';
    const hasReimbursement = settings.reimbursementStatus !== 'ALL';
    
    const hasAnyFilter = hasPharmacies || hasLaboratories || hasCategories || hasProducts || hasExclusions || hasDate || hasProductType || hasTva || hasGeneric || hasReimbursement;

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        try {
            return format(new Date(dateStr), 'dd MMM yyyy', { locale: fr });
        } catch (e) {
            return dateStr;
        }
    };

    if (!hasAnyFilter) return null;

    return (
        <div className="w-full mt-4 px-1 animate-in fade-in slide-in-from-top-1">
            <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-white/60 shadow-lg ring-1 ring-black/5 p-4 mx-auto w-full">
                <div className="flex flex-wrap items-stretch gap-4">
                    
                    {/* 1. Période (Always First) */}
                    {hasDate && (
                        <div className="flex items-center gap-3 px-3 py-2 bg-blue-50/50 rounded-lg border border-blue-100/50">
                            <div className="p-1.5 bg-blue-100 rounded-md">
                                <Calendar className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Période</span>
                                <span className="text-xs font-semibold text-blue-900">
                                    {formatDate(store.dateRange.start)} - {formatDate(store.dateRange.end)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* 2. Pharmacies */}
                    {hasPharmacies && (
                        <div className="flex items-center gap-3 px-3 py-2 bg-orange-50/50 rounded-lg border border-orange-100/50 max-w-md overflow-hidden">
                            <div className="p-1.5 bg-orange-100 rounded-md shrink-0">
                                <Building2 className="w-4 h-4 text-orange-600" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">Pharmacies</span>
                                    <span className="bg-orange-100 text-orange-700 text-[10px] px-1.5 rounded-full font-bold">{store.pharmacies.length}</span>
                                </div>
                                <div className="flex gap-1 overflow-x-auto no-scrollbar mask-gradient-right">
                                    <span className="text-xs font-semibold text-orange-900 truncate">
                                        {store.pharmacies.map(p => p.name).join(', ')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. Product Settings (Grouped) */}
                    {(hasProductType || hasTva || hasGeneric || hasReimbursement) && (
                        <div className="flex items-center gap-3 px-3 py-2 bg-slate-50/50 rounded-lg border border-slate-100/50">
                            <div className="p-1.5 bg-slate-100 rounded-md">
                                <Package className="w-4 h-4 text-slate-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Critères Produits</span>
                                <div className="flex flex-wrap gap-2 mt-0.5">
                                    {hasProductType && (
                                        <span className="inline-flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px] font-medium text-slate-700">
                                            {settings.productType === 'MEDICAMENT' ? 'Médicaments' : 'Parapharmacie'}
                                        </span>
                                    )}
                                    {hasTva && (
                                        <span className="inline-flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px] font-medium text-slate-700">
                                            <Percent className="w-3 h-3 text-slate-400" />
                                            TVA {settings.tvaRates.join('%, ')}%
                                        </span>
                                    )}
                                    {hasGeneric && (
                                        <span className="inline-flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px] font-medium text-slate-700">
                                            <Pill className="w-3 h-3 text-slate-400" />
                                            {settings.isGeneric === 'GENERIC' ? 'Génériques' : settings.isGeneric === 'PRINCEPS' ? 'Princeps' : 'Princeps & Génériques'}
                                        </span>
                                    )}
                                    {hasReimbursement && (
                                        <span className="inline-flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px] font-medium text-slate-700">
                                            <FileText className="w-3 h-3 text-slate-400" />
                                            {settings.reimbursementStatus === 'REIMBURSED' ? 'Remboursé' : 'Non Remboursé'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. Laboratoires */}
                    {hasLaboratories && (
                        <div className="flex items-center gap-3 px-3 py-2 bg-purple-50/50 rounded-lg border border-purple-100/50 max-w-sm">
                            <div className="p-1.5 bg-purple-100 rounded-md">
                                <TestTube className="w-4 h-4 text-purple-600" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Laboratoires</span>
                                    <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 rounded-full font-bold">{store.laboratories.length}</span>
                                </div>
                                <span className="text-xs font-semibold text-purple-900 truncate block max-w-[200px]">
                                    {store.laboratories.length === 1 ? store.laboratories[0]?.name : `${store.laboratories.length} sélectionnés`}
                                </span>
                            </div>
                        </div>
                    )}

                     {/* 5. Catégories */}
                     {hasCategories && (
                        <div className="flex items-center gap-3 px-3 py-2 bg-red-50/50 rounded-lg border border-red-100/50">
                            <div className="p-1.5 bg-red-100 rounded-md">
                                <Tag className="w-4 h-4 text-red-600" />
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Catégories</span>
                                    <span className="bg-red-100 text-red-700 text-[10px] px-1.5 rounded-full font-bold">{store.categories.length}</span>
                                </div>
                                <span className="text-xs font-semibold text-red-900">
                                    {store.categories.length} catégories
                                </span>
                            </div>
                        </div>
                    )}

                    {/* 6. Produits Spécifiques */}
                    {hasProducts && (
                        <div className="flex items-center gap-3 px-3 py-2 bg-emerald-50/50 rounded-lg border border-emerald-100/50">
                            <div className="p-1.5 bg-emerald-100 rounded-md">
                                <Package className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Produits</span>
                                    <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 rounded-full font-bold">{store.products.length}</span>
                                </div>
                                <span className="text-xs font-semibold text-emerald-900">
                                    {store.products.length} produits ciblés
                                </span>
                            </div>
                        </div>
                    )}

                    {/* 7. Exclusions */}
                    {hasExclusions && (
                        <div className="flex items-center gap-3 px-3 py-2 bg-gray-100/50 rounded-lg border border-gray-200/50">
                            <div className="p-1.5 bg-gray-200 rounded-md">
                                <Ban className="w-4 h-4 text-gray-700" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Exclusions</span>
                                <div className="flex gap-2">
                                    {store.excludedProducts.length > 0 && <span className="text-xs font-bold text-gray-800">{store.excludedProducts.length} Prod</span>}
                                    {store.excludedLaboratories.length > 0 && <span className="text-xs font-bold text-gray-800">{store.excludedLaboratories.length} Lab</span>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
