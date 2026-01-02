import React, { useState } from 'react';
import { Plus, X, Package, TestTube, Tag } from 'lucide-react';
import { useComparisonStore, ComparisonType } from '@/stores/useComparisonStore';
import { ComparisonTypeSelectionModal } from './ComparisonTypeSelectionModal';
import { ComparisonSelectionModal } from './ComparisonSelectionModal';

export const ComparisonSelectors: React.FC = () => {
    const { entities, removeEntity } = useComparisonStore();
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

    // New State for Selection Modal
    const [selectionType, setSelectionType] = useState<ComparisonType | null>(null);

    const handleAddClick = () => {
        if (entities.length >= 3) return;
        setIsTypeModalOpen(true);
    };

    const handleTypeSelect = (type: ComparisonType) => {
        setIsTypeModalOpen(false);
        setSelectionType(type); // Open the search modal next
    };

    const handleSelectionClose = () => {
        setSelectionType(null);
    };

    const getIcon = (type: ComparisonType) => {
        switch (type) {
            case 'PRODUCT': return Package;
            case 'LABORATORY': return TestTube;
            case 'CATEGORY': return Tag;
        }
    };

    const getColor = (type: ComparisonType) => {
        switch (type) {
            case 'PRODUCT': return 'text-green-600 bg-green-50';
            case 'LABORATORY': return 'text-purple-600 bg-purple-50';
            case 'CATEGORY': return 'text-red-600 bg-red-50';
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Existing Entities */}
            {entities.map((entity) => {
                const Icon = getIcon(entity.type);
                const colorClass = getColor(entity.type);

                return (
                    <div key={entity.id} className="relative group">
                        <div className="h-full bg-white rounded-xl shadow-sm border-2 border-transparent hover:border-blue-100 transition-all p-6 flex flex-col gap-4">
                            <div className="flex items-start justify-between">
                                <div className={`p-3 rounded-lg ${colorClass}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <button
                                    onClick={() => removeEntity(entity.id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-900 text-lg mb-1">{entity.label}</h3>
                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                    <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-xs">
                                        {entity.type}
                                    </span>
                                    <span>{entity.sourceIds.length} élément(s)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Empty Slots */}
            {Array.from({ length: 3 - entities.length }).map((_, i) => (
                <button
                    key={`empty-${i}`}
                    onClick={handleAddClick}
                    className="h-full min-h-[160px] rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center gap-3 group"
                >
                    <div className="w-12 h-12 rounded-full bg-gray-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                        <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-500 group-hover:text-blue-600">Ajouter une comparaison</span>
                </button>
            ))}

            <ComparisonTypeSelectionModal
                isOpen={isTypeModalOpen}
                onClose={() => setIsTypeModalOpen(false)}
                onSelect={handleTypeSelect}
            />

            <ComparisonSelectionModal
                isOpen={!!selectionType}
                type={selectionType}
                onClose={handleSelectionClose}
            />
        </div>
    );
};
