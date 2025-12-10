// src/components/organisms/FilterPanel/components/ClusterTabContent.tsx
import React from 'react';
import { Map as MapIcon, ListFilter } from 'lucide-react';
import { FranceMapSelector } from './FranceMapSelector';
import { RangeSlider } from '@/components/atoms/Slider/RangeSlider';

interface ClusterTabContentProps {
    selectedRegions: string[];
    onToggleRegion: (region: string) => void;
    caRange: [number, number];
    onCaRangeChange: (range: [number, number]) => void;
}

export const ClusterTabContent: React.FC<ClusterTabContentProps> = ({
    selectedRegions,
    onToggleRegion,
    caRange,
    onCaRangeChange
}) => {
    return (
        <div className="p-6 bg-white border-b border-gray-100 space-y-8">
            {/* Map */}
            <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2.5">
                    <MapIcon className="w-3.5 h-3.5" />
                    Régions ({selectedRegions.length})
                </label>
                <FranceMapSelector
                    selectedRegions={selectedRegions}
                    onToggleRegion={onToggleRegion}
                />
            </div>

            {/* Slider */}
            <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2.5">
                    <ListFilter className="w-3.5 h-3.5" />
                    Chiffre d'Affaires
                </label>
                <RangeSlider
                    min={0}
                    max={70000000}
                    step={100000}
                    value={caRange}
                    onChange={onCaRangeChange}
                />
            </div>
        </div>
    );
};
