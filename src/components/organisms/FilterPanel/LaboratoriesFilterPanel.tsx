// src/components/organisms/FilterPanel/LaboratoriesFilterPanel.tsx
'use client';

import React from 'react';
import { TestTube, Tag } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { useLaboratoryFilter } from './hooks/useLaboratoryFilter';
import { LaboratoryHeader } from './components/laboratories/LaboratoryHeader';
import { LaboratoryList } from './components/laboratories/LaboratoryList';
import { PinnedSelectionList } from './components/shared/PinnedSelectionList';

interface LaboratoriesFilterPanelProps { onClose?: () => void; }

export const LaboratoriesFilterPanel: React.FC<LaboratoriesFilterPanelProps> = ({ onClose }) => {
    const {
        searchQuery, setSearchQuery, labOrBrandMode, setLabOrBrandMode,
        results, isLoading, selectedMap,
        handleToggle, handleRemoveSelection, handleApply, handleClearAll
    } = useLaboratoryFilter(onClose);

    // Use results directly
    const displayResults = (!searchQuery && results.length > 10) ? results.slice(0, 10) : results;
    const selectedItems = Array.from(selectedMap.values());

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            <LaboratoryHeader
                mode={labOrBrandMode}
                onModeChange={setLabOrBrandMode}
                currentSearch={searchQuery}
                onSearchChange={setSearchQuery}
                selectionCount={selectedMap.size}
                onClearAll={handleClearAll}
            />

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                {searchQuery ? (
                    <>
                        <LaboratoryList
                            items={displayResults}
                            isLoading={isLoading}
                            selectedMap={selectedMap}
                            hasSelection={selectedMap.size > 0}
                            searchQuery={searchQuery}
                            mode={labOrBrandMode}
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
                                    icon={labOrBrandMode === 'laboratory' ? TestTube : Tag}
                                    colorTheme="purple"
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <PinnedSelectionList
                            items={selectedItems}
                            onRemove={handleRemoveSelection}
                            icon={labOrBrandMode === 'laboratory' ? TestTube : Tag}
                            colorTheme="purple"
                        />
                        <LaboratoryList
                            items={displayResults}
                            isLoading={isLoading}
                            selectedMap={selectedMap}
                            hasSelection={selectedMap.size > 0}
                            searchQuery={searchQuery}
                            mode={labOrBrandMode}
                            onToggle={handleToggle}
                        />
                    </>
                )}
            </div>

            <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] shrink-0">
                <Button variant="primary" fullWidth size="lg" onClick={handleApply}
                    className="shadow-xl rounded-xl h-12 !bg-none !bg-purple-600 hover:!bg-purple-700 shadow-purple-500/20"
                >
                    Appliquer ({selectedMap.size})
                </Button>
            </div>
        </div>
    );
};
