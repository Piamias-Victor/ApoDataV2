import React from 'react';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { useExcludedPharmacyFilter } from '../../hooks/useExcludedPharmacyFilter';
import { ExcludedPharmacyHeader } from './ExcludedPharmacyHeader';
import { ExcludedPharmacyList } from './ExcludedPharmacyList';
import { PinnedSelectionList } from '../shared/PinnedSelectionList';

interface ExcludedPharmaciesTabProps {
    onClose?: (() => void) | undefined;
}

export const ExcludedPharmaciesTab: React.FC<ExcludedPharmaciesTabProps> = ({ onClose }) => {
    const {
        searchQuery,
        setSearchQuery,
        results,
        isLoading,
        selectedMap,
        handleToggle,
        handleRemoveSelection,
        handleClearAll,
        handleApply
    } = useExcludedPharmacyFilter(onClose);

    const displayResults = (!searchQuery && results.length > 10) ? results.slice(0, 10) : results;
    const selectedItems = Array.from(selectedMap.values());

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            <ExcludedPharmacyHeader
                currentSearch={searchQuery}
                onSearchChange={setSearchQuery}
                selectionCount={selectedMap.size}
                onClearAll={handleClearAll}
            />

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                {searchQuery ? (
                    <>
                        <ExcludedPharmacyList
                            items={displayResults}
                            isLoading={isLoading}
                            selectedMap={selectedMap}
                            hasSelection={selectedMap.size > 0}
                            searchQuery={searchQuery}
                            onToggle={handleToggle}
                        />
                        {selectedItems.length > 0 && (
                            <div className="pt-4 border-t border-gray-100">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Sélection en cours ({selectedItems.length})
                                </h3>
                                <PinnedSelectionList
                                    items={selectedItems}
                                    onRemove={handleRemoveSelection}
                                    icon={Building2}
                                    colorTheme="black"
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <PinnedSelectionList
                            items={selectedItems}
                            onRemove={handleRemoveSelection}
                            icon={Building2}
                            colorTheme="black"
                        />
                        <ExcludedPharmacyList
                            items={displayResults}
                            isLoading={isLoading}
                            selectedMap={selectedMap}
                            hasSelection={selectedMap.size > 0}
                            searchQuery={searchQuery}
                            onToggle={handleToggle}
                        />
                    </>
                )}
            </div>

            <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] shrink-0">
                <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    onClick={handleApply}
                    className="shadow-xl rounded-xl h-12 !bg-none !bg-gray-800 hover:!bg-gray-900 shadow-gray-500/20"
                >
                    Appliquer ({selectedMap.size})
                </Button>
            </div>
        </div>
    );
};
