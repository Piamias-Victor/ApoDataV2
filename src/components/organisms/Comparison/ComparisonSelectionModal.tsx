import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Package, TestTube, Tag, X, Check, Loader2 } from 'lucide-react';
import { ComparisonType, useComparisonStore } from '@/stores/useComparisonStore';
import { FilterSearchInput } from '@/components/organisms/FilterPanel/components/shared/FilterSearchInput';
import { Button } from '@/components/atoms/Button/Button';

interface ComparisonSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: ComparisonType | null;
}

interface SearchItem {
    id: string;
    label: string;
    subLabel?: string;
}

// TODO: Move API calls to a hook if this grows
const fetchItems = async (type: ComparisonType, query: string): Promise<SearchItem[]> => {
    let url = '';
    let body: any = { query, limit: 20 };

    switch (type) {
        case 'PRODUCT':
            url = '/api/products/search';
            break;
        case 'LABORATORY':
            url = '/api/laboratories/search';
            body = { ...body, mode: 'laboratory', labOrBrandMode: 'laboratory' };
            break;
        case 'CATEGORY':
            url = '/api/categories/search';
            break;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error('Fetch failed');
        const data = await response.json();

        // Normalization
        if (type === 'PRODUCT') {
            return (data.products || []).map((p: any) => ({
                id: p.bcb_product_id.toString(),
                label: p.name,
                subLabel: p.code_13_ref
            }));
        } else if (type === 'LABORATORY') {
            return (data.laboratories || []).map((l: any) => ({
                id: l.laboratory_name,
                label: l.laboratory_name
            }));
        } else {
            return (data.categories || []).map((c: any) => ({
                id: c.category_name,
                label: c.category_name,
                subLabel: c.category_type
            }));
        }
    } catch (error) {
        console.error("Search error", error);
        return [];
    }
};

