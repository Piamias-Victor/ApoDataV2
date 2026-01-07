import React from 'react';
import { Store } from 'lucide-react';
import { SelectedPharmacy } from '@/types/filters';
import { PharmacyCard } from './PharmacyCard';
import { FilterLoadingState } from './shared/FilterLoadingState';

interface Pharmacy {
    id: string;
    name: string;
    address: string;
    ca: number;
    region: string;
    id_nat: string;
    cip: string;
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
        return <FilterLoadingState message="Recherche en cours..." color="orange" />;
    }

    if (pharmacies.length === 0) {
        return (
            <div className="text-center pt-8 opacity-60 min-h-[200px]">
                <Store className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="font-medium text-gray-500">Aucune pharmacie trouvée</p>
                <p className="text-sm text-gray-400">Essayez d&apos;élargir vos filtres</p>
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
