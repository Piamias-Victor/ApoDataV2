import React from 'react';
import { createPortal } from 'react-dom';
import { Package, TestTube, Tag } from 'lucide-react';
import { ComparisonType } from '@/stores/useComparisonStore';

interface ComparisonTypeSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: ComparisonType) => void;
}

export const ComparisonTypeSelectionModal: React.FC<ComparisonTypeSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    const options = [
        { type: 'PRODUCT' as const, label: 'Produits', icon: Package, color: 'text-green-600', bg: 'bg-green-50', hover: 'hover:bg-green-100' },
        { type: 'LABORATORY' as const, label: 'Laboratoires', icon: TestTube, color: 'text-purple-600', bg: 'bg-purple-50', hover: 'hover:bg-purple-100' },
        { type: 'CATEGORY' as const, label: 'Catégories', icon: Tag, color: 'text-red-600', bg: 'bg-red-50', hover: 'hover:bg-red-100' },
    ];

    const modalContent = (
        <div className="fixed inset-0 top-0 left-0 z-[9999] flex flex-col items-center justify-start pt-20 p-4 sm:p-6 isolate">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Que voulez-vous comparer ?</h2>
                    <p className="text-gray-500 mb-6">Choisissez le type d&apos;élément à ajouter à cette comparaison.</p>

                    <div className="grid gap-3">
                        {options.map((option) => (
                            <button
                                key={option.type}
                                onClick={() => onSelect(option.type)}
                                className={`flex items-center gap-4 p-4 rounded-xl border border-gray-100 transition-all duration-200 ${option.hover} group text-left`}
                            >
                                <div className={`p-3 rounded-lg ${option.bg}`}>
                                    <option.icon className={`w-6 h-6 ${option.color}`} />
                                </div>
                                <div>
                                    <span className={`block font-semibold text-gray-900 group-hover:text-gray-900`}>
                                        {option.label}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        Comparer des performances {option.label.toLowerCase()}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