export const ComparisonSelectionModal: React.FC<ComparisonSelectionModalProps> = ({ isOpen, onClose, type }) => {
    const { addEntity } = useComparisonStore();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Selection state: Map<ID, Item>
    const [selectedItems, setSelectedItems] = useState<Map<string, SearchItem>>(new Map());

    // Grouping Option
    const [groupName, setGroupName] = useState('');

    useEffect(() => {
        if (isOpen && type) {
            // Reset state on open
            setQuery('');
            setResults([]);
            setSelectedItems(new Map());
            setGroupName('');
            // Initial fetch or suggestions could go here
        }
    }, [isOpen, type]);

    useEffect(() => {
        if (!type || !query) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            const items = await fetchItems(type, query);
            setResults(items);
            setIsLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, type]);

    if (!isOpen || !type) return null;

    const handleToggle = (item: SearchItem) => {
        const newMap = new Map(selectedItems);
        if (newMap.has(item.id)) {
            newMap.delete(item.id);
        } else {
            newMap.set(item.id, item);
        }
        setSelectedItems(newMap);
    };

    const handleSelectAll = () => {
        const newMap = new Map(selectedItems);
        results.forEach(item => {
            newMap.set(item.id, item);
        });
        setSelectedItems(newMap);
    };

    const handleConfirm = () => {
        if (selectedItems.size === 0) return;

        const items = Array.from(selectedItems.values());
        const sourceIds = items.map(i => i.id);

        // Auto-grouping logic
        let label = groupName.trim();
        if (!label) {
            if (items.length === 1) {
                label = items[0]?.label || 'Élément';
            } else {
                label = `${items.length} ${type === 'PRODUCT' ? 'Produits' : type === 'LABORATORY' ? 'Laboratoires' : 'Catégories'}`;
            }
        }

        addEntity({
            label,
            type,
            sourceIds,
            color: getColorForType(type)
        });
        onClose();
    };

    const getColorForType = (t: ComparisonType) => {
        switch (t) {
            case 'PRODUCT': return 'green';
            case 'LABORATORY': return 'purple';
            case 'CATEGORY': return 'red';
        }
    };

    // Dynamic styles based on type
    const accentColor = type === 'PRODUCT' ? 'text-green-600 bg-green-50' :
        type === 'LABORATORY' ? 'text-purple-600 bg-purple-50' :
            'text-red-600 bg-red-50';

    const modalContent = (
        <div className="fixed inset-0 top-0 left-0 z-[9999] flex flex-col items-center justify-start pt-20 p-4 sm:p-6 isolate">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${accentColor}`}>
                            {type === 'PRODUCT' && <Package className="w-5 h-5" />}
                            {type === 'LABORATORY' && <TestTube className="w-5 h-5" />}
                            {type === 'CATEGORY' && <Tag className="w-5 h-5" />}
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 leading-tight">Sélectionner {type === 'PRODUCT' ? 'des Produits' : type === 'LABORATORY' ? 'des Laboratoires' : 'des Catégories'}</h2>
                            <p className="text-xs text-gray-500">Ajoutez des éléments à comparer</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 bg-gray-50/50 border-b border-gray-100 shrink-0 space-y-3">
                    <FilterSearchInput
                        value={query}
                        onChange={setQuery}
                        placeholder={`Rechercher ${type === 'PRODUCT' ? 'un produit' : type === 'LABORATORY' ? 'un laboratoire' : 'une catégorie'}...`}
                        autoFocus
                    />
                    {results.length > 0 && (
                        <button
                            onClick={handleSelectAll}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-all flex items-center gap-1"
                        >
                            <Check className="w-4 h-4" />
                            Tout sélectionner ({results.length})
                        </button>
                    )}
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto p-2 scroll-smooth">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className={`w-8 h-8 animate-spin ${type === 'PRODUCT' ? 'text-green-500' : type === 'LABORATORY' ? 'text-purple-500' : 'text-red-500'}`} />
                        </div>
                    ) : results.length > 0 ? (
                        <div className="grid gap-1">
                            {results.map((item) => {
                                const isSelected = selectedItems.has(item.id);
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleToggle(item)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group
                                            ${isSelected ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'hover:bg-gray-50 border border-transparent'}
                                        `}
                                    >
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors
                                            ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 group-hover:border-blue-400 bg-white'}
                                        `}>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-medium truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>{item.label}</div>
                                            {item.subLabel && <div className="text-xs text-gray-500 truncate">{item.subLabel}</div>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : query ? (
                        <div className="text-center py-12 text-gray-500">
                            Aucun résultat trouvé
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400 text-sm">
                            Tapez pour rechercher...
                        </div>
                    )}
                </div>

                {/* Footer / Grouping Config */}
                <div className="p-4 bg-white border-t border-gray-100 shrink-0 space-y-4 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)]">
                    {selectedItems.size > 1 && (
                        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 animate-in slide-in-from-top-2 duration-200">
                            <div className="mb-2 text-xs font-semibold text-blue-800">
                                Nommez ce groupe d&apos;éléments :
                            </div>
                            <input
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder={`Ex: Mes ${type === 'PRODUCT' ? 'Produits' : 'Laboratoires'}`}
                                className="w-full text-sm rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-4">
                        <div className="text-sm text-gray-500 font-medium">
                            {selectedItems.size} sélectionné(s)
                        </div>
                        <Button
                            variant="primary"
                            disabled={selectedItems.size === 0}
                            onClick={handleConfirm}
                            className={`min-w-[120px] ${type === 'PRODUCT' ? '!bg-green-600 hover:!bg-green-700' :
                                type === 'LABORATORY' ? '!bg-purple-600 hover:!bg-purple-700' :
                                    '!bg-red-600 hover:!bg-red-700'
                                }`}
                        >
                            Confirmer
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Using Portal to break out of any parent stacking context (transforms, etc.)
    return typeof document !== 'undefined'
        ? createPortal(modalContent, document.body)
        : null;
};
