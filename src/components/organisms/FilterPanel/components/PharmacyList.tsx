// src/components/organisms/FilterPanel/components/PharmacyList.tsx
import React from 'react';
import { Store } from 'lucide-react';
import { SelectedPharmacy } from '@/types/filters';
import { PharmacyCard } from './PharmacyCard';

interface Pharmacy {
    id: string;
    name: string;
    address: string;
    ca: number;
    region: string;
    id_nat: string;
}

interface PharmacyListProps {
    pharmacies: Pharmacy[];
    isLoading: boolean;
    selectedMap: Map<string, SelectedPharmacy>;
    onToggle: (pharmacy: Pharmacy) => void;
}

export const PharmacyList: React.FC<PharmacyListProps> = ({
    pharmacies,
    isLoading,
    selectedMap,
    onToggle
}) => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center pt-8 text-gray-400 space-y-3 min-h-[200px]">
                <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">Recherche en cours...</span>
            </div>
        );
    }

    if (pharmacies.length === 0) {
        return (
            <div className="text-center pt-8 opacity-60 min-h-[200px]">
                <Store className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="font-medium text-gray-500">Aucune pharmacie trouvée</p>
                <p className="text-sm text-gray-400">Essayez d'élargir vos filtres</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-3 bg-gray-50/30 min-h-[200px]">
            {pharmacies.map(pharmacy => (
                <PharmacyCard
                    key={pharmacy.id}
                    pharmacy={pharmacy}
                    isSelected={selectedMap.has(pharmacy.id)}
                    onToggle={onToggle}
                />
            ))}
        </div>
    );
};
